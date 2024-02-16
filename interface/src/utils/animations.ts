export function animationsComplete(element: HTMLElement) {
  return Promise.allSettled(
    element.getAnimations().map((animation) => animation.finished)
  );
}
