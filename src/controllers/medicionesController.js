const { sql } = require("../../config/db");

// GET /api/cultivos/:id/mediciones
const listar = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { limit = 50, offset = 0, desde, hasta } = req.query;

    let mediciones;
    if (desde && hasta) {
      mediciones = await sql`
        SELECT * FROM mediciones
        WHERE cultivo_id = ${id} AND fecha BETWEEN ${desde} AND ${hasta}
        ORDER BY fecha DESC LIMIT ${limit} OFFSET ${offset}
      `;
    } else {
      mediciones = await sql`
        SELECT * FROM mediciones
        WHERE cultivo_id = ${id}
        ORDER BY fecha DESC LIMIT ${limit} OFFSET ${offset}
      `;
    }
    res.json({ ok: true, total: mediciones.length, data: mediciones });
  } catch (err) { next(err); }
};

// GET /api/cultivos/:id/mediciones/ultima
const ultima = async (req, res, next) => {
  try {
    const { id } = req.params;
    const [med] = await sql`
      SELECT * FROM mediciones WHERE cultivo_id = ${id} ORDER BY fecha DESC LIMIT 1
    `;
    if (!med) return res.status(404).json({ ok: false, mensaje: "Sin mediciones aún" });
    res.json({ ok: true, data: med });
  } catch (err) { next(err); }
};

// GET /api/cultivos/:id/mediciones/estadisticas
const estadisticas = async (req, res, next) => {
  try {
    const { id } = req.params;
    const [stats] = await sql`
      SELECT
        COUNT(*)::int                        AS total_registros,
        ROUND(AVG(humedad_suelo)::numeric, 2)  AS humedad_promedio,
        ROUND(AVG(temperatura)::numeric, 2)    AS temperatura_promedio,
        ROUND(SUM(lluvia_mm)::numeric, 2)      AS lluvia_total_mm,
        ROUND(AVG(ph_suelo)::numeric, 2)       AS ph_promedio,
        ROUND(AVG(fertilizante_kg)::numeric,2) AS fertilizante_promedio,
        MIN(fecha)                             AS primera_medicion,
        MAX(fecha)                             AS ultima_medicion
      FROM mediciones WHERE cultivo_id = ${id}
    `;
    res.json({ ok: true, data: stats });
  } catch (err) { next(err); }
};

// POST /api/cultivos/:id/mediciones
const crear = async (req, res, next) => {
  try {
    const { id } = req.params;
    const {
      humedad_suelo, temperatura, lluvia_mm,
      ph_suelo, fertilizante_kg, radiacion_solar,
      dias_siembra, fuente = "manual"
    } = req.body;

    const [nueva] = await sql`
      INSERT INTO mediciones (
        cultivo_id, humedad_suelo, temperatura, lluvia_mm,
        ph_suelo, fertilizante_kg, radiacion_solar, dias_siembra, fuente
      ) VALUES (
        ${id}, ${humedad_suelo}, ${temperatura}, ${lluvia_mm},
        ${ph_suelo}, ${fertilizante_kg}, ${radiacion_solar}, ${dias_siembra}, ${fuente}
      ) RETURNING *
    `;
    res.status(201).json({ ok: true, mensaje: "Medición registrada", data: nueva });
  } catch (err) { next(err); }
};

// POST /api/cultivos/:id/mediciones/lote
const crearLote = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { mediciones } = req.body;
    if (!Array.isArray(mediciones) || mediciones.length === 0) {
      return res.status(400).json({ ok: false, mensaje: "Envía un array 'mediciones'" });
    }
    const insertadas = [];
    for (const m of mediciones) {
      const [row] = await sql`
        INSERT INTO mediciones (
          cultivo_id, humedad_suelo, temperatura, lluvia_mm,
          ph_suelo, fertilizante_kg, radiacion_solar, dias_siembra, fuente
        ) VALUES (
          ${id}, ${m.humedad_suelo}, ${m.temperatura}, ${m.lluvia_mm},
          ${m.ph_suelo}, ${m.fertilizante_kg}, ${m.radiacion_solar}, ${m.dias_siembra},
          ${m.fuente || "lote"}
        ) RETURNING id, fecha
      `;
      insertadas.push(row);
    }
    res.status(201).json({ ok: true, insertadas: insertadas.length, data: insertadas });
  } catch (err) { next(err); }
};

module.exports = { listar, ultima, estadisticas, crear, crearLote };
