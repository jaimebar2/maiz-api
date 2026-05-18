const router = require("express").Router();
const { body } = require("express-validator");
const ctrl = require("../controllers/cultivosController");
const medCtrl = require("../controllers/medicionesController");
const iaCtrl = require("../controllers/iaController");
const { validate } = require("../middleware/validators");

const cultivoRules = [
  body("nombre").notEmpty().withMessage("El nombre es obligatorio"),
  body("hectareas").isFloat({ gt: 0 }).withMessage("Hectáreas debe ser un número positivo"),
];

router.get("/",           ctrl.listar);
router.get("/:id",        ctrl.obtener);
router.post("/",          cultivoRules, validate, ctrl.crear);
router.put("/:id",        ctrl.actualizar);
router.delete("/:id",     ctrl.eliminar);

// Mediciones anidadas bajo cultivo
router.get("/:id/mediciones",              medCtrl.listar);
router.get("/:id/mediciones/ultima",       medCtrl.ultima);
router.get("/:id/mediciones/estadisticas", medCtrl.estadisticas);
router.post("/:id/mediciones",             medCtrl.crear);
router.post("/:id/mediciones/lote",        medCtrl.crearLote);

// Alertas activas del cultivo
router.get("/:id/alertas", iaCtrl.alertasActivasHandler);

module.exports = router;
