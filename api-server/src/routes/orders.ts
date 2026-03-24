import { Router, type IRouter } from "express";
import { db } from "@workspace/db";
import { ordersTable } from "@workspace/db/schema";
import { eq, desc } from "drizzle-orm";
import { addOrderClient, removeOrderClient, addAdminClient, removeAdminClient, emitOrderUpdate } from "../lib/sse";
const router: IRouter = Router();

const MONTHS = ["JAN","FEB","MAR","APR","MAY","JUN","JUL","AUG","SEP","OCT","NOV","DEC"];
const CHARS = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

function generateTrackingCode(orderId: number): string {
  const month = MONTHS[new Date().getMonth()];
  const num = String(orderId).padStart(4, "0");
  let suffix = "";
  for (let i = 0; i < 3; i++) suffix += CHARS[Math.floor(Math.random() * CHARS.length)];
  return `PB-${month}-${num}-${suffix}`;
}

router.get("/orders", async (req, res) => {
  try {
    const orders = await db.select().from(ordersTable).orderBy(desc(ordersTable.createdAt));
    res.json(orders);
  } catch (err) {
    req.log.error({ err }, "Failed to fetch orders");
    res.status(500).json({ error: "Failed to fetch orders" });
  }
});

router.get("/orders/track/:code", async (req, res) => {
  try {
    const code = req.params.code.toUpperCase();
    const [order] = await db.select({
      id: ordersTable.id,
      trackingCode: ordersTable.trackingCode,
      customerName: ordersTable.customerName,
      customerPhone: ordersTable.customerPhone,
      customerEmail: ordersTable.customerEmail,
      productName: ordersTable.productName,
      quantity: ordersTable.quantity,
      totalPrice: ordersTable.totalPrice,
      status: ordersTable.status,
      orderType: ordersTable.orderType,
      projectTitle: ordersTable.projectTitle,
      notes: ordersTable.notes,
      deliveryType: ordersTable.deliveryType,
      courierName: ordersTable.courierName,
      courierTrackingUrl: ordersTable.courierTrackingUrl,
      courierTrackingNumber: ordersTable.courierTrackingNumber,
      invoiceIssued: ordersTable.invoiceIssued,
      invoiceUrl: ordersTable.invoiceUrl,
      attachmentUrl: ordersTable.attachmentUrl,
      referenceFiles: ordersTable.referenceFiles,
      paymentProofUrl: ordersTable.paymentProofUrl,
      deliveryFiles: ordersTable.deliveryFiles,
      deliveryLinks: ordersTable.deliveryLinks,
      createdAt: ordersTable.createdAt,
    }).from(ordersTable).where(eq(ordersTable.trackingCode, code));
    if (!order) return res.status(404).json({ error: "Order not found" });
    res.json(order);
  } catch (err) {
    req.log.error({ err }, "Failed to track order");
    res.status(500).json({ error: "Failed to track order" });
  }
});

/* ── SSE: customer watches one order ── */
router.get("/events/order/:code", (req, res) => {
  const code = req.params.code.toUpperCase();
  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");
  res.setHeader("X-Accel-Buffering", "no");
  res.flushHeaders();
  res.write(`: connected to order ${code}\n\n`);

  const keepAlive = setInterval(() => {
    try { res.write(":ping\n\n"); } catch { clearInterval(keepAlive); }
  }, 25000);

  addOrderClient(code, res);

  req.on("close", () => {
    clearInterval(keepAlive);
    removeOrderClient(code, res);
  });
});

/* ── SSE: admin watches all orders ── */
router.get("/events/admin", (req, res) => {
  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");
  res.setHeader("X-Accel-Buffering", "no");
  res.flushHeaders();
  res.write(`: admin connected\n\n`);

  const keepAlive = setInterval(() => {
    try { res.write(":ping\n\n"); } catch { clearInterval(keepAlive); }
  }, 25000);

  addAdminClient(res);

  req.on("close", () => {
    clearInterval(keepAlive);
    removeAdminClient(res);
  });
});

router.get("/orders/:id", async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const [order] = await db.select().from(ordersTable).where(eq(ordersTable.id, id));
    if (!order) return res.status(404).json({ error: "Order not found" });
    res.json(order);
  } catch (err) {
    req.log.error({ err }, "Failed to fetch order");
    res.status(500).json({ error: "Failed to fetch order" });
  }
});

