const express = require('express')
const cors = require('cors')
const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')

require('dotenv').config()

const db = require('./db')

const app = express()

// ======================================
// CONFIGURACIÓN
// ======================================

app.use(cors())
app.use(express.json())

// ======================================
// RUTA PRINCIPAL
// ======================================

app.get('/', (req, res) => {
  res.send('API Maíz funcionando')
})

// ======================================
// CULTIVOS
// ======================================

app.get('/api/cultivos', (req, res) => {
  res.json([
    {
      parcela: 'A1',
      humedad_suelo: 65,
      temperatura: 28,
      produccion_kg: 240,
    },
  ])
})

// ======================================
// REGISTRO USUARIO
// ======================================

app.post('/api/auth/register', async (req, res) => {
  try {
    const { nombre, correo, password } = req.body

    const hash = await bcrypt.hash(password, 10)

    const result = await db.query(
      `INSERT INTO usuarios(nombre, correo, password)
       VALUES($1,$2,$3)
       RETURNING id,nombre,correo,rol`,
      [nombre, correo, hash]
    )

    res.json({
      ok: true,
      usuario: result.rows[0],
    })
  } catch (error) {
    console.log(error)

    res.status(500).json({
      ok: false,
      mensaje: 'Error registrando usuario',
    })
  }
})

// ======================================
// LOGIN
// ======================================

app.post('/api/auth/login', async (req, res) => {
  try {
    const { correo, password } = req.body

    const result = await db.query(
      'SELECT * FROM usuarios WHERE correo = $1',
      [correo]
    )

    if (result.rows.length === 0) {
      return res.status(400).json({
        ok: false,
        mensaje: 'Usuario no encontrado',
      })
    }

    const usuario = result.rows[0]

    const validPassword = await bcrypt.compare(
      password,
      usuario.password
    )

    if (!validPassword) {
      return res.status(400).json({
        ok: false,
        mensaje: 'Contraseña incorrecta',
      })
    }

    const token = jwt.sign(
      {
        id: usuario.id,
        rol: usuario.rol,
      },
      process.env.JWT_SECRET,
      {
        expiresIn: '7d',
      }
    )

    res.json({
      ok: true,
      token,
      usuario: {
        id: usuario.id,
        nombre: usuario.nombre,
        correo: usuario.correo,
        rol: usuario.rol,
      },
    })
  } catch (error) {
    console.log(error)

    res.status(500).json({
      ok: false,
      mensaje: 'Error iniciando sesión',
    })
  }
})

// ======================================
// LISTAR USUARIOS
// ======================================

app.get('/api/usuarios', async (req, res) => {
  try {
    const result = await db.query(
      'SELECT id,nombre,correo,rol,activo FROM usuarios'
    )

    res.json({
      ok: true,
      usuarios: result.rows,
    })
  } catch (error) {
    console.log(error)

    res.status(500).json({
      ok: false,
      mensaje: 'Error obteniendo usuarios',
    })
  }
})

// ======================================
// CAMBIAR CONTRASEÑA
// ======================================

app.put('/api/usuarios/:id/password', async (req, res) => {
  try {
    const { id } = req.params
    const { password } = req.body

    const hash = await bcrypt.hash(password, 10)

    await db.query(
      'UPDATE usuarios SET password = $1 WHERE id = $2',
      [hash, id]
    )

    res.json({
      ok: true,
      mensaje: 'Contraseña actualizada',
    })
  } catch (error) {
    console.log(error)

    res.status(500).json({
      ok: false,
      mensaje: 'Error actualizando contraseña',
    })
  }
})

// ======================================
// INICIAR SERVIDOR
// ======================================

const PORT = process.env.PORT || 3000

app.listen(PORT, () => {
  console.log(`Servidor funcionando en puerto ${PORT}`)
})