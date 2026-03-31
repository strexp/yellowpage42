import { getConfig, loadConfig } from "../config";

describe("Config Coverage", () => {
  beforeEach(() => {
    jest.resetModules();
  });

  it("should throw if getConfig is called before loadConfig", () => {
    expect(() => getConfig()).toThrow(
      "Config not loaded. Call loadConfig() first.",
    );
  });

  it("should load default config if config file is missing", () => {
    jest.mock("fs", () => ({
      existsSync: jest.fn().mockReturnValue(false),
    }));
    const config = loadConfig("missing.json");
    expect(config.server.port).toBe(3000);
  });

  it("should load user config if config file exists", () => {
    jest.mock("fs", () => ({
      existsSync: jest.fn().mockReturnValue(true),
      readFileSync: jest.fn().mockReturnValue('{"server":{"port":4000}}'),
    }));
    const config = loadConfig("exists.json");
    expect(config.server.port).toBe(4000);
  });

  it("should return cached config on subsequent calls", () => {
    const c1 = loadConfig();
    const c2 = loadConfig();
    expect(c1).toBe(c2);
  });
});
