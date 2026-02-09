import React from 'react';
import TaskItem from '../TaskItem/TaskItem.jsx';
import styles from './TaskList.module.css';

/**
 * Renders a list of tasks.
 */
export default function TaskList({ tasks, onToggle, onDelete, onUpdateText }) {
  return (
    <div className={styles.list} role="list" aria-label="Tasks">
      {tasks.map((t) => (
        <TaskItem
          key={t.id}
          task={t}
          onToggle={() => onToggle(t.id)}
          onDelete={() => onDelete(t.id)}
          onUpdateText={(nextText) => onUpdateText(t.id, nextText)}
        />
      ))}
    </div>
  );
}
