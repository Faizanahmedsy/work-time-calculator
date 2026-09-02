"use server";

import { cookies } from "next/headers";
import { RmsService } from "@/services/rms";

const COOKIE_OPTIONS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax",
  path: "/",
  maxAge: 60 * 60 * 24 * 5, // token lifetime is ~5 days
};

export async function rmsLoginAction(email, password) {
  try {
    const res = await RmsService.login(email, password);

    if (!res.success || !res.data?.token) {
      return { success: false, message: res.message || "Login failed." };
    }

    const user = res.data.user || {};
    const cookieStore = cookies();
    cookieStore.set("rms_auth_token", res.data.token, COOKIE_OPTIONS);
    cookieStore.set("rms_user_name", user.fullName || "", COOKIE_OPTIONS);
    cookieStore.set("rms_user_role", user.role || "", COOKIE_OPTIONS);

    return {
      success: true,
      data: {
        userName: user.fullName || "",
        role: user.role || "",
        email: user.email || email,
      },
    };
  } catch (error) {
    return {
      success: false,
      message: error?.message || "Unexpected error during RMS login.",
    };
  }
}

export async function rmsLogoutAction() {
  const cookieStore = cookies();
  cookieStore.delete("rms_auth_token");
  cookieStore.delete("rms_user_name");
  cookieStore.delete("rms_user_role");
  return { success: true };
}

export async function getRmsAuthStateAction() {
  const cookieStore = cookies();
  return {
    isAuthenticated: Boolean(cookieStore.get("rms_auth_token")?.value),
    userName: cookieStore.get("rms_user_name")?.value || null,
    role: cookieStore.get("rms_user_role")?.value || null,
  };
}

export async function getRmsProjectsAction(options = {}) {
  const cookieStore = cookies();
  const token = cookieStore.get("rms_auth_token")?.value;

  if (!token) {
    return { success: false, statusCode: 401, message: "Unauthorized" };
  }

  try {
    return await RmsService.fetchProjects(token, options);
  } catch (error) {
    return {
      success: false,
      statusCode: 500,
      message: error?.message || "Failed to fetch projects.",
    };
  }
}

export async function getRmsDailyReportsAction(options = {}) {
  const cookieStore = cookies();
  const token = cookieStore.get("rms_auth_token")?.value;

  if (!token) {
    return { success: false, statusCode: 401, message: "Unauthorized" };
  }

  try {
    return await RmsService.fetchDailyReports(token, options);
  } catch (error) {
    return {
      success: false,
      statusCode: 500,
      message: error?.message || "Failed to fetch daily reports.",
    };
  }
}

export async function getRmsMilestonesAction(projectId) {
  const cookieStore = cookies();
  const token = cookieStore.get("rms_auth_token")?.value;

  if (!token) {
    return { success: false, statusCode: 401, message: "Unauthorized" };
  }

  if (!projectId) {
    return { success: false, statusCode: 400, message: "Missing projectId." };
  }

  try {
    return await RmsService.fetchMilestones(token, projectId);
  } catch (error) {
    return {
      success: false,
      statusCode: 500,
      message: error?.message || "Failed to fetch milestones.",
    };
  }
}

export async function getRmsPendingReportCountAction(options = {}) {
  const cookieStore = cookies();
  const token = cookieStore.get("rms_auth_token")?.value;

  if (!token) {
    return { success: false, statusCode: 401, message: "Unauthorized" };
  }

  try {
    return await RmsService.fetchPendingReportCount(token, options);
  } catch (error) {
    return {
      success: false,
      statusCode: 500,
      message: error?.message || "Failed to fetch pending report count.",
    };
  }
}

/**
 * RMS keys daily reports by employeeId, which the API does not hand back on
 * every call. The JWT's `sub` is that id — verified against production, where
 * sub 29 matches employee.id 29 on the returned report rows.
 */
function employeeIdFromToken(token) {
  try {
    const payload = token.split(".")[1];
    const json = Buffer.from(payload, "base64").toString("utf8");
    const sub = JSON.parse(json)?.sub;
    return typeof sub === "number" ? sub : Number(sub) || null;
  } catch (e) {
    return null;
  }
}

export async function createRmsDailyReportAction(entry) {
  const cookieStore = cookies();
  const token = cookieStore.get("rms_auth_token")?.value;

  if (!token) {
    return { success: false, statusCode: 401, message: "Unauthorized" };
  }

  const employeeId = employeeIdFromToken(token);
  if (!employeeId) {
    return {
      success: false,
      statusCode: 400,
      message: "Could not read your employee id from the session. Sign in again.",
    };
  }

  const missing = ["projectId", "projectMilestoneId", "taskId", "reportingDate", "timeSpent"]
    .filter((k) => !entry?.[k]);
  if (missing.length) {
    return {
      success: false,
      statusCode: 400,
      message: `Missing ${missing.join(", ")}.`,
    };
  }

  try {
    return await RmsService.createDailyReport(token, { ...entry, employeeId });
  } catch (error) {
    return {
      success: false,
      statusCode: 500,
      message: error?.message || "Failed to submit daily report.",
    };
  }
}
