/**
 * API client for tasks with transparent localStorage fallback.
 *
 * If an API base URL is configured (REACT_APP_API_BASE or REACT_APP_BACKEND_URL),
 * the client will attempt to use it. If requests fail (network/CORS/server down),
 * or if no base URL is configured, it will use localStorage persistence.
 */

/**
 * @typedef {Object} Task
 * @property {string} id
 * @property {string} title
 * @property {string=} description
 * @property {boolean} completed
 * @property {string} createdAt ISO timestamp
 * @property {string} updatedAt ISO timestamp
 */

const STORAGE_KEY = "kavia.todo.tasks.v1";

/** @returns {string|null} */
function getConfiguredBaseUrl() {
  const raw = process.env.REACT_APP_API_BASE || process.env.REACT_APP_BACKEND_URL;
  if (!raw) return null;
  const trimmed = String(raw).trim();
  if (!trimmed) return null;
  return trimmed.replace(/\/+$/, "");
}

/** @param {string} input */
function safeJsonParse(input) {
  try {
    return JSON.parse(input);
  } catch {
    return null;
  }
}

/** @returns {Task[]} */
function readLocalTasks() {
  const raw = window.localStorage.getItem(STORAGE_KEY);
  if (!raw) return [];
  const parsed = safeJsonParse(raw);
  if (!Array.isArray(parsed)) return [];
  return parsed;
}

/** @param {Task[]} tasks */
function writeLocalTasks(tasks) {
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
}

/** @returns {string} */
function newId() {
  // Reasonably unique id without adding dependencies
  return `t_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 9)}`;
}

/** @param {Task} t */
function normalizeTask(t) {
  const now = new Date().toISOString();
  return {
    id: String(t.id ?? newId()),
    title: String(t.title ?? "").trim(),
    description: t.description == null ? "" : String(t.description),
    completed: Boolean(t.completed),
    createdAt: t.createdAt ? String(t.createdAt) : now,
    updatedAt: t.updatedAt ? String(t.updatedAt) : now,
  };
}

/** @param {Response} res */
async function parseResponseJson(res) {
  const text = await res.text();
  if (!text) return null;
  const parsed = safeJsonParse(text);
  return parsed;
}

/**
 * Attempt a fetch call; treat network failures/timeouts/CORS as unreachable.
 * We intentionally do not add AbortController timeout to keep code minimal.
 *
 * @param {string} url
 * @param {RequestInit} options
 */
async function tryFetch(url, options) {
  try {
    const res = await fetch(url, options);
    return res;
  } catch (e) {
    // Network error / CORS / DNS
    const err = new Error("Backend unreachable");
    err.cause = e;
    err.name = "BackendUnreachableError";
    throw err;
  }
}

/**
 * Local storage implementation matching the /tasks API semantics.
 */
const localImpl = {
  /** @returns {Promise<Task[]>} */
  async listTasks() {
    return readLocalTasks().map(normalizeTask);
  },

  /** @param {{title: string, description?: string}} payload */
  async createTask(payload) {
    const now = new Date().toISOString();
    const task = normalizeTask({
      id: newId(),
      title: payload.title,
      description: payload.description ?? "",
      completed: false,
      createdAt: now,
      updatedAt: now,
    });

    const tasks = readLocalTasks();
    tasks.unshift(task);
    writeLocalTasks(tasks);
    return task;
  },

  /** @param {string} id @param {{title?: string, description?: string, completed?: boolean}} patch */
  async updateTask(id, patch) {
    const tasks = readLocalTasks();
    const idx = tasks.findIndex((t) => String(t.id) === String(id));
    if (idx === -1) throw new Error("Task not found");

    const existing = normalizeTask(tasks[idx]);
    const updated = normalizeTask({
      ...existing,
      ...patch,
      id: existing.id,
      updatedAt: new Date().toISOString(),
    });

    tasks[idx] = updated;
    writeLocalTasks(tasks);
    return updated;
  },

  /** @param {string} id */
  async deleteTask(id) {
    const tasks = readLocalTasks();
    const next = tasks.filter((t) => String(t.id) !== String(id));
    writeLocalTasks(next);
    return { ok: true };
  },
};

