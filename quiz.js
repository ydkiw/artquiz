let userName = ''; // 사용자 이름 저장 변수
let userApiKey = ''; // 참가번호(API 키) 저장 변수
let currentQuestionIndex = 0;
let questions = [];
let quizStartTime = null;
const usedPrompts = new Set(); // 중복 방지용 세트

// 초기화: 첫 로드 시 오버레이 숨기기
document.addEventListener('DOMContentLoaded', () => {

  document.getElementById('game-screen').style.display = 'none';
});

// API 키 제출 이벤트 리스너
document.getElementById('api-key-submit').addEventListener('click', async () => {
  // 사용자 이름 및 API 키 입력값 가져오기
  userName = document.getElementById('user-name-input').value.trim();
  userApiKey = document.getElementById('api-key-input').value.trim();

  // 입력값 검증
  if (!userName || !userApiKey) {
    alert('이름과 참가번호를 모두 입력해주세요.');
    return;
  }

  // 시작 화면 숨기기
  document.getElementById('api-key-screen').style.display = 'none';

  // 게임 화면 표시
  document.getElementById('game-screen').style.display = 'block';

  // 카운트다운 오버레이 표시
  document.getElementById('countdown-overlay').style.display = 'flex';

  startCountdown(() => {
    document.getElementById('countdown-overlay').style.display = 'none';
    quizStartTime = new Date(); // 퀴즈 시작 시간 기록
    loadQuestions(); // 질문 로드
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

document.getElementById('countdown-overlay').style.display = 'none';
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
        max_tokens: 200,
        temperature: 0.8, // 창의성 증가
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

function shuffleArray(array) {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
}


const quizData = [
  { prompt: "모나리자와 관련된 퀴즈를 만들어주세요.", image: "monalisa.jpg" },
  { prompt: "진주 귀고리를 한 소녀와 관련된 퀴즈를 만들어주세요.", image: "pearl_earring.jpg" },
  { prompt: "별이 빛나는 밤과 관련된 퀴즈를 만들어주세요.", image: "starry.jpg" },
  { prompt: "인왕제색도와 관련된 퀴즈를 만들어주세요.", image: "inwang.jpg" },
  { prompt: "절규와 관련된 퀴즈를 만들어주세요.", image: "scream.jpg" },
];

function shuffleQuizData() {
  for (let i = quizData.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [quizData[i], quizData[j]] = [quizData[j], quizData[i]];
  }
}

// generateQuizPrompt 함수 정의
function generateQuizPrompt(artwork) {
  // 랜덤 주제 배열
  const topics = [
    '작품의 제작 이유 또는 배경',
    '작품의 작가의 생애',
    '작품의 시대적 특징',
    '작품과 관련된 역사적 사건',
    '작품과 관련된 루머',
    '연관된 다른 작품'
  ];

  // 랜덤하게 주제 선택
  const randomTopic = topics[Math.floor(Math.random() * topics.length)];

  return `
    당신은 예술작품 퀴즈를 만드는 전문가입니다. 
    다음 조건을 충족하며 정확하고 사실에 기반한 흥미로운 퀴즈를 만들어주세요.

    작품 정보:
    - 작품 이름: ${artwork.prompt}
    - 작품 이미지 경로: ${artwork.image}
    - 주제: ${randomTopic}

    요구사항:
    1. 질문은 완성된 두 문장의 의문문으로 작성하세요. 질문은 명확하고 구체적으로 서술하세요.
    2. 정답은 반드시 하나의 선택지가 있어야 하며, 역사적 사실이나 공인된 정보에 기반해야 합니다.
    3. 정답 이외의 선택지 중 하나는 재미있거나 비현실적인 오답이어야 하며, 나머지 두 개의 오답은 사실과 비슷하지만 틀린 정보여야 합니다.
    4. 각 선택지는 질문에 관련되어야 하며, 한 문장으로 작성하세요. 선택지는 다음 형식을 따르세요:
       - [선택지 텍스트]
    5. 응답 형식은 다음과 같아야 합니다:

    질문: [질문 텍스트]
    - [선택지 1]
    - [선택지 2]
    - [선택지 3]
    - [선택지 4]

    예:
    질문: 모나리자의 배경에 있는 풍경은 무엇을 나타내나요?
    - 이탈리아의 한 도시를 표현한 것이다.
    - 레오나르도 다빈치의 상상 속 세계를 묘사한 것이다.
    - 당시 유럽에서 가장 높은 산맥 중 하나를 그린 것이다.
    - 달에 대한 미래 상상을 나타낸 것이다.
  `;
}



// 질문 데이터 파싱 함수
function parseQuizContent(content) {
  const lines = content.split('\n').map(line => line.trim());
  const question = lines[0].replace('질문: ', '');
  const options = lines.slice(1).map(option => option.replace(/^[-•]\s*/, ''));

  if (options.length < 4) {
    console.error("잘못된 퀴즈 형식:", content);
    return null;
  }

  // 정답이 기본적으로 첫 번째 옵션임
  const correctAnswer = options[0];

  // 배열 섞기
  shuffleArray(options);

  // 섞인 배열에서 정답 위치 찾기
  const correctAnswerIndex = options.indexOf(correctAnswer);

  return { question, options, correctAnswerIndex };
}

async function loadQuestions() {
  const promises = quizData.map(async (item) => {
    let questionContent = null;

    // 중복되지 않는 질문 생성
    while (!questionContent || usedPrompts.has(questionContent)) {
      const prompt = generateQuizPrompt(item);
      questionContent = await callGPT(prompt);
    }

    usedPrompts.add(questionContent);

    const parsed = parseQuizContent(questionContent);
    if (!parsed) {
      console.warn("유효하지 않은 데이터로 인해 질문이 건너뛰어졌습니다:", questionContent);
      return null;
    }

    return {
      ...parsed,
      image: item.image,
    };
  });

  questions = (await Promise.all(promises)).filter(q => q !== null);

  if (questions.length === 0) {
    alert("유효한 퀴즈를 생성할 수 없습니다. 다시 시도해주세요.");
    return;
  }

  loadQuestion();
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

  const buttons = document.querySelectorAll('.choices button'); // 모든 버튼 가져오기

  buttons.forEach((button, index) => {
    if (index < questionData.options.length) {
      button.innerText = questionData.options[index]; // 선택지 설정
      button.disabled = false;
      button.classList.remove('correct', 'wrong');
      button.style.display = 'block'; // 버튼 표시

      // 클릭 이벤트 설정
      button.onclick = () => checkAnswer(index);
    } else {
      button.style.display = 'none'; // 사용하지 않는 버튼 숨기기
    }
  });
}

// 정답 확인 로직
function checkAnswer(selectedIndex) {
  const questionData = questions[currentQuestionIndex];
  const buttons = document.querySelectorAll('.choices button');

  buttons.forEach(button => (button.disabled = true)); // 모든 버튼 비활성화

  if (selectedIndex !== questionData.correctAnswerIndex) {
    buttons[selectedIndex].classList.add('wrong'); // 오답 시각 효과
    setTimeout(() => {
      buttons.forEach(button => {
        button.classList.remove('wrong'); // 효과 제거
        button.disabled = false; // 버튼 활성화
      });
    }, 2000);
  } else {
    buttons[selectedIndex].classList.add('correct');
    setTimeout(() => {
      currentQuestionIndex++;
      if (currentQuestionIndex < questions.length) {
        loadQuestion();
      } else {
        endQuiz();
      }
    }, 1000);
  }
}

// 퀴즈 종료
function endQuiz() {
  if (!quizStartTime) {
    console.error("Error: quizStartTime is not initialized.");
    return;
  }

  const quizEndTime = new Date();
  const timeTaken = Math.floor((quizEndTime - quizStartTime) / 1000);

  if (isNaN(timeTaken) || timeTaken < 0) {
    console.error("Error: timeTaken is invalid.");
    return;
  }

  const minutes = Math.floor(timeTaken / 60);
  const seconds = timeTaken % 60;

  // 랭킹 계산
  const rankingData = [
    { threshold: 30, ranking: '1위 (ChatGPT급)', trophy: '🥇' },
    { threshold: 60, ranking: '2위', trophy: '🥈' },
    { threshold: 90, ranking: '3위', trophy: '🥉' },
  ];

  let ranking = '참가자';
  let trophy = '🏅';

  for (const { threshold, ranking: r, trophy: t } of rankingData) {
    if (timeTaken <= threshold) {
      ranking = r;
      trophy = t;
      break;
    }
  }

  // 오버레이 배경과 결과 내용 추가
  document.body.innerHTML = `
    <div class="overlay">
      <div class="result-container">
        <h1>퀴즈 완료!</h1>
        <p>소요 시간: <strong>${minutes > 0 ? `${minutes}분 ` : ''}${seconds}초</strong></p>
        <p>🎉 ${userName}님, 당신은 ${ranking}입니다.</p>
        <p style="font-size: 2rem;">${trophy}</p>
        <div class="ranking-info">
          <p>🏆 랭킹 기준:</p>
          <ul>
            <li>🥇 ~30초: 1위 (ChatGPT급)</li>
            <li>🥈 ~60초: 2위</li>
            <li>🥉 ~90초: 3위</li>
            <li>🏅 90초 초과: 참가자</li>
          </ul>
        </div>
        <button class="restart-button" onclick="restartQuiz()">다시 시작하기</button>
      </div>
    </div>
  `;
}

function restartQuiz() {
  // 페이지를 새로고침하여 처음 화면으로 돌아가기
  location.reload();
}


