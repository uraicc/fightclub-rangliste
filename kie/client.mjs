/**
 * kie.ai Market API client for Fightclub.
 * Auth: Authorization Bearer KIE_API_KEY
 * Docs: https://docs.kie.ai/market/quickstart
 */

const API_BASE = "https://api.kie.ai/api/v1";

export function getApiKey() {
  const key = process.env.KIE_API_KEY?.trim();
  if (!key) {
    throw new Error(
      "KIE_API_KEY fehlt. Secret im Cursor-Dashboard setzen oder lokal in .env legen."
    );
  }
  return key;
}

async function request(path, { method = "GET", body } = {}) {
  const res = await fetch(`${API_BASE}${path}`, {
    method,
    headers: {
      Authorization: `Bearer ${getApiKey()}`,
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: body ? JSON.stringify(body) : undefined,
  });

  const text = await res.text();
  let data;
  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    data = { raw: text };
  }

  if (!res.ok) {
    const msg =
      data?.msg || data?.message || data?.error || text || res.statusText;
    throw new Error(`kie.ai ${method} ${path} failed (${res.status}): ${msg}`);
  }

  return data;
}

/** Remaining credits */
export async function getCredits() {
  return request("/chat/credit");
}

/**
 * Create a Market job.
 * @param {{ model: string, input: object, callBackUrl?: string }} payload
 */
export async function createTask(payload) {
  if (!payload?.model || !payload?.input) {
    throw new Error("createTask requires { model, input }");
  }
  return request("/jobs/createTask", { method: "POST", body: payload });
}

/** Query task status / result */
export async function getTask(taskId) {
  if (!taskId) throw new Error("taskId required");
  return request(`/jobs/recordInfo?taskId=${encodeURIComponent(taskId)}`);
}

/**
 * Poll until success/fail.
 * @returns {Promise<object>} final recordInfo payload
 */
export async function waitForTask(
  taskId,
  { timeoutMs = 10 * 60 * 1000, intervalMs = 5000 } = {}
) {
  const started = Date.now();
  while (Date.now() - started < timeoutMs) {
    const info = await getTask(taskId);
    const state =
      info?.data?.state ||
      info?.data?.status ||
      info?.state ||
      info?.status ||
      "";

    const normalized = String(state).toLowerCase();
    if (["success", "succeeded", "completed", "complete"].includes(normalized)) {
      return info;
    }
    if (["fail", "failed", "error", "cancelled", "canceled"].includes(normalized)) {
      throw new Error(
        `kie.ai task ${taskId} failed: ${JSON.stringify(info?.data || info)}`
      );
    }

    await new Promise((r) => setTimeout(r, intervalMs));
  }
  throw new Error(`kie.ai task ${taskId} timed out after ${timeoutMs}ms`);
}
