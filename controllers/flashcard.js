const Question = require('../models/Question');

const addFlashCardRoute = '/flashcard/add';
const listFlashCardRoute = '/flashcard/list';

/**
 * GET /flashcard
 * Add flash Card form page.
 */
exports.addFlashCardForm = (req, res) => {
  res.render('flashcards/add', {
    title: 'Add Flash Card',
    question: {}
  });
};

/**
 * GET /flashcard/list
 * Add flash Card form page.
 */
exports.getFlashCards = (req, res) => {
  Question.find({}, (err, records) => {
    if (err) { return next(err); }
    res.render('flashcards/list', {
      title: 'Add Flash Card',
      questions: records
    });
  });
};

exports.editFlashCardForm = (req, res) => {
  const { flashCardId: id } = req.params;
  Question.findOne({ _id: id }, (err, question) => {
    if (err) {
      req.flash('errors', { msg: `Such id[${id}] does'nt exists in our database.` });
      res.redirect(listFlashCardRoute);
    } else {
      res.render('flashcards/add', {
        title: 'Edit Flash Card',
        question,
      });
    }
  });
};

/**
 * GET /flashcards
 * Add flash Card form page.
 */
exports.runFlashCards = (req, res) => {
  res.render('flashcards', {
    title: 'FlashCards'
  });
};

exports.deleteFlashCard = (req, res) => {
  const { flashCardId: id } = req.params;
  Question.deleteOne({ _id: id }, (err) => {
    if (err) {
      req.flash('errors', { msg: `Such id[${id}] does'nt exists in our database.` });
    } else {
      req.flash('success', { msg: 'Card was deleted successfully!' });
    }
    res.redirect(listFlashCardRoute);
  });
};
/**
 * POST /flashcard
 * Save flash Card to MongoDB.
 */
exports.addFlashCard = (req, res) => {
  req.assert('category', 'Category cannot be blank').notEmpty();
  req.assert('complexity', 'Complexity cannot be blank').notEmpty();
  req.assert('title', 'Title cannot be blank').notEmpty();
  req.assert('answer', 'Answer cannot be blank').notEmpty();

  const errors = req.validationErrors();

  if (errors) {
    req.flash('errors', errors);
    return res.redirect(addFlashCardRoute);
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
      return res.redirect(addFlashCardRoute);
    }
    question.save((err) => {
      if (err) {
        req.flash('errors', { msg: err.message });
        return res.redirect(addFlashCardRoute);
      }
      req.flash('success', { msg: 'Card was added successfully!' });
    });
  });
  res.redirect(listFlashCardRoute);
};

exports.editFlashCard = (req, res) => {
  req.assert('category', 'Category cannot be blank').notEmpty();
  req.assert('complexity', 'Complexity cannot be blank').notEmpty();
  req.assert('title', 'Title cannot be blank').notEmpty();
  req.assert('answer', 'Answer cannot be blank').notEmpty();

  const errors = req.validationErrors();

  if (errors) {
    req.flash('errors', errors);
    return res.redirect(listFlashCardRoute);
  }

  const {
    _id, category, complexity, title, answer
  } = req.body;

  Question.findOne({ _id })
    .then((question) => {
      if (!question) {
        req.flash('errors', { msg: 'Such Question doesn\'t exists.' });
      } else {
        question.category = category;
        question.complexity = complexity;
        question.title = title;
        question.answer = answer;
        question = question.save();
        req.flash('success', { msg: 'Card was saved successfully!' });
      }
      return question;
    });

  res.redirect(listFlashCardRoute);
};
