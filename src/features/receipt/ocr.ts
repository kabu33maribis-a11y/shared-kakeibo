let workerPromise: Promise<import("tesseract.js").Worker> | null = null;

async function getWorker() {
  if (!workerPromise) {
    workerPromise = (async () => {
      const { createWorker } = await import("tesseract.js");
      return createWorker("jpn", undefined, {
        // Prefer CDN assets so Next bundling does not break the worker.
        workerPath:
          "https://cdn.jsdelivr.net/npm/tesseract.js@7/dist/worker.min.js",
        langPath: "https://tessdata.projectnaptha.com/4.0.0",
        corePath:
          "https://cdn.jsdelivr.net/npm/tesseract.js-core@5/tesseract-core.wasm.js",
      });
    })().catch((error) => {
      workerPromise = null;
      throw error;
    });
  }

  return workerPromise;
}

export async function recognizeReceiptText(
  image: Blob | HTMLCanvasElement,
): Promise<string> {
  const worker = await getWorker();
  const {
    data: { text },
  } = await worker.recognize(image);
  return text;
}

export async function terminateReceiptOcr(): Promise<void> {
  if (!workerPromise) {
    return;
  }

  try {
    const worker = await workerPromise;
    await worker.terminate();
  } finally {
    workerPromise = null;
  }
}
