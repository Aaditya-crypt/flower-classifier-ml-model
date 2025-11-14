# single_test.py
# Usage:
#   python single_test.py --weights models/best.pt --label_map models/label_map.json --image path/to/image.jpg

import argparse, json
import torch, torch.nn as nn
from PIL import Image
from torchvision import transforms, models

def build_model(num_classes):
    m = models.efficientnet_b0(weights=None)
    in_feats = m.classifier[1].in_features
    m.classifier[1] = nn.Linear(in_feats, num_classes)
    return m

def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--weights", required=True)
    ap.add_argument("--label_map", required=True)
    ap.add_argument("--image", required=True)
    args = ap.parse_args()

    with open(args.label_map, "r") as f:
        idx2class = {int(k): v for k, v in json.load(f).items()}
    classes = [idx2class[i] for i in range(len(idx2class))]

    tfm = transforms.Compose([
        transforms.Resize(256),
        transforms.CenterCrop(224),
        transforms.ToTensor(),
        transforms.Normalize([0.485,0.456,0.406],[0.229,0.224,0.225]),
    ])
    img = Image.open(args.image).convert("RGB")
    x = tfm(img).unsqueeze(0)

    model = build_model(num_classes=len(classes))
    ckpt = torch.load(args.weights, map_location="cpu")
    state = ckpt["model"] if "model" in ckpt else ckpt
    model.load_state_dict(state)
    model.eval()

    with torch.no_grad():
        logits = model(x)
        probs = torch.softmax(logits, dim=1)[0]
        conf, idx = torch.max(probs, dim=0)

    label = classes[int(idx)]
    print("\n✅ Prediction")
    print("--------------------------")
    print(f"Class       : {label}")
    print(f"Confidence  : {float(conf):.4f}")
    print("--------------------------\n")

if __name__ == "__main__":
    main()
