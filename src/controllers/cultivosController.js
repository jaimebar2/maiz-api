const { sql } = require("../../config/db");

// GET /api/cultivos
const listar = async (req, res, next) => {
  try {
    const cultivos = await sql`
      SELECT c.*,
        COUNT(m.id)::int AS total_mediciones,
        MAX(m.fecha)     AS ultima_medicion
      FROM cultivos c
      LEFT JOIN mediciones m ON m.cultivo_id = c.id
      WHERE c.activo = TRUE
      GROUP BY c.id
      ORDER BY c.created_at DESC
    `;
    res.json({ ok: true, total: cultivos.length, data: cultivos });
  } catch (err) { next(err); }
};

// GET /api/cultivos/:id
const obtener = async (req, res, next) => {
  try {
    const { id } = req.params;
    const [cultivo] = await sql`SELECT * FROM cultivos WHERE id = ${id}`;
    if (!cultivo) return res.status(404).json({ ok: false, mensaje: "Cultivo no encontrado" });
    res.json({ ok: true, data: cultivo });
  } catch (err) { next(err); }
};

// POST /api/cultivos
const crear = async (req, res, next) => {
  try {
    const { nombre, variedad, hectareas, ubicacion } = req.body;
    const [nuevo] = await sql`
      INSERT INTO cultivos (nombre, variedad, hectareas, ubicacion)
      VALUES (${nombre}, ${variedad}, ${hectareas}, ${ubicacion})
      RETURNING *
    `;
    res.status(201).json({ ok: true, mensaje: "Cultivo creado", data: nuevo });
  } catch (err) { next(err); }
};

// PUT /api/cultivos/:id
const actualizar = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { nombre, variedad, hectareas, ubicacion } = req.body;
    const [updated] = await sql`
      UPDATE cultivos
      SET nombre = COALESCE(${nombre}, nombre),
          variedad = COALESCE(${variedad}, variedad),
          hectareas = COALESCE(${hectareas}, hectareas),
          ubicacion = COALESCE(${ubicacion}, ubicacion),
          updated_at = NOW()
      WHERE id = ${id}
      RETURNING *
    `;
    if (!updated) return res.status(404).json({ ok: false, mensaje: "Cultivo no encontrado" });
    res.json({ ok: true, mensaje: "Cultivo actualizado", data: updated });
  } catch (err) { next(err); }
};

// DELETE /api/cultivos/:id  (soft delete)
const eliminar = async (req, res, next) => {
  try {
    const { id } = req.params;
    await sql`UPDATE cultivos SET activo = FALSE WHERE id = ${id}`;
    res.json({ ok: true, mensaje: "Cultivo desactivado" });
  } catch (err) { next(err); }
};

module.exports = { listar, obtener, crear, actualizar, eliminar };
