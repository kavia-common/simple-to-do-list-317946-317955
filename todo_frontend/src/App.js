import React from "react";
import "./App.css";
import "./styles/theme.css";

import Header from "./components/Header";
import TaskInput from "./components/TaskInput";
import TaskList from "./components/TaskList";
import { useTasks } from "./hooks/useTasks";

// PUBLIC_INTERFACE
function App() {
  /** Top-level SPA component holding tasks state and wiring UI to actions. */
  const { tasks, loading, error, notice, mode, actions } = useTasks();

  return (
    <div className="app">
      <div className="container">
        <Header mode={mode} onReload={actions.reload} />

        {(error || notice) ? (
          <div className="messages" aria-live="polite">
            {error ? (
              <div className="alert error" role="alert">
                <div className="messages__row">
                  <span>{error}</span>
                  <button className="btn secondary messages__dismiss" type="button" onClick={actions.dismissMessage} aria-label="Dismiss error">
                    Dismiss
                  </button>
                </div>
              </div>
            ) : null}

            {notice ? (
              <div className="alert notice" role="status">
                <div className="messages__row">
                  <span>{notice}</span>
                  <button className="btn secondary messages__dismiss" type="button" onClick={actions.dismissMessage} aria-label="Dismiss message">
                    Dismiss
                  </button>
                </div>
              </div>
            ) : null}
          </div>
        ) : null}

        <div className="grid">
          <TaskInput onAdd={actions.addTask} />
          <TaskList
            tasks={tasks}
            loading={loading}
            onToggle={actions.toggleComplete}
            onDelete={actions.removeTask}
            onEdit={actions.editTask}
          />
        </div>

        <footer className="footer">
          <p className="footer__text">
            Tip: If <code>REACT_APP_API_BASE</code> (or <code>REACT_APP_BACKEND_URL</code>) is set, the app will use the backend <code>/tasks</code> endpoints; otherwise it persists to localStorage.
          </p>
        </footer>
      </div>
    </div>
  );
}

export default App;
