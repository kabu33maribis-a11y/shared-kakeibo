export const DEFAULT_FOCUS_PADDING = 12;
export const DEFAULT_FOOTER_HEIGHT = 96;

export function getScrollDeltaToRevealElement({
  elementTop,
  elementBottom,
  viewHeight,
  headerHeight,
  footerHeight,
  padding = DEFAULT_FOCUS_PADDING,
}: {
  elementTop: number;
  elementBottom: number;
  viewHeight: number;
  headerHeight: number;
  footerHeight: number;
  padding?: number;
}): number {
  const topLimit = headerHeight + padding;
  const bottomLimit = viewHeight - footerHeight - padding;

  if (elementTop >= topLimit && elementBottom <= bottomLimit) {
    return 0;
  }

  const visibleCenter = (topLimit + bottomLimit) / 2;
  const elementCenter = (elementTop + elementBottom) / 2;
  return elementCenter - visibleCenter;
}

function revealInput(element: HTMLElement) {
  if (typeof document === "undefined" || document.activeElement !== element) {
    return;
  }

  const header = document.querySelector("header");
  const footer = document.querySelector("[data-sticky-footer]");
  const visual = window.visualViewport;
  const viewOffset = visual?.offsetTop ?? 0;
  const rect = element.getBoundingClientRect();
  const delta = getScrollDeltaToRevealElement({
    elementTop: rect.top - viewOffset,
    elementBottom: rect.bottom - viewOffset,
    viewHeight: visual?.height ?? window.innerHeight,
    headerHeight: header?.getBoundingClientRect().height ?? 0,
    footerHeight: footer?.getBoundingClientRect().height ?? DEFAULT_FOOTER_HEIGHT,
  });

  if (Math.abs(delta) < 1) {
    return;
  }

  window.scrollBy({ top: delta, behavior: "smooth" });
}

export function scheduleKeepInputVisible(element: HTMLElement) {
  const run = () => revealInput(element);

  window.setTimeout(run, 50);
  window.setTimeout(run, 320);

  const visual = window.visualViewport;
  if (!visual) {
    return;
  }

  const onChange = () => {
    run();
  };

  visual.addEventListener("resize", onChange);
  visual.addEventListener("scroll", onChange);
  window.setTimeout(() => {
    visual.removeEventListener("resize", onChange);
    visual.removeEventListener("scroll", onChange);
  }, 800);
}
