import { describe, expect, it } from "vitest";
import { getScrollDeltaToRevealElement } from "./keep_input_visible";

describe("getScrollDeltaToRevealElement", () => {
  it("does not scroll when the field is already in the safe area", () => {
    expect(
      getScrollDeltaToRevealElement({
        elementTop: 120,
        elementBottom: 160,
        viewHeight: 700,
        headerHeight: 56,
        footerHeight: 96,
      }),
    ).toBe(0);
  });

  it("scrolls down when the field is hidden under the header", () => {
    const delta = getScrollDeltaToRevealElement({
      elementTop: 10,
      elementBottom: 50,
      viewHeight: 700,
      headerHeight: 56,
      footerHeight: 96,
    });

    expect(delta).toBeLessThan(0);
  });

  it("scrolls up when the field is hidden behind the footer", () => {
    const delta = getScrollDeltaToRevealElement({
      elementTop: 640,
      elementBottom: 680,
      viewHeight: 700,
      headerHeight: 56,
      footerHeight: 96,
    });

    expect(delta).toBeGreaterThan(0);
  });
});
