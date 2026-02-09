import React, { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import styles from './Walkthrough.module.css';
import { findTourTarget, computeTooltipPosition, trapTabKey } from './utils.js';
import { setWalkthroughDismissed } from './storage.js';

/**
 * @typedef {Object} WalkthroughStep
 * @property {string} id Unique id for step
 * @property {string} targetTourId data-tour-id to anchor to
 * @property {string} title
 * @property {string} description
 * @property {'top'|'bottom'|'left'|'right'} [side]
 */

/**
 * Lightweight dependency-free walkthrough / tooltip sequence.
 * Uses a scrim overlay, highlights target, and positions tooltip near target.
 */
export default function Walkthrough({ open, steps, initialStepId, onClose }) {
  const orderedSteps = useMemo(() => steps ?? [], [steps]);
  const initialIndex = useMemo(() => {
    if (!initialStepId) return 0;
    const idx = orderedSteps.findIndex((s) => s.id === initialStepId);
    return idx >= 0 ? idx : 0;
  }, [orderedSteps, initialStepId]);

  const [index, setIndex] = useState(initialIndex);
  const [targetRect, setTargetRect] = useState(null);
  const [targetEl, setTargetEl] = useState(null);
  const [tooltipPos, setTooltipPos] = useState({ top: 0, left: 0, side: 'bottom' });

  const tooltipRef = useRef(null);
  const previouslyFocusedRef = useRef(null);

  const step = orderedSteps[index];

  // Reset index when (re)opening so users start from beginning.
  useEffect(() => {
    if (!open) return;
    setIndex(initialIndex);
  }, [open, initialIndex]);

  // Track focus + keyboard handlers.
  useEffect(() => {
    if (!open) return;

    previouslyFocusedRef.current = document.activeElement;

    function onKeyDown(e) {
      if (!open) return;

      if (e.key === 'Escape') {
        e.preventDefault();
        onClose?.({ reason: 'escape' });
        return;
      }

      // Enter advances unless focus is on Back/Skip/Done buttons (they handle their own clicks).
      if (e.key === 'Enter') {
        const active = document.activeElement;
        const inTooltip = tooltipRef.current?.contains(active);
        if (inTooltip) return;
        e.preventDefault();
        goNext();
      }

      // Focus trap
      if (e.key === 'Tab' && tooltipRef.current) {
        trapTabKey(e, tooltipRef.current);
      }
    }

    window.addEventListener('keydown', onKeyDown, true);
    return () => window.removeEventListener('keydown', onKeyDown, true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, index, orderedSteps.length, onClose]);

  // When closed, restore focus.
  useEffect(() => {
    if (open) return;
    const prev = previouslyFocusedRef.current;
    if (prev && typeof prev.focus === 'function') {
      prev.focus();
    }
  }, [open]);

  // Resolve target element; if missing, auto-skip to next available.
  useEffect(() => {
    if (!open) return;
    if (!step) return;

    const el = findTourTarget(step.targetTourId);
    if (!el) {
      // Target not available (responsive layout or no tasks) => skip forward
      const nextIdx = findNextAvailableIndex(index + 1);
      if (nextIdx !== null) setIndex(nextIdx);
      else finish('missing-targets');
      return;
    }

    setTargetEl(el);
    setTargetRect(el.getBoundingClientRect());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, index, step?.targetTourId]);

  // Update rect on scroll/resize.
  useEffect(() => {
    if (!open || !targetEl) return;

    const update = () => setTargetRect(targetEl.getBoundingClientRect());
    update();

    window.addEventListener('resize', update);
    window.addEventListener('scroll', update, true);
    return () => {
      window.removeEventListener('resize', update);
      window.removeEventListener('scroll', update, true);
    };
  }, [open, targetEl]);

  // Compute tooltip position after it renders.
  useLayoutEffect(() => {
    if (!open) return;
    if (!targetRect) return;

    const tooltip = tooltipRef.current;
    if (!tooltip) return;

    const { width, height } = tooltip.getBoundingClientRect();
    const preferred = step?.side ?? 'bottom';
    const pos = computeTooltipPosition(targetRect, width, height, preferred);
    setTooltipPos(pos);
  }, [open, targetRect, step]);

  // On open, focus the tooltip for screen reader + keyboard users.
  useEffect(() => {
    if (!open) return;
    // Focus after paint
    const t = window.setTimeout(() => {
      tooltipRef.current?.focus();
    }, 0);
    return () => window.clearTimeout(t);
  }, [open, index]);

  function findNextAvailableIndex(startIdx) {
    for (let i = startIdx; i < orderedSteps.length; i += 1) {
      const el = findTourTarget(orderedSteps[i].targetTourId);
      if (el) return i;
    }
    return null;
  }

  function findPrevAvailableIndex(startIdx) {
    for (let i = startIdx; i >= 0; i -= 1) {
      const el = findTourTarget(orderedSteps[i].targetTourId);
      if (el) return i;
    }
    return null;
  }

  function goNext() {
    const nextIdx = findNextAvailableIndex(index + 1);
    if (nextIdx === null) finish('done');
    else setIndex(nextIdx);
  }

  function goBack() {
    const prevIdx = findPrevAvailableIndex(index - 1);
    if (prevIdx === null) return;
    setIndex(prevIdx);
  }

  function finish(reason) {
    setWalkthroughDismissed(true);
    onClose?.({ reason });
  }

  function skip() {
    setWalkthroughDismissed(true);
    onClose?.({ reason: 'skip' });
  }

  if (!open || !step || !targetRect) return null;

  // Highlight uses rect + scroll offsets
  const highlightStyle = {
    top: Math.max(0, targetRect.top - 6) + window.scrollY,
    left: Math.max(0, targetRect.left - 6) + window.scrollX,
    width: Math.max(0, targetRect.width + 12),
    height: Math.max(0, targetRect.height + 12)
  };

  const tooltipStyle = {
    top: tooltipPos.top + window.scrollY,
    left: tooltipPos.left + window.scrollX
  };

  const isLast = (() => {
    const nextIdx = findNextAvailableIndex(index + 1);
    return nextIdx === null;
  })();

  return (
    <div className={styles.root} aria-hidden={false}>
      <div className={styles.scrim} aria-hidden="true" />

      <div className={styles.highlight} style={highlightStyle} aria-hidden="true" />

      <div
        className={styles.tooltip}
        ref={tooltipRef}
        style={tooltipStyle}
        role="dialog"
        aria-modal="true"
        aria-label={`Walkthrough: ${step.title}`}
        tabIndex={-1}
        data-side={tooltipPos.side}
      >
        <div className={styles.arrow} aria-hidden="true" />

        <div className={styles.header}>
          <div className={styles.kicker} aria-hidden="true">
            Step {index + 1} of {orderedSteps.length}
          </div>
          <h3 className={styles.title}>{step.title}</h3>
          <p className={styles.desc}>{step.description}</p>
        </div>

        <div className={styles.actions}>
          <button type="button" className={styles.secondary} onClick={skip}>
            Skip
          </button>

          <div className={styles.spacer} />

          <button type="button" className={styles.ghost} onClick={goBack} disabled={index === 0}>
            Back
          </button>

          {!isLast ? (
            <button type="button" className={styles.primary} onClick={goNext}>
              Next
            </button>
          ) : (
            <button type="button" className={styles.primary} onClick={() => finish('done')}>
              Done
            </button>
          )}
        </div>

        <div className={styles.hint} aria-hidden="true">
          Tip: Tab to navigate • Enter for Next • Esc to exit
        </div>
      </div>
    </div>
  );
}
