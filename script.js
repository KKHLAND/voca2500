document.addEventListener('DOMContentLoaded', () => {
    // ------------------
    // 상태 변수 (State Variables)
    // ------------------
    let selectedDayData = null;
    let currentIndex = 0;
    let studyMode = 'en-ko'; // en-ko, ko-en
    let currentMode = 'normal'; // normal, drawer
    let showMeaning = false;
    let isAudioUnlocked = false;
    let bookmarkedWords = [];
    let lastSelectedDay = null; // 마지막으로 학습한 Day를 저장

    // ------------------
    // DOM 요소 (DOM Elements)
    // ------------------
    const daySelector = document.getElementById('day-selector');
    const vocaCardContainer = document.getElementById('voca-card-container');
    const studyModeToggle = document.getElementById('study-mode-toggle');
    const modeSelector = document.getElementById('mode-selector');
    const normalModeButton = document.querySelector('.mode-button[data-mode="normal"]');
    const drawerModeButton = document.querySelector('.mode-button[data-mode="drawer"]');

    // ------------------
    // 로컬 저장소 (Local Storage)
    // ------------------
    const loadBookmarkedWords = () => {
        const storedWords = localStorage.getItem('bookmarkedVoca');
        bookmarkedWords = storedWords ? JSON.parse(storedWords) : [];
    };

    const saveBookmarkedWords = () => {
        localStorage.setItem('bookmarkedVoca', JSON.stringify(bookmarkedWords));
    };


    // ------------------
    // 음성 재생(TTS) 관련 설정
    // ------------------
    try {
        if ('speechSynthesis' in window) {
            window.speechSynthesis.getVoices();
            window.speechSynthesis.onvoiceschanged = () => window.speechSynthesis.getVoices();
        }
    } catch (e) {
        console.error("Speech Synthesis API is not supported in this browser.", e);
    }

    const unlockAudio = () => {
        if (isAudioUnlocked || !('speechSynthesis' in window)) return;
        const utterance = new SpeechSynthesisUtterance('');
        window.speechSynthesis.speak(utterance);
        isAudioUnlocked = true;
    };

    // ------------------
    // 핵심 함수 (Core Functions)
    // ------------------

    const shuffleArray = (array) => {
        const newArray = [...array];
        for (let i = newArray.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
        }
        return newArray;
    };
    
    const loadDayData = (day) => {
        const dayData = window.vocaData.find(d => d.day === day);
        if (dayData) {
            lastSelectedDay = day;
            selectedDayData = { ...dayData, words: shuffleArray(dayData.words) };
            currentIndex = 0;
            showMeaning = false;
            renderVocaCard();
        }
    };

    const handleSpeak = (word) => {
        if (!('speechSynthesis' in window) || !word) {
            alert('음성 재생 기능이 지원되지 않는 브라우저입니다.');
            return;
        }
        window.speechSynthesis.cancel();
        const utterance = new SpeechSynthesisUtterance(word);
        utterance.lang = 'en-US';
        utterance.rate = 1.0;
        utterance.pitch = 1.0;
        window.speechSynthesis.speak(utterance);
    };

    const toggleBookmark = (word) => {
        const wordIndex = bookmarkedWords.findIndex(item => item.en === word.en);
        if (wordIndex > -1) {
            bookmarkedWords.splice(wordIndex, 1);
        } else {
            bookmarkedWords.push(word);
        }
        saveBookmarkedWords();

        if (currentMode === 'drawer') {
             selectedDayData.words = shuffleArray(bookmarkedWords);
             if (currentIndex >= selectedDayData.words.length) {
                currentIndex = Math.max(0, selectedDayData.words.length - 1);
             }
        }
        
        renderVocaCard();
        updateDrawerModeButton();
    };
    
    const updateDrawerModeButton = () => {
        drawerModeButton.textContent = `서랍 (${bookmarkedWords.length})`;
    };

    const renderVocaCard = () => {
        if (!selectedDayData || selectedDayData.words.length === 0) {
            let message = "학습할 Day를 선택해 주세요.";
            if (currentMode === 'drawer') {
                message = "서랍이 비어있습니다. 단어에 별표를 눌러 추가해 보세요.";
            }
            vocaCardContainer.innerHTML = `
                <div class="bg-white border border-gray-200 rounded-xl p-6 md:p-10 min-h-[450px] flex items-center justify-center">
                    <p class="text-gray-500 text-xl">${message}</p>
                </div>`;
            return;
        }

        const wordData = selectedDayData.words[currentIndex];
        const isEnKoMode = studyMode === 'en-ko';
        const totalWords = selectedDayData.words.length;
        const isBookmarked = bookmarkedWords.some(item => item.en === wordData.en);

        const speakerIcon = `
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-10 h-10">
                <path stroke-linecap="round" stroke-linejoin="round" d="M19.114 5.636a9 9 0 0 1 0 12.728M16.463 8.288a5.25 5.25 0 0 1 0 7.424M6.75 8.25l4.72-4.72a.75.75 0 0 1 1.28.53v15.88a.75.75 0 0 1-1.28.53l-4.72-4.72H4.51c-.88 0-1.704-.507-1.938-1.354A9.01 9.01 0 0 1 2.25 12c0-.83.112-1.633.322-2.396C2.806 8.756 3.63 8.25 4.51 8.25H6.75Z" />
            </svg>`;

        const starIcon = `
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-8 h-8">
                <path stroke-linecap="round" stroke-linejoin="round" d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.563.563 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z" />
            </svg>`;
        
        let questionContent, answerContent;

        if (isEnKoMode) {
            questionContent = `
                <div class="flex items-center gap-4">
                    <h2 class="font-montserrat text-5xl md:text-7xl font-bold text-blue-600">${wordData.en}</h2>
                    <button data-speak-word="${wordData.en}" class="speak-button text-gray-500 hover:text-blue-600 transition-colors p-2 rounded-full hover:bg-blue-50" title="발음 듣기">
                        ${speakerIcon}
                    </button>
                </div>
                <div class="h-8 mt-2"></div>`;
            answerContent = `
                <div class="w-full animate-fade-in text-center">
                    <p class="text-3xl font-bold text-red-600">${wordData.ko}</p>
                    <div class="mt-4 p-4 bg-blue-50 rounded-lg text-left w-full">
                        <p class="text-xl text-blue-800 font-medium">${wordData.sentence}</p>
                        <p class="text-lg text-blue-600 mt-1">${wordData.translation}</p>
                    </div>
                </div>`;
        } else {
            const koWordClass = wordData.ko.length > 15 ? 'text-3xl md:text-4xl' : 'text-4xl md:text-5xl';
            questionContent = `
                <h2 class="font-sans font-bold text-blue-600 ${koWordClass}">${wordData.ko}</h2>
                <div class="h-8 mt-2"></div>`;
            answerContent = `
                <div class="w-full animate-fade-in text-center">
                    <div class="flex items-center justify-center gap-4">
                        <h2 class="font-montserrat text-5xl md:text-7xl font-bold text-red-600">${wordData.en}</h2>
                        <button data-speak-word="${wordData.en}" class="speak-button text-gray-500 hover:text-blue-600 transition-colors p-2 rounded-full hover:bg-blue-50" title="발음 듣기">
                            ${speakerIcon}
                        </button>
                    </div>
                    <div class="h-8 mt-2"></div>
                    <div class="mt-4 p-4 bg-blue-50 rounded-lg text-left w-full">
                        <p class="text-xl text-blue-800 font-medium">${wordData.sentence}</p>
                        <p class="text-lg text-blue-600 mt-1">${wordData.translation}</p>
                    </div>
                </div>`;
        }


        vocaCardContainer.innerHTML = `
            <div class="bg-white border border-gray-200 rounded-xl shadow-lg p-6 md:p-10 min-h-[450px] flex flex-col justify-between relative">
                 <div class="absolute top-4 left-4">
                     <button class="star-button ${isBookmarked ? 'bookmarked' : ''} text-gray-400 hover:text-yellow-400 transition-colors" title="서랍에 추가/제거">
                        ${starIcon}
                    </button>
                </div>
                <div class="text-right text-gray-500 font-medium">${currentIndex + 1} / ${totalWords}</div>
                <div class="flex-grow flex flex-col justify-center items-center gap-2 text-center">${questionContent}</div>
                <div id="answer-section" class="min-h-[180px] mt-4 flex flex-col justify-center items-center text-center">
                    ${!showMeaning ? `<button id="show-meaning-button" class="bg-orange-500 text-white font-bold py-3 px-8 rounded-lg text-lg hover:bg-orange-600 transition-transform transform hover:scale-105">${isEnKoMode ? '뜻 보기' : '영어단어 보기'}</button>` : answerContent}
                </div>
                <div class="flex justify-between mt-6">
                    <button id="prev-button" ${currentIndex === 0 ? 'disabled' : ''} class="bg-blue-600 text-white font-bold py-3 px-8 rounded-lg text-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors">이전</button>
                    <button id="next-button" ${currentIndex === totalWords - 1 ? 'disabled' : ''} class="bg-blue-600 text-white font-bold py-3 px-8 rounded-lg text-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors">다음</button>
                </div>
            </div>`;
            
        addCardEventListeners(wordData);
    };
    
    const addCardEventListeners = (wordData) => {
        const showMeaningButton = document.getElementById('show-meaning-button');
        if (showMeaningButton) {
            showMeaningButton.addEventListener('click', () => {
                unlockAudio();
                showMeaning = true;
                renderVocaCard();
            });
        }
        
        document.querySelectorAll('.speak-button').forEach(button => {
            button.addEventListener('click', (e) => {
                unlockAudio();
                const wordToSpeak = e.currentTarget.dataset.speakWord;
                handleSpeak(wordToSpeak);
            });
        });
        
        const starButton = document.querySelector('.star-button');
        if (starButton) {
            starButton.addEventListener('click', () => toggleBookmark(wordData));
        }

        document.getElementById('prev-button').addEventListener('click', () => handleNavigation('prev'));
        document.getElementById('next-button').addEventListener('click', () => handleNavigation('next'));
    };

    const handleNavigation = (direction) => {
        if (!selectedDayData) return;
        const newIndex = direction === 'next' ? currentIndex + 1 : currentIndex - 1;
        if (newIndex >= 0 && newIndex < selectedDayData.words.length) {
            currentIndex = newIndex;
            showMeaning = false;
            renderVocaCard();
        }
    };
    
    // ------------------
    // 이벤트 리스너 설정
    // ------------------
    daySelector.addEventListener('change', (e) => {
        unlockAudio();
        loadDayData(Number(e.target.value));
    });
    
    modeSelector.addEventListener('click', (e) => {
        const button = e.target.closest('.mode-button');
        if (!button || button.dataset.mode === currentMode) return;

        currentMode = button.dataset.mode;
        
        document.querySelectorAll('.mode-button').forEach(btn => {
            const isSelected = btn.dataset.mode === currentMode;
            btn.classList.remove('bg-white', 'text-blue-600', 'shadow', 'text-gray-600', 'hover:bg-gray-300', 'bg-blue-600', 'text-white');
            if (isSelected) {
                btn.classList.add('bg-blue-600', 'text-white', 'shadow');
            } else {
                btn.classList.add('text-gray-600', 'hover:bg-gray-300');
            }
        });

        if (currentMode === 'drawer') {
            daySelector.disabled = true;
            normalModeButton.textContent = "돌아가기";
            selectedDayData = { day: 'Drawer', words: shuffleArray(bookmarkedWords) };
            daySelector.value = '';
        } else {
            daySelector.disabled = false;
            normalModeButton.textContent = "일반 학습";
            if (lastSelectedDay) {
                daySelector.value = lastSelectedDay;
                loadDayData(lastSelectedDay);
            } else {
                selectedDayData = null;
                renderVocaCard();
            }
            return; 
        }
        
        currentIndex = 0;
        showMeaning = false;
        renderVocaCard();
    });

    studyModeToggle.addEventListener('click', (e) => {
    const button = e.target.closest('.study-mode-button');
    if (button && button.dataset.mode !== studyMode) {
        unlockAudio();
        studyMode = button.dataset.mode;
        showMeaning = false;
        document.querySelectorAll('.study-mode-button').forEach(btn => {
            const isSelected = btn.dataset.mode === studyMode;
            // 기존 blue 클래스와 새로운 green 클래스를 모두 제거 리스트에 추가
            btn.classList.remove('bg-blue-600', 'text-blue-600', 'bg-green-600', 'shadow', 'text-gray-600', 'hover:bg-gray-300', 'text-white');
            if (isSelected) {
                // 선택된 버튼에 green 클래스 추가
                btn.classList.add('bg-green-600', 'text-white', 'shadow');
            } else {
                btn.classList.add('text-gray-600', 'hover:bg-gray-300');
            }
        });
        if(selectedDayData) renderVocaCard();
            }
        });

    // ------------------
    // 초기화 함수
    // ------------------
    const init = () => {
        loadBookmarkedWords();
        updateDrawerModeButton();

        if (window.vocaData && window.vocaData.length > 0) {
            window.vocaData.forEach(d => {
                const option = document.createElement('option');
                option.value = d.day;
                option.textContent = `Day ${d.day}`;
                daySelector.appendChild(option);
            });
        }
        renderVocaCard();
    };

    init();
});
