import { Router, type IRouter } from "express";
import { db } from "@workspace/db";
import { siteSettingsTable } from "@workspace/db/schema";

const router: IRouter = Router();

// Coerce null to empty string for non-nullable text fields
function coerceSettings(body: Record<string, unknown>): Record<string, unknown> {
  const nonNullableTextKeys = [
    "businessName", "ownerName", "tagline", "phone", "email", "address",
    "heroTitle", "heroSubtitle", "aboutText", "invoiceCurrency",
  ];
  const out: Record<string, unknown> = { ...body };
  for (const key of nonNullableTextKeys) {
    if (out[key] == null) out[key] = "";
  }
  return out;
}

router.get("/settings", async (req, res) => {
  try {
    const rows = await db.select().from(siteSettingsTable).limit(1);
    if (rows.length === 0) {
      const [defaults] = await db.insert(siteSettingsTable).values({
        businessName: "PrintBloom",
        tagline: "Professional Printing Services",
        phone: "+94 77 123 4567",
        email: "info@printbloom.online",
        address: "123 Print Street, Colombo, Sri Lanka",
        whatsapp: "+94771234567",
        heroTitle: "Your Vision, Perfectly Printed",
        heroSubtitle: "Professional printing services for businesses and individuals across Sri Lanka",
        aboutText: "PrintBloom is your trusted printing partner, delivering high-quality prints for all your business and personal needs.",
      }).returning();
      return res.json(defaults);
    }
    res.json(rows[0]);
  } catch (err) {
    req.log.error({ err }, "Failed to fetch settings");
    res.status(500).json({ error: "Failed to fetch settings" });
  }
});

router.put("/settings", async (req, res) => {
  try {
    const raw = coerceSettings(req.body);
    // Pick only known columns to avoid unknown field errors
    const allowed: Record<string, unknown> = {};
    const knownFields = [
      "businessName", "ownerName", "tagline", "logoUrl",
      "businessLogoUrl", "bankLogoUrl", "heroBgImageUrl",
      "phone", "email", "address",
      "whatsapp", "whatsappDefaultMsg",
      "facebook", "instagram", "tiktok",
      "heroTitle", "heroSubtitle", "aboutText",
      "bankName", "bankAccountHolder", "bankAccountNumber", "bankBranch", "bankSwiftCode",
      "invoiceCurrency", "invoiceTerms",
      "shippingFirstKgRate", "shippingExtraKgRate",
    ];
    for (const key of knownFields) {
      if (raw[key] !== undefined) allowed[key] = raw[key] ?? null;
    }
    const rows = await db.select().from(siteSettingsTable).limit(1);
    if (rows.length === 0) {
      const [settings] = await db.insert(siteSettingsTable).values(allowed as any).returning();
      return res.json(settings);
    }
    const [settings] = await db.update(siteSettingsTable).set({ ...allowed, updatedAt: new Date() } as any).returning();
    res.json(settings);
  } catch (err) {
    req.log.error({ err }, "Failed to update settings");
    res.status(400).json({ error: "Invalid settings data" });
  }
});

export default router;
