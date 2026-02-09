import React, { useEffect, useRef, useState } from 'react';
import styles from './TaskInput.module.css';

/**
 * Task input row used to create new tasks.
 */
export default function TaskInput({ onAdd }) {
  const [value, setValue] = useState('');
  const inputRef = useRef(null);

  const trimmed = value.trim();
  const canAdd = trimmed.length > 0;

  useEffect(() => {
    // Keep focus ready for rapid entry on initial load.
    inputRef.current?.focus();
  }, []);

  function submit() {
    if (!canAdd) return;
    onAdd(trimmed);
    setValue('');
    inputRef.current?.focus();
  }

  function onKeyDown(e) {
    if (e.key === 'Enter') {
      e.preventDefault();
      submit();
    }
  }

  return (
    <div className={styles.row}>
      <label className={styles.label} htmlFor="new-task">
        Add a task
      </label>

      <div className={styles.controls}>
        <input
          id="new-task"
          ref={inputRef}
          className={styles.input}
          type="text"
          value={value}
          placeholder="Add a new task..."
          aria-label="New task text"
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={onKeyDown}
          autoComplete="off"
        />

        <button
          type="button"
          className={styles.addButton}
          onClick={submit}
          disabled={!canAdd}
          aria-label="Add task"
        >
          Add
        </button>
      </div>
    </div>
  );
}
