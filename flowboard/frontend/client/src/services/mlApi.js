const ML_STORAGE_KEY = 'fb_ml_v1';

const ML_BASE = import.meta.env.VITE_ML_API_URL || 'http://127.0.0.1:5000';

const readStore = () => {
  try {
    return JSON.parse(localStorage.getItem(ML_STORAGE_KEY) || '{}') || {};
  } catch {
    return {};
  }
};

const writeStore = (obj) => {
  localStorage.setItem(ML_STORAGE_KEY, JSON.stringify(obj));
};

/** @deprecated Prefer task.delay_risk on the task object from TaskContext */
export function getTaskMl(taskId) {
  if (!taskId) return null;
  const store = readStore();
  return store[taskId]?.data ?? null;
}

export function setTaskMl(taskId, data) {
  if (!taskId) return;
  const store = readStore();
  store[taskId] = { data, updatedAt: new Date().toISOString() };
  writeStore(store);
}

export function normalizeRiskPercent(value) {
  if (typeof value !== 'number') return null;
  const pct = value <= 1 ? Math.round(value * 100) : Math.round(value);
  return Math.max(0, Math.min(100, pct));
}

export function getDelayRiskPercent(source) {
  if (!source) return null;
  if (typeof source === 'number') return normalizeRiskPercent(source);
  const value = source.delay_risk ?? source.risk;
  return normalizeRiskPercent(value);
}

export function getDelayRiskLabel(percent) {
  if (typeof percent !== 'number') return null;
  if (percent <= 40) return 'Low';
  if (percent <= 70) return 'Medium';
  return 'High';
}

/** Unified display: done tasks show 0% / Completed per product rules */
export function getDelayRiskDisplay(task) {
  if (!task) return { pct: null, label: null, isDone: false };
  if (task.status === 'done') {
    return { pct: 0, label: 'Completed', isDone: true };
  }
  const pct = getDelayRiskPercent(task);
  const label = pct == null ? null : getDelayRiskLabel(pct);
  return { pct, label, isDone: false };
}

export function mergeTaskWithMlResponse(task, pred) {
  if (!task) return task;
  if (!pred) return { ...task };
  return {
    ...task,
    delay_risk: pred.delay_risk,
    reasons: Array.isArray(pred.reasons) ? pred.reasons : [],
    suggestions: Array.isArray(pred.suggestions) ? pred.suggestions : [],
  };
}

/**
 * Maps board task.status to ML /predict body values: "todo" | "in progress" | "done".
 * Backend also normalizes variants (e.g. inprogress); we send canonical strings from the client.
 */
export function normalizeStatusForMlApi(status) {
  if (status == null || status === '') return 'todo';
  const compact = String(status).trim().toLowerCase().replace(/[\s_-]+/g, '');
  if (compact === 'inprogress') return 'in progress';
  if (compact === 'done') return 'done';
  return 'todo';
}

export async function fetchPrediction(task) {
  try {
    const status = normalizeStatusForMlApi(task?.status);
    const res = await fetch(`${ML_BASE}/predict`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        dueDate: task?.dueDate,
        priority: task?.priority,
        status,
      }),
    });

    if (!res.ok) {
      const text = await res.text().catch(() => '');
      throw new Error(text || `ML request failed (${res.status})`);
    }

    return await res.json();
  } catch (err) {
    console.error('[ML] fetch error:', err);
    return null;
  }
}

export async function predictTaskDelay(task) {
  const data = await fetchPrediction(task);
  return data;
}

export async function getDelayRisk(task) {
  return predictTaskDelay(task);
}
