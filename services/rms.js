// Defaults to production. Override with RMS_API_ORIGIN in .env.local (gitignored)
// to point a local session at another environment.
const RMS_ORIGIN =
  process.env.RMS_API_ORIGIN || "https://api-resource-management.devstree.in";
const RMS_WEB_ORIGIN =
  process.env.RMS_WEB_ORIGIN || "https://resource-management.devstree.in";

export const RMS_BASE_URL = `${RMS_ORIGIN}/api/v1`;

const BASE_HEADERS = {
  accept: "application/json, text/plain, */*",
  "content-type": "application/json;charset=UTF-8",
  origin: RMS_WEB_ORIGIN,
  referer: `${RMS_WEB_ORIGIN}/`,
};

// These calls run inside server actions, so they never show up in the browser's
// network tab. Logging is on outside production; set RMS_LOG=0 to silence it.
const LOG_ENABLED =
  process.env.RMS_LOG !== "0" && process.env.NODE_ENV !== "production";
// The bearer token is a real credential and this lands in terminal scrollback,
// so it is masked unless you explicitly opt in to replayable curl.
const LOG_TOKEN = process.env.RMS_LOG_TOKEN === "1";

const C = {
  reset: "[0m",
  cyan: "[36m",
  green: "[32m",
  red: "[31m",
  dim: "[2m",
};

