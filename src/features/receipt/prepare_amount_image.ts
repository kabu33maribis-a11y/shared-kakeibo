/** Crop guide as fractions of the visible video element. */
export const AMOUNT_CROP = {
  left: 0.08,
  top: 0.38,
  width: 0.84,
  height: 0.24,
} as const;

export interface PixelCrop {
  sx: number;
  sy: number;
  sw: number;
  sh: number;
}

/**
 * Map a guide rectangle on an object-fit:cover element onto source video pixels.
 */
export function guideToVideoCrop(
  videoWidth: number,
  videoHeight: number,
  elementWidth: number,
  elementHeight: number,
  guide = AMOUNT_CROP,
): PixelCrop {
  if (
    videoWidth <= 0 ||
    videoHeight <= 0 ||
    elementWidth <= 0 ||
    elementHeight <= 0
  ) {
    return {
      sx: Math.round(videoWidth * guide.left),
      sy: Math.round(videoHeight * guide.top),
      sw: Math.max(1, Math.round(videoWidth * guide.width)),
      sh: Math.max(1, Math.round(videoHeight * guide.height)),
    };
  }

  const scale = Math.max(
    elementWidth / videoWidth,
    elementHeight / videoHeight,
  );
  const displayedW = videoWidth * scale;
  const displayedH = videoHeight * scale;
  const offsetX = (displayedW - elementWidth) / 2;
  const offsetY = (displayedH - elementHeight) / 2;

  const sx = Math.max(0, (guide.left * elementWidth + offsetX) / scale);
  const sy = Math.max(0, (guide.top * elementHeight + offsetY) / scale);
  const sw = Math.min(videoWidth - sx, (guide.width * elementWidth) / scale);
  const sh = Math.min(videoHeight - sy, (guide.height * elementHeight) / scale);

  return {
    sx: Math.round(sx),
    sy: Math.round(sy),
    sw: Math.max(1, Math.round(sw)),
    sh: Math.max(1, Math.round(sh)),
  };
}

/**
 * Crop the amount guide region, upscale, and boost contrast for digit OCR.
 */
export function prepareAmountCloseup(
  source: HTMLCanvasElement,
  crop: PixelCrop,
  scale = 2.5,
): HTMLCanvasElement {
  const out = document.createElement("canvas");
  out.width = Math.round(crop.sw * scale);
  out.height = Math.round(crop.sh * scale);
  const ctx = out.getContext("2d");
  if (!ctx) {
    return source;
  }

  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = "high";
  ctx.drawImage(
    source,
    crop.sx,
    crop.sy,
    crop.sw,
    crop.sh,
    0,
    0,
    out.width,
    out.height,
  );

  const image = ctx.getImageData(0, 0, out.width, out.height);
  const { data } = image;
  for (let i = 0; i < data.length; i += 4) {
    const gray = 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
    const boosted =
      gray < 140 ? Math.max(0, gray * 0.55) : Math.min(255, gray * 1.25 + 20);
    const value = boosted > 165 ? 255 : boosted < 110 ? 0 : boosted;
    data[i] = value;
    data[i + 1] = value;
    data[i + 2] = value;
  }
  ctx.putImageData(image, 0, 0);
  return out;
}
