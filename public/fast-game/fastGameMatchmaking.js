// Улучшенный fastGameMatchmaking.js
import { showToast } from '../active.js';

// Состояние поиска игры
let ws;
let searchTimeout;
let searchStage = 0;
let matchmakingActive = false;
let matchFoundTimeout;
let playerRank;
let timerInterval;
let searchStartTime; // Время начала всего поиска
let globalSearchStartTime; // Время начала всего поиска для глобального таймера
let stageTransitionInProgress = false; // Флаг для предотвращения перекрытия анимаций

// Константы
const searchRanges = [1000, 10000, 50000, 100000, Infinity];
const searchTimes = [10000, 10000, 10000, 10000, Infinity]; // 10 секунд для каждой стадии, бесконечность для последней
const ANIMATION_PRESTART = 150; // Время в мс для запуска анимации до фактического перехода

/**
 * Инициализирует модуль поиска игры с WebSocket соединением
 * @param {WebSocket} websocket - WebSocket соединение
 */
export function initializeMatchmaking(websocket) {
    ws = websocket;
    
    // Добавляем обработчик для сообщений о поиске игры
    document.addEventListener('matchmakingMessage', handleMatchmakingMessage);
}

/**
 * Начинает поиск игры
 */
export function startMatchmaking() {
    if (matchmakingActive) return;
    
    // Устанавливаем состояние активного поиска
    matchmakingActive = true;
    searchStage = 0;
    
    // Устанавливаем время начала поиска
    globalSearchStartTime = Date.now();
    searchStartTime = globalSearchStartTime;
    
    // Показываем модальное окно
    showSearchModal();
    
    // Затем асинхронно запрашиваем ранг игрока
    fetchPlayerRank().then(rank => {
        playerRank = rank || 0; // По умолчанию 0, если не удалось получить ранг
        
        // Начинаем процесс поиска
        sendMatchmakingRequest();
    }).catch(error => {
        console.error('Ошибка при получении ранга:', error);
        playerRank = 0; // По умолчанию 0 при ошибке
        sendMatchmakingRequest();
    });
}

/**
 * Показывает модальное окно поиска игры
 */
function showSearchModal() {
    const modalHTML = getSearchModalTemplate();
    document.body.insertAdjacentHTML('beforeend', modalHTML);
    
    // Инициализируем таймер сразу, чтобы избежать моргания
    const timerText = document.querySelector('.fastGame-timer-text');
    if (timerText) {
        // Создаем структуру с текстовым узлом и span элементом для лучшего контроля
        timerText.innerHTML = '';
        timerText.appendChild(document.createTextNode('00:00'));
        const spanElement = document.createElement('span');
        spanElement.textContent = 'поиск';
        timerText.appendChild(spanElement);
    }
    
    // Используем RAF для лучшей анимации
    requestAnimationFrame(() => {
        const modalBackdrop = document.querySelector('.fastGame-matchmaking-modal-backdrop');
        const modal = document.querySelector('.fastGame-matchmaking-modal');
        
        // Триггерим перерасчет layout перед добавлением классов для анимации
        modalBackdrop.offsetHeight;
        
        if (modalBackdrop) modalBackdrop.classList.add('visible');
        if (modal) {
            modal.classList.add('visible', 'initial');
        }
        
        // Активируем первый этап поиска сразу после появления модального окна
        // Добавляем класс активности сразу, без задержки
        const firstStage = document.querySelector('.fastGame-search-stage-item[data-stage="0"]');
        if (firstStage) {
            firstStage.classList.add('active');
        }
        
        // Запускаем таймер после добавления класса активности
        startSearchTimer();
    });
    
    // Добавляем обработчик для кнопки отмены
    const cancelButton = document.querySelector('.fastGame-cancel-search-btn');
    if (cancelButton) {
        cancelButton.addEventListener('click', cancelMatchmaking);
    }
}

/**
 * Генерирует HTML-шаблон модального окна поиска игры
 * @returns {string} HTML-шаблон
 */
