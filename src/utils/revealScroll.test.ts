// @vitest-environment jsdom
import { describe, expect, it, vi } from 'vitest';
import { centerRevealCard } from './revealScroll';

function createRevealElements({
  containerLeft = 100,
  containerWidth = 400,
  scrollWidth = 1200,
  scrollLeft = 0,
  cardLeft = 600,
  cardWidth = 125,
}: {
  containerLeft?: number;
  containerWidth?: number;
  scrollWidth?: number;
  scrollLeft?: number;
  cardLeft?: number;
  cardWidth?: number;
} = {}) {
  const container = document.createElement('div');
  const card = document.createElement('button');
  Object.defineProperties(container, {
    clientWidth: { configurable: true, value: containerWidth },
    scrollWidth: { configurable: true, value: scrollWidth },
    scrollLeft: { configurable: true, writable: true, value: scrollLeft },
  });
  vi.spyOn(container, 'getBoundingClientRect').mockReturnValue({
    left: containerLeft,
    right: containerLeft + containerWidth,
    top: 0,
    bottom: 200,
    width: containerWidth,
    height: 200,
    x: containerLeft,
    y: 0,
    toJSON: () => ({}),
  });
  vi.spyOn(card, 'getBoundingClientRect').mockReturnValue({
    left: cardLeft,
    right: cardLeft + cardWidth,
    top: 0,
    bottom: 200,
    width: cardWidth,
    height: 200,
    x: cardLeft,
    y: 0,
    toJSON: () => ({}),
  });
  Object.defineProperty(container, 'scrollTo', { configurable: true, value: vi.fn() });
  return { container, card };
}

describe('centerRevealCard', () => {
  it('smoothly scrolls the reveal container to center the latest card', () => {
    const { container, card } = createRevealElements();

    centerRevealCard(container, card);

    expect(container.scrollTo).toHaveBeenCalledWith({ left: 362.5, behavior: 'smooth' });
  });

  it('does not scroll when the card is already centered', () => {
    const { container, card } = createRevealElements({
      cardLeft: 237.5,
      scrollLeft: 0,
    });

    centerRevealCard(container, card);

    expect(container.scrollTo).not.toHaveBeenCalled();
  });

  it('clamps the scroll position at the end of the card row', () => {
    const { container, card } = createRevealElements({
      scrollWidth: 700,
      containerWidth: 400,
      cardLeft: 650,
      cardWidth: 125,
    });

    centerRevealCard(container, card);

    expect(container.scrollTo).toHaveBeenCalledWith({ left: 300, behavior: 'smooth' });
  });
});
