import request from "supertest";
import { initDatabase, closeDatabase } from "../db";
import { loadConfig } from "../config";
import { generateToken } from "../middleware/auth";
import { app } from "../server";

export function createTestToken(mnt: string = "MAINT-TEST"): string {
  const db = require("../db").getDatabase();
  db.prepare("INSERT INTO users (mnt, name, telephony) VALUES (?, ?, ?)").run(
    mnt,
    "Test User",
    '["42401234"]',
  );
  return generateToken(mnt);
}

describe("Public Phonebook API", () => {
  const testMnt = "MAINT-TEST";
  const testPrefix = "42401234";

  beforeAll(() => {
    loadConfig();
    initDatabase(":memory:");
    createTestToken(testMnt);

    const db = require("../db").getDatabase();
    db.prepare(
      "INSERT INTO phonebooks (mnt, number, name, type) VALUES (?, ?, ?, ?)",
    ).run(testMnt, `${testPrefix}001`, "Test User", "phone");
    db.prepare(
      "INSERT INTO phonebooks (mnt, number, name, type) VALUES (?, ?, ?, ?)",
    ).run(testMnt, `${testPrefix}002`, "Test User 2", "fax");
  });

  afterAll(() => {
    closeDatabase();
  });

  describe("GET /public/phonebook", () => {
    it("should return all public phonebook entries", async () => {
      const response = await request(app).get("/public/phonebook");

      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBeGreaterThan(0);
      expect(response.body[0]).toHaveProperty("mnt");
      expect(response.body[0]).toHaveProperty("number");
      expect(response.body[0]).toHaveProperty("name");
      expect(response.body[0]).toHaveProperty("type");
    });
  });

  describe("GET /public/phonebook/download", () => {
    it("should return VCF format by default", async () => {
      const response = await request(app).get("/public/phonebook/download");

      expect(response.status).toBe(200);
      expect(response.header["content-type"]).toMatch(/vcard/i);
      expect(response.text).toContain("BEGIN:VCARD");
      expect(response.text).toContain("END:VCARD");
    });

    it("should return CSV format when requested", async () => {
      const response = await request(app).get(
        "/public/phonebook/download?format=csv",
      );

      expect(response.status).toBe(200);
      expect(response.header["content-type"]).toContain("text/csv");
      expect(response.text).toContain("Number,Name,Type,MNT");
    });

    it("should return 400 for unsupported format", async () => {
      const response = await request(app).get(
        "/public/phonebook/download?format=json",
      );

      expect(response.status).toBe(400);
    });
  });
});
