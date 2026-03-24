import { Router } from "express";
import { db } from "@workspace/db";
import { rawMaterialsTable } from "@workspace/db/schema";
import { eq, desc } from "drizzle-orm";

const router = Router();

router.get("/raw-materials", async (_req, res) => {
  try {
    const items = await db.select().from(rawMaterialsTable).orderBy(desc(rawMaterialsTable.updatedAt));
    res.json(items);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch raw materials" });
  }
});

router.post("/raw-materials", async (req, res) => {
  try {
    const { name, category, unit, currentStock, minimumStock, costPerUnit, notes } = req.body;
    if (!name) return res.status(400).json({ error: "Name is required" });
    const [item] = await db.insert(rawMaterialsTable).values({
      name,
      category: category || "paper",
      unit: unit || "reams",
      currentStock: parseFloat(currentStock) || 0,
      minimumStock: parseFloat(minimumStock) || 0,
      costPerUnit: costPerUnit != null ? parseFloat(costPerUnit) : null,
      notes: notes || null,
    }).returning();
    res.status(201).json(item);
  } catch (err) {
    res.status(500).json({ error: "Failed to create raw material" });
  }
});

router.put("/raw-materials/:id", async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const { name, category, unit, currentStock, minimumStock, costPerUnit, notes } = req.body;
    const updates: Record<string, unknown> = { updatedAt: new Date() };
    if (name !== undefined) updates.name = name;
    if (category !== undefined) updates.category = category;
    if (unit !== undefined) updates.unit = unit;
    if (currentStock !== undefined) updates.currentStock = parseFloat(currentStock);
    if (minimumStock !== undefined) updates.minimumStock = parseFloat(minimumStock);
    if (costPerUnit !== undefined) updates.costPerUnit = costPerUnit != null ? parseFloat(costPerUnit) : null;
    if (notes !== undefined) updates.notes = notes || null;
    const [item] = await db.update(rawMaterialsTable).set(updates as any).where(eq(rawMaterialsTable.id, id)).returning();
    if (!item) return res.status(404).json({ error: "Not found" });
    res.json(item);
  } catch (err) {
    res.status(500).json({ error: "Failed to update raw material" });
  }
});

router.delete("/raw-materials/:id", async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    await db.delete(rawMaterialsTable).where(eq(rawMaterialsTable.id, id));
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: "Failed to delete raw material" });
  }
});

export default router;
