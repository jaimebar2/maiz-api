const { sql } = require("../../config/db");

// ── Lógica de IA (reglas + modelos simulados) ────────────────────────────────

const LIMITES = {
  temperatura:    { min: 15, max: 35 },
  humedad_suelo:  { min: 40, max: 85 },
  ph_suelo:       { min: 5.8, max: 7.2 },
  lluvia_mm:      { min: 0,  max: 50  },
  radiacion_solar:{ min: 10, max: 28  },
};

const SCORES_SIEMBRA = {
  1: 52, 2: 58, 3: 65, 4: 72, 5: 85, 6: 78,
  7: 70, 8: 68, 9: 82, 10: 88, 11: 74, 12: 60,
};
const MESES = ["","Ene","Feb","Mar","Abr","May","Jun","Jul","Ago","Sep","Oct","Nov","Dic"];

function predecirCosecha(d) {
  const base =
    (d.humedad_suelo * 0.8) +
    (d.fertilizante_kg * 1.2) -
    (Math.abs(d.temperatura - 26) * 3) +
    (d.lluvia_mm * 0.5) -
    (Math.abs(d.ph_suelo - 6.5) * 20) +
    ((d.radiacion_solar || 18) * 2);
  const factor = d.dias_siembra < 80 ? 0.7 : d.dias_siembra < 120 ? 1.0 : 0.85;
  const kg = Math.max(40, Math.min(300, Math.round(base * factor)));
  return {
    prediccion_kg: kg,
    nivel: kg > 200 ? "excelente" : kg > 130 ? "bueno" : kg > 80 ? "regular" : "bajo",
    recomendacion:
      kg > 200 ? "Condiciones óptimas. Mantener el manejo actual." :
      kg > 130 ? "Buena producción. Monitorear humedad y fertilización." :
      kg > 80  ? "Producción regular. Revisar fertilización y pH." :
                 "Producción baja. Revisar urgentemente todos los factores.",
  };
}

function detectarNecesidadAgua(d) {
  let prob = 0;
  if (d.humedad_suelo < 45) prob += ((45 - d.humedad_suelo) / 45) * 0.5;
  if (d.temperatura > 28)   prob += ((d.temperatura - 28) / 15) * 0.25;
  if (d.lluvia_mm < 3)      prob += ((3 - d.lluvia_mm) / 3) * 0.25;
  prob = Math.min(0.98, Math.max(0.02, prob));
  return {
    necesita_agua: prob > 0.6,
    probabilidad: Math.round(prob * 100),
    urgencia: prob > 0.8 ? "alta" : prob > 0.6 ? "media" : "baja",
    recomendacion:
      prob > 0.6
        ? "Regar en las próximas 24 horas."
        : prob > 0.35
        ? "Monitorear humedad en las próximas 48 horas."
        : "El cultivo no necesita agua en este momento.",
  };
}

function evaluarAlertas(d) {
  const alertas = [];
  for (const [variable, lim] of Object.entries(LIMITES)) {
    const valor = d[variable];
    if (valor == null) continue;
    if (valor < lim.min) {
      const nivel = valor < lim.min * 0.85 ? "critico" : "advertencia";
      alertas.push({ variable, valor, nivel, mensaje: `${variable} (${valor}) por debajo del mínimo (${lim.min})` });
    } else if (valor > lim.max) {
      const nivel = valor > lim.max * 1.15 ? "critico" : "advertencia";
      alertas.push({ variable, valor, nivel, mensaje: `${variable} (${valor}) por encima del máximo (${lim.max})` });
    }
  }
  return alertas;
}

function recomendarSiembra() {
  const ranking = Object.entries(SCORES_SIEMBRA)
    .map(([mes, score]) => ({
      mes: parseInt(mes),
      nombre_mes: MESES[mes],
      score,
      recomendacion: score >= 80 ? "óptimo" : score >= 65 ? "bueno" : score >= 50 ? "regular" : "no recomendado",
    }))
    .sort((a, b) => b.score - a.score);
  return { ranking, mejor_mes: ranking[0] };
}

// ── Endpoints ────────────────────────────────────────────────────────────────

// POST /api/ia/predecir-cosecha
const predecirCosechaHandler = async (req, res, next) => {
  try {
    const datos = req.body;
    const resultado = predecirCosecha(datos);

    if (datos.cultivo_id) {
      await sql`
        INSERT INTO predicciones_ia (cultivo_id, tipo, resultado, confianza, datos_entrada)
        VALUES (${datos.cultivo_id}, 'cosecha', ${JSON.stringify(resultado)}, 85, ${JSON.stringify(datos)})
      `;
    }
    res.json({ ok: true, tipo: "prediccion_cosecha", data: resultado });
  } catch (err) { next(err); }
};

