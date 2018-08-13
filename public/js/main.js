$(document).ready(() => {
  $('#answer').richText();
  $('#title').richText();

  $.get('/api/flashcards/statistic')
    .done(({ totalCards, totalLearned, totalFavored }) => {
      $('#cards_value').html(totalCards);
      $('#learned_value').html(totalLearned);
      $('#favored_value').html(totalFavored);
    });
});
