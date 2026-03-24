import type { Response } from "express";

const orderClients = new Map<string, Set<Response>>();
const adminClients = new Set<Response>();

export function addOrderClient(trackingCode: string, res: Response) {
  if (!orderClients.has(trackingCode)) orderClients.set(trackingCode, new Set());
  orderClients.get(trackingCode)!.add(res);
}

export function removeOrderClient(trackingCode: string, res: Response) {
  orderClients.get(trackingCode)?.delete(res);
  if (orderClients.get(trackingCode)?.size === 0) orderClients.delete(trackingCode);
}

export function addAdminClient(res: Response) {
  adminClients.add(res);
}

export function removeAdminClient(res: Response) {
  adminClients.delete(res);
}

export function emitOrderUpdate(trackingCode: string, orderId: number) {
  const payload = JSON.stringify({ type: "order-updated", orderId, trackingCode });
  const msg = `event: order-updated\ndata: ${payload}\n\n`;

  orderClients.get(trackingCode)?.forEach(res => {
    try { res.write(msg); } catch { removeOrderClient(trackingCode, res); }
  });

  adminClients.forEach(res => {
    try { res.write(msg); } catch { removeAdminClient(res); }
  });
}
