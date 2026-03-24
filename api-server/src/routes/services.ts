import { Router, type IRouter } from "express";
import { db } from "@workspace/db";
import { servicesTable, insertServiceSchema } from "@workspace/db/schema";
import { eq, asc } from "drizzle-orm";

const router: IRouter = Router();

router.get("/services", async (req, res) => {
  try {
    const services = await db.select().from(servicesTable).orderBy(asc(servicesTable.sortOrder), asc(servicesTable.createdAt));
    res.json(services);
  } catch (err) {
    req.log.error({ err }, "Failed to fetch services");
    res.status(500).json({ error: "Failed to fetch services" });
  }
});

router.post("/services", async (req, res) => {
  try {
    const data = insertServiceSchema.parse(req.body);
    const [service] = await db.insert(servicesTable).values(data).returning();
    res.status(201).json(service);
  } catch (err) {
    req.log.error({ err }, "Failed to create service");
    res.status(400).json({ error: "Invalid service data" });
  }
});

router.put("/services/:id", async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const data = insertServiceSchema.parse(req.body);
    const [service] = await db.update(servicesTable).set(data).where(eq(servicesTable.id, id)).returning();
    if (!service) {
      return res.status(404).json({ error: "Service not found" });
    }
    res.json(service);
  } catch (err) {
    req.log.error({ err }, "Failed to update service");
    res.status(400).json({ error: "Invalid service data" });
  }
});

router.delete("/services/:id", async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    await db.delete(servicesTable).where(eq(servicesTable.id, id));
    res.status(204).end();
  } catch (err) {
    req.log.error({ err }, "Failed to delete service");
    res.status(500).json({ error: "Failed to delete service" });
  }
});

export default router;
