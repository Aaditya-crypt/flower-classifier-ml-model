# app.py
# Usage:
#   pip install -r requirements.txt
#   python app.py
# POST /predict with form-data: image=<file>

import io, os, json
from typing import Dict, Any
from PIL import Image
import torch, torch.nn as nn
from torchvision import transforms, models
from flask import Flask, request, jsonify
from flask_cors import CORS

MODEL_PATH = os.environ.get("MODEL_PATH", "models/best.pt")
LABEL_MAP  = os.environ.get("LABEL_MAP",  "models/label_map.json")

# ---- load classes ----
with open(LABEL_MAP, "r") as f:
    IDX2CLASS = {int(k): v for k, v in json.load(f).items()}
CLASSES = [IDX2CLASS[i] for i in range(len(IDX2CLASS))]

# ---- model ----
def build_model(num_classes):
    m = models.efficientnet_b0(weights=None)
    in_feats = m.classifier[1].in_features
    m.classifier[1] = nn.Linear(in_feats, num_classes)
    return m

model = build_model(num_classes=len(CLASSES))
ckpt = torch.load(MODEL_PATH, map_location="cpu")
state = ckpt["model"] if "model" in ckpt else ckpt
model.load_state_dict(state)
model.eval()

# ---- preprocessing ----
preprocess = transforms.Compose([
    transforms.Resize(256),
    transforms.CenterCrop(224),
    transforms.ToTensor(),
    transforms.Normalize([0.485,0.456,0.406],[0.229,0.224,0.225]),
])

def predict_pil(pil: Image.Image) -> Dict[str, Any]:
    x = preprocess(pil.convert("RGB")).unsqueeze(0)
    with torch.no_grad():
        logits = model(x)
        probs = torch.softmax(logits, dim=1)[0]
        conf, idx = torch.max(probs, dim=0)
    label = CLASSES[int(idx)]
    return {
        "class_id": label,
        "common_name": label.replace("_"," ").title(),
        "confidence": round(float(conf), 4),
        # Optional placeholders your UI can show/hide:
        "poisonous": False,
        "poison_note": "",
        "specialties": [],
        "where_found": [],
        "bloom_season": [],
        "general_nature": "flowering plant",
    }

app = Flask(__name__)
CORS(app)

@app.get("/health")
def health():
    return jsonify({"status": "ok", "num_classes": len(CLASSES), "model_path": MODEL_PATH})

@app.post("/predict")
def predict():
    if "image" not in request.files:
        return jsonify({"error": "form-data must include 'image'"}), 400
    f = request.files["image"]
    if not f.filename:
        return jsonify({"error": "empty filename"}), 400
    try:
        img = Image.open(io.BytesIO(f.read()))
    except Exception as e:
        return jsonify({"error": f"invalid image: {e}"}), 415
    return jsonify(predict_pil(img)), 200

if __name__ == "__main__":
    port = int(os.environ.get("PORT", "8000"))
    app.run(host="0.0.0.0", port=port)