const shellQuote = (value) => `'${String(value).replace(/'/g, `'\\''`)}'`;

/** Renders a request as a runnable curl command for the server console. */
const toCurl = (url, { method = "GET", headers = {}, body } = {}) => {
  const parts = [`curl -X ${method} ${shellQuote(url)}`];
  Object.entries(headers).forEach(([key, value]) => {
    const shown =
      key.toLowerCase() === "authorization" && !LOG_TOKEN
        ? "Bearer $RMS_TOKEN"
        : value;
    parts.push(`  -H ${shellQuote(`${key}: ${shown}`)}`);
  });
  if (body) parts.push(`  -d ${shellQuote(body)}`);
  return parts.join(" \\\n");
};

// Credentials must never reach terminal scrollback or the browser console.
const SECRET_FIELDS = new Set(["password", "currentPassword", "newPassword", "token"]);

/** Replaces credential fields with a placeholder before anything is logged. */
const redact = (body) => {
  if (!body || typeof body !== "object") return body;
  return Object.fromEntries(
    Object.entries(body).map(([k, v]) => [
      k,
      SECRET_FIELDS.has(k) ? "«redacted»" : v,
    ]),
  );
};

/** Keeps huge project/report payloads from flooding the terminal. */
const preview = (value) => {
  const text = JSON.stringify(value, null, 2);
  if (!text) return String(value);
  return text.length > 4000 ? `${text.slice(0, 4000)}\n… (truncated)` : text;
};

/**
 * Single entry point for every RMS call: logs the outgoing curl, the parsed
 * response body, and any error body. Routing all methods through here means a
 * new endpoint cannot silently skip the logging.
 */
const rmsFetch = async (path, { method = "GET", token, body, label } = {}) => {
  const url = `${RMS_BASE_URL}${path}`;
  const headers = { ...BASE_HEADERS };
  if (token) headers.authorization = `Bearer ${token}`;
  const payload = body === undefined ? undefined : JSON.stringify(body);
  const safeBody = redact(body);
  const safePayload = body === undefined ? undefined : JSON.stringify(safeBody);
  const tag = label || path;

  if (LOG_ENABLED) {
    console.log(
      `\n${C.cyan}[RMS →] ${method} ${tag}${C.reset}\n${toCurl(url, {
        method,
        headers,
        body: safePayload,
      })}`,
    );
    if (payload) console.log(`${C.dim}[RMS →] body:${C.reset}`, preview(safeBody));
  }

  const startedAt = Date.now();
  let response;
  try {
    response = await fetch(url, {
      method,
      headers,
      ...(payload === undefined ? {} : { body: payload }),
      cache: "no-store",
    });
  } catch (error) {
    // Network-level failure: DNS, TLS, connection refused. Never reaches failure().
    if (LOG_ENABLED) {
      console.log(
        `${C.red}[RMS ✗] ${method} ${tag} network error (${Date.now() - startedAt}ms)${C.reset}`,
        error?.message || error,
      );
    }
    throw error;
  }

  const ms = Date.now() - startedAt;
  const raw = await response.text();
  let parsed;
  try {
    parsed = raw ? JSON.parse(raw) : null;
  } catch (e) {
    parsed = null; // non-JSON body, keep `raw` for the log
  }

  if (!response.ok) {
    const message =
      parsed?.message || parsed?.error || `API Error: ${response.status}`;
    if (LOG_ENABLED) {
      console.log(
        `${C.red}[RMS ←] ${response.status} ${method} ${tag} (${ms}ms)${C.reset}`,
      );
      console.log(`${C.red}[RMS ←] error body:${C.reset}`, preview(parsed ?? raw));
    }
    const result = {
      success: false,
      statusCode: response.status,
      message,
      data: null,
      metadata: null,
    };

    if (LOG_ENABLED) {
      result.__rmsDebug = {
        label: tag,
        method,
        url,
        status: response.status,
        ms,
        curl: toCurl(url, { method, headers, body: safePayload }),
        requestBody: safeBody ?? null,
        responseBody: parsed ?? raw,
      };
    }

    return result;
  }

  if (LOG_ENABLED) {
    const rows = Array.isArray(parsed?.data) ? ` · ${parsed.data.length} rows` : "";
    console.log(
      `${C.green}[RMS ←] ${response.status} ${method} ${tag} (${ms}ms)${rows}${C.reset}`,
      parsed?.message || "",
    );
    console.log(`${C.dim}[RMS ←] body:${C.reset}`, preview(parsed ?? raw));
  }

  // Server actions never touch the browser's network tab, so the request is
  // also attached to the response for the client to print in its console.
  // Stripped in production, and the token is masked unless RMS_LOG_TOKEN=1.
  if (LOG_ENABLED && parsed && typeof parsed === "object") {
    return {
      ...parsed,
      __rmsDebug: {
        label: tag,
        method,
        url,
        status: response.status,
        ms,
        curl: toCurl(url, { method, headers, body: safePayload }),
        requestBody: safeBody ?? null,
        responseBody: parsed,
      },
    };
  }

  return parsed;
};

export const RmsService = {
  login: async (email, password) =>
    rmsFetch("/auth/login", {
      method: "POST",
      body: { email, password },
      label: "login",
    }),

  fetchProjects: async (token, options = {}) => {
    const {
      page = 1,
      limit = 9,
      search = "",
      status = "active",
      isPinned = true,
      pagination = true,
    } = options;

    const query = new URLSearchParams({
      pagination: String(pagination),
      status,
      search,
      isPinned: String(isPinned),
      page: String(page),
      limit: String(limit),
    });

    return rmsFetch(`/projects?${query.toString()}`, {
      token,
      label: "projects",
    });
  },

  /**
   * Daily reports the signed-in user has already submitted to RMS.
   * The endpoint is scoped to the caller, so no employee filter is needed.
   * `limit` is capped at 100 by the API.
   */
  fetchDailyReports: async (
    token,
    { fromDate, toDate, limit = 100, page = 1 } = {},
  ) => {
    const query = new URLSearchParams({
      limit: String(Math.min(limit, 100)),
      page: String(page),
    });
    if (fromDate) query.set("fromDate", fromDate);
    if (toDate) query.set("toDate", toDate);

    return rmsFetch(`/daily-reports?${query}`, {
      token,
      label: "daily-reports",
    });
  },

  /**
   * Number of days the signed-in user still owes a daily report for.
   * Scoped to the caller by the token, so no employee filter is needed.
   */
  fetchPendingReportCount: async (token, { isRead = true } = {}) => {
    const query = new URLSearchParams({ isRead: String(isRead) });
    return rmsFetch(`/daily-reports/my-pending-report-count?${query}`, {
      token,
      label: "pending-report-count",
    });
  },

  /**
   * Files a daily report against a task.
   *
   * Note the asymmetry with fetchDailyReports: writes take timeSpent as
   * "8h15m", while reads return it as HH.MM ("8.15"). Not a typo.
   * taskDescription is HTML — RMS renders it in a rich-text field.
   */
  createDailyReport: async (token, entry) =>
    rmsFetch("/daily-reports", {
      method: "POST",
      token,
      body: {
        employeeId: entry.employeeId,
        projectId: entry.projectId,
        projectMilestoneId: entry.projectMilestoneId,
        taskId: entry.taskId,
        reportingDate: entry.reportingDate,
        taskDescription: entry.taskDescription,
        timeSpent: entry.timeSpent,
      },
      label: "create-daily-report",
    }),

  fetchMilestones: async (token, projectId) =>
    rmsFetch(`/project-milestones?projectId=${encodeURIComponent(projectId)}`, {
      token,
      label: "milestones",
    }),
};
