const express = require('express');
const mongoose = require('mongoose');
const dbconnect = require('./config');
const ModelUser = require('./userModel');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const cors = require('cors');
const app = express();
const router = express.Router();

// Configuración del middleware CORS
app.use(cors({
  origin: 'https://proyecto-noticiero.vercel.app', // Dominio permitido
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json());

// Rutas y demás middlewares
app.post('/register', async (req, res) => {
    const { username, password } = req.body;
  
    try {
      // Verificar si el usuario ya existe
      const existingUser = await ModelUser.findOne({ username });
      if (existingUser) {
        return res.status(400).json({ msg: 'User already exists' });
      }
  
      // Verificar si es el primer usuario
      const existingUsers = await ModelUser.find();
      const role = existingUsers.length === 0 ? 'admin' : 'user';
  
      // Encriptar la contraseña
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(password, salt);
  
      // Crear un nuevo usuario
      const newUser = new ModelUser({
        username,
        password: hashedPassword,
        role 
      });
      await newUser.save();
  
      res.status(201).json({ msg: 'User registered successfully', role });
    } catch (err) {
      console.error('Error en el registro:', err); // Agregar más detalles en los logs
      res.status(500).json({ msg: 'Server error', error: err.message });
    }
  });

app.post('/login', async (req, res) => {
  const { username, password } = req.body;
  try {
    const user = await ModelUser.findOne({ username });
    if (!user) return res.status(400).json({ msg: 'User does not exist' });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).json({ msg: 'Invalid credentials' });

    const payload = { user: { id: user._id, role: user.role } };
    const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '1h' });

    res.json({ token, role: user.role });
  } catch (err) {
    res.status(500).json({ msg: 'Server error' });
  }
});

// Middleware de autenticación
const authMiddleware = (req, res, next) => {
  const token = req.header('x-auth-token');
  if (!token) return res.status(401).json({ msg: 'No token, authorization denied' });

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    res.status(400).json({ msg: 'Token is not valid' });
  }
};

app.get('/protected', authMiddleware, (req, res) => {
  res.json({ msg: 'This is a protected route' });
});

// Uso de rutas
app.use('/api/users', router);

app.listen(3001, () => {
  console.log('El servidor está en el puerto 3001');
});

dbconnect();
