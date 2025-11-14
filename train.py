# train.py  (Windows/CPU friendly, very chatty)
import argparse, json, os, sys, time
from pathlib import Path

import torch
import torch.nn as nn
from torch.utils.data import DataLoader, random_split
from torchvision import datasets, transforms, models

def log(msg): print(msg, flush=True)

def make_loaders(train_dir, val_dir=None, img_size=224, batch_size=32, val_split=0.15, device="cpu"):
    # Lighter CPU transforms (faster than RandomResizedCrop/ColorJitter)
    mean, std = [0.485,0.456,0.406],[0.229,0.224,0.225]
    tf_train = transforms.Compose([
        transforms.Resize(256),
        transforms.CenterCrop(img_size),
        transforms.ToTensor(),
        transforms.Normalize(mean, std),
    ])
    tf_eval = transforms.Compose([
        transforms.Resize(256),
        transforms.CenterCrop(img_size),
        transforms.ToTensor(),
        transforms.Normalize(mean, std),
    ])

    if not os.path.isdir(train_dir):
        raise FileNotFoundError(f"train_dir not found: {train_dir}")

    ds_train = datasets.ImageFolder(train_dir, transform=tf_train)
    classes = ds_train.classes
    log(f"Found {len(ds_train)} train images across {len(classes)} classes: {classes}")

    if len(ds_train) == 0:
        raise RuntimeError("No images found in train_dir. Expected data/train/<class>/*.jpg")

    if val_dir and os.path.isdir(val_dir):
        ds_val = datasets.ImageFolder(val_dir, transform=tf_eval)
        log(f"Using external val set with {len(ds_val)} images")
    else:
        n_val = max(1, int(len(ds_train)*val_split))
        n_train = len(ds_train) - n_val
        ds_train, ds_val = random_split(ds_train, [n_train, n_val])
        if hasattr(ds_val, "dataset"): ds_val.dataset.transform = tf_eval
        log(f"Split: train={n_train}  val={n_val}")

    # On CPU, pin_memory=False (faster/safer). num_workers=0 avoids hangs on Windows.
    pin = (device == "cuda")
    dl_train = DataLoader(ds_train, batch_size=batch_size, shuffle=True,  num_workers=0, pin_memory=pin)
    dl_val   = DataLoader(ds_val,   batch_size=batch_size, shuffle=False, num_workers=0, pin_memory=pin)
    return dl_train, dl_val, classes

def build_model(num_classes):
    m = models.efficientnet_b0(weights=models.EfficientNet_B0_Weights.IMAGENET1K_V1)
    in_feats = m.classifier[1].in_features
    m.classifier[1] = nn.Linear(in_feats, num_classes)
    return m

@torch.no_grad()
def eval_acc(model, loader, device):
    model.eval(); corr=tot=0
    for x,y in loader:
        x,y = x.to(device), y.to(device)
        pred = model(x).argmax(1)
        corr += (pred==y).sum().item(); tot += y.numel()
    return corr/tot if tot else 0.0

def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--train_dir", required=True)
    ap.add_argument("--val_dir", default=None)
    ap.add_argument("--epochs", type=int, default=1)
    ap.add_argument("--batch_size", type=int, default=8)
    ap.add_argument("--lr", type=float, default=2e-4)
    ap.add_argument("--out_dir", default="models")
    ap.add_argument("--log_every", type=int, default=20, help="print every N batches")
    ap.add_argument("--max_steps", type=int, default=0, help="stop after N train steps (0=all)")
    args = ap.parse_args()

    log(f"Python: {sys.executable}")
    Path(args.out_dir).mkdir(parents=True, exist_ok=True)

    device = "cuda" if torch.cuda.is_available() else "cpu"
    log(f"Device: {device}")

    log("Loading data...")
    dl_train, dl_val, classes = make_loaders(args.train_dir, args.val_dir,
                                             batch_size=args.batch_size, device=device)

    label_map_path = os.path.join(args.out_dir, "label_map.json")
    with open(label_map_path, "w") as f:
        json.dump({i:c for i,c in enumerate(classes)}, f, indent=2)
    log(f"Saved label map -> {label_map_path}")

    log("Building model...")
    model = build_model(len(classes)).to(device)
    opt = torch.optim.AdamW(model.parameters(), lr=args.lr)
    sch = torch.optim.lr_scheduler.CosineAnnealingLR(opt, T_max=max(1, args.epochs))
    loss_fn = nn.CrossEntropyLoss()

    # Use AMP only on CUDA; on CPU it’s disabled automatically
    use_amp = (device == "cuda")
    scaler = torch.amp.GradScaler('cuda') if use_amp else None

    best = 0.0
    log("Training...\n")
    global_step = 0
    for ep in range(1, args.epochs+1):
        model.train(); total_loss=n=0
        for b,(x,y) in enumerate(dl_train, start=1):
            x,y = x.to(device), y.to(device)
            opt.zero_grad(set_to_none=True)

            if use_amp:
                with torch.amp.autocast('cuda'):
                    loss = loss_fn(model(x), y)
                scaler.scale(loss).backward(); scaler.step(opt); scaler.update()
            else:
                loss = loss_fn(model(x), y)
                loss.backward(); opt.step()

            total_loss += loss.item()*y.size(0); n += y.size(0)
            global_step += 1

            if b % args.log_every == 0 or args.max_steps and global_step >= args.max_steps:
                log(f"  ep {ep} | step {b} | running loss={(total_loss/max(1,n)):.4f}")
            if args.max_steps and global_step >= args.max_steps:
                log("Reached --max_steps, breaking early for smoke test.")
                break

        sch.step()

        val_acc = eval_acc(model, dl_val, device)
        log(f"Epoch {ep}/{args.epochs} | Loss {(total_loss/max(1,n)):.4f} | Val Acc {val_acc:.4f}")
        if val_acc > best:
            best = val_acc
            best_path = os.path.join(args.out_dir, "best.pt")
            torch.save({"model": model.state_dict(), "ts": time.time()}, best_path)
            log(f"  -> saved best model to {best_path} (acc={best:.4f})")

    log(f"\nDone. Best val acc: {best:.4f}")

if __name__ == "__main__":
    import traceback
    try:
        main()
    except Exception:
        traceback.print_exc(); sys.exit(1)
