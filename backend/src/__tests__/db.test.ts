import { getDatabase, closeDatabase, initDatabase } from "../db";

describe("Database Coverage", () => {
  beforeEach(() => {
    jest.resetModules();
  });

  it("should throw if db is not initialized", () => {
    closeDatabase();
    expect(() => getDatabase()).toThrow(
      "Database not initialized. Call initDatabase() first.",
    );
  });

  it("should initialize and return db successfully", () => {
    const db = initDatabase(":memory:");
    expect(getDatabase()).toBe(db);
    expect(db.open).toBe(true);
  });
});
