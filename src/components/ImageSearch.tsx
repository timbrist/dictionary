import React, { useMemo, useState } from "react";
import { httpsCallable } from "firebase/functions";

import { functions } from "../firebase";
import type { WordEntry } from "../types/WordType";

type Point = { x: number; y: number };

type DetectionObject = {
  name: string;
  score: number;
  box: Point[];
};

type DetectObjectsResponse = {
  objects: DetectionObject[];
  count: number;
};

type ImageSearchProps = {
  onAddWord?: (input: WordEntry) => void;
};

const detectImageObjects = httpsCallable<{ base64Image: string }, DetectObjectsResponse>(functions, "detectImageObjects");

function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result;
      if (typeof result === "string") {
        resolve(result);
      } else {
        reject(new Error("Could not read image file."));
      }
    };
    reader.onerror = () => reject(new Error("Could not read image file."));
    reader.readAsDataURL(file);
  });
}

function formatPercent(score: number): string {
  return `${Math.round(score * 100)}%`;
}

export function ImageSearch({ onAddWord }: ImageSearchProps) {
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [detections, setDetections] = useState<DetectionObject[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const hasImage = Boolean(previewUrl);

  const sortedDetections = useMemo(() => {
    return [...detections].sort((a, b) => b.score - a.score);
  }, [detections]);

  async function onFileChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setError("Please upload an image file.");
      return;
    }

    setError(null);
    setLoading(true);

    try {
      const dataUrl = await fileToDataUrl(file);
      setPreviewUrl(dataUrl);

      const base64Image = dataUrl.split(",")[1] ?? "";
      if (!base64Image) {
        throw new Error("Unable to parse image payload.");
      }

      const response = await detectImageObjects({ base64Image });
      setDetections(response.data.objects ?? []);
    } catch (e) {
      const message = e instanceof Error ? e.message : "Image detection failed.";
      setDetections([]);
      setError(message);
    } finally {
      setLoading(false);
    }
  }

  function addDetectionToWordList(item: DetectionObject) {
    onAddWord?.({
      word: item.name,
      meaning: "Detected from image",
    });
  }

  function addAllDetections() {
    for (const item of sortedDetections) {
      addDetectionToWordList(item);
    }
  }

  return (
    <div style={styles.page}>
      <h2 style={styles.title}>Image Object Detection</h2>

      <label style={styles.fileLabel}>
        <span>{loading ? "Analyzing..." : "Upload image"}</span>
        <input type="file" accept="image/*" onChange={onFileChange} style={styles.fileInput} disabled={loading} />
      </label>

      {sortedDetections.length > 0 ? (
        <button type="button" style={styles.addAllButton} onClick={addAllDetections}>
          Add All Detected Words
        </button>
      ) : null}

      {error ? <p style={styles.error}>{error}</p> : null}

      {!hasImage ? (
        <p style={styles.muted}>Pick an image to detect objects and draw labeled boxes.</p>
      ) : (
        <div style={styles.viewerWrap}>
          <div style={styles.imageFrame}>
            <img src={previewUrl ?? ""} alt="Uploaded preview" style={styles.image} />

            <svg viewBox="0 0 1 1" preserveAspectRatio="none" style={styles.overlay}>
              {detections.map((item, index) => {
                if (item.box.length < 4) return null;

                const xs = item.box.map((point) => point.x);
                const ys = item.box.map((point) => point.y);
                const left = Math.min(...xs);
                const top = Math.min(...ys);
                const width = Math.max(...xs) - left;
                const height = Math.max(...ys) - top;

                const textY = top > 0.04 ? top - 0.01 : Math.min(0.99, top + 0.03);

                return (
                  <g key={`${item.name}-${index}`}>
                    <rect
                      x={left}
                      y={top}
                      width={width}
                      height={height}
                      fill="rgba(29, 78, 216, 0.12)"
                      stroke="#1d4ed8"
                      strokeWidth={0.004}
                    />
                    <text x={left} y={textY} fill="#0f172a" fontSize={0.03} fontWeight={700}>
                      {item.name} ({formatPercent(item.score)})
                    </text>
                  </g>
                );
              })}
            </svg>
          </div>

          <div style={styles.resultPanel}>
            <h3 style={styles.resultTitle}>Detected Objects</h3>
            {sortedDetections.length === 0 ? (
              <p style={styles.muted}>No objects detected.</p>
            ) : (
              <ul style={styles.resultList}>
                {sortedDetections.map((item, index) => (
                  <li key={`${item.name}-${index}`} style={styles.resultItem}>
                    <span>
                      {item.name} <strong>{formatPercent(item.score)}</strong>
                    </span>
                    <button type="button" style={styles.addOneButton} onClick={() => addDetectionToWordList(item)}>
                      Add
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  page: {
    display: "grid",
    gap: 12,
    width: "min(900px, 96vw)",
    margin: "20px auto",
    fontFamily: "ui-sans-serif, system-ui, sans-serif",
  },
  title: {
    margin: 0,
  },
  fileLabel: {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    width: 180,
    padding: "10px 14px",
    borderRadius: 10,
    border: "1px solid #cbd5e1",
    background: "#f8fafc",
    cursor: "pointer",
    fontWeight: 600,
  },
  addAllButton: {
    justifySelf: "start",
    border: "none",
    borderRadius: 10,
    padding: "9px 12px",
    cursor: "pointer",
    fontWeight: 700,
    color: "#fff",
    background: "#14532d",
  },
  addOneButton: {
    border: "none",
    borderRadius: 8,
    padding: "6px 10px",
    cursor: "pointer",
    fontWeight: 700,
    color: "#fff",
    background: "#0f766e",
  },
  fileInput: {
    display: "none",
  },
  viewerWrap: {
    display: "grid",
    gridTemplateColumns: "2fr 1fr",
    gap: 16,
    alignItems: "start",
  },
  imageFrame: {
    position: "relative",
    border: "1px solid #e2e8f0",
    borderRadius: 12,
    overflow: "hidden",
    background: "#fff",
  },
  image: {
    display: "block",
    width: "100%",
    height: "auto",
  },
  overlay: {
    position: "absolute",
    inset: 0,
    width: "100%",
    height: "100%",
    pointerEvents: "none",
  },
  resultPanel: {
    border: "1px solid #e2e8f0",
    borderRadius: 12,
    padding: 12,
    background: "#fff",
  },
  resultTitle: {
    margin: "0 0 10px",
  },
  resultList: {
    listStyle: "none",
    margin: 0,
    padding: 0,
    display: "grid",
    gap: 8,
  },
  resultItem: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    borderBottom: "1px solid #f1f5f9",
    paddingBottom: 6,
    gap: 10,
  },
  muted: {
    color: "#64748b",
    margin: 0,
  },
  error: {
    color: "#b91c1c",
    margin: 0,
  },
};

export default ImageSearch;
