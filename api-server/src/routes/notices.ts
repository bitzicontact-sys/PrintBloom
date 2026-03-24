import { Router, type IRouter } from "express";
import { db } from "@workspace/db";
import { noticesTable, insertNoticeSchema } from "@workspace/db/schema";
import { eq } from "drizzle-orm";

const router: IRouter = Router();

router.get("/notices", async (req, res) => {
  try {
    const notices = await db.select().from(noticesTable).orderBy(noticesTable.createdAt);
    res.json(notices);
  } catch (err) {
    req.log.error({ err }, "Failed to fetch notices");
    res.status(500).json({ error: "Failed to fetch notices" });
  }
});

router.post("/notices", async (req, res) => {
  try {
    const data = insertNoticeSchema.parse(req.body);
    const [notice] = await db.insert(noticesTable).values(data).returning();
    res.status(201).json(notice);
  } catch (err) {
    req.log.error({ err }, "Failed to create notice");
    res.status(400).json({ error: "Invalid notice data" });
  }
});

router.put("/notices/:id", async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const data = insertNoticeSchema.parse(req.body);
    const [notice] = await db.update(noticesTable).set(data).where(eq(noticesTable.id, id)).returning();
    if (!notice) {
      return res.status(404).json({ error: "Notice not found" });
    }
    res.json(notice);
  } catch (err) {
    req.log.error({ err }, "Failed to update notice");
    res.status(400).json({ error: "Invalid notice data" });
  }
});

router.delete("/notices/:id", async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    await db.delete(noticesTable).where(eq(noticesTable.id, id));
    res.status(204).end();
  } catch (err) {
    req.log.error({ err }, "Failed to delete notice");
    res.status(500).json({ error: "Failed to delete notice" });
  }
});

export default router;
