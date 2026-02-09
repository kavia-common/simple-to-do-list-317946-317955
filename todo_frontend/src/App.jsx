import React, { useEffect, useMemo, useState } from 'react';
import Header from './components/Header/Header.jsx';
import TaskInput from './components/TaskInput/TaskInput.jsx';
import FilterBar from './components/FilterBar/FilterBar.jsx';
import TaskList from './components/TaskList/TaskList.jsx';
import EmptyState from './components/EmptyState/EmptyState.jsx';
import InstructionsPanel from './components/InstructionsPanel/InstructionsPanel.jsx';
import Walkthrough from './components/Walkthrough/Walkthrough.jsx';
import { getWalkthroughDismissed } from './components/Walkthrough/storage.js';
import styles from './App.module.css';

const STORAGE_KEY = 'todo_tasks';

function safeParseTasks(json) {
  try {
    const parsed = JSON.parse(json);
    if (!Array.isArray(parsed)) return [];
    return parsed
      .filter((t) => t && typeof t === 'object')
      .map((t) => ({
        id: String(t.id ?? crypto.randomUUID()),
        text: String(t.text ?? ''),
        completed: Boolean(t.completed),
        createdAt: typeof t.createdAt === 'number' ? t.createdAt : Date.now()
      }))
      .filter((t) => t.text.trim().length > 0);
  } catch {
    return [];
  }
}

function createTask(text) {
  return {
    id: crypto.randomUUID(),
    text,
    completed: false,
    createdAt: Date.now()
  };
}

export default function App() {
  const [tasks, setTasks] = useState(() => safeParseTasks(localStorage.getItem(STORAGE_KEY) ?? '[]'));
  const [filter, setFilter] = useState('all'); // all | active | completed
  const [helpOpen, setHelpOpen] = useState(false);

  const [walkthroughOpen, setWalkthroughOpen] = useState(false);

  const walkthroughSteps = useMemo(
    () => [
      {
        id: 'help',
        targetTourId: 'header-help',
        side: 'bottom',
        title: 'Help & walkthrough',
        description: 'Use Help any time, or restart this walkthrough to learn the basics.'
      },
      {
        id: 'add',
        targetTourId: 'add-input',
        side: 'bottom',
        title: 'Add tasks fast',
        description: 'Type a task and press Enter, or click Add. Empty tasks are blocked.'
      },
      {
        id: 'actions',
        targetTourId: 'task-row',
        side: 'top',
        title: 'Edit, complete, delete',
        description: 'Use the checkbox to complete, the pencil to edit, and the trash to delete.'
      },
      {
        id: 'filter',
        targetTourId: 'filter-bar',
        side: 'top',
        title: 'Filter your list',
        description: 'Switch between All / Active / Completed to focus on what matters.'
      }
    ],
    []
  );

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
  }, [tasks]);

  const counts = useMemo(() => {
    const total = tasks.length;
    const completed = tasks.filter((t) => t.completed).length;
    const active = total - completed;
    return { total, active, completed };
  }, [tasks]);

  const filteredTasks = useMemo(() => {
    if (filter === 'active') return tasks.filter((t) => !t.completed);
    if (filter === 'completed') return tasks.filter((t) => t.completed);
    return tasks;
  }, [tasks, filter]);

  useEffect(() => {
    // Auto-start only for first-time users with no stored tasks (and not previously dismissed).
    if (tasks.length > 0) return;
    if (getWalkthroughDismissed()) return;
    setWalkthroughOpen(true);
  }, []);

  function addTask(rawText) {
    const text = rawText.trim();
    if (!text) return;
    setTasks((prev) => [createTask(text), ...prev]);
  }

  function toggleTask(id) {
    setTasks((prev) => prev.map((t) => (t.id === id ? { ...t, completed: !t.completed } : t)));
  }

  function deleteTask(id) {
    setTasks((prev) => prev.filter((t) => t.id !== id));
  }

  function updateTaskText(id, rawText) {
    const nextText = rawText.trim();
    if (!nextText) return false;
    setTasks((prev) => prev.map((t) => (t.id === id ? { ...t, text: nextText } : t)));
    return true;
  }

  function startWalkthrough() {
    setHelpOpen(false);
    setWalkthroughOpen(true);
  }

  return (
    <div className={styles.page}>
      <Header
        helpOpen={helpOpen}
        onToggleHelp={() => setHelpOpen((v) => !v)}
        onStartWalkthrough={startWalkthrough}
      />

      <main className={styles.main} aria-label="To-do application">
        <InstructionsPanel open={helpOpen} onClose={() => setHelpOpen(false)} onStartWalkthrough={startWalkthrough} />

        <section className={styles.card} aria-label="Create a task">
          <TaskInput onAdd={addTask} />
          <FilterBar filter={filter} onChange={setFilter} counts={counts} />
        </section>

        <section className={styles.listRegion} aria-label="Task list">
          {tasks.length === 0 ? (
            <EmptyState onOpenHelp={() => setHelpOpen(true)} />
          ) : (
            <TaskList
              tasks={filteredTasks}
              onToggle={toggleTask}
              onDelete={deleteTask}
              onUpdateText={updateTaskText}
            />
          )}
        </section>
      </main>

      <Walkthrough open={walkthroughOpen} steps={walkthroughSteps} onClose={() => setWalkthroughOpen(false)} />
    </div>
  );
}
