import React, { useState } from "react";

type Prediction = {
  class_id: string;
  common_name: string;
  confidence: number;
  poisonous: boolean;
  poison_note?: string;
  specialties?: string[];
  where_found?: string[];
  bloom_season?: string[];
  general_nature?: string;
};

const API =
  import.meta.env.VITE_API_BASE_URL?.toString() || "http://127.0.0.1:8000";

export default function Index() {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<Prediction | null>(null);

  const onPick: React.ChangeEventHandler<HTMLInputElement> = (e) => {
    const f = e.target.files?.[0] || null;
    setFile(f);
    setResult(null);
    setError(null);
    if (f) {
      const url = URL.createObjectURL(f);
      setPreview(url);
    } else {
      setPreview(null);
    }
  };

  const predict = async () => {
    if (!file) {
      setError("Please choose an image first.");
      return;
    }
    try {
      setLoading(true);
      setError(null);
      setResult(null);

      const form = new FormData();
      form.append("image", file);

      const res = await fetch(`${API}/predict`, {
        method: "POST",
        body: form,
      });

      if (!res.ok) {
        const msg = await res.text();
        throw new Error(msg || `HTTP ${res.status}`);
      }

      const data = (await res.json()) as Prediction;
      setResult(data);
    } catch (err: any) {
      setError(err?.message || "Prediction failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-gray-50 p-6">
      <div className="w-full max-w-3xl rounded-2xl bg-white shadow p-6">
        <h1 className="text-2xl font-semibold tracking-tight">
          🌸 Flower Identifier
        </h1>
        <p className="text-sm text-gray-500">
          Upload a flower photo to identify its type and basic information.
        </p>

        <div className="mt-6 grid gap-4 md:grid-cols-2">
          <div className="border-2 border-dashed rounded-xl p-4 flex flex-col items-center justify-center">
            <input
              id="file"
              type="file"
              accept="image/*"
              onChange={onPick}
              className="hidden"
            />
            <label
              htmlFor="file"
              className="inline-flex items-center justify-center rounded-lg border px-4 py-2 text-sm font-medium hover:bg-gray-50 cursor-pointer"
            >
              Choose Image
            </label>

            {preview && (
              <img
                src={preview}
                alt="preview"
                className="mt-4 max-h-64 object-contain rounded-lg"
              />
            )}
          </div>

          <div className="flex flex-col gap-3">
            <button
              onClick={predict}
              disabled={loading || !file}
              className="rounded-lg bg-black text-white px-4 py-2 text-sm font-medium disabled:opacity-50"
            >
              {loading ? "Predicting..." : "Predict"}
            </button>

            {error && (
              <div className="rounded-lg bg-red-50 text-red-700 px-4 py-2 text-sm">
                {error}
              </div>
            )}

            {result && (
              <div className="rounded-lg border p-4">
                <h2 className="text-lg font-semibold mb-2">
                  Result: {result.common_name || result.class_id}
                </h2>
                <div className="text-sm grid gap-1">
                  <div>
                    <span className="font-medium">Class:</span>{" "}
                    <code className="bg-gray-100 px-1 rounded">
                      {result.class_id}
                    </code>
                  </div>
                  <div>
                    <span className="font-medium">Confidence:</span>{" "}
                    {(result.confidence * 100).toFixed(2)}%
                  </div>
                  <div>
                    <span className="font-medium">Poisonous:</span>{" "}
                    {result.poisonous ? "Yes" : "No"}
                    {result.poison_note ? ` – ${result.poison_note}` : ""}
                  </div>
                  {result.general_nature && (
                    <div>
                      <span className="font-medium">Nature:</span>{" "}
                      {result.general_nature}
                    </div>
                  )}
                  {!!(result.where_found?.length) && (
                    <div>
                      <span className="font-medium">Where found:</span>{" "}
                      {result.where_found!.join(", ")}
                    </div>
                  )}
                  {!!(result.bloom_season?.length) && (
                    <div>
                      <span className="font-medium">Bloom season:</span>{" "}
                      {result.bloom_season!.join(", ")}
                    </div>
                  )}
                  {!!(result.specialties?.length) && (
                    <div>
                      <span className="font-medium">Specialties:</span>{" "}
                      {result.specialties!.join(", ")}
                    </div>
                  )}
                </div>
              </div>
            )}

            <div className="text-xs text-gray-500 mt-2">
              API: <code>{API}</code>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
