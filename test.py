# test.py
# Usage:
#   python test.py --weights models/best.pt --label_map models/label_map.json --data_dir data/test

import argparse, json
import numpy as np
import torch, torch.nn as nn
from torchvision import datasets, transforms, models
from torch.utils.data import DataLoader
from sklearn.metrics import classification_report, confusion_matrix

def build_model(num_classes):
    m = models.efficientnet_b0(weights=None)
    in_feats = m.classifier[1].in_features
    m.classifier[1] = nn.Linear(in_feats, num_classes)
    return m

def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--weights", required=True)
    ap.add_argument("--label_map", required=True)
    ap.add_argument("--data_dir", required=True)
    ap.add_argument("--batch_size", type=int, default=32)
    args = ap.parse_args()

    # load label map
    with open(args.label_map, "r") as f:
        idx2class = {int(k): v for k, v in json.load(f).items()}
    classes = [idx2class[i] for i in range(len(idx2class))]

    tfm = transforms.Compose([
        transforms.Resize(256),
        transforms.CenterCrop(224),
        transforms.ToTensor(),
        transforms.Normalize([0.485,0.456,0.406],[0.229,0.224,0.225]),
    ])
    ds = datasets.ImageFolder(args.data_dir, transform=tfm)
    dl = DataLoader(ds, batch_size=args.batch_size, shuffle=False, num_workers=2, pin_memory=True)

    model = build_model(num_classes=len(classes))
    ckpt = torch.load(args.weights, map_location="cpu")
    state = ckpt["model"] if "model" in ckpt else ckpt
    model.load_state_dict(state)
    model.eval()

    y_true, y_pred = [], []
    with torch.no_grad():
        for x, y in dl:
            logits = model(x)
            y_pred.extend(logits.argmax(1).cpu().numpy().tolist())
            y_true.extend(y.cpu().numpy().tolist())

    acc = float(np.mean(np.array(y_true) == np.array(y_pred)))
    print("\nAccuracy:", round(acc, 4))
    print("\nClassification report:\n")
    print(classification_report(y_true, y_pred, target_names=ds.classes, digits=4))
    print("\nConfusion matrix (rows=true, cols=pred):\n")
    print(confusion_matrix(y_true, y_pred))

if __name__ == "__main__":
    main()