function getSearchModalTemplate() {
    return `
        <div class="fastGame-matchmaking-modal-backdrop">
            <div class="fastGame-matchmaking-modal">
                <div class="fastGame-gradient-bg"></div>
                <div class="fastGame-matchmaking-modal-content">
                    <div class="fastGame-modal-glow top-left"></div>
                    <div class="fastGame-modal-glow bottom-right"></div>
                    
                    <h2 class="fastGame-fade-in fastGame-no-animation">Поиск соперника</h2>
                    
                    <div class="fastGame-matchmaking-timer fastGame-fade-in fastGame-no-animation">
                        <div class="fastGame-timer-text">00:00<span>поиск</span></div>
                    </div>
                    
                    <div class="fastGame-search-stages-container fastGame-fade-in fastGame-no-animation">
                        <ul class="fastGame-search-stages-list">
                            <li class="fastGame-search-stage-item" data-stage="0">
                                <div class="fastGame-search-stage-number">1</div>
                                <div class="fastGame-search-stage-text">Поиск игроков в диапазоне ~1000</div>
                                <div class="fastGame-search-stage-status"></div>
                            </li>
                            <li class="fastGame-search-stage-item" data-stage="1">
                                <div class="fastGame-search-stage-number">2</div>
                                <div class="fastGame-search-stage-text">Поиск игроков в диапазоне ~10 000</div>
                                <div class="fastGame-search-stage-status"></div>
                            </li>
                            <li class="fastGame-search-stage-item" data-stage="2">
                                <div class="fastGame-search-stage-number">3</div>
                                <div class="fastGame-search-stage-text">Поиск игроков в диапазоне ~50 000</div>
                                <div class="fastGame-search-stage-status"></div>
                            </li>
                            <li class="fastGame-search-stage-item" data-stage="3">
                                <div class="fastGame-search-stage-number">4</div>
                                <div class="fastGame-search-stage-text">Поиск игроков в диапазоне ~100 000</div>
                                <div class="fastGame-search-stage-status"></div>
                            </li>
                            <li class="fastGame-search-stage-item" data-stage="4">
                                <div class="fastGame-search-stage-number">5</div>
                                <div class="fastGame-search-stage-text">Поиск игроков без ограничений</div>
                                <div class="fastGame-search-stage-status"></div>
                            </li>
                        </ul>
                    </div>
                    
                    <button class="fastGame-cancel-search-btn fastGame-fade-in fastGame-no-animation">Отменить поиск</button>
                </div>
            </div>
        </div>
    `;
}

/**
 * Запускает таймер поиска
 */
function startSearchTimer() {
    // Очищаем предыдущий интервал, если он существует
    clearInterval(timerInterval);
    
    const timerText = document.querySelector('.fastGame-timer-text');
    
    if (timerText) {
        // Таймер уже инициализирован в showSearchModal, запускаем только интервал
        timerInterval = setInterval(() => {
            if (!matchmakingActive) {
                clearInterval(timerInterval);
                return;
            }
            
            // Используем globalSearchStartTime для постоянного отображения общего времени поиска
            const elapsed = Date.now() - globalSearchStartTime;
            const seconds = Math.floor(elapsed / 1000) % 60;
            const minutes = Math.floor(elapsed / 60000);
            
            // Обновляем только текст внутри элемента, сохраняя структуру
            const timeNode = document.createTextNode(`${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`);
            
            // Проверяем содержимое
            if (timerText.childNodes[0] && timerText.childNodes[0].nodeType === Node.TEXT_NODE) {
                timerText.replaceChild(timeNode, timerText.childNodes[0]);
            } else {
                timerText.insertBefore(timeNode, timerText.firstChild);
            }
            
            // Проверяем, не пора ли начать анимацию для следующей стадии
            // Но только если у нас не бесконечная стадия и анимация не уже в процессе
            if (!stageTransitionInProgress && searchStage < searchRanges.length - 1) {
                // Для определения перехода используем стадию и время с начала текущей стадии
                const stageElapsed = Date.now() - searchStartTime;
                const currentStageTime = searchTimes[searchStage];
                if (currentStageTime !== Infinity && stageElapsed >= currentStageTime - ANIMATION_PRESTART) {
                    // Начинаем анимацию перехода заранее
                    stageTransitionInProgress = true;
                    prepareNextStageAnimation();
                }
            }
        }, 50); // Уменьшаем интервал до 50мс для более точного отслеживания
    }
}

/**
 * Подготавливает анимацию для следующей стадии поиска
 */