/**
 * Remote implementation talking to /tasks endpoints.
 * Expected endpoints:
 * - GET    /tasks
 * - POST   /tasks
 * - PATCH  /tasks/:id (or PUT; we'll use PATCH)
 * - DELETE /tasks/:id
 */
function makeRemoteImpl(baseUrl) {
  const makeUrl = (path) => `${baseUrl}${path.startsWith("/") ? "" : "/"}${path}`;

  return {
    async listTasks() {
      const res = await tryFetch(makeUrl("/tasks"), {
        method: "GET",
        headers: { Accept: "application/json" },
      });

      if (!res.ok) {
        const body = await parseResponseJson(res);
        throw new Error(body?.message || `Failed to load tasks (${res.status})`);
      }
      const data = await parseResponseJson(res);
      if (!Array.isArray(data)) return [];
      return data.map(normalizeTask);
    },

    async createTask(payload) {
      const res = await tryFetch(makeUrl("/tasks"), {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify({
          title: payload.title,
          description: payload.description ?? "",
        }),
      });

      if (!res.ok) {
        const body = await parseResponseJson(res);
        throw new Error(body?.message || `Failed to create task (${res.status})`);
      }
      const data = await parseResponseJson(res);
      return normalizeTask(data || payload);
    },

    async updateTask(id, patch) {
      const res = await tryFetch(makeUrl(`/tasks/${encodeURIComponent(String(id))}`), {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify(patch),
      });

      if (!res.ok) {
        const body = await parseResponseJson(res);
        throw new Error(body?.message || `Failed to update task (${res.status})`);
      }
      const data = await parseResponseJson(res);
      return normalizeTask(data || { id, ...patch });
    },

    async deleteTask(id) {
      const res = await tryFetch(makeUrl(`/tasks/${encodeURIComponent(String(id))}`), {
        method: "DELETE",
        headers: { Accept: "application/json" },
      });

      if (!res.ok) {
        const body = await parseResponseJson(res);
        throw new Error(body?.message || `Failed to delete task (${res.status})`);
      }
      return { ok: true };
    },
  };
}

/**
 * Chooses remote if base URL configured; otherwise local.
 * If remote is configured but becomes unreachable at runtime, callers should
 * catch errors and retry via local as needed (handled by useTasks).
 */
function getPreferredImpl() {
  const baseUrl = getConfiguredBaseUrl();
  if (!baseUrl) return { impl: localImpl, mode: "local" };
  return { impl: makeRemoteImpl(baseUrl), mode: "remote" };
}

// PUBLIC_INTERFACE
export function getApiMode() {
  /** Returns "remote" when env-based base URL is configured, else "local". */
  return getPreferredImpl().mode;
}

// PUBLIC_INTERFACE
export async function listTasks() {
  /** List tasks. May throw if remote is configured but fails. */
  return getPreferredImpl().impl.listTasks();
}

// PUBLIC_INTERFACE
export async function createTask(payload) {
  /** Create a task with {title, description?}. */
  return getPreferredImpl().impl.createTask(payload);
}

// PUBLIC_INTERFACE
export async function updateTask(id, patch) {
  /** Update a task by id. Patch can include title, description, completed. */
  return getPreferredImpl().impl.updateTask(id, patch);
}

// PUBLIC_INTERFACE
export async function deleteTask(id) {
  /** Delete a task by id. */
  return getPreferredImpl().impl.deleteTask(id);
}

// PUBLIC_INTERFACE
export async function fallbackToLocalList() {
  /** Always list tasks from localStorage (used when remote unreachable). */
  return localImpl.listTasks();
}

// PUBLIC_INTERFACE
export async function fallbackToLocalCreate(payload) {
  /** Always create task in localStorage (used when remote unreachable). */
  return localImpl.createTask(payload);
}

// PUBLIC_INTERFACE
export async function fallbackToLocalUpdate(id, patch) {
  /** Always update task in localStorage (used when remote unreachable). */
  return localImpl.updateTask(id, patch);
}

// PUBLIC_INTERFACE
export async function fallbackToLocalDelete(id) {
  /** Always delete task in localStorage (used when remote unreachable). */
  return localImpl.deleteTask(id);
}
