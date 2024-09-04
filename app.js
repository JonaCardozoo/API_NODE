const express = require('express');
const mongoose = require('mongoose');
const dbconnect = require('./config'); 
const ModelUser = require('./userModel');
const app = express();
const router = express.Router();

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

app.use(express.json());
app.use(router);

app.listen(3001, () => {
    console.log('El servidor está en el puerto 3001');
});

dbconnect();
