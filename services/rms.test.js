import { describe, it, expect, beforeEach, jest } from "@jest/globals";
import { RmsService } from "./rms";

// Mirrors a real Response: rms.js reads the body via text() so it can log the
// raw payload even when it is not valid JSON.
const jsonResponse = (body, status = 200) => ({
  ok: status >= 200 && status < 300,
  status,
  json: async () => body,
  text: async () => JSON.stringify(body),
});

describe("RmsService", () => {
  beforeEach(() => {
    global.fetch = jest.fn();
  });

  describe("login", () => {
    it("POSTs email and password as JSON", async () => {
      global.fetch.mockResolvedValue(
        jsonResponse({ success: true, data: { token: "t" } }),
      );

      await RmsService.login("a@b.in", "secret");

      const [url, init] = global.fetch.mock.calls[0];
      expect(url).toMatch(/\/api\/v1\/auth\/login$/);
      expect(init.method).toBe("POST");
      expect(JSON.parse(init.body)).toEqual({
        email: "a@b.in",
        password: "secret",
      });
      expect(init.cache).toBe("no-store");
    });

    it("returns the parsed body on success", async () => {
      const body = { success: true, data: { token: "abc" } };
      global.fetch.mockResolvedValue(jsonResponse(body));

      // Outside production the response also carries a __rmsDebug block for the
      // browser console, so match the API fields rather than the whole object.
      await expect(RmsService.login("a@b.in", "x")).resolves.toMatchObject(body);
    });

    it("never puts the password in the debug log", async () => {
      global.fetch.mockResolvedValue(
        jsonResponse({ success: true, data: { token: "abc" } }),
      );

      const res = await RmsService.login("a@b.in", "hunter2");

      expect(JSON.stringify(res.__rmsDebug)).not.toContain("hunter2");
      expect(res.__rmsDebug.requestBody.password).toBe("«redacted»");
      // The real password still goes over the wire.
      expect(JSON.parse(global.fetch.mock.calls[0][1].body).password).toBe(
        "hunter2",
      );
    });

    it("never puts the bearer token in the debug log", async () => {
      global.fetch.mockResolvedValue(jsonResponse({ success: true, data: [] }));

      const res = await RmsService.fetchProjects("super-secret-token");

      expect(res.__rmsDebug.curl).toContain("Bearer $RMS_TOKEN");
      expect(res.__rmsDebug.curl).not.toContain("super-secret-token");
    });

    it("surfaces the API message on a 401 instead of a bare status", async () => {
      global.fetch.mockResolvedValue(
        jsonResponse({ message: "Invalid credentials" }, 401),
      );

      const res = await RmsService.login("a@b.in", "wrong");
      expect(res.success).toBe(false);
      expect(res.statusCode).toBe(401);
      expect(res.message).toBe("Invalid credentials");
    });

    it("falls back to the error field when message is absent", async () => {
      global.fetch.mockResolvedValue(
        jsonResponse({ error: "UnauthorizedException" }, 401),
      );

      const res = await RmsService.login("a@b.in", "wrong");
      expect(res.message).toBe("UnauthorizedException");
    });

    it("falls back to the status code when the body is not JSON", async () => {
      global.fetch.mockResolvedValue({
        ok: false,
        status: 502,
        text: async () => "<html>Bad Gateway</html>",
      });

      const res = await RmsService.login("a@b.in", "x");
      expect(res.message).toBe("API Error: 502");
      expect(res.statusCode).toBe(502);
    });
  });

  describe("fetchProjects", () => {
    it("sends the bearer token", async () => {
      global.fetch.mockResolvedValue(jsonResponse({ success: true, data: [] }));

      await RmsService.fetchProjects("tok123");

      const [, init] = global.fetch.mock.calls[0];
      expect(init.headers.authorization).toBe("Bearer tok123");
      expect(init.method).toBe("GET");
    });

    it("applies default query params", async () => {
      global.fetch.mockResolvedValue(jsonResponse({ success: true, data: [] }));

      await RmsService.fetchProjects("tok");

      const url = new URL(global.fetch.mock.calls[0][0]);
      expect(url.pathname).toBe("/api/v1/projects");
      expect(url.searchParams.get("page")).toBe("1");
      expect(url.searchParams.get("limit")).toBe("9");
      expect(url.searchParams.get("status")).toBe("active");
      expect(url.searchParams.get("isPinned")).toBe("true");
      expect(url.searchParams.get("pagination")).toBe("true");
      expect(url.searchParams.get("search")).toBe("");
    });

    it("passes through overrides", async () => {
      global.fetch.mockResolvedValue(jsonResponse({ success: true, data: [] }));

      await RmsService.fetchProjects("tok", {
        page: 3,
        limit: 20,
        search: "home",
        status: "completed",
        isPinned: false,
      });

      const url = new URL(global.fetch.mock.calls[0][0]);
      expect(url.searchParams.get("page")).toBe("3");
      expect(url.searchParams.get("limit")).toBe("20");
      expect(url.searchParams.get("search")).toBe("home");
      expect(url.searchParams.get("status")).toBe("completed");
      expect(url.searchParams.get("isPinned")).toBe("false");
    });

    it("url-encodes a search term with spaces and symbols", async () => {
      global.fetch.mockResolvedValue(jsonResponse({ success: true, data: [] }));

      await RmsService.fetchProjects("tok", { search: "a b&c=d" });

      const url = new URL(global.fetch.mock.calls[0][0]);
      expect(url.searchParams.get("search")).toBe("a b&c=d");
    });

    it("surfaces the API message on failure", async () => {
      global.fetch.mockResolvedValue(
        jsonResponse({ message: "Unauthorized" }, 401),
      );

      const res = await RmsService.fetchProjects("bad");
      expect(res).toMatchObject({
        success: false,
        statusCode: 401,
        message: "Unauthorized",
        data: null,
      });
    });
  });

  describe("fetchMilestones", () => {
    it("requests the milestones endpoint for the project", async () => {
      global.fetch.mockResolvedValue(jsonResponse({ success: true, data: [] }));

      await RmsService.fetchMilestones("tok", 804);

      const url = new URL(global.fetch.mock.calls[0][0]);
      expect(url.pathname).toBe("/api/v1/project-milestones");
      expect(url.searchParams.get("projectId")).toBe("804");

      const [, init] = global.fetch.mock.calls[0];
      expect(init.headers.authorization).toBe("Bearer tok");
    });

    it("encodes an unexpected projectId rather than injecting raw query", async () => {
      global.fetch.mockResolvedValue(jsonResponse({ success: true, data: [] }));

      await RmsService.fetchMilestones("tok", "1&admin=true");

      const url = new URL(global.fetch.mock.calls[0][0]);
      expect(url.searchParams.get("projectId")).toBe("1&admin=true");
      expect(url.searchParams.get("admin")).toBeNull();
    });

    it("surfaces the API message on failure", async () => {
      global.fetch.mockResolvedValue(
        jsonResponse({ message: "Project not found" }, 404),
      );

      const res = await RmsService.fetchMilestones("tok", 999999);
      expect(res.success).toBe(false);
      expect(res.statusCode).toBe(404);
      expect(res.message).toBe("Project not found");
    });
  });

  describe("fetchPendingReportCount", () => {
    it("GETs the pending-count endpoint with the bearer token", async () => {
      global.fetch.mockResolvedValue(
        jsonResponse({
          success: true,
          statusCode: 200,
          message: "My pending report count fetched successfully",
          data: { id: 29, pendingCount: 1 },
        }),
      );

      const res = await RmsService.fetchPendingReportCount("tok");

      const [url, init] = global.fetch.mock.calls[0];
      expect(url).toContain("/daily-reports/my-pending-report-count?");
      expect(url).toContain("isRead=true");
      expect(init.method).toBe("GET");
      expect(init.headers.authorization).toBe("Bearer tok");
      expect(init.cache).toBe("no-store");
      expect(res.data.pendingCount).toBe(1);
    });

    it("honours an explicit isRead=false", async () => {
      global.fetch.mockResolvedValue(jsonResponse({ success: true }));

      await RmsService.fetchPendingReportCount("tok", { isRead: false });

      expect(global.fetch.mock.calls[0][0]).toContain("isRead=false");
    });

    it("surfaces the API message on failure", async () => {
      global.fetch.mockResolvedValue(jsonResponse({ message: "Unauthorized" }, 401));

      const res = await RmsService.fetchPendingReportCount("bad");
      expect(res).toMatchObject({ success: false, statusCode: 401, message: "Unauthorized" });
    });
  });
});
