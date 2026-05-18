const router = require("express").Router();
const ctrl = require("../controllers/iaController");

router.post("/predecir-cosecha",   ctrl.predecirCosechaHandler);
router.post("/necesidad-agua",     ctrl.necesidadAguaHandler);
router.post("/alertas",            ctrl.alertasHandler);
router.get("/fechas-siembra",      ctrl.fechasSiembraHandler);
router.post("/analisis-completo",  ctrl.analisisCompletoHandler);
router.get("/historial/:cultivo_id", ctrl.historialHandler);
router.patch("/alertas/:id/resolver", ctrl.resolverAlertaHandler);

module.exports = router;