router.post("/orders", async (req, res) => {
  try {
    const {
      customerName, customerPhone, customerEmail, customerBusinessName, customerAddress,
      productId, productName, quantity, totalPrice, notes, orderType, projectTitle,
      budget, deadline, attachmentUrl, referenceUrls, referenceFiles,
    } = req.body;
    if (!customerName || !customerPhone || !productName || !quantity || totalPrice == null) {
      return res.status(400).json({ error: "Missing required fields" });
    }
    const [inserted] = await db.insert(ordersTable).values({
      trackingCode: "PENDING",
      orderType: orderType ?? "standard",
      customerName,
      customerPhone,
      customerEmail: customerEmail ?? null,
      customerBusinessName: customerBusinessName ?? null,
      customerAddress: customerAddress ?? null,
      productId: productId ?? null,
      productName,
      quantity,
      totalPrice,
      notes: notes ?? null,
      adminNotes: null,
      projectTitle: projectTitle ?? null,
      budget: budget ?? null,
      deadline: deadline ?? null,
      attachmentUrl: attachmentUrl ?? null,
      referenceUrls: referenceUrls ? JSON.stringify(referenceUrls) : null,
      referenceFiles: referenceFiles ? JSON.stringify(referenceFiles) : null,
      status: "pending",
      deliveryType: "physical",
    }).returning();

    const trackingCode = generateTrackingCode(inserted.id);
    const [order] = await db.update(ordersTable).set({ trackingCode }).where(eq(ordersTable.id, inserted.id)).returning();
    res.status(201).json(order);
  } catch (err) {
    req.log.error({ err }, "Failed to create order");
    res.status(400).json({ error: "Invalid order data" });
  }
});

router.put("/orders/:id", async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const {
      status, notes, adminNotes, totalPrice,
      courierName, courierTrackingUrl, courierTrackingNumber,
      customerName, customerPhone, customerEmail,
      customerBusinessName, customerAddress,
      productName, quantity, projectTitle,
      deliveryType, invoiceIssued, invoiceUrl,
      attachmentUrl, paymentProofUrl, referenceUrls, referenceFiles,
      deliveryFiles, deliveryLinks,
    } = req.body;
    const allowedStatuses = ["pending", "confirmed", "processing", "completed", "cancelled"];
    if (status && !allowedStatuses.includes(status)) {
      return res.status(400).json({ error: "Invalid status" });
    }
    const data: Record<string, unknown> = {};
    if (status !== undefined) data.status = status;
    if (notes !== undefined) data.notes = notes ?? null;
    if (adminNotes !== undefined) data.adminNotes = adminNotes;
    if (totalPrice !== undefined) data.totalPrice = totalPrice;
    if (customerName !== undefined && customerName) data.customerName = customerName;
    if (customerPhone !== undefined && customerPhone) data.customerPhone = customerPhone;
    if (customerEmail !== undefined) data.customerEmail = customerEmail ?? null;
    if (customerBusinessName !== undefined) data.customerBusinessName = customerBusinessName ?? null;
    if (customerAddress !== undefined) data.customerAddress = customerAddress ?? null;
    if (productName !== undefined && productName) data.productName = productName;
    if (quantity !== undefined && quantity > 0) data.quantity = quantity;
    if (projectTitle !== undefined) data.projectTitle = projectTitle ?? null;
    if (courierName !== undefined) data.courierName = courierName ?? null;
    if (courierTrackingUrl !== undefined) data.courierTrackingUrl = courierTrackingUrl ?? null;
    if (courierTrackingNumber !== undefined) data.courierTrackingNumber = courierTrackingNumber ?? null;
    if (deliveryType !== undefined) data.deliveryType = deliveryType ?? null;
    if (invoiceIssued !== undefined) data.invoiceIssued = invoiceIssued;
    if (invoiceUrl !== undefined) data.invoiceUrl = invoiceUrl ?? null;
    if (attachmentUrl !== undefined) data.attachmentUrl = attachmentUrl ?? null;
    if (paymentProofUrl !== undefined) data.paymentProofUrl = paymentProofUrl ?? null;
    if (referenceUrls !== undefined) data.referenceUrls = referenceUrls ? JSON.stringify(referenceUrls) : null;
    if (referenceFiles !== undefined) data.referenceFiles = referenceFiles ? JSON.stringify(referenceFiles) : null;
    if (deliveryFiles !== undefined) data.deliveryFiles = deliveryFiles ? JSON.stringify(deliveryFiles) : null;
    if (deliveryLinks !== undefined) data.deliveryLinks = deliveryLinks ? JSON.stringify(deliveryLinks) : null;
    const [order] = await db.update(ordersTable).set(data).where(eq(ordersTable.id, id)).returning();
    if (!order) return res.status(404).json({ error: "Order not found" });

    /* Broadcast real-time update to all connected clients */
    emitOrderUpdate(order.trackingCode, order.id);

    res.json(order);
  } catch (err) {
    req.log.error({ err }, "Failed to update order");
    res.status(400).json({ error: "Invalid order data" });
  }
});

export default router;
