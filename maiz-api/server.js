const express = require('express')
const cors = require('cors')
const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')

const { Pool } = require('pg')

const app = express()

app.use(cors())
app.use(express.json())

// POSTGRESQL
const db = new Pool({
  connectionString:
    'postgresql://neondb_owner:npg_TlOVauBX1IF0@ep-lingering-star-aqulp2zw-pooler.c-8.us-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require',
  ssl: {
    rejectUnauthorized: false,
  },
})

// TEST
db.connect()
  .then(() => {
    console.log(
      '✅ PostgreSQL conectado'
    )
  })
  .catch((err) => {
    console.log(err)
  })

// REGISTER
app.post(
  '/api/auth/register',
  async (req, res) => {
    try {
      const {
        nombre,
        correo,
        password,
      } = req.body

      const hash =
        await bcrypt.hash(password, 10)

      const result = await db.query(
        `
        INSERT INTO usuarios
        (nombre, correo, password)
        VALUES ($1,$2,$3)
        RETURNING id, nombre, correo
      `,
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
      })
    }
  }
)

// LOGIN
app.post(
  '/api/auth/login',
  async (req, res) => {
    try {
      const { correo, password } =
        req.body

      const result = await db.query(
        `
        SELECT *
        FROM usuarios
        WHERE correo = $1
      `,
        [correo]
      )

      if (result.rows.length === 0) {
        return res.status(401).json({
          ok: false,
          msg: 'Usuario no existe',
        })
      }

      const usuario = result.rows[0]

      const validPassword =
        await bcrypt.compare(
          password,
          usuario.password
        )

      if (!validPassword) {
        return res.status(401).json({
          ok: false,
          msg: 'Password incorrecto',
        })
      }

      const token = jwt.sign(
        {
          id: usuario.id,
        },
        'maiz_secret_2026'
      )

      res.json({
        ok: true,
        token,
        usuario: {
          id: usuario.id,
          nombre: usuario.nombre,
          correo: usuario.correo,
        },
      })
    } catch (error) {
      console.log(error)

      res.status(500).json({
        ok: false,
      })
    }
  }
)

// LISTAR USUARIOS
app.get(
  '/api/usuarios',
  async (req, res) => {
    try {
      const result = await db.query(
        `
        SELECT
        id,
        nombre,
        correo
        FROM usuarios
        ORDER BY id DESC
      `
      )

      res.json(result.rows)
    } catch (error) {
      console.log(error)

      res.status(500).json({
        ok: false,
      })
    }
  }
)

// ELIMINAR USUARIO
app.delete(
  '/api/usuarios/:id',
  async (req, res) => {
    try {
      await db.query(
        `
        DELETE FROM usuarios
        WHERE id = $1
      `,
        [req.params.id]
      )

      res.json({
        ok: true,
      })
    } catch (error) {
      console.log(error)

      res.status(500).json({
        ok: false,
      })
    }
  }
)

app.listen(3000, () => {
  console.log(
    '🚀 Servidor funcionando en puerto 3000'
  )
})