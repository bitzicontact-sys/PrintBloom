import { Router, type IRouter } from "express";
import { db } from "@workspace/db";
import { clientsTable } from "@workspace/db/schema";
import { eq, desc, isNull } from "drizzle-orm";

const router: IRouter = Router();

function generateClientId(id: number): string {
  const rand = Math.random().toString(36).slice(2, 5).toUpperCase();
  return `PB-CLT-${String(id).padStart(4, "0")}-${rand}`;
}

/* Backfill any existing clients that have no clientId */
async function backfillClientIds() {
  const missing = await db.select({ id: clientsTable.id })
    .from(clientsTable)
    .where(isNull(clientsTable.clientId));
  for (const row of missing) {
    await db.update(clientsTable)
      .set({ clientId: generateClientId(row.id) })
      .where(eq(clientsTable.id, row.id));
  }
}
backfillClientIds().catch(() => {});

router.get("/clients", async (req, res) => {
  try {
    const clients = await db.select().from(clientsTable).orderBy(desc(clientsTable.createdAt));
    res.json(clients);
  } catch (err) {
    req.log.error({ err }, "Failed to fetch clients");
    res.status(500).json({ error: "Failed to fetch clients" });
  }
});

router.get("/clients/:id", async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const [client] = await db.select().from(clientsTable).where(eq(clientsTable.id, id));
    if (!client) return res.status(404).json({ error: "Client not found" });
    res.json(client);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch client" });
  }
});

router.post("/clients", async (req, res) => {
  try {
    const { name, phone, email, businessName, address, notes } = req.body;
    if (!name || !phone) return res.status(400).json({ error: "Name and phone are required" });
    const [inserted] = await db.insert(clientsTable).values({
      name, phone,
      email: email ?? null,
      businessName: businessName ?? null,
      address: address ?? null,
      notes: notes ?? null,
    }).returning();
    /* Assign a unique clientId based on the auto-incremented id */
    const clientId = generateClientId(inserted.id);
    const [client] = await db.update(clientsTable)
      .set({ clientId })
      .where(eq(clientsTable.id, inserted.id))
      .returning();
    res.status(201).json(client);
  } catch (err) {
    req.log.error({ err }, "Failed to create client");
    res.status(400).json({ error: "Failed to create client" });
  }
});

router.put("/clients/:id", async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const { name, phone, email, businessName, address, notes } = req.body;
    const [client] = await db.update(clientsTable).set({
      name, phone,
      email: email ?? null,
      businessName: businessName ?? null,
      address: address ?? null,
      notes: notes ?? null,
    }).where(eq(clientsTable.id, id)).returning();
    if (!client) return res.status(404).json({ error: "Client not found" });
    res.json(client);
  } catch (err) {
    res.status(400).json({ error: "Failed to update client" });
  }
});

router.delete("/clients/:id", async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    await db.delete(clientsTable).where(eq(clientsTable.id, id));
    res.status(204).send();
  } catch (err) {
    res.status(400).json({ error: "Failed to delete client" });
  }
});

export default router;
