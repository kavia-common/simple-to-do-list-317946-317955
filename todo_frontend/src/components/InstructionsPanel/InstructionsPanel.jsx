import React, { useEffect, useRef } from 'react';
import styles from './InstructionsPanel.module.css';

/**
 * Dismissible help/instructions panel. Shown/hidden via the header help button.
 */
export default function InstructionsPanel({ open, onClose, onStartWalkthrough }) {
  const closeButtonRef = useRef(null);

  useEffect(() => {
    if (open) closeButtonRef.current?.focus();
  }, [open]);

  useEffect(() => {
    function onKeyDown(e) {
      if (!open) return;
      if (e.key === 'Escape') onClose();
    }
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <aside className={styles.panel} aria-label="Help and instructions">
      <div className={styles.header}>
        <div>
          <h2 className={styles.title}>Help</h2>
          <p className={styles.subtitle}>Keyboard-friendly, quick to use.</p>
        </div>

        <div className={styles.headerActions}>
          <button
            type="button"
            className={styles.walkthrough}
            onClick={onStartWalkthrough}
            aria-label="Start walkthrough"
          >
            Start walkthrough
          </button>

          <button
            ref={closeButtonRef}
            type="button"
            className={styles.close}
            onClick={onClose}
            aria-label="Close help panel"
          >
            ×
          </button>
        </div>
      </div>

      <div className={styles.body}>
        <section className={styles.section} aria-label="Creating tasks">
          <h3 className={styles.h3}>Create</h3>
          <p className={styles.p}>
            Type a task in the input and press <kbd>Enter</kbd> or click <strong>Add</strong>. Empty tasks aren’t
            allowed.
          </p>
        </section>

        <section className={styles.section} aria-label="Editing tasks">
          <h3 className={styles.h3}>Edit</h3>
          <p className={styles.p}>
            Use the pencil icon to edit inline. In edit mode: <kbd>Enter</kbd> saves and <kbd>Esc</kbd> cancels.
          </p>
        </section>

        <section className={styles.section} aria-label="Completing and filtering tasks">
          <h3 className={styles.h3}>Complete & filter</h3>
          <p className={styles.p}>
            Toggle the checkbox to mark complete. Use filters (All / Active / Completed) to focus.
          </p>
        </section>

        <section className={styles.section} aria-label="Deleting tasks">
          <h3 className={styles.h3}>Delete</h3>
          <p className={styles.p}>
            Use the trash icon to remove tasks. Your list is saved automatically in your browser.
          </p>
        </section>
      </div>
    </aside>
  );
}
