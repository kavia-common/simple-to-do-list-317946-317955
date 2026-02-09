import { useCallback, useEffect, useMemo, useState } from "react";
import {
  createTask,
  deleteTask,
  fallbackToLocalCreate,
  fallbackToLocalDelete,
  fallbackToLocalList,
  fallbackToLocalUpdate,
  getApiMode,
  listTasks,
  updateTask,
} from "../api/client";

/**
 * @typedef {import("../api/client").Task} Task
 */

function isBackendUnreachableError(err) {
  return err?.name === "BackendUnreachableError" || /unreachable/i.test(String(err?.message || ""));
}

/**
 * @param {Task[]} tasks
 * @param {string} id
 */
function findIndexById(tasks, id) {
  return tasks.findIndex((t) => String(t.id) === String(id));
}

// PUBLIC_INTERFACE
export function useTasks() {
  /** React hook providing tasks state and CRUD actions with optimistic updates. */
  const [tasks, setTasks] = useState(/** @type {Task[]} */ ([]));
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const initialMode = useMemo(() => getApiMode(), []);
  const [mode, setMode] = useState(initialMode); // "remote" | "local"

  const clearMessagesSoon = useCallback(() => {
    window.clearTimeout(clearMessagesSoon._t);
    clearMessagesSoon._t = window.setTimeout(() => {
      setError("");
      setNotice("");
    }, 3500);
  }, []);
  // stash timer handle on function object (simple, no extra refs)
  clearMessagesSoon._t = clearMessagesSoon._t || 0;

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const remoteTasks = await listTasks();
      setTasks(remoteTasks);
      setMode(getApiMode());
      if (getApiMode() === "remote") {
        setNotice("Connected to backend.");
        clearMessagesSoon();
      }
    } catch (e) {
      // If remote is configured but unreachable, fall back to local.
      const fallback = isBackendUnreachableError(e);
      if (fallback) {
        const localTasks = await fallbackToLocalList();
        setTasks(localTasks);
        setMode("local");
        setNotice("Backend unavailable — using local storage.");
        clearMessagesSoon();
      } else {
        setError(e?.message || "Failed to load tasks.");
        clearMessagesSoon();
      }
    } finally {
      setLoading(false);
    }
  }, [clearMessagesSoon]);

  useEffect(() => {
    load();
  }, [load]);

  const addTask = useCallback(
    async ({ title, description }) => {
      setError("");
      const optimistic = {
        id: `optimistic_${Date.now()}`,
        title: String(title || "").trim(),
        description: description ? String(description) : "",
        completed: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        _optimistic: true,
      };

      if (!optimistic.title) {
        setError("Title is required.");
        clearMessagesSoon();
        return;
      }

      setTasks((prev) => [optimistic, ...prev]);

      try {
        const created = await createTask({ title: optimistic.title, description: optimistic.description });
        setTasks((prev) => {
          const idx = findIndexById(prev, optimistic.id);
          if (idx === -1) return prev;
          const next = [...prev];
          next[idx] = created;
          return next;
        });
      } catch (e) {
        if (isBackendUnreachableError(e)) {
          // Persist to local if remote fails.
          const created = await fallbackToLocalCreate({
            title: optimistic.title,
            description: optimistic.description,
          });
          setMode("local");
          setNotice("Backend unavailable — saved locally.");
          clearMessagesSoon();
          setTasks((prev) => {
            const idx = findIndexById(prev, optimistic.id);
            if (idx === -1) return prev;
            const next = [...prev];
            next[idx] = created;
            return next;
          });
          return;
        }

        // Revert optimistic
        setTasks((prev) => prev.filter((t) => String(t.id) !== String(optimistic.id)));
        setError(e?.message || "Failed to add task.");
        clearMessagesSoon();
      }
    },
    [clearMessagesSoon]
  );

  const editTask = useCallback(
    async (id, patch) => {
      setError("");
      let snapshot = null;

      setTasks((prev) => {
        const idx = findIndexById(prev, id);
        if (idx === -1) return prev;
        snapshot = prev[idx];
        const next = [...prev];
        next[idx] = {
          ...prev[idx],
          ...patch,
          updatedAt: new Date().toISOString(),
        };
        return next;
      });

      try {
        const updated = await updateTask(id, patch);
        setTasks((prev) => {
          const idx = findIndexById(prev, id);
          if (idx === -1) return prev;
          const next = [...prev];
          next[idx] = updated;
          return next;
        });
      } catch (e) {
        if (isBackendUnreachableError(e)) {
          const updated = await fallbackToLocalUpdate(id, patch);
          setMode("local");
          setNotice("Backend unavailable — changes saved locally.");
          clearMessagesSoon();
          setTasks((prev) => {
            const idx = findIndexById(prev, id);
            if (idx === -1) return prev;
            const next = [...prev];
            next[idx] = updated;
            return next;
          });
          return;
        }

        // Revert
        if (snapshot) {
          setTasks((prev) => {
            const idx = findIndexById(prev, id);
            if (idx === -1) return prev;
            const next = [...prev];
            next[idx] = snapshot;
            return next;
          });
        }
        setError(e?.message || "Failed to update task.");
        clearMessagesSoon();
      }
    },
    [clearMessagesSoon]
  );

  const toggleComplete = useCallback(
    async (id) => {
      const t = tasks.find((x) => String(x.id) === String(id));
      const nextCompleted = !Boolean(t?.completed);
      await editTask(id, { completed: nextCompleted });
    },
    [editTask, tasks]
  );

  const removeTask = useCallback(
    async (id) => {
      setError("");
      let snapshot = null;

      setTasks((prev) => {
        const idx = findIndexById(prev, id);
        if (idx === -1) return prev;
        snapshot = prev[idx];
        return prev.filter((t) => String(t.id) !== String(id));
      });

      try {
        await deleteTask(id);
      } catch (e) {
        if (isBackendUnreachableError(e)) {
          await fallbackToLocalDelete(id);
          setMode("local");
          setNotice("Backend unavailable — deleted locally.");
          clearMessagesSoon();
          return;
        }

        // Revert
        if (snapshot) setTasks((prev) => [snapshot, ...prev]);
        setError(e?.message || "Failed to delete task.");
        clearMessagesSoon();
      }
    },
    [clearMessagesSoon]
  );

  const dismissMessage = useCallback(() => {
    setError("");
    setNotice("");
  }, []);

  return {
    tasks,
    loading,
    error,
    notice,
    mode,
    actions: {
      reload: load,
      addTask,
      editTask,
      toggleComplete,
      removeTask,
      dismissMessage,
    },
  };
}
