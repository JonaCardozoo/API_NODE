const express = require('express');
const mongoose = require('mongoose');
const dbconnect = require('./config');
const ModelUser = require('./models/userModel');
const NewsModel = require('./models/NewsModel');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const cors = require('cors');
const app = express();
const router = express.Router();

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));
app.use(express.json());

// Configuración de CORS
app.use(cors({
    origin: 'https://proyecto-noticiero.vercel.app',
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));

// Middleware de autenticación
const authMiddleware = (req, res, next) => {
    const token = req.header('x-auth-token');
    if (!token) return res.status(401).json({ msg: 'No token, authorization denied' });

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = decoded.user;  // Agregar datos del usuario al objeto req
        next();
    } catch (err) {
        res.status(400).json({ msg: 'Token is not valid' });
    }
};

// Middleware de autorización de administrador
const adminMiddleware = (req, res, next) => {
    if (req.user.role !== 'admin') {
        return res.status(403).json({ msg: 'Access denied. Admins only.' });
    }
    next();
};

// Rutas de usuarios
router.post("/", async (req, res) => {
    try {
        const body = req.body;
        const respuesta = await ModelUser.create(body);
        res.send(respuesta);
    } catch (error) {
        res.status(500).send(error.message);
    }
});

// Ruta protegida: Solo admins pueden acceder a esta ruta
router.get('/users', authMiddleware, adminMiddleware, async (req, res) => {
    try {
        console.log('Fetching users...');
        const users = await ModelUser.find({});
        console.log('Users fetched:', users);
        res.json(users);
    } catch (error) {
        res.status(500).json({ msg: 'Server error', error: error.message });
    }
});

// Ruta de login
app.post('/login', async (req, res) => {
    const { username, password } = req.body;

    try {
        const user = await ModelUser.findOne({ username });
        if (!user) {
            return res.status(400).json({ msg: 'User does not exist' });
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(400).json({ msg: 'Invalid credentials' });
        }

        const payload = {
            user: {
                id: user._id,
                role: user.role
            }
        };

        const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '24h' });

        res.json({ token, role: user.role });
    } catch (err) {
        res.status(500).json({ msg: 'Server error' });
    }
});

// Ruta de noticias (ejemplo de ruta de noticias protegida)
router.post('/news', authMiddleware, async (req, res) => {
    const { username, title, image, category, content, category_news } = req.body;

    try {
        const newNews = new NewsModel({
            username: username || '',  // Asignar una cadena vacía si no se proporciona
            title,
            image,
            category,
            content,
            category_news
        });

        await newNews.save();
        res.status(201).json({ msg: 'News created successfully', news: newNews });
    } catch (err) {
        res.status(500).json({ msg: 'Error creating news', error: err.message });
    }
});

// Ruta de noticias: Obtener todas las noticias
router.get('/news', async (req, res) => {
    try {
        const newsList = await NewsModel.find();
        res.json(newsList);
    } catch (err) {
        res.status(500).json({ msg: 'Error fetching news', error: err.message });
    }
});

// Health check endpoint
app.get("/healthz", (req, res) => {
    res.status(200).send("OK");
});

app.use(router);

// Conectar a la base de datos y arrancar el servidor
dbconnect();

app.listen(3001, () => {
    console.log('El servidor está en el puerto 3001');
});
