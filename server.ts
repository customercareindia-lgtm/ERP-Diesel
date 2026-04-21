import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import fs from "fs";

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // API Routes
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok", service: "LubriERP-Backend" });
  });

  // Razorpay Simulation / Integration Placeholder
  app.post("/api/payments/create-order", (req, res) => {
    const { amount, currency, receipt } = req.body;
    // In a real production app, you'd use something like:
    // const razorpayOrder = await razorpay.orders.create({ amount, currency, receipt });
    res.json({ id: "order_" + Math.random().toString(36).substr(2, 9), amount, currency });
  });

  // SMS/WhatsApp Simulation
  app.post("/api/notifications/send", (req, res) => {
    const { to, message, type } = req.body;
    console.log(`[ERP-NOTIFY] Sending ${type} to ${to}: ${message}`);
    res.json({ success: true, messageId: "msg_" + Date.now() });
  });

  // Vite Middleware
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    if (fs.existsSync(distPath)) {
      app.use(express.static(distPath));
      app.get("*", (req, res) => {
        res.sendFile(path.join(distPath, "index.html"));
      });
    }
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`LubriERP Pro Server running on http://localhost:${PORT}`);
  });
}

startServer();
