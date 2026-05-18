# 🌽 API — Sistema IA Cultivo de Maíz

API REST en **Node.js + Express** conectada a **Neon (PostgreSQL)**.

---

## Estructura del proyecto

```
maiz-api/
├── config/
│   └── db.js                  # Conexión a Neon
├── src/
│   ├── index.js               # Servidor principal
│   ├── routes/
│   │   ├── cultivos.js
│   │   └── ia.js
│   ├── controllers/
│   │   ├── cultivosController.js
│   │   ├── medicionesController.js
│   │   └── iaController.js
│   ├── models/
│   │   └── migrate.js         # Crea las tablas
│   └── middleware/
│       └── validators.js
├── .env.example
└── package.json
```

---

## Instalación

```bash
npm install
cp .env.example .env
# Edita .env y coloca tu DATABASE_URL de Neon
```

## Crear las tablas en Neon

```bash
npm run migrate
```

## Iniciar el servidor

```bash
npm run dev      # Desarrollo (nodemon)
npm start        # Producción
```

---

## Endpoints

### Cultivos

| Método | Ruta | Descripción |
|--------|------|-------------|
| GET | `/api/cultivos` | Listar todos |
| GET | `/api/cultivos/:id` | Obtener uno |
| POST | `/api/cultivos` | Crear cultivo |
| PUT | `/api/cultivos/:id` | Actualizar |
| DELETE | `/api/cultivos/:id` | Desactivar |

### Mediciones

| Método | Ruta | Descripción |
|--------|------|-------------|
| GET | `/api/cultivos/:id/mediciones` | Listar mediciones |
| GET | `/api/cultivos/:id/mediciones/ultima` | Última medición |
| GET | `/api/cultivos/:id/mediciones/estadisticas` | Estadísticas |
| POST | `/api/cultivos/:id/mediciones` | Registrar medición |
| POST | `/api/cultivos/:id/mediciones/lote` | Registrar en lote (Arduino/ESP32) |

### IA

| Método | Ruta | Descripción |
|--------|------|-------------|
| POST | `/api/ia/predecir-cosecha` | Predicción de kg/ha |
| POST | `/api/ia/necesidad-agua` | Detectar si necesita riego |
| POST | `/api/ia/alertas` | Generar alertas por condiciones |
| GET | `/api/ia/fechas-siembra` | Ranking de meses para sembrar |
| POST | `/api/ia/analisis-completo` | Los 4 módulos de IA juntos |
| GET | `/api/ia/historial/:cultivo_id` | Historial de predicciones |
| PATCH | `/api/ia/alertas/:id/resolver` | Marcar alerta como resuelta |
| GET | `/api/cultivos/:id/alertas` | Alertas activas del cultivo |

---

## Ejemplos de uso

### Crear un cultivo
```http
POST /api/cultivos
Content-Type: application/json

{
  "nombre": "Lote Norte",
  "variedad": "Maíz amarillo",
  "hectareas": 5.5,
  "ubicacion": "Montería, Córdoba"
}
```

### Registrar medición
```http
POST /api/cultivos/1/mediciones
Content-Type: application/json

{
  "humedad_suelo": 62,
  "temperatura": 27,
  "lluvia_mm": 8,
  "ph_suelo": 6.5,
  "fertilizante_kg": 22,
  "radiacion_solar": 20,
  "dias_siembra": 90,
  "fuente": "sensor_esp32"
}
```

### Análisis completo con IA
```http
POST /api/ia/analisis-completo
Content-Type: application/json

{
  "cultivo_id": 1,
  "humedad_suelo": 38,
  "temperatura": 33,
  "lluvia_mm": 1,
  "ph_suelo": 6.2,
  "fertilizante_kg": 18,
  "radiacion_solar": 21,
  "dias_siembra": 75
}
```

### Respuesta de análisis completo
```json
{
  "ok": true,
  "tipo": "analisis_completo",
  "data": {
    "cosecha": {
      "prediccion_kg": 134,
      "nivel": "bueno",
      "recomendacion": "Buena producción. Monitorear humedad y fertilización."
    },
    "agua": {
      "necesita_agua": true,
      "probabilidad": 78,
      "urgencia": "alta",
      "recomendacion": "Regar en las próximas 24 horas."
    },
    "alertas": [
      {
        "variable": "humedad_suelo",
        "valor": 38,
        "nivel": "advertencia",
        "mensaje": "humedad_suelo (38) por debajo del mínimo (40)"
      }
    ],
    "siembra": {
      "mejor_mes": { "mes": 10, "nombre_mes": "Oct", "score": 88, "recomendacion": "óptimo" }
    }
  }
}
```

### Lote de mediciones desde Arduino/ESP32
```http
POST /api/cultivos/1/mediciones/lote
Content-Type: application/json

{
  "mediciones": [
    { "humedad_suelo": 60, "temperatura": 26, "lluvia_mm": 5, "ph_suelo": 6.4, "fertilizante_kg": 20, "radiacion_solar": 19, "dias_siembra": 45 },
    { "humedad_suelo": 58, "temperatura": 27, "lluvia_mm": 4, "ph_suelo": 6.5, "fertilizante_kg": 20, "radiacion_solar": 20, "dias_siembra": 46 }
  ]
}
```

---

## Tablas en Neon

```
cultivos         → datos del lote/cultivo
mediciones       → lecturas de sensores
cosechas         → producción real registrada
predicciones_ia  → historial de predicciones
alertas          → alertas generadas y su estado
```
