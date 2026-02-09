import React from "react";

/**
 * @param {{ mode: "remote" | "local", onReload: () => void }} props
 */
// PUBLIC_INTERFACE
export default function Header({ mode, onReload }) {
  /** Application header with connectivity badge and reload control. */
  return (
    <div className="header">
      <div className="header__left">
        <h1 className="header__title">To‑Do</h1>
        <p className="header__subtitle">A simple, fast task list with offline fallback.</p>
      </div>

      <div className="header__right">
        <span className={`badge ${mode}`}>
          <span className="dot" aria-hidden="true" />
          <span>
            {mode === "remote" ? "Backend connected" : "Local storage mode"}
          </span>
        </span>

        <button className="btn secondary" onClick={onReload} aria-label="Reload tasks">
          Reload
        </button>
      </div>
    </div>
  );
}
