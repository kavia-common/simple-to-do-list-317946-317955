import React, { useEffect, useId, useRef, useState } from 'react';
import styles from './TaskItem.module.css';

/**
 * A single task row supporting toggle complete, inline edit, and delete.
 */
export default function TaskItem({ task, onToggle, onDelete, onUpdateText }) {
  const checkboxId = useId();
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(task.text);

  const inputRef = useRef(null);

  useEffect(() => {
    // If task text changes externally, keep draft in sync when not editing.
    if (!editing) setDraft(task.text);
  }, [task.text, editing]);

  useEffect(() => {
    if (editing) {
      inputRef.current?.focus();
      inputRef.current?.select();
    }
  }, [editing]);

  function startEdit() {
    setDraft(task.text);
    setEditing(true);
  }

  function cancelEdit() {
    setDraft(task.text);
    setEditing(false);
  }

  function saveEdit() {
    const ok = onUpdateText(draft);
    if (ok) setEditing(false);
    // If invalid (empty), keep editing so user can fix.
  }

  function onEditKeyDown(e) {
    if (e.key === 'Escape') {
      e.preventDefault();
      cancelEdit();
    }
    if (e.key === 'Enter') {
      e.preventDefault();
      saveEdit();
    }
  }

  return (
    <div
      className={`${styles.row} ${task.completed ? styles.completed : ''}`}
      role="listitem"
      data-tour-id="task-row"
    >
      <div className={styles.left}>
        <input
          id={checkboxId}
          type="checkbox"
          className={styles.checkbox}
          checked={task.completed}
          onChange={onToggle}
          aria-label={task.completed ? 'Mark task as pending' : 'Mark task as completed'}
        />

        {!editing ? (
          <label className={styles.text} htmlFor={checkboxId} title={task.text}>
            {task.text}
          </label>
        ) : (
          <div className={styles.editor}>
            <input
              ref={inputRef}
              className={styles.editInput}
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={onEditKeyDown}
              aria-label="Edit task text"
            />
            <div className={styles.editActions}>
              <button type="button" className={styles.primaryAction} onClick={saveEdit} aria-label="Save edit">
                Save
              </button>
              <button type="button" className={styles.secondaryAction} onClick={cancelEdit} aria-label="Cancel edit">
                Cancel
              </button>
            </div>
            <div className={styles.hint} aria-hidden="true">
              Enter to save • Esc to cancel
            </div>
          </div>
        )}
      </div>

      {!editing && (
        <div className={styles.actions} data-tour-id="task-actions">
          <button type="button" className={styles.iconButton} onClick={startEdit} aria-label="Edit task">
            ✎
          </button>
          <button type="button" className={styles.iconButtonDanger} onClick={onDelete} aria-label="Delete task">
            🗑
          </button>
        </div>
      )}
    </div>
  );
}
