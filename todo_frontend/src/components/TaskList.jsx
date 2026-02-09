import React from "react";
import TaskItem from "./TaskItem";

/**
 * @param {{
 *  tasks: Array<any>,
 *  loading: boolean,
 *  onToggle: (id: string) => void,
 *  onDelete: (id: string) => void,
 *  onEdit: (id: string, patch: { title?: string, description?: string }) => void
 * }} props
 */
// PUBLIC_INTERFACE
export default function TaskList({ tasks, loading, onToggle, onDelete, onEdit }) {
  /** List component for tasks, including empty/loading states. */
  return (
    <section className="surface taskList" aria-label="Task list">
      <div className="taskList__header">
        <h2 className="taskList__title">Tasks</h2>
        <span className="taskList__count" aria-label="Task count">
          {tasks.length} total
        </span>
      </div>

      {loading ? (
        <div className="taskList__state" role="status" aria-live="polite">
          Loading…
        </div>
      ) : tasks.length === 0 ? (
        <div className="taskList__state">
          <p className="taskList__emptyTitle">No tasks yet</p>
          <p className="taskList__emptySubtitle">Add your first task above.</p>
        </div>
      ) : (
        <ul className="taskList__items">
          {tasks.map((t) => (
            <TaskItem key={t.id} task={t} onToggle={onToggle} onDelete={onDelete} onEdit={onEdit} />
          ))}
        </ul>
      )}
    </section>
  );
}
