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

  let whereClause = "WHERE hidden = 0";
  const params: (string | number)[] = [];

  if (search) {
    whereClause += " AND (number LIKE ? OR name LIKE ? OR mnt LIKE ?)";
    const searchPattern = `%${search}%`;
    params.push(searchPattern, searchPattern, searchPattern);
  }
  if (type) {
    whereClause += " AND type = ?";
    params.push(type);
  }
  if (language) {
    whereClause += " AND language = ?";
    params.push(language);
  }

  const sortBy = (req.query.sortBy as string) || "mnt";
  const sortOrder = (req.query.sortOrder as string) || "asc";
  const allowedSortKeys = ["mnt", "number", "name", "type", "language"];
  const sortKey = allowedSortKeys.includes(sortBy) ? sortBy : "mnt";
  const order = sortOrder.toLowerCase() === "desc" ? "DESC" : "ASC";

  const countQuery = `SELECT COUNT(*) as count FROM phonebooks ${whereClause}`;
  const totalRes = db.prepare(countQuery).get(...params) as { count: number };
  const total = totalRes.count;

  let dataQuery = `SELECT mnt, number, name, type, language FROM phonebooks ${whereClause} ORDER BY ${sortKey} ${order}`;
  if (sortKey !== "number") {
    dataQuery += `, number ASC`;
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

  let query = `SELECT mnt, number, name, type, language FROM phonebooks WHERE hidden = 0`;
  const params: string[] = [];

  if (type) {
    query += ` AND type = ?`;
    params.push(type);
  }
  if (language) {
    query += ` AND language = ?`;
    params.push(language);
  }

  const sortBy = (req.query.sortBy as string) || "mnt";
  const sortOrder = (req.query.sortOrder as string) || "asc";
  const allowedSortKeys = ["mnt", "number", "name", "type", "language"];
  const sortKey = allowedSortKeys.includes(sortBy) ? sortBy : "mnt";
  const order = sortOrder.toLowerCase() === "desc" ? "DESC" : "ASC";

  query += ` ORDER BY ${sortKey} ${order}`;
  if (sortKey !== "number") {
    query += `, number ASC`;
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
      vcf += `NOTE:Maintainer ${entry.mnt} - Type: ${entry.type} - Lang: ${entry.language}\n`;
      vcf += "END:VCARD\n";
    }

    res.header("Content-Type", "text/vcard");
    res.attachment("yellowpage42_phonebook.vcf");
    res.send(vcf);
  } else if (format === "csv") {
    let csv = "Number,Name,Type,Language,MNT\n";
    for (const entry of entries) {
      csv += `${entry.number},${entry.name},${entry.type},${entry.language},${entry.mnt}\n`;
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
