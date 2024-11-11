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

// Configuración de CORS
app.use(cors({
    origin: '*', // Permitir todos los orígenes (modifica esto según sea necesario en producción)
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));


app.use((req, res, next) => {
    res.status(200).send("Funcionando");
});


// Registro de usuario
app.post('/register', async (req, res) => {
    const { username, password } = req.body;

    if (!username || !password) {
        return res.status(400).json({ msg: 'Username and password are required' });
    }

    try {
        const existingUser = await ModelUser.findOne({ username });
        if (existingUser) {
            return res.status(400).json({ msg: 'User already exists' });
        }

        const existingUsers = await ModelUser.find();
        const role = existingUsers.length === 0 ? 'admin' : 'user';

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        const newUser = new ModelUser({
            username,
            password: hashedPassword,
            role
        });
        await newUser.save();

        res.status(201).json({ msg: 'User registered successfully', role });
    } catch (err) {
        console.error('Error in /register:', err);
        res.status(500).json({ msg: 'Server error' });
    }
});

// Login de usuario
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

// Ruta protegida
app.get('/protected', authMiddleware, (req, res) => {
    res.json({ msg: 'This is a protected route' });
});

// Crear una noticia
router.post('/news', async (req, res) => {
    const { username, title, image, category, content, category_news } = req.body;

    try {
        const newNews = new NewsModel({
            username: username || '', // Asignar una cadena vacía si no se proporciona
            title,
            image,  // Aquí podrías guardar una URL de Google Drive o base64
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

// Obtener todas las noticias
router.get('/news', async (req, res) => {
    try {
        const newsList = await NewsModel.find();
        res.json(newsList);
    } catch (err) {
        res.status(500).json({ msg: 'Error fetching news', error: err.message });
    }
});

// Obtener una noticia por ID
router.get('/news/:id', async (req, res) => {
    const id = req.params.id;

    if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(400).send('Invalid ID');
    }

    try {
        const newsItem = await NewsModel.findById(id);
        if (!newsItem) {
            return res.status(404).send('News not found');
        }
        res.json(newsItem);
    } catch (err) {
        res.status(500).json({ msg: 'Error fetching news', error: err.message });
    }
});

app.get("/healthz", (req, res) => {
    res.status(200).send("OK");
});

// Actualizar una noticia por ID
router.put('/news/:id', async (req, res) => {
    const id = req.params.id;

    if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(400).send('Invalid ID');
    }

    try {
        const updatedNews = await NewsModel.findOneAndUpdate({ _id: id }, req.body, { new: true });
        if (!updatedNews) {
            return res.status(404).send('News not found');
        }
        res.json(updatedNews);
    } catch (err) {
        res.status(500).json({ msg: 'Error updating news', error: err.message });
    }
});

// Eliminar una noticia
router.delete('/news/:id', async (req, res) => {
    const id = req.params.id;

    if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(400).send('Invalid ID');
    }

    try {
        const deletedNews = await NewsModel.deleteOne({ _id: id });
        if (deletedNews.deletedCount === 0) {
            return res.status(404).send('News not found');
        }
        res.json({ msg: 'News deleted successfully' });
    } catch (err) {
        res.status(500).json({ msg: 'Error deleting news', error: err.message });
    }
});

// Middleware para manejar rutas no encontradas (404)
app.use((req, res, next) => {
    res.redirect('/');
});

// Middleware para manejo de errores globales
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ msg: 'Server error', error: err.message });
});

// Configurar las rutas
app.use(router);

// Conectar a la base de datos y escuchar en el puerto adecuado
const PORT = process.env.PORT || 3000; // Usa el puerto de la variable de entorno
app.listen(PORT, '0.0.0.0', () => {
    console.log(`El servidor está en el puerto ${PORT}`);
});



dbconnect();
