import express from "express";

const app = express();
app.use(express.json());

// In-memory store for webhook payment status updates
const webhookPaidOrders = new Map<string, { status: string; completedAt: string }>();

// Proxy Endpoint: Create Transaction
app.post("/api/pakasir/transactioncreate/:method", async (req, res) => {
  try {
    const { method } = req.params;
    const { project, order_id, amount, api_key } = req.body;

    if (!project || !order_id || !amount || !api_key) {
      return res.status(400).json({ message: "Parameter project, order_id, amount, dan api_key wajib diisi." });
    }

    const pakasirRes = await fetch(`https://app.pakasir.com/api/transactioncreate/${method}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ project, order_id, amount: Number(amount), api_key }),
    });

    const contentType = pakasirRes.headers.get("content-type") || "";
    if (contentType.includes("application/json")) {
      const data = await pakasirRes.json();
      return res.status(pakasirRes.status).json(data);
    } else {
      const rawText = await pakasirRes.text();
      return res.status(pakasirRes.status).json({
        message: `Pakasir API merespon non-JSON (${pakasirRes.status})`,
        rawText
      });
    }
  } catch (err: any) {
    console.error("Pakasir transactioncreate proxy error:", err);
    return res.status(500).json({ message: `Proxy Error: ${err.message || "Gagal terhubung ke Pakasir"}` });
  }
});

// Proxy Endpoint: Check Transaction Detail
app.get("/api/pakasir/transactiondetail", async (req, res) => {
  try {
    const { project, amount, order_id, api_key } = req.query;

    if (!project || !amount || !order_id || !api_key) {
      return res.status(400).json({ message: "Parameter project, amount, order_id, dan api_key wajib diisi." });
    }

    const orderKey = String(order_id);
    if (webhookPaidOrders.has(orderKey)) {
      const whInfo = webhookPaidOrders.get(orderKey)!;
      if (whInfo.status === 'completed' || whInfo.status.toLowerCase() === 'completed') {
        return res.status(200).json({
          transaction: {
            order_id: orderKey,
            amount: Number(amount),
            project: String(project),
            status: "completed",
            completed_at: whInfo.completedAt,
          }
        });
      }
    }

    const queryStr = `project=${encodeURIComponent(String(project))}&amount=${encodeURIComponent(String(amount))}&order_id=${encodeURIComponent(String(order_id))}&api_key=${encodeURIComponent(String(api_key))}`;
    const pakasirRes = await fetch(`https://app.pakasir.com/api/transactiondetail?${queryStr}`, {
      method: "GET",
    });

    const contentType = pakasirRes.headers.get("content-type") || "";
    if (contentType.includes("application/json")) {
      const data = await pakasirRes.json();
      if (data && data.transaction && (data.transaction.status === "completed" || String(data.transaction.status).toLowerCase() === "completed")) {
        webhookPaidOrders.set(orderKey, { status: "completed", completedAt: data.transaction.completed_at || new Date().toISOString() });
      }
      return res.status(pakasirRes.status).json(data);
    } else {
      const rawText = await pakasirRes.text();
      return res.status(pakasirRes.status).json({
        message: `Pakasir API merespon non-JSON (${pakasirRes.status})`,
        rawText
      });
    }
  } catch (err: any) {
    console.error("Pakasir transactiondetail proxy error:", err);
    return res.status(500).json({ message: `Proxy Error: ${err.message || "Gagal terhubung ke Pakasir"}` });
  }
});

// Proxy Endpoint: Payment Simulation (Sandbox)
app.post("/api/pakasir/paymentsimulation", async (req, res) => {
  try {
    const { project, order_id, amount, api_key } = req.body;
    const orderKey = String(order_id);
    webhookPaidOrders.set(orderKey, { status: "completed", completedAt: new Date().toISOString() });

    const pakasirRes = await fetch(`https://app.pakasir.com/api/paymentsimulation`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ project, order_id, amount: Number(amount), api_key }),
    });

    const contentType = pakasirRes.headers.get("content-type") || "";
    if (contentType.includes("application/json")) {
      const data = await pakasirRes.json();
      return res.status(pakasirRes.status).json(data);
    } else {
      return res.status(200).json({ success: true, message: "Simulasi pembayaran diselesaikan." });
    }
  } catch (err: any) {
    console.error("Pakasir simulation proxy error:", err);
    return res.status(500).json({ message: `Proxy Error: ${err.message || "Gagal terhubung ke Pakasir"}` });
  }
});

// Proxy Endpoint: Transaction Cancel
app.post("/api/pakasir/transactioncancel", async (req, res) => {
  try {
    const { project, order_id, amount, api_key } = req.body;
    const pakasirRes = await fetch(`https://app.pakasir.com/api/transactioncancel`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ project, order_id, amount: Number(amount), api_key }),
    });
    const contentType = pakasirRes.headers.get("content-type") || "";
    if (contentType.includes("application/json")) {
      const data = await pakasirRes.json();
      return res.status(pakasirRes.status).json(data);
    } else {
      return res.status(200).json({ success: true, message: "Transaksi dibatalkan." });
    }
  } catch (err: any) {
    console.error("Pakasir cancel proxy error:", err);
    return res.status(500).json({ message: `Proxy Error: ${err.message || "Gagal terhubung ke Pakasir"}` });
  }
});

// Webhook Receiver Endpoint
app.post("/api/pakasir-webhook", (req, res) => {
  const { amount, order_id, status, completed_at } = req.body;
  console.log(`[PAKASIR WEBHOOK RECEIVED] Order: ${order_id}, Status: ${status}, Amount: ${amount}`);
  if (order_id && status) {
    webhookPaidOrders.set(String(order_id), {
      status: String(status),
      completedAt: completed_at || new Date().toISOString()
    });
  }
  return res.status(200).json({ status: "ok", received: true });
});

export default app;
