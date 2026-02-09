import React from 'react';
import styles from './Header.module.css';

/**
 * Header for the todo app.
 * Includes title and a help button that toggles the instructions panel.
 */
export default function Header({ helpOpen, onToggleHelp }) {
  return (
    <header className={styles.header}>
      <div className={styles.inner}>
        <div className={styles.brand}>
          <h1 className={styles.title}>To‑Do</h1>
          <p className={styles.subtitle}>Stay on track with quick add, edit, and filters.</p>
        </div>

        <button
          type="button"
          className={styles.helpButton}
          aria-label={helpOpen ? 'Close help' : 'Open help'}
          aria-pressed={helpOpen}
          onClick={onToggleHelp}
        >
          <span className={styles.helpIcon} aria-hidden="true">
            ?
          </span>
          <span className={styles.helpText}>Help</span>
        </button>
      </div>

      <div className={styles.underline} aria-hidden="true" />
    </header>
  );
}
