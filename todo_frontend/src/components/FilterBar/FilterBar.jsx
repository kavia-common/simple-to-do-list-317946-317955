import React from 'react';
import styles from './FilterBar.module.css';

/**
 * Client-side filter bar (All / Active / Completed) with counts.
 */
export default function FilterBar({ filter, onChange, counts }) {
  const items = [
    { key: 'all', label: 'All', count: counts.total },
    { key: 'active', label: 'Active', count: counts.active },
    { key: 'completed', label: 'Completed', count: counts.completed }
  ];

  return (
    <div className={styles.bar} role="tablist" aria-label="Task filters">
      {items.map((it) => {
        const active = it.key === filter;
        return (
          <button
            key={it.key}
            type="button"
            role="tab"
            aria-selected={active}
            className={`${styles.pill} ${active ? styles.active : ''}`}
            onClick={() => onChange(it.key)}
          >
            <span className={styles.label}>{it.label}</span>
            <span className={styles.count} aria-label={`${it.count} ${it.label} tasks`}>
              {it.count}
            </span>
          </button>
        );
      })}
    </div>
  );
}
