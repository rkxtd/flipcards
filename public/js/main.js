$(document).ready(() => {
  $('#answer').richText();
  $('#title').richText();

  fetch('/api/flashcards/statistic')
    .then(response => response.json())
    .then(({ totalCards, totalLearned, totalFavored }) => {
      $('#cards_value').html(totalCards);
      $('#learned_value').html(totalLearned);
      $('#favored_value').html(totalFavored);
    });
});
