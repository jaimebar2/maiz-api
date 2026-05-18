/**
 * migrate.js — Crea todas las tablas en Neon
 * Ejecutar: node src/models/migrate.js
 */

const { sql, testConnection } = require("../../config/db");

const migrate = async () => {
  await testConnection();
  console.log("📦 Ejecutando migraciones...\n");

  // ── Tabla: cultivos ──────────────────────────────────────────
  await sql`
    CREATE TABLE IF NOT EXISTS cultivos (
      id          SERIAL PRIMARY KEY,
      nombre      VARCHAR(100) NOT NULL,
      variedad    VARCHAR(100),
      hectareas   NUMERIC(8,2) NOT NULL,
      ubicacion   VARCHAR(200),
      activo      BOOLEAN DEFAULT TRUE,
      created_at  TIMESTAMP DEFAULT NOW(),
      updated_at  TIMESTAMP DEFAULT NOW()
    )
  `;
  console.log("✅ Tabla 'cultivos' lista");

  // ── Tabla: mediciones ────────────────────────────────────────
  await sql`
    CREATE TABLE IF NOT EXISTS mediciones (
      id                SERIAL PRIMARY KEY,
      cultivo_id        INTEGER NOT NULL REFERENCES cultivos(id) ON DELETE CASCADE,
      fecha             TIMESTAMP DEFAULT NOW(),
      humedad_suelo     NUMERIC(5,2),
      temperatura       NUMERIC(5,2),
      lluvia_mm         NUMERIC(6,2),
      ph_suelo          NUMERIC(4,2),
      fertilizante_kg   NUMERIC(8,2),
      radiacion_solar   NUMERIC(6,2),
      dias_siembra      INTEGER,
      fuente            VARCHAR(50) DEFAULT 'manual',
      created_at        TIMESTAMP DEFAULT NOW()
    )
  `;
  console.log("✅ Tabla 'mediciones' lista");

  // ── Tabla: cosechas ──────────────────────────────────────────
  await sql`
    CREATE TABLE IF NOT EXISTS cosechas (
      id                SERIAL PRIMARY KEY,
      cultivo_id        INTEGER NOT NULL REFERENCES cultivos(id) ON DELETE CASCADE,
      fecha_cosecha     DATE NOT NULL,
      produccion_kg     NUMERIC(10,2) NOT NULL,
      prediccion_kg     NUMERIC(10,2),
      calidad           VARCHAR(50),
      observaciones     TEXT,
      created_at        TIMESTAMP DEFAULT NOW()
    )
  `;
  console.log("✅ Tabla 'cosechas' lista");

  // ── Tabla: predicciones_ia ───────────────────────────────────
  await sql`
    CREATE TABLE IF NOT EXISTS predicciones_ia (
      id                SERIAL PRIMARY KEY,
      cultivo_id        INTEGER NOT NULL REFERENCES cultivos(id) ON DELETE CASCADE,
      tipo              VARCHAR(50) NOT NULL,
      resultado         JSONB NOT NULL,
      confianza         NUMERIC(5,2),
      datos_entrada     JSONB,
      created_at        TIMESTAMP DEFAULT NOW()
    )
  `;
  console.log("✅ Tabla 'predicciones_ia' lista");

  // ── Tabla: alertas ───────────────────────────────────────────
  await sql`
    CREATE TABLE IF NOT EXISTS alertas (
      id          SERIAL PRIMARY KEY,
      cultivo_id  INTEGER NOT NULL REFERENCES cultivos(id) ON DELETE CASCADE,
      tipo        VARCHAR(50) NOT NULL,
      nivel       VARCHAR(20) NOT NULL,
      variable    VARCHAR(100),
      valor       NUMERIC(10,2),
      mensaje     TEXT NOT NULL,
      resuelta    BOOLEAN DEFAULT FALSE,
      created_at  TIMESTAMP DEFAULT NOW()
    )
  `;
  console.log("✅ Tabla 'alertas' lista");

  // ── Índices ──────────────────────────────────────────────────
  await sql`CREATE INDEX IF NOT EXISTS idx_mediciones_cultivo ON mediciones(cultivo_id)`;
  await sql`CREATE INDEX IF NOT EXISTS idx_mediciones_fecha ON mediciones(fecha DESC)`;
  await sql`CREATE INDEX IF NOT EXISTS idx_alertas_cultivo ON alertas(cultivo_id)`;
  await sql`CREATE INDEX IF NOT EXISTS idx_predicciones_cultivo ON predicciones_ia(cultivo_id)`;
  console.log("✅ Índices creados");

  console.log("\n🌽 Migración completada exitosamente.");
  process.exit(0);
};

migrate().catch((err) => {
  console.error("❌ Error en migración:", err);
  process.exit(1);
});