function prepareNextStageAnimation() {
    // Запускаем анимацию заранее для плавного перехода
    updateSearchStageIndicator(searchStage + 1, true);
    
    // Обновляем UI компоненты для следующей стадии
    const modal = document.querySelector('.fastGame-matchmaking-modal');
    if (modal) {
        modal.classList.remove('initial');
    }
    
    // Рассчитываем, сколько времени осталось до точного момента перехода
    const elapsedSinceStart = Date.now() - searchStartTime;
    const timeToExactTransition = searchTimes[searchStage] - elapsedSinceStart;
    
    // Запланируем точный переход на следующую стадию
    if (timeToExactTransition > 0) {
        clearTimeout(searchTimeout);
        searchTimeout = setTimeout(() => {
            // Увеличиваем стадию поиска
            searchStage++;
            
            // Сбрасываем флаг анимации
            stageTransitionInProgress = false;
            
            // Обновляем время начала текущей стадии, НО НЕ глобальное время
            searchStartTime = Date.now();
            
            // Отправляем запрос с новыми параметрами
            sendMatchmakingRequest();
        }, timeToExactTransition);
    } else {
        // Если мы уже опоздали (что маловероятно), выполняем переход немедленно
        searchStage++;
        stageTransitionInProgress = false;
        searchStartTime = Date.now();
        sendMatchmakingRequest();
    }
}

/**
 * Обновляет индикатор стадии поиска с плавной анимацией
 * @param {number} targetStage - Стадия, которую нужно активировать
 * @param {boolean} isPreparation - Флаг, указывающий, что это подготовка к переходу
 */
function updateSearchStageIndicator(targetStage, isPreparation = false) {
    const stageItems = document.querySelectorAll('.fastGame-search-stage-item');
    
    if (stageItems.length) {
        // Сначала обрабатываем предыдущие стадии
        for (let i = 0; i < targetStage; i++) {
            if (stageItems[i] && !stageItems[i].classList.contains('previous')) {
                stageItems[i].classList.remove('active');
                stageItems[i].classList.add('previous');
            }
        }
        
        // Затем активируем текущую стадию
        requestAnimationFrame(() => {
            if (stageItems[targetStage]) {
                // Сначала снимаем класс active с элементов, которые не должны быть активны
                stageItems.forEach((item, index) => {
                    if (index !== targetStage) {
                        item.classList.remove('active');
                    }
                });
                
                // Форсируем перерасчет layout перед добавлением класса
                stageItems[targetStage].offsetHeight;
                
                // Затем добавляем active только целевому
                stageItems[targetStage].classList.add('active');
            }
        });
        
        // Сбрасываем следующие стадии
        for (let i = targetStage + 1; i < stageItems.length; i++) {
            stageItems[i].classList.remove('active', 'previous');
        }
    }
}

/**
 * Отправляет запрос на поиск игры
 */
function sendMatchmakingRequest() {
    if (!matchmakingActive) return;
    
    clearTimeout(searchTimeout);
    
    const currentRange = searchRanges[searchStage];
    const searchTime = searchTimes[searchStage];
    
    // Обновляем индикатор (только если не идет подготовка анимации)
    if (!stageTransitionInProgress) {
        updateSearchStageIndicator(searchStage);
    }
    
    // Отправляем сообщение о поиске через WebSocket
    if (ws && ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify({
            type: 'fastGameSearch',
            playerRank: playerRank,
            range: currentRange
        }));
    } else {
        console.error('WebSocket не готов или не подключен');
        showToast('Ошибка соединения. Попробуйте позже.');
        cancelMatchmaking();
        return;
    }
    
    // Здесь не устанавливаем таймер для следующей стадии, 
    // т.к. это теперь происходит в startSearchTimer и prepareNextStageAnimation
}

/**
 * Переходит к следующей стадии поиска
 * Эта функция вызывается только при внешнем событии (не по таймеру)
 */
function nextSearchStage() {
    if (searchStage < searchRanges.length - 1) {
        // Убираем класс initial, т.к. у нас будет больше одного пункта
        const modal = document.querySelector('.fastGame-matchmaking-modal');
        if (modal) {
            modal.classList.remove('initial');
        }
        
        // Переходим к следующей стадии
        searchStage++;
        
        // Обновляем время начала ТЕКУЩЕЙ стадии, не трогая глобальное время
        searchStartTime = Date.now();
        
        // Обновляем индикатор и отправляем запрос
        updateSearchStageIndicator(searchStage);
        sendMatchmakingRequest();
    } else {
        // Достигли последней стадии, продолжаем искать с максимальным диапазоном
        sendMatchmakingRequest();
    }
}

/**
 * Отменяет поиск игры
 * @param {boolean} isDecline - Флаг, указывающий, что это отклонение найденного матча, а не просто отмена поиска
 */