// POST /api/ia/necesidad-agua
const necesidadAguaHandler = async (req, res, next) => {
  try {
    const datos = req.body;
    const resultado = detectarNecesidadAgua(datos);

    if (datos.cultivo_id) {
      await sql`
        INSERT INTO predicciones_ia (cultivo_id, tipo, resultado, confianza, datos_entrada)
        VALUES (${datos.cultivo_id}, 'agua', ${JSON.stringify(resultado)}, ${resultado.probabilidad}, ${JSON.stringify(datos)})
      `;
      if (resultado.necesita_agua) {
        await sql`
          INSERT INTO alertas (cultivo_id, tipo, nivel, variable, valor, mensaje)
          VALUES (${datos.cultivo_id}, 'agua', ${resultado.urgencia}, 'humedad_suelo',
                  ${datos.humedad_suelo}, ${resultado.recomendacion})
        `;
      }
    }
    res.json({ ok: true, tipo: "necesidad_agua", data: resultado });
  } catch (err) { next(err); }
};

// POST /api/ia/alertas
const alertasHandler = async (req, res, next) => {
  try {
    const datos = req.body;
    const alertasGeneradas = evaluarAlertas(datos);

    if (datos.cultivo_id && alertasGeneradas.length > 0) {
      for (const a of alertasGeneradas) {
        await sql`
          INSERT INTO alertas (cultivo_id, tipo, nivel, variable, valor, mensaje)
          VALUES (${datos.cultivo_id}, 'sensor', ${a.nivel}, ${a.variable}, ${a.valor}, ${a.mensaje})
        `;
      }
    }
    res.json({
      ok: true,
      tipo: "alertas_tiempo_real",
      total_alertas: alertasGeneradas.length,
      estado_general: alertasGeneradas.length === 0 ? "normal" :
        alertasGeneradas.some(a => a.nivel === "critico") ? "critico" : "advertencia",
      data: alertasGeneradas,
    });
  } catch (err) { next(err); }
};

// GET /api/ia/fechas-siembra
const fechasSiembraHandler = async (req, res, next) => {
  try {
    const resultado = recomendarSiembra();
    res.json({ ok: true, tipo: "fechas_siembra", data: resultado });
  } catch (err) { next(err); }
};

// POST /api/ia/analisis-completo
const analisisCompletoHandler = async (req, res, next) => {
  try {
    const datos = req.body;
    const [cosecha, agua, alertasR, siembra] = await Promise.all([
      Promise.resolve(predecirCosecha(datos)),
      Promise.resolve(detectarNecesidadAgua(datos)),
      Promise.resolve(evaluarAlertas(datos)),
      Promise.resolve(recomendarSiembra()),
    ]);

    if (datos.cultivo_id) {
      const resumen = { cosecha, agua, alertas: alertasR.length };
      await sql`
        INSERT INTO predicciones_ia (cultivo_id, tipo, resultado, datos_entrada)
        VALUES (${datos.cultivo_id}, 'analisis_completo', ${JSON.stringify(resumen)}, ${JSON.stringify(datos)})
      `;
    }

    res.json({
      ok: true,
      tipo: "analisis_completo",
      data: { cosecha, agua, alertas: alertasR, siembra },
    });
  } catch (err) { next(err); }
};

// GET /api/ia/historial/:cultivo_id
const historialHandler = async (req, res, next) => {
  try {
    const { cultivo_id } = req.params;
    const { limit = 20 } = req.query;
    const historial = await sql`
      SELECT * FROM predicciones_ia
      WHERE cultivo_id = ${cultivo_id}
      ORDER BY created_at DESC LIMIT ${limit}
    `;
    res.json({ ok: true, total: historial.length, data: historial });
  } catch (err) { next(err); }
};

// GET /api/cultivos/:id/alertas
const alertasActivasHandler = async (req, res, next) => {
  try {
    const { id } = req.params;
    const alertas = await sql`
      SELECT * FROM alertas
      WHERE cultivo_id = ${id} AND resuelta = FALSE
      ORDER BY created_at DESC
    `;
    res.json({ ok: true, total: alertas.length, data: alertas });
  } catch (err) { next(err); }
};

// PATCH /api/alertas/:id/resolver
const resolverAlertaHandler = async (req, res, next) => {
  try {
    const { id } = req.params;
    await sql`UPDATE alertas SET resuelta = TRUE WHERE id = ${id}`;
    res.json({ ok: true, mensaje: "Alerta marcada como resuelta" });
  } catch (err) { next(err); }
};

module.exports = {
  predecirCosechaHandler,
  necesidadAguaHandler,
  alertasHandler,
  fechasSiembraHandler,
  analisisCompletoHandler,
  historialHandler,
  alertasActivasHandler,
  resolverAlertaHandler,
};
