import React from 'react';
import styles from './EmptyState.module.css';

/**
 * Empty state shown when there are no tasks.
 */
export default function EmptyState({ onOpenHelp }) {
  return (
    <div className={styles.card} role="status" aria-live="polite">
      <h2 className={styles.title}>Nothing here yet</h2>
      <p className={styles.text}>
        Add your first task above, then use the checkbox to mark it complete.
      </p>

      <ul className={styles.list}>
        <li>
          <strong>Add</strong>: type a task and press <kbd>Enter</kbd>
        </li>
        <li>
          <strong>Edit</strong>: click the pencil icon to edit inline
        </li>
        <li>
          <strong>Complete</strong>: toggle the checkbox
        </li>
        <li>
          <strong>Delete</strong>: use the trash icon
        </li>
      </ul>

      <button type="button" className={styles.helpCta} onClick={onOpenHelp} aria-label="Open help panel">
        View full help
      </button>
    </div>
  );
}
