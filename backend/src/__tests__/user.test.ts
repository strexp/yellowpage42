import request from "supertest";
import { initDatabase, closeDatabase, getDatabase } from "../db";
import { loadConfig } from "../config";
import { generateToken } from "../middleware/auth";
import { app } from "../server";

export function createTestToken(
  mnt: string = "MAINT-TEST",
  telephony: string = '["42401234"]',
): string {
  const db = getDatabase();
  db.prepare(
    "INSERT OR IGNORE INTO users (mnt, name, telephony) VALUES (?, ?, ?)",
  ).run(mnt, "Test User", telephony);
  return generateToken(mnt);
}

describe("User API", () => {
  let testToken: string;
  let testToken2: string;

  beforeAll(() => {
    jest.spyOn(console, "error").mockImplementation(() => {});
    loadConfig();
    initDatabase(":memory:");
    testToken = createTestToken("MAINT-TEST", '["42401234"]');
    testToken2 = createTestToken("MAINT-NOWRITE", "[]");
  });

  afterAll(() => {
    (console.error as jest.Mock).mockRestore();
    closeDatabase();
  });

  describe("GET /user/me", () => {
    it("should return 401 without authentication", async () => {
      const response = await request(app).get("/user/me");
      expect(response.status).toBe(401);
    });

    it("should return user info with valid token", async () => {
      const response = await request(app)
        .get("/user/me")
        .set("Authorization", `Bearer ${testToken}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty("telephony");
      expect(response.body.telephony[0]).toBe("42401234");
      expect(response.body).toHaveProperty("canWrite", true);
    });

    it("should return empty prefix for non-configured User", async () => {
      const response = await request(app)
        .get("/user/me")
        .set("Authorization", `Bearer ${testToken2}`);

      expect(response.status).toBe(200);
      expect(response.body.telephony).toEqual([]);
      expect(response.body).toHaveProperty("canWrite", false);
    });
  });
});
