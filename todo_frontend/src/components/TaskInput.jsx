import React, { useMemo, useState } from "react";

/**
 * @param {{ onAdd: (payload: { title: string, description?: string }) => Promise<void> | void }} props
 */
// PUBLIC_INTERFACE
export default function TaskInput({ onAdd }) {
  /** Form to add a new task. */
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const canSubmit = useMemo(() => Boolean(title.trim()), [title]);

  async function handleSubmit(e) {
    e.preventDefault();
    if (!canSubmit || submitting) return;

    setSubmitting(true);
    try {
      await onAdd({ title: title.trim(), description: description.trim() || "" });
      setTitle("");
      setDescription("");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <section className="surface taskInput" aria-label="Add a task">
      <form className="taskInput__form" onSubmit={handleSubmit}>
        <div className="taskInput__row">
          <label className="taskInput__label" htmlFor="task-title">
            Title <span className="taskInput__required">*</span>
          </label>
          <input
            id="task-title"
            className="input"
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g., Buy groceries"
            autoComplete="off"
            aria-required="true"
          />
        </div>

        <div className="taskInput__row">
          <label className="taskInput__label" htmlFor="task-desc">
            Description <span className="taskInput__optional">(optional)</span>
          </label>
          <textarea
            id="task-desc"
            className="textarea"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Add a little more detail…"
          />
        </div>

        <div className="taskInput__actions">
          <button className="btn" type="submit" disabled={!canSubmit || submitting} aria-label="Add task">
            {submitting ? "Adding…" : "Add task"}
          </button>
        </div>
      </form>
    </section>
  );
}
