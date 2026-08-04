import {
  guideToVideoCrop,
} from "@/features/receipt/prepare_amount_image";
import { describe, expect, it } from "vitest";

describe("guideToVideoCrop", () => {
  it("maps cover-cropped center guide back to video pixels", () => {
    // Video 1920x1080 shown in 300x400 portrait with object-cover.
    const crop = guideToVideoCrop(1920, 1080, 300, 400);
    expect(crop.sw).toBeGreaterThan(100);
    expect(crop.sh).toBeGreaterThan(50);
    expect(crop.sx + crop.sw).toBeLessThanOrEqual(1920);
    expect(crop.sy + crop.sh).toBeLessThanOrEqual(1080);
  });
});
