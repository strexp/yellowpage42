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

describe("Phonebook API", () => {
  let testToken: string;
  const testPrefix = "42401234";
  const testMnt = "MAINT-TEST";

  beforeAll(() => {
    jest.spyOn(console, "error").mockImplementation(() => {});
    loadConfig();
    initDatabase(":memory:");
    testToken = createTestToken();
  });

  afterAll(() => {
    (console.error as jest.Mock).mockRestore();
    closeDatabase();
  });

  beforeEach(() => {
    const db = getDatabase();
    db.prepare(
      "INSERT OR IGNORE INTO users (mnt, name, telephony) VALUES (?, ?, ?)",
    ).run(testMnt, "Test User", `["${testPrefix}"]`);
    db.prepare("DELETE FROM phonebooks WHERE mnt = ?").run(testMnt);
  });

  describe("GET /phonebook/me", () => {
    it("should return 401 without authentication", async () => {
      const response = await request(app).get("/phonebook/me");
      expect(response.status).toBe(401);
    });

    it("should return empty phonebook for new user", async () => {
      const response = await request(app)
        .get("/phonebook/me")
        .set("Authorization", `Bearer ${testToken}`);

      expect(response.status).toBe(200);
      expect(response.body).toEqual([]);
    });
  });

  describe("POST /phonebook/me", () => {
    it("should return 401 without authentication", async () => {
      const response = await request(app)
        .post("/phonebook/me")
        .send({ number: `${testPrefix}001`, name: "Test User", type: "phone" });

      expect(response.status).toBe(401);
    });

    it("should create phonebook entry successfully", async () => {
      const response = await request(app)
        .post("/phonebook/me")
        .set("Authorization", `Bearer ${testToken}`)
        .send({ number: `${testPrefix}001`, name: "Test User", type: "phone" });

      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty("id");
      expect(response.body.number).toBe(`${testPrefix}001`);
      expect(response.body.name).toBe("Test User");
      expect(response.body.type).toBe("phone");
    });

    it("should reject number without correct prefix", async () => {
      const response = await request(app)
        .post("/phonebook/me")
        .set("Authorization", `Bearer ${testToken}`)
        .send({ number: "4250000001", name: "Test User", type: "phone" });

      expect(response.status).toBe(400);
    });

    it("should reject write for non-write User", async () => {
      const db = getDatabase();
      db.prepare(
        "INSERT OR IGNORE INTO users (mnt, name, telephony) VALUES (?, ?, ?)",
      ).run("MAINT-NOWRITE", "No Write", "[]");
      const nonWriteToken = generateToken("MAINT-NOWRITE");

      const response = await request(app)
        .post("/phonebook/me")
        .set("Authorization", `Bearer ${nonWriteToken}`)
        .send({ number: "42401234567", name: "Test User", type: "phone" });

      expect(response.status).toBe(403);
      expect(response.body.error).toContain("Write access is only available");
    });
  });

  describe("DELETE /phonebook/me/:id", () => {
    it("should return 401 without authentication", async () => {
      const response = await request(app).delete("/phonebook/me/1");

      expect(response.status).toBe(401);
    });

    it("should delete phonebook entry successfully", async () => {
      const createResponse = await request(app)
        .post("/phonebook/me")
        .set("Authorization", `Bearer ${testToken}`)
        .send({ number: `${testPrefix}001`, name: "Test User", type: "phone" });

      const id = createResponse.body.id;

      const deleteResponse = await request(app)
        .delete(`/phonebook/me/${id}`)
        .set("Authorization", `Bearer ${testToken}`);

      expect(deleteResponse.status).toBe(200);
      expect(deleteResponse.body).toEqual({ success: true });
    });
  });

  describe("Non-Write User access", () => {
    beforeEach(() => {
      const db = getDatabase();
      db.prepare(
        "INSERT OR IGNORE INTO users (mnt, name, telephony) VALUES (?, ?, ?)",
      ).run("MAINT-READ", "Read", "[]");
    });

    it("should allow read for non-write User", async () => {
      const nonWriteToken = generateToken("MAINT-READ");

      const response = await request(app)
        .get("/phonebook/me")
        .set("Authorization", `Bearer ${nonWriteToken}`);

      expect(response.status).toBe(200);
    });

    it("should reject write for non-write User", async () => {
      const nonWriteToken = generateToken("MAINT-READ");

      const response = await request(app)
        .post("/phonebook/me")
        .set("Authorization", `Bearer ${nonWriteToken}`)
        .send({ number: "42401234567", name: "Test User", type: "phone" });

      expect(response.status).toBe(403);
    });

    it("should reject delete for non-write User", async () => {
      const nonWriteToken = generateToken("MAINT-READ");

      const response = await request(app)
        .delete("/phonebook/me/1")
        .set("Authorization", `Bearer ${nonWriteToken}`);

      expect(response.status).toBe(403);
    });
  });

  describe("Edge Cases", () => {
    it("should reject more than 20 entries per prefix", async () => {
      const db = getDatabase();
      for (let i = 0; i < 20; i++) {
        db.prepare(
          "INSERT INTO phonebooks (mnt, number, name, type) VALUES (?, ?, ?, ?)",
        ).run(testMnt, `424012340${i + 10}`, "Test", "phone");
      }
      const response = await request(app)
        .post("/phonebook/me")
        .set("Authorization", `Bearer ${testToken}`)
        .send({ number: "42401234999", name: "Overflow", type: "phone" });

      expect(response.status).toBe(400);
      expect(response.body.error).toContain("Maximum 20");
    });

    it("should return 404 when deleting non-existent entry", async () => {
      const response = await request(app)
        .delete("/phonebook/me/9999")
        .set("Authorization", `Bearer ${testToken}`);
      expect(response.status).toBe(404);
    });

    it("should handle zod validation error", async () => {
      const response = await request(app)
        .post("/phonebook/me")
        .set("Authorization", `Bearer ${testToken}`)
        .send({ number: "abc", name: "", type: "invalid_type" });
      expect(response.status).toBe(400);
    });

    it("should return 500 on db error during POST", async () => {
      const db = getDatabase();
      db.prepare("DROP TABLE phonebooks").run();
      const response = await request(app)
        .post("/phonebook/me")
        .set("Authorization", `Bearer ${testToken}`)
        .send({ number: "42401234001", name: "Test", type: "phone" });
      expect(response.status).toBe(500);

      initDatabase(":memory:");
      createTestToken();
    });
  });
});
