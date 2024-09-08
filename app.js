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
app.use(cors({
  origin: 'https://proyecto-noticiero.vercel.app', 
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));


router.post("/", async (req, res) => {
    try {
        const body = req.body;
        const respuesta = await ModelUser.create(body);
        res.send(respuesta);
    } catch (error) {
        res.status(500).send(error.message);
    }
});

router.get('/users', async (req, res) => {
    try {
        console.log('Fetching users...');
        const users = await ModelUser.find({});
        console.log('Users fetched:', users);
        res.json(users);
    } catch (error) {
        console.error('Error fetching users:', error);
        res.status(500).json({ msg: 'Server error', error: error.message });
    }
});


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

        const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '1h' });

        res.json({ token, role: user.role });
    } catch (err) {
        res.status(500).json({ msg: 'Server error' });
    }
});

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

app.use(router);

app.listen(3001, () => {
    console.log('El servidor está en el puerto 3001');
});


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

dbconnect();