export function cancelMatchmaking(isDecline = false) {
    if (!matchmakingActive) return;
    
    matchmakingActive = false;
    clearTimeout(searchTimeout);
    clearTimeout(matchFoundTimeout);
    clearInterval(timerInterval);
    stageTransitionInProgress = false;
    
    // Определяем, какой тип сообщения отправить
    const messageType = isDecline ? 'declineFastGame' : 'cancelFastGameSearch';
    
    // Уведомляем сервер об отмене/отклонении
    if (ws && ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify({
            type: messageType
        }));
    }
    
    // Закрываем модальное окно
    closeMatchmakingModal();
    
    // Показываем разные сообщения в зависимости от причины отмены
    if (isDecline) {
        showToast('Вы отклонили игру');
    } else {
        showToast('Поиск игры отменен');
    }
}

/**
 * Закрывает модальное окно поиска игры
 */
function closeMatchmakingModal() {
    const modal = document.querySelector('.fastGame-matchmaking-modal');
    const backdrop = document.querySelector('.fastGame-matchmaking-modal-backdrop');
    
    if (modal) {
        modal.classList.remove('visible');
    }
    
    if (backdrop) {
        backdrop.classList.remove('visible');
        
        // Удаляем элемент после завершения анимации (ускорено)
        setTimeout(() => {
            if (backdrop && backdrop.parentNode) {
                backdrop.remove();
            }
        }, 200); // Сокращено с 400мс до 200мс
    }
}

/**
 * Обрабатывает сообщения о поиске игры
 * @param {Event} event - Событие с данными сообщения
 */
function handleMatchmakingMessage(event) {
    const data = event.detail;
    
    switch(data.type) {
        case 'matchFound':
            handleMatchFound(data);
            break;
        case 'matchCancelled':
            handleMatchCancelled(data);
            break;
        case 'matchAccepted':
            handleMatchAccepted(data); // Передаем данные в обработчик
            break;
        case 'matchmakingTimeout':
            handleMatchCancelled({ reason: 'timeout' });
            break;
        default:
            console.warn('Неизвестный тип сообщения MatchmakingMessage:', data.type);
    }
}

/**
 * Плавная замена содержимого модального окна
 * @param {string} newHTML - Новое HTML содержимое
 * @param {function} callback - Функция обратного вызова после замены
 */
function smoothModalTransition(newHTML, callback) {
    const currentModal = document.querySelector('.fastGame-matchmaking-modal');
    const currentBackdrop = document.querySelector('.fastGame-matchmaking-modal-backdrop');
    
    if (currentModal && currentBackdrop) {
        // Плавно скрываем текущее модальное окно (ускорено)
        currentModal.style.transition = 'transform 0.2s ease-out, opacity 0.2s ease-out'; // Сокращено с 0.4s до 0.2s
        currentModal.style.transform = 'translateY(25px) scale(0.95)';
        currentModal.style.opacity = '0';
        
        // Используем requestAnimationFrame для более плавной анимации
        setTimeout(() => {
            // Заменяем содержимое модального окна
            currentBackdrop.innerHTML = newHTML;
            
            // Показываем новое модальное окно
            const newModal = currentBackdrop.querySelector('.fastGame-matchmaking-modal');
            if (newModal) {
                // Форсируем перерасчет layout перед анимацией
                newModal.offsetHeight;
                
                requestAnimationFrame(() => {
                    newModal.classList.add('visible');
                    
                    // Вызываем callback после анимации появления
                    if (callback) setTimeout(callback, 50); // Сокращено со 100мс до 50мс
                });
            }
        }, 200); // Сокращено с 400мс до 200мс
    }
}

/**
 * Обрабатывает сообщение о найденной игре
 * @param {Object} data - Данные сообщения
 */
function handleMatchFound(data) {
    clearTimeout(searchTimeout);
    stageTransitionInProgress = false;
    
    // Создаем шаблон для нового модального окна
    const newModalHTML = getMatchFoundModalTemplate(data.opponent);
    
    // Выполняем плавный переход
    smoothModalTransition(newModalHTML, () => {
        // Добавляем обработчики для кнопок
        const acceptButton = document.querySelector('.fastGame-accept-match-btn');
        const declineButton = document.querySelector('.fastGame-decline-match-btn');
        
        if (acceptButton) {
            acceptButton.addEventListener('click', acceptMatch);
        }
        
        if (declineButton) {
            declineButton.addEventListener('click', () => cancelMatchmaking(true));
        }
        
        // Запускаем таймер обратного отсчета
        startAcceptTimer();
    });
    
    // Устанавливаем таймер для автоматической отмены через 20 секунд
    matchFoundTimeout = setTimeout(() => {
        if (matchmakingActive) {
            cancelMatchmaking(true);
        }
    }, 20000);
}

