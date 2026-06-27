import { Router, Response } from "express";
import { z } from "zod";
import { AuthRequest } from "../middleware/auth";
import { registryMiddleware } from "../middleware/registry";
import { getDatabase } from "../db";
import { phonebookEntrySchema } from "../schemas";
import { PhonebookEntry } from "../types";

const router = Router();

router.get("/me", (req: AuthRequest, res: Response) => {
  if (!req.user) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  const db = getDatabase();
  const user = db
    .prepare("SELECT telephony FROM users WHERE mnt = ?")
    .get(req.user.mnt) as { telephony?: string } | undefined;
  const telephony = JSON.parse(user?.telephony || "[]") as string[];

  const allEntries = db
    .prepare("SELECT * FROM phonebooks")
    .all() as PhonebookEntry[];

  // 过滤条件为仅当用户的 prefix 包揽了该条目
  const entries = allEntries.filter((e) =>
    telephony.some((prefix) => e.number.startsWith(prefix)),
  );

  res.json(
    entries.map((e) => ({
      id: e.id,
      number: e.number,
      name: e.name,
      type: e.type,
      language: e.language,
      hidden: !!e.hidden,
    })),
  );
});

router.post("/me", registryMiddleware, (req: AuthRequest, res: Response) => {
  if (!req.user) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  try {
    const data = phonebookEntrySchema.parse(req.body);
    const db = getDatabase();

    const user = db
      .prepare("SELECT telephony FROM users WHERE mnt = ?")
      .get(req.user.mnt) as { telephony?: string } | undefined;
    const telephony = JSON.parse(user?.telephony || "[]") as string[];

    const matchedPrefix = telephony.find((prefix) =>
      data.number.startsWith(prefix),
    );
    if (!matchedPrefix) {
      res.status(400).json({
        error: "Number must start with one of your allocated prefixes",
      });
      return;
    }

    const allEntries = db.prepare("SELECT number FROM phonebooks").all() as {
      number: string;
    }[];
    const prefixCount = allEntries.filter((e) =>
      e.number.startsWith(matchedPrefix),
    ).length;

    if (prefixCount >= 20) {
      res
        .status(400)
        .json({ error: "Maximum 20 phonebook entries allowed per prefix" });
      return;
    }

    const existingNumber = db
      .prepare("SELECT id FROM phonebooks WHERE number = ?")
      .get(data.number);

    if (existingNumber) {
      res.status(400).json({ error: "Extension number already exists" });
      return;
    }

    const result = db
      .prepare(
        "INSERT INTO phonebooks (mnt, number, name, type, language, hidden) VALUES (?, ?, ?, ?, ?, ?)",
      )
      .run(
        req.user.mnt,
        data.number,
        data.name,
        data.type,
        data.language,
        data.hidden ? 1 : 0,
      );

    res.status(201).json({
      id: result.lastInsertRowid,
      number: data.number,
      name: data.name,
      type: data.type,
      language: data.language,
      hidden: data.hidden,
    });
  } catch (error: unknown) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ error: "Invalid request body" });
    } else {
      console.error("Phonebook create error:", error);
      res.status(500).json({ error: "Failed to create phonebook entry" });
    }
  }
});

router.patch(
  "/me/:id/hidden",
  registryMiddleware,
  (req: AuthRequest, res: Response) => {
    if (!req.user) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }

    try {
      const { hidden } = z.object({ hidden: z.boolean() }).parse(req.body);
      const { id } = req.params;
      const db = getDatabase();

      const entry = db
        .prepare("SELECT * FROM phonebooks WHERE id = ?")
        .get(id) as PhonebookEntry | undefined;

      if (!entry) {
        res.status(404).json({ error: "Entry not found" });
        return;
      }

      const user = db
        .prepare("SELECT telephony FROM users WHERE mnt = ?")
        .get(req.user.mnt) as { telephony?: string } | undefined;
      const telephony = JSON.parse(user?.telephony || "[]") as string[];

      const validPrefix = telephony.some((prefix) =>
        entry.number.startsWith(prefix),
      );

      if (!validPrefix) {
        res
          .status(403)
          .json({ error: "Forbidden: You don't manage this prefix" });
        return;
      }

      db.prepare("UPDATE phonebooks SET hidden = ? WHERE id = ?").run(
        hidden ? 1 : 0,
        id,
      );
      res.json({ success: true, hidden });
    } catch (error: unknown) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ error: "Invalid request body" });
      } else {
        console.error("Phonebook update error:", error);
        res
          .status(500)
          .json({ error: "Failed to update phonebook entry visibility" });
      }
    }
  },
);

router.delete(
  "/me/:id",
  registryMiddleware,
  (req: AuthRequest, res: Response) => {
    if (!req.user) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }

    const { id } = req.params;
    const db = getDatabase();

    const entry = db
      .prepare("SELECT * FROM phonebooks WHERE id = ?")
      .get(id) as PhonebookEntry | undefined;

    if (!entry) {
      res.status(404).json({ error: "Entry not found" });
      return;
    }

    const user = db
      .prepare("SELECT telephony FROM users WHERE mnt = ?")
      .get(req.user.mnt) as { telephony?: string } | undefined;
    const telephony = JSON.parse(user?.telephony || "[]") as string[];

    const validPrefix = telephony.some((prefix) =>
      entry.number.startsWith(prefix),
    );

    if (!validPrefix) {
      res
        .status(403)
        .json({ error: "Forbidden: You don't manage this prefix" });
      return;
    }

    db.prepare("DELETE FROM phonebooks WHERE id = ?").run(id);
    res.json({ success: true });
  },
);

export default router;
