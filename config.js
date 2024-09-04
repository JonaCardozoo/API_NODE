require('dotenv').config();
const mongoose = require('mongoose');
const dbUrl = process.env.DATABASE_URL;

async function dbconnect() {
  try {
    if (!dbUrl) {
      throw new Error("La URI de conexión a MongoDB no está definida.");
    }
    await mongoose.connect(dbUrl);
    console.log('Conexión exitosa a MongoDB');
  } catch (error) {
    console.error('Error al conectar a MongoDB:', error);
  }
}

module.exports = dbconnect;
