import { Router, Request, Response } from "express";
import { getDatabase } from "../db";
import { PhonebookEntry } from "../types";

const router = Router();

router.get("/phonebook", (req: Request, res: Response) => {
  const db = getDatabase();

  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.itemsPerPage as string) || 10;
  const search = (req.query.search as string) || "";
  const type = (req.query.type as string) || "";
  const language = (req.query.language as string) || "";

  let whereClause = "WHERE p.hidden = 0";
  const params: (string | number)[] = [];

  if (search) {
    whereClause +=
      " AND (p.number LIKE ? OR p.name LIKE ? OR p.mnt LIKE ? OR u.name LIKE ?)";
    const searchPattern = `%${search}%`;
    params.push(searchPattern, searchPattern, searchPattern, searchPattern);
  }
  if (type) {
    whereClause += " AND p.type = ?";
    params.push(type);
  }
  if (language) {
    whereClause += " AND p.language = ?";
    params.push(language);
  }

  const sortBy = (req.query.sortBy as string) || "mnt";
  const sortOrder = (req.query.sortOrder as string) || "asc";
  const allowedSortKeys = ["mnt", "number", "name", "type", "language"];
  const sortKeyParam = allowedSortKeys.includes(sortBy) ? sortBy : "mnt";
  const sortKeyMap: Record<string, string> = {
    mnt: "p.mnt",
    number: "p.number",
    name: "p.name",
    type: "p.type",
    language: "p.language",
  };
  const sortKey = sortKeyMap[sortKeyParam];
  const order = sortOrder.toLowerCase() === "desc" ? "DESC" : "ASC";

  const countQuery = `SELECT COUNT(*) as count FROM phonebooks p LEFT JOIN users u ON p.mnt = u.mnt ${whereClause}`;
  const totalRes = db.prepare(countQuery).get(...params) as { count: number };
  const total = totalRes.count;

  let dataQuery = `SELECT p.mnt, p.number, p.name, p.type, p.language, p.sms, u.name as mntName FROM phonebooks p LEFT JOIN users u ON p.mnt = u.mnt ${whereClause} ORDER BY ${sortKey} ${order}`;
  if (sortKey !== "p.number") {
    dataQuery += `, p.number ASC`;
  }

  if (limit > 0) {
    dataQuery += ` LIMIT ? OFFSET ?`;
    params.push(limit, (page - 1) * limit);
  }

  const items = db.prepare(dataQuery).all(...params) as PhonebookEntry[];
  res.json({ items, total });
});

router.get("/phonebook/download", (req: Request, res: Response) => {
  const db = getDatabase();

  const type = (req.query.type as string) || "";
  const language = (req.query.language as string) || "";

  let query = `SELECT p.mnt, p.number, p.name, p.type, p.language, p.sms, u.name as mntName FROM phonebooks p LEFT JOIN users u ON p.mnt = u.mnt WHERE p.hidden = 0`;
  const params: string[] = [];

  if (type) {
    query += ` AND p.type = ?`;
    params.push(type);
  }
  if (language) {
    query += ` AND p.language = ?`;
    params.push(language);
  }

  const sortBy = (req.query.sortBy as string) || "mnt";
  const sortOrder = (req.query.sortOrder as string) || "asc";
  const allowedSortKeys = ["mnt", "number", "name", "type", "language"];
  const sortKeyParam = allowedSortKeys.includes(sortBy) ? sortBy : "mnt";
  const sortKeyMap: Record<string, string> = {
    mnt: "p.mnt",
    number: "p.number",
    name: "p.name",
    type: "p.type",
    language: "p.language",
  };
  const sortKey = sortKeyMap[sortKeyParam];
  const order = sortOrder.toLowerCase() === "desc" ? "DESC" : "ASC";

  query += ` ORDER BY ${sortKey} ${order}`;
  if (sortKey !== "p.number") {
    query += `, p.number ASC`;
  }

  const entries = db.prepare(query).all(...params) as PhonebookEntry[];
  const format = req.query.format || "vcf";

  if (format === "vcf") {
    let vcf = "";
    for (const entry of entries) {
      vcf += "BEGIN:VCARD\n";
      vcf += "VERSION:3.0\n";
      vcf += `FN:${entry.name}\n`;
      vcf += `TEL;TYPE=VOICE,WORK:${entry.number}\n`;
      vcf += `NOTE:Maintainer ${entry.mnt} (${entry.mntName || ""}) - Type: ${entry.type} - Lang: ${entry.language} - SMS: ${entry.sms ? "Yes" : "No"}\n`;
      vcf += "END:VCARD\n";
    }

    res.header("Content-Type", "text/vcard");
    res.attachment("yellowpage42_phonebook.vcf");
    res.send(vcf);
  } else if (format === "csv") {
    let csv = "Number,Name,Type,Language,MNT,MNT Name,SMS\n";
    for (const entry of entries) {
      csv += `${entry.number},${entry.name},${entry.type},${entry.language},${entry.mnt},${entry.mntName || ""},${entry.sms ? "Yes" : "No"}\n`;
    }

    res.header("Content-Type", "text/csv");
    res.attachment("yellowpage42_phonebook.csv");
    res.send(csv);
  } else if (format === "json") {
    res.header("Content-Type", "application/json");
    res.attachment("yellowpage42_phonebook.json");
    res.send(JSON.stringify(entries, null, 2));
  } else {
    res.status(400).json({ error: "Unsupported format. Use vcf, csv or json" });
  }
});

export default router;
