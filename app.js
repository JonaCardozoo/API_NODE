const express = require('express');
const mongoose = require('mongoose');
const dbconnect = require('./config'); 
const ModelUser = require('./userModel');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const cors = require('cors');
const app = express();
const router = express.Router();


app.use(cors({
    origin: 'https://proyecto-noticiero.vercel.app/', // Permite solicitudes desde tu dominio local
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

router.get("/", async (req, res) => {
    try {
        const respuesta = await ModelUser.find({});
        res.send(respuesta);
    } catch (error) {
        res.status(500).send(error.message);
    }
});

router.get("/:id", async (req, res) => {
    const id = req.params.id;
    
    if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(400).send('Invalid ID');
    }
    
    try {
        const respuesta = await ModelUser.findById(id);
        if (!respuesta) {
            return res.status(404).send('User not found');
        }
        res.send(respuesta);
    } catch (error) {
        res.status(500).send(error.message);
    }
});

router.put("/:id", async (req, res) => {
    const id = req.params.id;

    if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(400).send('Invalid ID');
    }

    try {
        const body = req.body;
        const respuesta = await ModelUser.findOneAndUpdate({_id: id}, body, { new: true });
        if (!respuesta) {
            return res.status(404).send('User not found');
        }
        res.send(respuesta);
    } catch (error) {
        res.status(500).send(error.message);
    }
});

router.delete("/:id", async (req, res) => {
    const id = req.params.id;

    if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(400).send('Invalid ID');
    }

    try {
        const respuesta = await ModelUser.deleteOne({_id: id});
        if (respuesta.deletedCount === 0) {
            return res.status(404).send('User not found');
        }
        res.send({ message: 'User deleted successfully' });
    } catch (error) {
        res.status(500).send(error.message);
    }
});


app.post('/register', async (req, res) => {
    const { username, password } = req.body;

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
                role: user.rol 
            }
        };

        
        const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '1h' });

        // Devolver el token y el rol del usuario
        res.json({ token, role: user.rol });
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




app.use(express.json());
app.use(router);

app.listen(3001, () => {
    console.log('El servidor está en el puerto 3001');
});

dbconnect();
