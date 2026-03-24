import { Router, type IRouter } from "express";
import { db } from "@workspace/db";
import { projectsTable } from "@workspace/db/schema";
import { eq, desc } from "drizzle-orm";
const router: IRouter = Router();

router.get("/projects", async (req, res) => {
  try {
    const projects = await db.select().from(projectsTable).orderBy(desc(projectsTable.createdAt));
    res.json(projects);
  } catch (err) {
    req.log.error({ err }, "Failed to fetch projects");
    res.status(500).json({ error: "Failed to fetch projects" });
  }
});

router.post("/projects", async (req, res) => {
  try {
    const {
      clientId, clientName, name, description, status, deadline, totalAmount, paidAmount,
      clientPhone, clientEmail, clientAddress, adminNotes, deliveryType,
      courierName, courierTrackingNumber, courierTrackingUrl,
      referenceFiles, deliveryFiles, deliveryLinks, paymentProofUrl,
    } = req.body;
    if (!clientName || !name) return res.status(400).json({ error: "Client name and project name are required" });
    const [project] = await db.insert(projectsTable).values({
      clientId: clientId ?? null,
      clientName, name,
      description: description ?? null,
      status: status ?? "active",
      deadline: deadline ?? null,
      totalAmount: totalAmount ?? 0,
      paidAmount: paidAmount ?? 0,
      clientPhone: clientPhone ?? null,
      clientEmail: clientEmail ?? null,
      clientAddress: clientAddress ?? null,
      adminNotes: adminNotes ?? null,
      deliveryType: deliveryType ?? "physical",
      courierName: courierName ?? null,
      courierTrackingNumber: courierTrackingNumber ?? null,
      courierTrackingUrl: courierTrackingUrl ?? null,
      referenceFiles: referenceFiles ?? null,
      deliveryFiles: deliveryFiles ?? null,
      deliveryLinks: deliveryLinks ?? null,
      paymentProofUrl: paymentProofUrl ?? null,
    }).returning();
    res.status(201).json(project);
  } catch (err) {
    req.log.error({ err }, "Failed to create project");
    res.status(400).json({ error: "Failed to create project" });
  }
});

router.put("/projects/:id", async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const {
      clientName, name, description, status, deadline, totalAmount, paidAmount,
      clientPhone, clientEmail, clientAddress, adminNotes, deliveryType,
      courierName, courierTrackingNumber, courierTrackingUrl,
      referenceFiles, deliveryFiles, deliveryLinks, paymentProofUrl,
    } = req.body;
    const [project] = await db.update(projectsTable).set({
      ...(clientName !== undefined && { clientName }),
      ...(name !== undefined && { name }),
      description: description ?? null,
      ...(status !== undefined && { status }),
      deadline: deadline ?? null,
      ...(totalAmount !== undefined && { totalAmount }),
      ...(paidAmount !== undefined && { paidAmount }),
      ...(clientPhone !== undefined && { clientPhone: clientPhone ?? null }),
      ...(clientEmail !== undefined && { clientEmail: clientEmail ?? null }),
      ...(clientAddress !== undefined && { clientAddress: clientAddress ?? null }),
      ...(adminNotes !== undefined && { adminNotes: adminNotes ?? null }),
      ...(deliveryType !== undefined && { deliveryType }),
      ...(courierName !== undefined && { courierName: courierName ?? null }),
      ...(courierTrackingNumber !== undefined && { courierTrackingNumber: courierTrackingNumber ?? null }),
      ...(courierTrackingUrl !== undefined && { courierTrackingUrl: courierTrackingUrl ?? null }),
      ...(referenceFiles !== undefined && { referenceFiles }),
      ...(deliveryFiles !== undefined && { deliveryFiles }),
      ...(deliveryLinks !== undefined && { deliveryLinks }),
      ...(paymentProofUrl !== undefined && { paymentProofUrl: paymentProofUrl ?? null }),
    }).where(eq(projectsTable.id, id)).returning();
    if (!project) return res.status(404).json({ error: "Project not found" });
    res.json(project);
  } catch (err) {
    req.log.error({ err }, "Failed to update project");
    res.status(400).json({ error: "Failed to update project" });
  }
});

router.delete("/projects/:id", async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    await db.delete(projectsTable).where(eq(projectsTable.id, id));
    res.status(204).send();
  } catch (err) {
    res.status(400).json({ error: "Failed to delete project" });
  }
});

export default router;
