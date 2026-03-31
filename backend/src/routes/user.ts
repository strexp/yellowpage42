import { Router, Response } from "express";
import { AuthRequest } from "../middleware/auth";
import { getDatabase } from "../db";
import { User as UserType } from "../types";

const router = Router();

router.get("/me", (req: AuthRequest, res: Response) => {
  if (!req.user) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  const db = getDatabase();
  const user = db
    .prepare("SELECT * FROM users WHERE mnt = ?")
    .get(req.user.mnt) as UserType | undefined;

  if (!user) {
    res.status(404).json({ error: "User not found" });
    return;
  }

  const telephony = JSON.parse(user.telephony || "[]");

  res.json({
    mnt: user.mnt,
    name: user.name,
    telephony,
    canWrite: telephony.length > 0,
  });
});

export default router;
