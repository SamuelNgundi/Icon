export function centerRevealCard(
  container: HTMLElement,
  card: HTMLElement,
  behavior: ScrollBehavior = 'smooth',
): void {
  const containerRect = container.getBoundingClientRect();
  const cardRect = card.getBoundingClientRect();
  const targetLeft = Math.max(
    0,
    Math.min(
      container.scrollWidth - container.clientWidth,
      container.scrollLeft + cardRect.left - containerRect.left - (container.clientWidth - cardRect.width) / 2,
    ),
  );

  if (Math.abs(targetLeft - container.scrollLeft) < 2) return;

  if (typeof container.scrollTo === 'function') container.scrollTo({ left: targetLeft, behavior });
  else container.scrollLeft = targetLeft;
}
