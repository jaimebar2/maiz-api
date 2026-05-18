require("dotenv").config();
const express = require("express");
const cors = require("cors");
const { testConnection } = require("../config/db");
const { notFound, errorHandler } = require("./middleware/validators");

const cultivosRoutes = require("./routes/cultivos");
const iaRoutes = require("./routes/ia");

const app = express();
const PORT = process.env.PORT || 3000;

// ── Middlewares ──────────────────────────────────────────────────────────────
app.use(cors());
app.use(express.json());

// ── Salud ────────────────────────────────────────────────────────────────────
app.get("/", (req, res) => {
  res.json({
    ok: true,
    sistema: "🌽 API - Sistema IA Cultivo de Maíz",
    version: "1.0.0",
    endpoints: {
      cultivos:   "/api/cultivos",
      mediciones: "/api/cultivos/:id/mediciones",
      ia:         "/api/ia",
      alertas:    "/api/cultivos/:id/alertas",
    },
  });
});

// ── Rutas ────────────────────────────────────────────────────────────────────
app.use("/api/cultivos", cultivosRoutes);
app.use("/api/ia",       iaRoutes);

// ── Errores ──────────────────────────────────────────────────────────────────
app.use(notFound);
app.use(errorHandler);

// ── Inicio ───────────────────────────────────────────────────────────────────
const start = async () => {
  await testConnection();
  app.listen(PORT, () => {
    console.log(`\n🌽 API corriendo en http://localhost:${PORT}`);
    console.log("─────────────────────────────────────");
    console.log("  GET  /api/cultivos");
    console.log("  POST /api/cultivos");
    console.log("  POST /api/cultivos/:id/mediciones");
    console.log("  POST /api/ia/analisis-completo");
    console.log("  POST /api/ia/predecir-cosecha");
    console.log("  POST /api/ia/necesidad-agua");
    console.log("  POST /api/ia/alertas");
    console.log("  GET  /api/ia/fechas-siembra");
    console.log("─────────────────────────────────────\n");
  });
};

start();
