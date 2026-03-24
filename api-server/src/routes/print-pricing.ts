import { Router, type IRouter } from "express";
import { db } from "@workspace/db";
import { printPricingTable, laminationOptionsTable, insertPrintPricingSchema, insertLaminationOptionSchema } from "@workspace/db/schema";
import { eq, asc } from "drizzle-orm";

const router: IRouter = Router();

/* ─── Print Pricing Configs ─── */

router.get("/print-pricing", async (req, res) => {
  try {
    const configs = await db.select().from(printPricingTable).orderBy(asc(printPricingTable.sortOrder), asc(printPricingTable.id));
    const lamination = await db.select().from(laminationOptionsTable).orderBy(asc(laminationOptionsTable.sortOrder), asc(laminationOptionsTable.id));
    res.json({ configs, lamination });
  } catch (err) {
    req.log.error({ err }, "Failed to fetch print pricing");
    res.status(500).json({ error: "Failed to fetch print pricing" });
  }
});

router.post("/print-pricing", async (req, res) => {
  try {
    const data = insertPrintPricingSchema.parse(req.body);
    const [record] = await db.insert(printPricingTable).values(data).returning();
    res.status(201).json(record);
  } catch (err) {
    req.log.error({ err }, "Failed to create print pricing config");
    res.status(400).json({ error: "Invalid data" });
  }
});

router.put("/print-pricing/:id", async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const data = insertPrintPricingSchema.parse(req.body);
    const [record] = await db.update(printPricingTable).set(data).where(eq(printPricingTable.id, id)).returning();
    if (!record) return res.status(404).json({ error: "Not found" });
    res.json(record);
  } catch (err) {
    req.log.error({ err }, "Failed to update print pricing config");
    res.status(400).json({ error: "Invalid data" });
  }
});

router.delete("/print-pricing/:id", async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    await db.delete(printPricingTable).where(eq(printPricingTable.id, id));
    res.status(204).end();
  } catch (err) {
    req.log.error({ err }, "Failed to delete print pricing config");
    res.status(500).json({ error: "Failed to delete" });
  }
});

/* ─── Lamination Options ─── */

router.post("/lamination-options", async (req, res) => {
  try {
    const data = insertLaminationOptionSchema.parse(req.body);
    const [record] = await db.insert(laminationOptionsTable).values(data).returning();
    res.status(201).json(record);
  } catch (err) {
    req.log.error({ err }, "Failed to create lamination option");
    res.status(400).json({ error: "Invalid data" });
  }
});

router.put("/lamination-options/:id", async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const data = insertLaminationOptionSchema.parse(req.body);
    const [record] = await db.update(laminationOptionsTable).set(data).where(eq(laminationOptionsTable.id, id)).returning();
    if (!record) return res.status(404).json({ error: "Not found" });
    res.json(record);
  } catch (err) {
    req.log.error({ err }, "Failed to update lamination option");
    res.status(400).json({ error: "Invalid data" });
  }
});

router.delete("/lamination-options/:id", async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    await db.delete(laminationOptionsTable).where(eq(laminationOptionsTable.id, id));
    res.status(204).end();
  } catch (err) {
    req.log.error({ err }, "Failed to delete lamination option");
    res.status(500).json({ error: "Failed to delete" });
  }
});

export default router;