/**
 * Генерирует HTML-шаблон модального окна о найденной игре
 * @param {Object} opponent - Данные о сопернике
 * @returns {string} HTML-шаблон
 */
function getMatchFoundModalTemplate(opponent) {
    // Обрабатываем случай, когда opponent может быть undefined
    const username = opponent?.username || 'Неизвестный';
    const rank = opponent?.rank || '?';
    const avatarUrl = opponent?.avatarUrl || '/img/default-avatar.png';
    
    return `
        <div class="fastGame-matchmaking-modal">
            <div class="fastGame-gradient-bg"></div>
            <div class="fastGame-matchmaking-modal-content">
                <div class="fastGame-modal-glow top-left"></div>
                <div class="fastGame-modal-glow bottom-right"></div>
                
                <h2 class="fastGame-fade-in fastGame-no-animation">Соперник найден!</h2>
                
                <div class="fastGame-match-opponent-info fastGame-fade-in fastGame-no-animation">
                    <img src="${avatarUrl}" alt="${username}" class="fastGame-opponent-avatar">
                    <div class="fastGame-opponent-details">
                        <div class="fastGame-opponent-username">${username}</div>
                        <div class="fastGame-opponent-rank">Ранг: #${rank}</div>
                    </div>
                </div>
                
                <div class="fastGame-matchmaking-timer fastGame-fade-in fastGame-no-animation">
                    <div class="fastGame-timer-text">00:20<span>принять</span></div>
                </div>
                
                <div class="fastGame-match-actions">
                    <button class="fastGame-accept-match-btn fastGame-fade-in fastGame-no-animation">Принять</button>
                    <button class="fastGame-decline-match-btn fastGame-fade-in fastGame-no-animation">Отклонить</button>
                </div>
            </div>
        </div>
    `;
}

/**
 * Запускает таймер обратного отсчета для принятия игры
 */
function startAcceptTimer() {
    const timerText = document.querySelector('.fastGame-timer-text');
    
    if (timerText) {
        const totalTime = 20000; // 20 секунд
        const startTime = Date.now();
        
        clearInterval(timerInterval);
        
        // Убеждаемся, что начальное значение установлено с правильной структурой DOM
        timerText.innerHTML = '';
        timerText.appendChild(document.createTextNode('00:20'));
        const spanElement = document.createElement('span');
        spanElement.textContent = 'принять';
        timerText.appendChild(spanElement);
        
        timerInterval = setInterval(() => {
            const elapsed = Date.now() - startTime;
            const remaining = totalTime - elapsed;
            
            if (remaining <= 0 || !matchmakingActive) {
                clearInterval(timerInterval);
                // Обновляем только текст, сохраняя структуру
                if (timerText.firstChild && timerText.firstChild.nodeType === Node.TEXT_NODE) {
                    timerText.firstChild.nodeValue = '00:00';
                }
                if (timerText.querySelector('span')) {
                    timerText.querySelector('span').textContent = 'время вышло';
                }
            } else {
                const seconds = Math.floor(remaining / 1000);
                // Обновляем только текст, сохраняя структуру
                if (timerText.firstChild && timerText.firstChild.nodeType === Node.TEXT_NODE) {
                    timerText.firstChild.nodeValue = `00:${seconds.toString().padStart(2, '0')}`;
                }
            }
        }, 100);
    }
}

/**
 * Принимает найденную игру
 */
function acceptMatch() {
    // Отправляем сообщение о принятии игры
    if (ws && ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify({
            type: 'acceptFastGame'
        }));
    } else {
        console.error('WebSocket не готов или не подключен');
        showToast('Ошибка соединения. Попробуйте позже.');
        cancelMatchmaking();
        return;
    }
    
    // Получаем данные текущего пользователя и соперника
    const currentUser = {
        username: document.querySelector('.profile-btn')?.getAttribute('data-username') || 'Вы',
        avatarUrl: document.querySelector('.profile-btn img')?.src || '/img/default-avatar.png',
        status: 'accepted'
    };
    
    const opponent = {
        username: document.querySelector('.fastGame-opponent-username')?.textContent || 'Соперник',
        avatarUrl: document.querySelector('.fastGame-opponent-avatar')?.src || '/img/default-avatar.png',
        status: 'waiting'
    };
    
    // Переходим к экрану VS
    transitionToVersusScreen(currentUser, opponent);
}

