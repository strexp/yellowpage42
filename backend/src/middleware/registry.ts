import { Response, NextFunction } from "express";
import { AuthRequest } from "./auth";
import { getDatabase } from "../db";

export function registryMiddleware(
  req: AuthRequest,
  res: Response,
  next: NextFunction,
): void {
  if (!req.user) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  const db = getDatabase();
  const user = db
    .prepare("SELECT telephony FROM users WHERE mnt = ?")
    .get(req.user.mnt) as { telephony?: string } | undefined;

  if (!user || JSON.parse(user.telephony || "[]").length === 0) {
    res.status(403).json({
      error:
        "Write access is only available for Maintainers with allocated telephony prefixes",
    });
    return;
  }

  next();
}
