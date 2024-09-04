const mongoose = require('mongoose');

async function dbconnect() {
  try {
    await mongoose.connect('mongodb://127.0.0.1:27017/base');
    console.log('Conexión exitosa a MongoDB');
  } catch (error) {
    console.error('Error al conectar a MongoDB:', error);
  }
}

module.exports = dbconnect;