/**
 * Переходит к экрану VS
 * @param {Object} currentUser - Данные текущего пользователя
 * @param {Object} opponent - Данные соперника
 */
function transitionToVersusScreen(currentUser, opponent) {
    // Создаем шаблон для экрана VS
    const vsModalHTML = getVersusScreenTemplate(currentUser, opponent);
    
    // Выполняем плавный переход
    smoothModalTransition(vsModalHTML);
}

/**
 * Генерирует HTML-шаблон экрана VS
 * @param {Object} currentUser - Данные текущего пользователя
 * @param {Object} opponent - Данные соперника
 * @returns {string} HTML-шаблон
 */
function getVersusScreenTemplate(currentUser, opponent) {
    return `
        <div class="fastGame-matchmaking-modal fastGame-versus-modal">
            <div class="fastGame-gradient-bg"></div>
            <div class="fastGame-matchmaking-modal-content">
                <div class="fastGame-modal-glow top-left"></div>
                <div class="fastGame-modal-glow bottom-right"></div>
                
                <h2 class="fastGame-fade-in fastGame-no-animation">Игра начинается!</h2>
                
                <div class="fastGame-match-versus-display fastGame-fade-in fastGame-no-animation">
                    <div class="fastGame-player-card">
                        <div class="fastGame-player-avatar-wrapper fastGame-${currentUser.status}">
                            <img src="${currentUser.avatarUrl}" alt="${currentUser.username}" class="fastGame-player-avatar">
                        </div>
                        <div class="fastGame-player-name">${currentUser.username}</div>
                        <div class="fastGame-player-status">${currentUser.status === 'accepted' ? 'Принял' : 'Ожидание'}</div>
                    </div>
                    
                    <div class="fastGame-versus-text">VS</div>
                    
                    <div class="fastGame-player-card">
                        <div class="fastGame-player-avatar-wrapper fastGame-${opponent.status}">
                            <img src="${opponent.avatarUrl}" alt="${opponent.username}" class="fastGame-player-avatar">
                        </div>
                        <div class="fastGame-player-name">${opponent.username}</div>
                        <div class="fastGame-player-status">${opponent.status === 'accepted' ? 'Принял' : 'Ожидание'}</div>
                    </div>
                </div>
                
                <div class="fastGame-match-status fastGame-fade-in fastGame-no-animation">
                    <p>Ожидание принятия игры соперником...</p>
                    <div class="fastGame-loading-spinner"></div>
                </div>
            </div>
        </div>
    `;
}

/**
 * Показывает экран VS с обоими принятыми игроками (без предыдущей модалки)
 * @param {Object} currentUser - Данные текущего пользователя
 * @param {Object} opponent - Данные соперника
 */
function showVersusScreen(currentUser, opponent) {
    const modalHTML = `
        <div class="fastGame-matchmaking-modal-backdrop">
            ${getAcceptedVersusScreenTemplate(currentUser, opponent)}
        </div>
    `;
    
    document.body.insertAdjacentHTML('beforeend', modalHTML);
    
    // Анимируем появление
    requestAnimationFrame(() => {
        const modalBackdrop = document.querySelector('.fastGame-matchmaking-modal-backdrop');
        const modal = document.querySelector('.fastGame-matchmaking-modal');
        
        modalBackdrop.offsetHeight; // Форсируем перерасчет layout
        
        if (modalBackdrop) modalBackdrop.classList.add('visible');
        if (modal) modal.classList.add('visible');
    });
}

/**
 * Переходит к экрану VS с обоими принятыми игроками
 * @param {Object} currentUser - Данные текущего пользователя
 * @param {Object} opponent - Данные соперника
 */
function transitionToVersusScreenAccepted(currentUser, opponent) {
    // Создаем шаблон для экрана VS с принятой игрой
    const vsModalHTML = getAcceptedVersusScreenTemplate(currentUser, opponent);
    
    // Выполняем плавный переход
    smoothModalTransition(vsModalHTML);
}

/**
 * Генерирует HTML-шаблон экрана VS с обоими принятыми игроками
 * @param {Object} currentUser - Данные текущего пользователя
 * @param {Object} opponent - Данные соперника
 * @returns {string} HTML-шаблон
 */
