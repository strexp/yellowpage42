import { authMiddleware, AuthRequest } from "../middleware/auth";
import { registryMiddleware } from "../middleware/registry";
import { Response, NextFunction } from "express";

jest.mock("../config", () => ({
  getConfig: () => ({ server: { jwtSecret: "secret" } }),
}));

describe("Middleware Coverage", () => {
  describe("authMiddleware", () => {
    it("should return 401 if no auth header", () => {
      const req = { headers: {} } as AuthRequest;
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
      } as unknown as Response;
      const next = jest.fn() as unknown as NextFunction;

      authMiddleware(req, res, next);
      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({ error: "Unauthorized" });
    });

    it("should return 401 if token is invalid", () => {
      const req = {
        headers: { authorization: "Bearer invalid" },
      } as AuthRequest;
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
      } as unknown as Response;
      const next = jest.fn() as unknown as NextFunction;

      authMiddleware(req, res, next);
      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({ error: "Invalid token" });
    });
  });

  describe("registryMiddleware", () => {
    it("should return 401 if user not in req", () => {
      const req = {} as AuthRequest;
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
      } as unknown as Response;
      const next = jest.fn() as unknown as NextFunction;

      registryMiddleware(req, res, next);
      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({ error: "Unauthorized" });
    });
  });
});
