const { validationResult } = require("express-validator");

const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      ok: false,
      errors: errors.array().map((e) => ({ campo: e.path, mensaje: e.msg })),
    });
  }
  next();
};

const notFound = (req, res) => {
  res.status(404).json({ ok: false, mensaje: `Ruta ${req.path} no encontrada` });
};

const errorHandler = (err, req, res, next) => {
  console.error("💥", err.message);
  res.status(500).json({ ok: false, mensaje: "Error interno del servidor", detalle: err.message });
};

module.exports = { validate, notFound, errorHandler };