function getAcceptedVersusScreenTemplate(currentUser, opponent) {
    return `
        <div class="fastGame-matchmaking-modal fastGame-versus-modal">
            <div class="fastGame-gradient-bg"></div>
            <div class="fastGame-matchmaking-modal-content">
                <div class="fastGame-modal-glow top-left"></div>
                <div class="fastGame-modal-glow bottom-right"></div>
                
                <h2 class="fastGame-fade-in fastGame-no-animation">Игра начинается!</h2>
                
                <div class="fastGame-match-versus-display fastGame-fade-in fastGame-no-animation">
                    <div class="fastGame-player-card">
                        <div class="fastGame-player-avatar-wrapper fastGame-accepted">
                            <img src="${currentUser.avatarUrl}" alt="${currentUser.username}" class="fastGame-player-avatar">
                        </div>
                        <div class="fastGame-player-name">${currentUser.username}</div>
                        <div class="fastGame-player-status">Принял</div>
                    </div>
                    
                    <div class="fastGame-versus-text">VS</div>
                    
                    <div class="fastGame-player-card">
                        <div class="fastGame-player-avatar-wrapper fastGame-accepted">
                            <img src="${opponent.avatarUrl}" alt="${opponent.username}" class="fastGame-player-avatar">
                        </div>
                        <div class="fastGame-player-name">${opponent.username}</div>
                        <div class="fastGame-player-status">Принял</div>
                    </div>
                </div>
                
                <div class="fastGame-match-status fastGame-fade-in fastGame-no-animation">
                    <p>Оба игрока приняли игру!</p>
                    <p class="fastGame-status-subtitle">Переход к игре через 3 секунды...</p>
                </div>
            </div>
        </div>
    `;
}

/**
 * Обрабатывает сообщение об отмене игры
 */
function handleMatchCancelled(data) {
    if (!matchmakingActive) return;
    
    matchmakingActive = false;
    clearTimeout(searchTimeout);
    clearTimeout(matchFoundTimeout);
    clearInterval(timerInterval);
    stageTransitionInProgress = false;
    
    // Определяем текст сообщения в зависимости от причины отмены
    const reason = data?.reason || 'unknown';
    let messageText = 'Игра отменена';
    let toastText = 'Игра отменена';
    
    if (reason === 'declined') {
        messageText = 'Соперник отклонил игру';
        toastText = 'Игра отменена: соперник отклонил матч';
    } else if (reason === 'timeout') {
        messageText = 'Время ожидания истекло';
        toastText = 'Игра отменена: истекло время ожидания';
    } else if (reason === 'disconnect') {
        messageText = 'Соперник отключился';
        toastText = 'Игра отменена: соперник отключился';
    }
    
    // Обновляем экран VS, если он открыт
    const versusModal = document.querySelector('.fastGame-versus-modal');
    if (versusModal) {
        const opponentAvatar = document.querySelector('.fastGame-player-avatar-wrapper.fastGame-waiting');
        const opponentStatus = document.querySelector('.fastGame-player-avatar-wrapper.fastGame-waiting + .fastGame-player-name + .fastGame-player-status');
        
        if (opponentAvatar) {
            // Форсируем перерасчет layout перед добавлением классов для анимации
            opponentAvatar.offsetHeight;
            
            opponentAvatar.classList.remove('fastGame-waiting');
            opponentAvatar.classList.add('fastGame-declined');
            
            if (opponentStatus) {
                opponentStatus.textContent = reason === 'timeout' ? 'Время истекло' : 'Отклонил';
            }
        }
        
        const matchStatus = document.querySelector('.fastGame-match-status');
        if (matchStatus) {
            matchStatus.innerHTML = `
                <p class="fastGame-fade-in fastGame-no-animation">${messageText}</p>
                <p class="fastGame-status-subtitle fastGame-fade-in fastGame-no-animation">Закрытие через 3 секунды...</p>
            `;
        }
        
        setTimeout(() => {
            closeMatchmakingModal();
        }, 3000);
    } else {
        // Проверяем, находимся ли мы на экране принятия матча
        const matchFoundModal = document.querySelector('.fastGame-matchmaking-modal:not(.fastGame-versus-modal)');
        if (matchFoundModal) {
            // Создаем шаблон для экрана отмены
            const cancelModalHTML = `
                <div class="fastGame-matchmaking-modal">
                    <div class="fastGame-gradient-bg"></div>
                    <div class="fastGame-matchmaking-modal-content">
                        <div class="fastGame-modal-glow top-left"></div>
                        <div class="fastGame-modal-glow bottom-right"></div>
                        
                        <h2 class="fastGame-fade-in fastGame-no-animation">Игра отменена</h2>
                        
                        <div class="fastGame-match-cancel-icon fastGame-fade-in fastGame-no-animation">
                            <svg viewBox="0 0 24 24" fill="none" stroke-linecap="round" stroke-linejoin="round">
                                <circle cx="12" cy="12" r="10"></circle>
                                <line x1="15" y1="9" x2="9" y2="15"></line>
                                <line x1="9" y1="9" x2="15" y2="15"></line>
                            </svg>
                        </div>
                        
                        <p class="fastGame-match-cancel-message fastGame-fade-in fastGame-no-animation">${messageText}</p>
                        <p class="fastGame-status-subtitle fastGame-fade-in fastGame-no-animation">Закрытие через 3 секунды...</p>
                    </div>
                </div>
            `;
            
            // Выполняем плавный переход
            smoothModalTransition(cancelModalHTML);
            
            // Закрываем через 3 секунды
            setTimeout(() => {
                closeMatchmakingModal();
            }, 3000);
        } else {
            // Если никаких особых модалок нет, просто закрываем текущую модалку
            closeMatchmakingModal();
        }
    }
    
    showToast(toastText);
}

