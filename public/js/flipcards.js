$(document).ready(() => {
  const flipContainer = $('#flip-container');
  const flipNextButton = $('#flip-next-button');
  const flipPrevButton = $('#flip-prev-button');
  const flipFiltersContainer = $('#flip-filters');
  const flipProgressBar = $('#completed-questions');
  const flipProgressBarValue = $('#completed-questions_value');

  const initialState = {
    filtersData: {},
    selectedFilters: {},
    questions: [],
    answeredQuestions: [],
    currentQuestion: undefined,
    questionsLoaded: false,
  };
  const getRandomInt = (max) => Math.floor(Math.random() * Math.floor(max));
  const loadFiltersData = (filters, questions) => {
    const filtersData = {};
    filters.map((filter) => {
      filtersData[filter] = [];
    });

    filters.map(filter => {
      questions.map(question => {
        if (!filtersData[filter].includes(question[filter])) {
          filtersData[filter].push(question[filter]);
        }
      });
    });

    return filtersData;
  };

  const displayQuestion = (question, parentDiv) => {

    const flipCardDiv = document.createElement("div");
    const cardFrontDiv = document.createElement("div");
    const cardBackDiv = document.createElement("div");
    const ratingDiv = document.createElement("div");

    flipCardDiv.className = 'flip-card';
    cardFrontDiv.className = `card-front ${question.complexity} ${question.category.replace(' ', '-')}`;
    cardBackDiv.className = `card-back ${question.complexity} ${question.category.replace(' ', '-')}`;
    ratingDiv.className = 'flip-rating';

    cardFrontDiv.innerHTML = `<div class="complexity ${question.complexity}">${question.category} / ${question.complexity}</div><div class="text">${question.title}</div>`;
    cardBackDiv.innerHTML = `<div class="text">${question.answer}</div>`;
    ratingDiv.innerHTML = `<span class="mdi mdi-${question.star ? 'star' : 'star-outline'}"></span>`;

    cardFrontDiv.append(ratingDiv.cloneNode(true));
    cardBackDiv.append(ratingDiv.cloneNode(true));

    flipCardDiv.append(cardFrontDiv);
    flipCardDiv.append(cardBackDiv);
    parentDiv.append(flipCardDiv);
  };

  const displayFilter = ({type, values}, selected, parentDiv) => {

    const filterFieldset = document.createElement("fieldset");
    const filterLegend = document.createElement("legend");

    filterFieldset.className = 'filter form-check';
    filterLegend.className = 'filter-legend';
    filterLegend.innerHTML = `${type}`;
    filterFieldset.append(filterLegend);

    values.forEach((value) => {
      const container = document.createElement('div');
      const checkbox = document.createElement('input');
      checkbox.type = 'checkbox';
      checkbox.className = 'form-check-input';
      checkbox.value = `${type}::${value}`;
      checkbox.name = 'filter';
      checkbox.id = `checkbox::${type}::${value}`;

      if (selected) {
        checkbox.checked = selected.includes(value) ? 'checked' : '';
      }

      const label = document.createElement('label');
      label.className = 'form-check-label';
      label.htmlFor = `checkbox::${type}::${value}`;
      label.appendChild(document.createTextNode(value));
      container.appendChild(checkbox);
      container.appendChild(label);
      filterFieldset.appendChild(container);
    });

    parentDiv.append(filterFieldset);
  };

  const reducer = (state = initialState, action) => {
    console.log('Action: ', action.type);
    switch (action.type) {
      case 'LOAD':
        return {
          ...initialState,
          allQuestions: action.data.questions,
          questions: action.data.questions,
          filtersData: loadFiltersData(action.data.filters, action.data.questions),
          questionsLoaded: true,
        };
      case 'NEXT':
        const currentQuestionNum = getRandomInt(state.questions.length);

        return {
          ...state,
          currentQuestion: state.questions[currentQuestionNum],
          questions: [
            ...state.questions.slice(0, currentQuestionNum),
            ...state.questions.slice(currentQuestionNum + 1),
          ],
          answeredQuestions: state.currentQuestion ? [
            ...state.answeredQuestions,
            state.currentQuestion
          ] : state.answeredQuestions,
        };
      case 'PREV':
        return {
          ...state,
          currentQuestion: state.answeredQuestions.pop(),
          questions: [
            ...state.questions,
            state.currentQuestion
          ],
          answeredQuestions: [...state.answeredQuestions],
        };
      case 'FILTER':
        const { filters } = action.data;
        const filtersCount = Object.keys(filters).length;
        return {
          ...state,
          currentQuestion: undefined,
          answeredQuestions: [],
          selectedFilters: filters,
          questions: state.allQuestions.filter(question => {
            let itemFiltersCount = 0;

            Object.keys(filters).map(type => {
              const values = filters[type];
              if (values.includes(question[type])) itemFiltersCount++;
            });

            return itemFiltersCount === filtersCount;
          }),
        };
      default:
        return state;
    }
  };

  const store = Redux.createStore(reducer);
  const render = () => {
    const {
      currentQuestion,
      questions,
      answeredQuestions,
      filtersData,
      selectedFilters,
    } = store.getState();
    flipContainer.empty();
    flipNextButton.attr('disabled', !(questions.length));
    flipPrevButton.attr('disabled', !(answeredQuestions.length));

    if (currentQuestion) {
      displayQuestion(currentQuestion, flipContainer);
    }
    flipFiltersContainer.empty();
    flipContainer.removeClass('hover')
    Object.keys(filtersData).map((type) => {
      return displayFilter({
        type,
        values: filtersData[type]
      }, selectedFilters[type], flipFiltersContainer);
    });
    const allQuestions = questions.length + answeredQuestions.length + 1;
    const progress = parseInt(100 / allQuestions * (answeredQuestions.length + 1), 10);
    flipProgressBar.attr('aria-valuenow', progress).css('width',`${progress}%`);
    flipProgressBarValue.html(`${progress}%`);
  };

  fetch('/api/flashcards')
    .then(response => response.json())
    .then(({ records: questions }) => {
      postData('/api/flashcards/my', { _csrf: $('meta[name=csrf-token]')[0].content })
        .then(({ learned, favored }) => {
          return {
            filters: ['category', 'complexity'],
            questions: questions
              .filter((question) => learned.indexOf(question._id) === -1)
              .map(question => ({
                ...question,
                star: favored.indexOf(question._id) !== -1,
              })),
          };
        })
        .then(data => store.dispatch({ type: 'LOAD', data }))
        .then(() => store.dispatch({ type: 'NEXT' }));
    });

  store.subscribe(render);
  flipNextButton.on('click', () => {
    store.dispatch({type: 'NEXT'});
  });
  flipPrevButton.on('click', () => {
    store.dispatch({type: 'PREV'});
  });

  $('body').on('click', 'input[type="checkbox"][name="filter"]', () => {
    const checkedFilters = [];
    $('input[name="filter"]:checked').each((i, checkbox) => {
      checkedFilters.push(checkbox.value);
    });

    store.dispatch({
      type: 'FILTER',
      data: {
        filters: checkedFilters.reduce((memo, acc) => {
          const element = acc.split('::');
          if (memo[element[0]]) {
            if (!memo[element[0]].includes(element[1])) {
              memo[element[0]].push(element[1]);
            }
          } else {
            memo[element[0]] = [element[1]];
          }
          return memo;
        }, {}),
      }
    });
    store.dispatch({ type: 'NEXT' });
  });

  $('#flip-learn-button').on('click', () => {
    const {
      currentQuestion: { _id },
    } = store.getState();
    const _csrf = $('meta[name=csrf-token]')[0].content;
    postData(`/api/flashcards/learned`, { _csrf, _id })
      .then(({ status, message }) => {
        console.log(`Status: ${status}. Message: ${message}`);
      })
      .then(() => store.dispatch({ type: 'NEXT' }));
  });

  // $('.flip-rating').on('click', () => {
  //   const {
  //     currentQuestion: { _id },
  //   } = store.getState();
  //   const _csrf = $('meta[name=csrf-token]')[0].content;
  //   postData(`/api/flashcards/favored`, { _csrf, _id })
  //     .then(({ status, message }) => {
  //       console.log(`Status: ${status}. Message: ${message}`);
  //     })
  //     .then(() => store.dispatch({ type: 'NEXT' }));
  // });
});