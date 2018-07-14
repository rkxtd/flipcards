const Question = require('../models/Question');

/**
 * GET /flashcard
 * Add flash Card form page.
 */
exports.getFlashCardForm = (req, res) => {
  res.render('addFlashcard', {
    title: 'Add Flash Card'
  });
};

/**
 * GET /flashcards
 * Add flash Card form page.
 */
exports.getFlashCards = (req, res) => {
  res.render('addFlashcard', {
    title: 'Add Flash Card'
  });
};

/**
 * POST /flashcard
 * Save flash Card to MongoDB.
 */
exports.postFlashCard = (req, res) => {
  req.assert('category', 'Category cannot be blank').notEmpty();
  req.assert('complexity', 'Complexity cannot be blank').notEmpty();
  req.assert('title', 'Title cannot be blank').notEmpty();
  req.assert('answer', 'Answer cannot be blank').notEmpty();

  const errors = req.validationErrors();

  if (errors) {
    req.flash('errors', errors);
    return res.redirect('/addFlashcard');
  }

  const {
    category, complexity, title, answer
  } = req.body;

  const question = new Question({
    category,
    complexity,
    title,
    answer
  });

  Question.findOne({ category, title }, (err, existingQuestion) => {
    if (err) { return next(err); }
    if (existingQuestion) {
      req.flash('errors', { msg: 'Same question within same category already exists.' });
      return res.redirect('/addFlashcard');
    }
    question.save((err) => {
      if (err) {
        req.flash('errors', { msg: err.message });
        return res.redirect('/addFlashcard');
      }
      req.flash('success', { msg: 'Card was added successfully!' });
      res.redirect('/addFlashcard');
    });
  });
};
