import { useState, useEffect } from 'react';

const fetchQuestions = async () => {
  const response = await fetch('https://opentdb.com/api.php?amount=20&category=18&difficulty=medium&type=multiple');
  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }
  const data = await response.json();
  return data.results.map((item, index) => ({
    numb: index + 1,
    question: unescapeHtml(item.question),
    answer: unescapeHtml(item.correct_answer),
    options: shuffleOptions(item.incorrect_answers.map(unescapeHtml).concat(unescapeHtml(item.correct_answer)))
  }));
};

const shuffleArray = (array) => {
  return array.sort(() => Math.random() - 0.5);
};

const shuffleOptions = shuffleArray; // Alias for clarity in fetchQuestions

const unescapeHtml = (text) => {
  const doc = new DOMParser().parseFromString(text, 'text/html');
  return doc.documentElement.textContent;
};

export const useQuestions = () => {
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const getQuestions = async () => {
    try {
      const questionsData = await fetchQuestions();
      const shuffledQuestions = shuffleArray(questionsData); // Shuffle questions each time
      setQuestions(shuffledQuestions);
      setLoading(false);
      localStorage.setItem('quizQuestions', JSON.stringify(shuffledQuestions));
    } catch (err) {
      if (err.message.includes('429')) {
        // Retry logic for rate limiting
        console.error('Rate limit exceeded, retrying in 10 seconds...');
        setTimeout(getQuestions, 10000); // Retry after 10 seconds
      } else {
        setError(err);
        setLoading(false);
      }
    }
  };

  useEffect(() => {
    const cachedQuestions = localStorage.getItem('quizQuestions');
    if (cachedQuestions) {
      const parsedQuestions = JSON.parse(cachedQuestions);
      const shuffledQuestions = shuffleArray(parsedQuestions); // Shuffle cached questions
      setQuestions(shuffledQuestions);
      setLoading(false);
    } else {
      getQuestions();
    }
  }, []);

  const reloadQuestions = async () => {
    await getQuestions(); // Fetch and reload questions
  };

  return { questions, loading, error, reloadQuestions };
};
