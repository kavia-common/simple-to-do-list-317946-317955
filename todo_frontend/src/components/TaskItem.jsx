import React, { useMemo, useState } from "react";

/**
 * @typedef {Object} Task
 * @property {string} id
 * @property {string} title
 * @property {string=} description
 * @property {boolean} completed
 * @property {string=} updatedAt
 */

/**
 * @param {{
 *  task: Task,
 *  onToggle: (id: string) => void,
 *  onDelete: (id: string) => void,
 *  onEdit: (id: string, patch: { title?: string, description?: string }) => void
 * }} props
 */
// PUBLIC_INTERFACE
export default function TaskItem({ task, onToggle, onDelete, onEdit }) {
  /** Renders a single task row with edit/delete/complete controls. */
  const [isEditing, setIsEditing] = useState(false);
  const [draftTitle, setDraftTitle] = useState(task.title);
  const [draftDescription, setDraftDescription] = useState(task.description || "");

  const completed = Boolean(task.completed);

  const titleId = useMemo(() => `task_${task.id}_title`, [task.id]);
  const descId = useMemo(() => `task_${task.id}_desc`, [task.id]);

  function startEdit() {
    setDraftTitle(task.title);
    setDraftDescription(task.description || "");
    setIsEditing(true);
  }

  function cancelEdit() {
    setDraftTitle(task.title);
    setDraftDescription(task.description || "");
    setIsEditing(false);
  }

  function saveEdit() {
    const nextTitle = draftTitle.trim();
    const nextDescription = draftDescription.trim();

    if (!nextTitle) return;
    onEdit(task.id, { title: nextTitle, description: nextDescription });
    setIsEditing(false);
  }

  return (
    <li className={`taskItem ${completed ? "isCompleted" : ""}`}>
      <div className="taskItem__left">
        <input
          className="taskItem__checkbox"
          type="checkbox"
          checked={completed}
          onChange={() => onToggle(task.id)}
          aria-label={completed ? "Mark task as not completed" : "Mark task as completed"}
        />

        <div className="taskItem__content">
          {!isEditing ? (
            <>
              <div className="taskItem__titleRow">
                <span className="taskItem__title" id={titleId}>
                  {task.title}
                </span>
                {task.updatedAt ? (
                  <span className="taskItem__meta" aria-label="Last updated">
                    Updated {new Date(task.updatedAt).toLocaleString()}
                  </span>
                ) : null}
              </div>
              {task.description ? (
                <p className="taskItem__description" id={descId}>
                  {task.description}
                </p>
              ) : (
                <p className="taskItem__description taskItem__description--empty">
                  No description
                </p>
              )}
            </>
          ) : (
            <div className="taskItem__editor" aria-label="Edit task">
              <label className="sr-only" htmlFor={`${titleId}_input`}>
                Edit title
              </label>
              <input
                id={`${titleId}_input`}
                className="input"
                type="text"
                value={draftTitle}
                onChange={(e) => setDraftTitle(e.target.value)}
                aria-label="Edit task title"
              />

              <label className="sr-only" htmlFor={`${descId}_input`}>
                Edit description
              </label>
              <textarea
                id={`${descId}_input`}
                className="textarea"
                value={draftDescription}
                onChange={(e) => setDraftDescription(e.target.value)}
                aria-label="Edit task description"
              />

              <div className="taskItem__editorActions">
                <button className="btn success" type="button" onClick={saveEdit} disabled={!draftTitle.trim()} aria-label="Save changes">
                  Save
                </button>
                <button className="btn secondary" type="button" onClick={cancelEdit} aria-label="Cancel editing">
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="taskItem__right">
        {!isEditing ? (
          <>
            <button className="btn secondary" type="button" onClick={startEdit} aria-label={`Edit task ${task.title}`}>
              Edit
            </button>
            <button className="btn danger" type="button" onClick={() => onDelete(task.id)} aria-label={`Delete task ${task.title}`}>
              Delete
            </button>
          </>
        ) : null}
      </div>
    </li>
  );
}
