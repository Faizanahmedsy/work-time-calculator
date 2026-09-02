/**
 * @jest-environment node
 */

/**
 * Integration tests against a live RMS API.
 *
 * Read-only: they log in and issue GETs. Nothing is created, updated or deleted.
 *
 * Opt-in. Configure in .env.local (gitignored) and these run automatically:
 *   RMS_API_ORIGIN, RMS_WEB_ORIGIN, RMS_TEST_EMAIL, RMS_TEST_PASSWORD
 * Without those credentials the whole suite is skipped, so CI stays green.
 */
import { describe, it, expect, beforeAll, jest } from "@jest/globals";
import { RmsService, RMS_BASE_URL } from "./rms";

const EMAIL = process.env.RMS_TEST_EMAIL;
const PASSWORD = process.env.RMS_TEST_PASSWORD;
const enabled = Boolean(EMAIL && PASSWORD);

const maybe = enabled ? describe : describe.skip;

jest.setTimeout(45000);

maybe("RMS API integration (live, read-only)", () => {
  let token;
  let firstProjectId;

  beforeAll(async () => {
    const res = await RmsService.login(EMAIL, PASSWORD);
    if (!res.success) {
      throw new Error(
        `Login failed against ${RMS_BASE_URL}: ${res.message}. Check RMS_TEST_EMAIL / RMS_TEST_PASSWORD.`,
      );
    }
    token = res.data.token;
  });

  describe("login", () => {
    it("returns a JWT and the user record", async () => {
      const res = await RmsService.login(EMAIL, PASSWORD);

      expect(res.success).toBe(true);
      expect(res.statusCode).toBe(200);
      expect(typeof res.data.token).toBe("string");
      expect(res.data.token.split(".")).toHaveLength(3);
      expect(res.data.user).toMatchObject({
        id: expect.any(Number),
        email: EMAIL,
        fullName: expect.any(String),
        role: expect.any(String),
      });
    });

    it("rejects a wrong password with 401 and a readable message", async () => {
      const res = await RmsService.login(EMAIL, "definitely-not-the-password");

      expect(res.success).toBe(false);
      expect(res.statusCode).toBe(401);
      expect(res.message).toMatch(/invalid/i);
      expect(res.message).not.toMatch(/^API Error/);
    });

    it("rejects an unknown user", async () => {
      const res = await RmsService.login(
        "no-such-user-9f2a@mailinator.com",
        "whatever",
      );
      expect(res.success).toBe(false);
      expect([400, 401, 404]).toContain(res.statusCode);
    });
  });

  describe("fetchProjects", () => {
    it("returns a page of projects with pagination metadata", async () => {
      const res = await RmsService.fetchProjects(token);

      expect(res.success).toBe(true);
      expect(Array.isArray(res.data)).toBe(true);
      expect(res.metadata).toMatchObject({
        page: 1,
        limit: 9,
        totalCount: expect.any(Number),
        totalPages: expect.any(Number),
      });
      expect(res.data.length).toBeLessThanOrEqual(9);

      if (res.data.length) {
        firstProjectId = res.data[0].id;
      }
    });

    it("returns the fields the Projects panel renders", async () => {
      const res = await RmsService.fetchProjects(token);
      if (!res.data.length) return;

      const project = res.data[0];
      expect(project).toMatchObject({
        id: expect.any(Number),
        name: expect.any(String),
      });
      // Optional in the payload, but must be the shape the UI assumes.
      expect(["number", "undefined"]).toContain(
        typeof project.percentageComplete,
      );
      expect(Array.isArray(project.technologies || [])).toBe(true);
      expect(Array.isArray(project.developerAllocations || [])).toBe(true);
      if (project.client) {
        expect(typeof project.client.name).toBe("string");
      }
    });

    it("honours the page parameter", async () => {
      const first = await RmsService.fetchProjects(token, { page: 1, limit: 2 });
      expect(first.success).toBe(true);
      expect(first.metadata.limit).toBe(2);

      if (first.metadata.totalPages < 2) return; // not enough data to page

      const second = await RmsService.fetchProjects(token, {
        page: 2,
        limit: 2,
      });
      expect(second.success).toBe(true);
      expect(second.metadata.page).toBe(2);

      const firstIds = first.data.map((p) => p.id);
      const secondIds = second.data.map((p) => p.id);
      expect(secondIds.some((id) => firstIds.includes(id))).toBe(false);
    });

    it("filters by search term", async () => {
      const all = await RmsService.fetchProjects(token, { limit: 50 });
      if (!all.data.length) return;

      const term = all.data[0].name.slice(0, 4);
      const filtered = await RmsService.fetchProjects(token, {
        search: term,
        limit: 50,
      });

      expect(filtered.success).toBe(true);
      expect(filtered.data.length).toBeGreaterThan(0);
      expect(filtered.data.length).toBeLessThanOrEqual(all.metadata.totalCount);
      filtered.data.forEach((p) => {
        expect(p.name.toLowerCase()).toContain(term.toLowerCase());
      });
    });

    it("returns an empty list for a search that matches nothing", async () => {
      const res = await RmsService.fetchProjects(token, {
        search: "zzz-no-such-project-zzz",
      });

      expect(res.success).toBe(true);
      expect(res.data).toEqual([]);
      expect(res.metadata.totalCount).toBe(0);
    });

    it("rejects a bad token with 401", async () => {
      const res = await RmsService.fetchProjects("not-a-real-token");

      expect(res.success).toBe(false);
      expect(res.statusCode).toBe(401);
    });
  });

  describe("fetchMilestones", () => {
    it("returns milestones with their tasks for a real project", async () => {
      const projects = await RmsService.fetchProjects(token, { limit: 50 });
      expect(projects.success).toBe(true);
      if (!projects.data.length) return;

      // Find a project that actually has milestones so the shape gets exercised.
      let payload = null;
      for (const project of projects.data) {
        const res = await RmsService.fetchMilestones(token, project.id);
        expect(res.success).toBe(true);
        expect(Array.isArray(res.data)).toBe(true);
        if (res.data.length) {
          payload = res;
          break;
        }
      }

      if (!payload) {
        console.warn("No project on this environment has milestones yet.");
        return;
      }

      const milestone = payload.data[0];
      expect(milestone).toMatchObject({
        id: expect.any(Number),
        name: expect.any(String),
      });
      // Fields the Milestones panel renders.
      expect(Number.isNaN(Number(milestone.actualTime ?? 0))).toBe(false);
      expect(Number.isNaN(Number(milestone.estimatedTime ?? 0))).toBe(false);
      expect(Array.isArray(milestone.tasks || [])).toBe(true);

      (milestone.tasks || []).forEach((task) => {
        expect(task).toMatchObject({
          id: expect.any(Number),
          taskName: expect.any(String),
        });
        expect(Number.isNaN(Number(task.actualLoggedHours ?? 0))).toBe(false);
      });
    });

    it("returns a list (not an error) for a project with no milestones", async () => {
      if (!firstProjectId) return;

      const res = await RmsService.fetchMilestones(token, firstProjectId);
      expect(res.success).toBe(true);
      expect(Array.isArray(res.data)).toBe(true);
    });

    it("rejects a bad token with 401", async () => {
      const res = await RmsService.fetchMilestones("not-a-real-token", 1);

      expect(res.success).toBe(false);
      expect(res.statusCode).toBe(401);
    });
  });
});

describe("RMS integration harness", () => {
  it("reports whether live tests ran", () => {
    if (!enabled) {
      console.warn(
        "RMS integration tests skipped — set RMS_TEST_EMAIL / RMS_TEST_PASSWORD in .env.local",
      );
    }
    expect(true).toBe(true);
  });
});
