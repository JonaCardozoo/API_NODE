const { v4: uuidv4 } = require('uuid');
const mongoose = require('mongoose');

const newsSchema = new mongoose.Schema({
    idNoticia: { type: String, default: uuidv4 },
    username: { type: String, required: false },
    title: { type: String, required: true },
    date: { type: Date, default: Date.now },
    image: { type: String },
    category: { type: String, required: true },
    content: { type: String, required: true },
    category_news: { type: String, required: true }
});

module.exports = mongoose.model('news', newsSchema);