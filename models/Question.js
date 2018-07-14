const mongoose = require('mongoose');

const questionSchema = new mongoose.Schema({
  category: String,
  complexity: String,
  title: String,
  answer: String,
}, { timestamps: true });

const Question = mongoose.model('Question', questionSchema);

module.exports = Question;