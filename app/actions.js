"use server";

import { cookies } from "next/headers";
import { MewurkService } from "@/services/mewurk";

const COOKIE_OPTIONS = {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 7, // 1 week
};

export async function loginAction(email, password) {
    try {
        const lookupRes = await MewurkService.lookupUser(email);
        if (!lookupRes.isSuccess || !lookupRes.data.tenantDetails.length) {
            return { isSuccess: false, message: "User not found or no tenant associated." };
        }
        const tenantId = lookupRes.data.tenantDetails[0].tenantId;

        const loginRes = await MewurkService.loginUser(email, password, tenantId);
        if (!loginRes.isSuccess) {
            return { isSuccess: false, message: loginRes.message || "Login failed." };
        }

        const cookieStore = cookies();
        cookieStore.set("mewurk_auth_token", loginRes.data.token, COOKIE_OPTIONS);
        if (loginRes.data.refreshToken) {
            cookieStore.set("mewurk_refresh_token", loginRes.data.refreshToken, COOKIE_OPTIONS);
        }
        cookieStore.set("mewurk_employee_code", String(loginRes.data.userModel.employeeCode), COOKIE_OPTIONS);
        cookieStore.set("mewurk_user_name", `${loginRes.data.userModel.firstName} ${loginRes.data.userModel.lastName}`, COOKIE_OPTIONS);

        return { 
            isSuccess: true, 
            data: {
                token: loginRes.data.token,
                employeeCode: String(loginRes.data.userModel.employeeCode),
                userName: `${loginRes.data.userModel.firstName} ${loginRes.data.userModel.lastName}`,
                refreshToken: loginRes.data.refreshToken
            }
        };
    } catch (error) {
        return { isSuccess: false, message: error.message || "An unexpected error occurred during login." };
    }
}

export async function logoutAction() {
    const cookieStore = cookies();
    cookieStore.delete("mewurk_auth_token");
    cookieStore.delete("mewurk_refresh_token");
    cookieStore.delete("mewurk_employee_code");
    cookieStore.delete("mewurk_user_name");
    return { isSuccess: true };
}

export async function getAttendanceLogsAction(date) {
    const cookieStore = cookies();
    const token = cookieStore.get("mewurk_auth_token")?.value;
    const employeeCode = cookieStore.get("mewurk_employee_code")?.value;

    if (!token || !employeeCode) {
        return { isSuccess: false, statusCode: 401, message: "Unauthorized" };
    }

    return await MewurkService.fetchAttendanceLogs(date, token, employeeCode);
}

export async function getCardDetailsAction(year, month) {
    const cookieStore = cookies();
    const token = cookieStore.get("mewurk_auth_token")?.value;
    const employeeCode = cookieStore.get("mewurk_employee_code")?.value;

    if (!token || !employeeCode) {
        return { isSuccess: false, statusCode: 401, message: "Unauthorized" };
    }

    return await MewurkService.fetchCardDetails(token, employeeCode, year, month);
}

export async function refreshSessionAction() {
    const cookieStore = cookies();
    const refreshToken = cookieStore.get("mewurk_refresh_token")?.value;

    if (!refreshToken) {
        return { isSuccess: false, message: "No refresh token available" };
    }

    try {
        const res = await MewurkService.refreshToken(refreshToken);
        if (res.isSuccess && res.data.token) {
            cookieStore.set("mewurk_auth_token", res.data.token, COOKIE_OPTIONS);
            if (res.data.refreshToken) {
                cookieStore.set("mewurk_refresh_token", res.data.refreshToken, COOKIE_OPTIONS);
            }
            return { isSuccess: true, token: res.data.token };
        }
        return { isSuccess: false, message: "Token refresh failed" };
    } catch (error) {
        return { isSuccess: false, message: "Network error during token refresh" };
    }
}

export async function getInitialAuthStateAction() {
    const cookieStore = cookies();
    return {
        token: cookieStore.get("mewurk_auth_token")?.value || null,
        employeeCode: cookieStore.get("mewurk_employee_code")?.value || null,
        userName: cookieStore.get("mewurk_user_name")?.value || null,
    };
}
