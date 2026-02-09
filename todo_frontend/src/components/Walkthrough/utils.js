/**
 * Walkthrough utilities: find anchors, position tooltip in viewport, and focus management.
 */

const VIEWPORT_PADDING = 10;

/**
 * Attempts to find the walkthrough target element by tour id.
 * @param {string} tourId
 * @returns {HTMLElement|null}
 */
export function findTourTarget(tourId) {
  if (!tourId) return null;
  return document.querySelector(`[data-tour-id="${CSS.escape(tourId)}"]`);
}

/**
 * Computes a tooltip position around a target with basic viewport-aware fallback.
 * @param {DOMRect} targetRect
 * @param {number} tooltipWidth
 * @param {number} tooltipHeight
 * @param {'top'|'bottom'|'left'|'right'} preferredSide
 */
export function computeTooltipPosition(targetRect, tooltipWidth, tooltipHeight, preferredSide) {
  const vw = window.innerWidth;
  const vh = window.innerHeight;

  const candidates = [preferredSide, 'bottom', 'top', 'right', 'left'].filter(
    (v, idx, arr) => arr.indexOf(v) === idx
  );

  function clamp(value, min, max) {
    return Math.max(min, Math.min(max, value));
  }

  function trySide(side) {
    let top = 0;
    let left = 0;

    if (side === 'top') {
      top = targetRect.top - tooltipHeight - 12;
      left = targetRect.left + targetRect.width / 2 - tooltipWidth / 2;
    } else if (side === 'bottom') {
      top = targetRect.bottom + 12;
      left = targetRect.left + targetRect.width / 2 - tooltipWidth / 2;
    } else if (side === 'left') {
      top = targetRect.top + targetRect.height / 2 - tooltipHeight / 2;
      left = targetRect.left - tooltipWidth - 12;
    } else {
      top = targetRect.top + targetRect.height / 2 - tooltipHeight / 2;
      left = targetRect.right + 12;
    }

    const clampedLeft = clamp(left, VIEWPORT_PADDING, vw - tooltipWidth - VIEWPORT_PADDING);
    const clampedTop = clamp(top, VIEWPORT_PADDING, vh - tooltipHeight - VIEWPORT_PADDING);

    const fitsVertically = clampedTop === top || (top >= VIEWPORT_PADDING && top + tooltipHeight <= vh - VIEWPORT_PADDING);
    const fitsHorizontally =
      clampedLeft === left || (left >= VIEWPORT_PADDING && left + tooltipWidth <= vw - VIEWPORT_PADDING);

    // We allow clamping, but prefer positions that fit without heavy clamping.
    const penalty = (clampedLeft !== left ? 1 : 0) + (clampedTop !== top ? 1 : 0);
    return { side, top: clampedTop, left: clampedLeft, penalty, fitsVertically, fitsHorizontally };
  }

  const scored = candidates.map(trySide).sort((a, b) => a.penalty - b.penalty);

  return scored[0];
}

/**
 * Minimal focus trap for a popover: cycles tab within focusable items.
 * @param {KeyboardEvent} e
 * @param {HTMLElement} container
 */
export function trapTabKey(e, container) {
  const focusables = container.querySelectorAll(
    'button,[href],input,select,textarea,[tabindex]:not([tabindex="-1"])'
  );
  const list = Array.from(focusables).filter((el) => !el.hasAttribute('disabled') && !el.getAttribute('aria-hidden'));

  if (list.length === 0) return;

  const first = list[0];
  const last = list[list.length - 1];
  const active = document.activeElement;

  if (e.shiftKey) {
    if (active === first || active === container) {
      e.preventDefault();
      last.focus();
    }
  } else {
    if (active === last) {
      e.preventDefault();
      first.focus();
    }
  }
}
