let userApiKey = '';
let currentQuestionIndex = 0;
let questions = [];

// 초기화: 첫 로드 시 오버레이 숨기기
document.addEventListener('DOMContentLoaded', () => {
  document.getElementById('countdown-overlay').style.display = 'none';
  document.getElementById('game-screen').style.display = 'none';
});

// 퀴즈 데이터
const quizData = [
  { prompt: "모나리자와 관련된 퀴즈를 만들어주세요.", image: "monalisa.jpg" },
  { prompt: "진주 귀고리를 한 소녀와 관련된 퀴즈를 만들어주세요.", image: "pearl_earring.jpg" },
];

// API 키 제출 이벤트 리스너 추가
document.getElementById('api-key-submit').addEventListener('click', async () => {
  userApiKey = document.getElementById('api-key-input').value.trim();
  if (!userApiKey) {
    alert('API Key를 입력해주세요.');
    return;
  }

  document.getElementById('api-key-screen').style.display = 'none';
  document.getElementById('countdown-overlay').style.display = 'flex'; // 카운트다운 오버레이 표시

  startCountdown(() => {
    document.getElementById('countdown-overlay').style.display = 'none';
    document.getElementById('game-screen').style.display = 'block'; // 게임 화면 표시
    loadQuestions();
  });
});

// 키보드 이벤트 리스너 추가 (엔터키로 API 키 제출 가능)
document.getElementById('api-key-input').addEventListener('keypress', (event) => {
  if (event.key === 'Enter') {
    document.getElementById('api-key-submit').click();
  }
});

// 카운트다운 함수
function startCountdown(callback) {
  const overlay = document.getElementById('countdown-overlay');
  let count = 3;
  overlay.textContent = count;
  const interval = setInterval(() => {
    count--;
    if (count === 0) {
      clearInterval(interval);
      callback();
    } else {
      overlay.textContent = count;
    }
  }, 1000);
}

// GPT 요청 함수
async function callGPT(prompt) {
  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${userApiKey}`,
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [{ role: 'user', content: prompt }],
        max_tokens: 150,
        temperature: 0.7,
      }),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`);
    }

    const data = await response.json();
    return data.choices[0].message.content;
  } catch (error) {
    console.error('API 호출 오류:', error);
    return null;
  }
}

// 질문 생성 로직
async function loadQuestions() {
  for (const item of quizData) {
    const prompt = `
      당신은 퀴즈를 만드는 전문가입니다. 아래의 예술작품에 대해 퀴즈를 만들어 주세요.
      요구사항:
      1. 질문은 완성된 문장으로 작성해 주세요.
      2. 정답을 포함한 총 3개의 선택지를 제공해 주세요.
      3. 정답은 항상 무작위의 선택지에 위치해 있어야 합니다.

      예술작품: ${item.prompt}
      작품과 관련된 문제를 작성하고, 아래의 형식에 맞게 답변을 반환하세요:

      질문: [질문을 입력하세요]
      - [선택지 1]
      - [선택지 2]
      - [선택지 3]
    `;

    const questionContent = await callGPT(prompt);

    if (questionContent) {
      const parsed = questionContent.split('\n');
      const question = parsed[0].replace('질문: ', '').trim();
      const options = parsed.slice(1, 4).map(opt => opt.replace(/^[-•]\s*/, '').trim());

      shuffleArray(options); // 선택지를 섞음

      questions.push({
        question,
        options,
        correctAnswerIndex: options.indexOf(parsed[1].replace(/^[-•]\s*/, '').trim()), // 정답 인덱스
        image: item.image,
      });
    } else {
      questions.push({
        question: '질문 생성에 실패했습니다.',
        options: ['다시 시도', '오류 발생', 'API 확인'],
        correctAnswerIndex: 0,
        image: '',
      });
    }
  }

  loadQuestion(); // 첫 번째 질문 로드
}

// 배열 섞기 함수
function shuffleArray(array) {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
}

// 질문 화면 로드
function loadQuestion() {
  const questionData = questions[currentQuestionIndex];
  document.getElementById('question').innerText = questionData.question;
  document.getElementById('art-image').src = questionData.image;

  questionData.options.forEach((option, index) => {
    const button = document.getElementById(`choice-${index}`);
    button.innerText = option;
    button.disabled = false;
    button.classList.remove('correct', 'wrong');

    // 클릭 시 정답 확인
    button.onclick = () => checkAnswer(index);
  });
}

// 정답 확인
function checkAnswer(selectedIndex) {
  const questionData = questions[currentQuestionIndex];
  const buttons = document.querySelectorAll('.choices button');

  buttons.forEach((button, index) => {
    button.disabled = true;
    if (index === questionData.correctAnswerIndex) {
      button.classList.add('correct'); // 정답 애니메이션
    } else {
      button.classList.add('wrong'); // 오답 애니메이션
    }
  });

  setTimeout(() => {
    currentQuestionIndex++;
    if (currentQuestionIndex < questions.length) {
      loadQuestion();
    } else {
      endQuiz();
    }
  }, 2000);
}

// 퀴즈 종료
function endQuiz() {
  document.body.innerHTML = `
    <div style="display: flex; flex-direction: column; justify-content: center; align-items: center; height: 100vh;">
      <h1>퀴즈 완료!</h1>
      <p>모든 문제를 완료했습니다!</p>
    </div>
  `;
}