/**
 * Обрабатывает принятие игры соперником
 * @param {Object} data - Данные о принятии игры
 */
function handleMatchAccepted(data) {
    matchmakingActive = false;
    clearTimeout(matchFoundTimeout);
    clearInterval(timerInterval);
    stageTransitionInProgress = false;
    
    // Получаем данные оппонента из события (если они есть)
    const opponent = data?.opponent || {
        username: document.querySelector('.fastGame-opponent-username')?.textContent || 'Соперник',
        avatarUrl: document.querySelector('.fastGame-opponent-avatar')?.src || '/img/default-avatar.png',
        status: 'accepted' // Теперь уже accepted, так как соперник принял игру
    };
    
    // Получаем данные текущего пользователя
    const currentUser = {
        username: document.querySelector('.profile-btn')?.getAttribute('data-username') || 'Вы',
        avatarUrl: document.querySelector('.profile-btn img')?.src || '/img/default-avatar.png',
        status: 'accepted'
    };
    
    // Проверяем, открыт ли уже экран VS
    const versusModal = document.querySelector('.fastGame-versus-modal');
    if (versusModal) {
        // Если экран VS уже открыт, просто обновляем статус соперника
        const opponentAvatar = document.querySelector('.fastGame-player-avatar-wrapper.fastGame-waiting');
        const opponentStatus = document.querySelector('.fastGame-player-avatar-wrapper.fastGame-waiting + .fastGame-player-name + .fastGame-player-status');
        
        if (opponentAvatar) {
            // Форсируем перерасчет layout перед добавлением классов для анимации
            opponentAvatar.offsetHeight;
            
            opponentAvatar.classList.remove('fastGame-waiting');
            opponentAvatar.classList.add('fastGame-accepted');
            
            if (opponentStatus) {
                opponentStatus.textContent = 'Принял';
            }
        }
        
        const matchStatus = document.querySelector('.fastGame-match-status');
        if (matchStatus) {
            matchStatus.innerHTML = `
                <p class="fastGame-fade-in fastGame-no-animation">Оба игрока приняли игру!</p>
                <p class="fastGame-status-subtitle fastGame-fade-in fastGame-no-animation">Переход к игре через 3 секунды...</p>
            `;
        }
    } else {
        // Если экран VS еще не открыт, показываем его сразу с обоими принятыми игроками
        if (document.querySelector('.fastGame-matchmaking-modal-backdrop')) {
            // Если какая-то модалка уже открыта, транзишн к экрану VS
            transitionToVersusScreenAccepted(currentUser, opponent);
        } else {
            // Если никакой модалки нет, показываем модалку VS с нуля
            showVersusScreen(currentUser, opponent);
        }
    }
    
    // В любом случае, закрываем через 3 секунды
    setTimeout(() => {
        closeMatchmakingModal();
        showToast('Функционал игры находится в разработке!');
    }, 3000);
}

/**
 * Получает ранг игрока от сервера
 * @returns {Promise<number|null>} Ранг игрока или null в случае ошибки
 */
async function fetchPlayerRank() {
    try {
        const response = await fetch('/api/osu/player-rank');
        if (!response.ok) throw new Error('Не удалось получить ранг игрока');
        
        const data = await response.json();
        return data.rank;
    } catch (error) {
        console.error('Ошибка при получении ранга игрока:', error);
        // Если не удалось получить ранг через API, используем случайное значение для демонстрации
        return Math.floor(Math.random() * 100000) + 1;
    }
}