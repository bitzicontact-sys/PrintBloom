import { Router, type IRouter } from "express";
import { db } from "@workspace/db";
import { productsTable, insertProductSchema } from "@workspace/db/schema";
import { eq, asc } from "drizzle-orm";

const router: IRouter = Router();

router.get("/products", async (req, res) => {
  try {
    const products = await db.select().from(productsTable).orderBy(asc(productsTable.sortOrder), asc(productsTable.createdAt));
    res.json(products);
  } catch (err) {
    req.log.error({ err }, "Failed to fetch products");
    res.status(500).json({ error: "Failed to fetch products" });
  }
});

router.post("/products", async (req, res) => {
  try {
    const data = insertProductSchema.parse(req.body);
    const [product] = await db.insert(productsTable).values(data).returning();
    res.status(201).json(product);
  } catch (err) {
    req.log.error({ err }, "Failed to create product");
    res.status(400).json({ error: "Invalid product data" });
  }
});

router.put("/products/:id", async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const data = insertProductSchema.parse(req.body);
    const [product] = await db.update(productsTable).set(data).where(eq(productsTable.id, id)).returning();
    if (!product) {
      return res.status(404).json({ error: "Product not found" });
    }
    res.json(product);
  } catch (err) {
    req.log.error({ err }, "Failed to update product");
    res.status(400).json({ error: "Invalid product data" });
  }
});

router.delete("/products/:id", async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    await db.delete(productsTable).where(eq(productsTable.id, id));
    res.status(204).end();
  } catch (err) {
    req.log.error({ err }, "Failed to delete product");
    res.status(500).json({ error: "Failed to delete product" });
  }
});

export default router;
