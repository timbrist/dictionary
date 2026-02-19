import * as logger from "firebase-functions/logger";
import { HttpsError, onCall } from "firebase-functions/v2/https";
import vision from "@google-cloud/vision";

const visionClient = new vision.ImageAnnotatorClient();

type Vertex = { x: number; y: number };

type ObjectAnnotation = {
  name: string;
  score: number;
  box: Vertex[];
};

function normalizeBase64(input: string): string {
  const trimmed = input.trim();
  const markerIndex = trimmed.indexOf("base64,");
  if (markerIndex >= 0) {
    return trimmed.slice(markerIndex + 7);
  }
  return trimmed;
}

function coerceVertices(vertices: Array<{ x?: number | null; y?: number | null }> | null | undefined): Vertex[] {
  if (!vertices) return [];
  return vertices.map((v) => ({
    x: v.x ?? 0,
    y: v.y ?? 0,
  }));
}

export const detectImageObjects = onCall({
  region: "europe-west3",
  memory: "512MiB",
  timeoutSeconds: 60,
  maxInstances: 10,
}, async (request) => {
  const base64Image = request.data?.base64Image;

  if (typeof base64Image !== "string" || !base64Image.trim()) {
    throw new HttpsError("invalid-argument", "Missing base64Image string.");
  }

  const normalizedBase64 = normalizeBase64(base64Image);
  if (normalizedBase64.length > 7_500_000) {
    throw new HttpsError("invalid-argument", "Image payload is too large.");
  }

  try {
    const [result] = await visionClient.annotateImage({
      image: { content: normalizedBase64 },
      features: [{ type: "OBJECT_LOCALIZATION" }],
    });

    const objects: ObjectAnnotation[] = (result.localizedObjectAnnotations ?? []).map((item) => ({
      name: item.name ?? "Unknown",
      score: item.score ?? 0,
      box: coerceVertices(item.boundingPoly?.normalizedVertices).map((v) => ({
        x: Math.max(0, Math.min(1, v.x)),
        y: Math.max(0, Math.min(1, v.y)),
      })),
    }));

    return {
      objects,
      count: objects.length,
    };
  } catch (error) {
    if (error instanceof HttpsError) {
      throw error;
    }
    logger.error("Vision API object detection failed", error);
    throw new HttpsError("internal", "Image analysis failed.");
  }
});
