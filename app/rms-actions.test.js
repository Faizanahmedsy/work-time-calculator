import { describe, it, expect, beforeEach, jest } from "@jest/globals";

const cookieStore = {
  get: jest.fn(),
  set: jest.fn(),
  delete: jest.fn(),
};

jest.mock("next/headers", () => ({
  cookies: () => cookieStore,
}));

jest.mock("@/services/rms", () => ({
  RmsService: {
    login: jest.fn(),
    fetchProjects: jest.fn(),
    fetchMilestones: jest.fn(),
  },
}));

const { RmsService } = require("@/services/rms");
const {
  rmsLoginAction,
  rmsLogoutAction,
  getRmsAuthStateAction,
  getRmsProjectsAction,
  getRmsMilestonesAction,
} = require("./rms-actions");

const withToken = (token = "tok123") => {
  cookieStore.get.mockImplementation((name) =>
    name === "rms_auth_token" ? { value: token } : undefined,
  );
};

describe("rms server actions", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    cookieStore.get.mockReturnValue(undefined);
  });

  describe("rmsLoginAction", () => {
    it("stores the token in an httpOnly cookie on success", async () => {
      RmsService.login.mockResolvedValue({
        success: true,
        data: {
          token: "jwt-abc",
          user: {
            fullName: "Faizanahmed Saiyed",
            role: "developer",
            email: "a@b.in",
          },
        },
      });

      const res = await rmsLoginAction("a@b.in", "pw");

      expect(res.success).toBe(true);
      const tokenCall = cookieStore.set.mock.calls.find(
        ([name]) => name === "rms_auth_token",
      );
      expect(tokenCall[1]).toBe("jwt-abc");
      expect(tokenCall[2].httpOnly).toBe(true);
      expect(tokenCall[2].sameSite).toBe("lax");
    });

    it("never returns the token to the client", async () => {
      RmsService.login.mockResolvedValue({
        success: true,
        data: { token: "jwt-abc", user: { fullName: "F", role: "developer" } },
      });

      const res = await rmsLoginAction("a@b.in", "pw");
      expect(JSON.stringify(res)).not.toContain("jwt-abc");
      expect(res.data).toEqual({
        userName: "F",
        role: "developer",
        email: "a@b.in",
      });
    });

    it("returns the API message and sets no cookie on bad credentials", async () => {
      RmsService.login.mockResolvedValue({
        success: false,
        message: "Invalid credentials",
      });

      const res = await rmsLoginAction("a@b.in", "wrong");

      expect(res).toEqual({ success: false, message: "Invalid credentials" });
      expect(cookieStore.set).not.toHaveBeenCalled();
    });

    it("treats a success response with no token as a failure", async () => {
      RmsService.login.mockResolvedValue({ success: true, data: {} });

      const res = await rmsLoginAction("a@b.in", "pw");
      expect(res.success).toBe(false);
      expect(cookieStore.set).not.toHaveBeenCalled();
    });

    it("catches a thrown network error", async () => {
      RmsService.login.mockRejectedValue(new Error("fetch failed"));

      const res = await rmsLoginAction("a@b.in", "pw");
      expect(res).toEqual({ success: false, message: "fetch failed" });
    });
  });

  describe("rmsLogoutAction", () => {
    it("clears every rms cookie", async () => {
      await rmsLogoutAction();

      const deleted = cookieStore.delete.mock.calls.map(([name]) => name);
      expect(deleted).toEqual(
        expect.arrayContaining([
          "rms_auth_token",
          "rms_user_name",
          "rms_user_role",
        ]),
      );
    });
  });

  describe("getRmsAuthStateAction", () => {
    it("reports authenticated when the token cookie is present", async () => {
      cookieStore.get.mockImplementation((name) =>
        ({
          rms_auth_token: { value: "tok" },
          rms_user_name: { value: "Faizan" },
          rms_user_role: { value: "developer" },
        })[name],
      );

      await expect(getRmsAuthStateAction()).resolves.toEqual({
        isAuthenticated: true,
        userName: "Faizan",
        role: "developer",
      });
    });

    it("reports unauthenticated with no cookies", async () => {
      await expect(getRmsAuthStateAction()).resolves.toEqual({
        isAuthenticated: false,
        userName: null,
        role: null,
      });
    });
  });

  describe("getRmsProjectsAction", () => {
    it("returns 401 without calling the API when there is no token", async () => {
      const res = await getRmsProjectsAction();

      expect(res).toEqual({
        success: false,
        statusCode: 401,
        message: "Unauthorized",
      });
      expect(RmsService.fetchProjects).not.toHaveBeenCalled();
    });

    it("forwards the token and options to the service", async () => {
      withToken("tok123");
      RmsService.fetchProjects.mockResolvedValue({ success: true, data: [] });

      await getRmsProjectsAction({ page: 2, search: "home" });

      expect(RmsService.fetchProjects).toHaveBeenCalledWith("tok123", {
        page: 2,
        search: "home",
      });
    });

    it("converts a thrown error into a 500 result", async () => {
      withToken();
      RmsService.fetchProjects.mockRejectedValue(new Error("ECONNREFUSED"));

      const res = await getRmsProjectsAction();
      expect(res).toEqual({
        success: false,
        statusCode: 500,
        message: "ECONNREFUSED",
      });
    });
  });

  describe("getRmsMilestonesAction", () => {
    it("returns 401 without a token", async () => {
      const res = await getRmsMilestonesAction(804);

      expect(res.statusCode).toBe(401);
      expect(RmsService.fetchMilestones).not.toHaveBeenCalled();
    });

    it("rejects a missing projectId before hitting the API", async () => {
      withToken();

      const res = await getRmsMilestonesAction(undefined);
      expect(res).toEqual({
        success: false,
        statusCode: 400,
        message: "Missing projectId.",
      });
      expect(RmsService.fetchMilestones).not.toHaveBeenCalled();
    });

    it("forwards token and projectId", async () => {
      withToken("tok9");
      RmsService.fetchMilestones.mockResolvedValue({ success: true, data: [] });

      await getRmsMilestonesAction(804);
      expect(RmsService.fetchMilestones).toHaveBeenCalledWith("tok9", 804);
    });

    it("converts a thrown error into a 500 result", async () => {
      withToken();
      RmsService.fetchMilestones.mockRejectedValue(new Error("boom"));

      const res = await getRmsMilestonesAction(804);
      expect(res).toEqual({
        success: false,
        statusCode: 500,
        message: "boom",
      });
    });
  });
});
