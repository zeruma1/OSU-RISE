// search.js
let currentTab = null;
let originalRanks = {}; // Для хранения оригинальных рангов
let noResultsMessageElement = null; // Глобальная ссылка на элемент сообщения
let messageCreationInProgress = false; // Флаг для предотвращения множественных созданий

/**
 * Инициализирует функциональность поиска для вкладки
 * @param {string} tabName - Имя активной вкладки
 */
export function initSearch(tabName) {
    currentTab = tabName;
    const searchInput = document.querySelector('.header-search input');
    
    if (!searchInput) {
        console.error('Элемент поиска не найден');
        return;
    }
    
    // Очищаем поле поиска при смене вкладки
    searchInput.value = '';
    
    // Очищаем ссылку на сообщение при смене вкладки
    removeNoResultsMessage();
    noResultsMessageElement = null;
    
    // Проверяем, является ли текущая вкладка поддерживаемой для поиска
    const isSearchableTab = tabName === 'leaderboard' || tabName === 'add-friend';
    
    // Проверяем ширину экрана
    const isWideScreen = window.innerWidth > 1500;
    
    // Показываем или скрываем поле поиска в зависимости от вкладки и ширины экрана
    const headerSearch = document.querySelector('.header-search');
    if (headerSearch) {
        if (isSearchableTab && isWideScreen) {
            headerSearch.style.display = 'flex';
            // Делаем небольшую задержку перед показом для плавной анимации
            setTimeout(() => {
                headerSearch.classList.add('visible');
            }, 10);
        } else {
            headerSearch.classList.remove('visible');
            // Задержка перед скрытием элемента для завершения анимации
            setTimeout(() => {
                headerSearch.style.display = 'none';
            }, 300);
        }
    }
    
    // Добавляем подсказку в зависимости от вкладки
    if (isSearchableTab) {
        searchInput.placeholder = tabName === 'leaderboard' ? 'Найти игрока' : 'Найти друга';
    }
    
    // Убираем предыдущий обработчик, если он был
    searchInput.removeEventListener('input', handleSearchInput);
    
    // Добавляем новый обработчик
    if (isSearchableTab) {
        searchInput.addEventListener('input', handleSearchInput);
        
        // Сохраняем оригинальные ранги при первой загрузке лидерборда
        if (tabName === 'leaderboard') {
            saveOriginalRanks();
        }
    }
}

/**
 * Сохраняет оригинальные ранги игроков
 */
function saveOriginalRanks() {
    originalRanks = {};
    const playerCards = document.querySelectorAll('.player-card');
    
    playerCards.forEach((card, index) => {
        const osuId = card.getAttribute('data-osuid');
        originalRanks[osuId] = {
            rank: index + 1,
            topClass: index < 3 ? `top-${index + 1}` : ''
        };
    });
}

/**
 * Обрабатывает ввод в поле поиска
 * @param {Event} event - Событие ввода
 */
function handleSearchInput(event) {
    const searchTerm = event.target.value.toLowerCase().trim();
    
    if (currentTab === 'leaderboard') {
        // Если строка поиска пуста и сообщение отображается, сначала скрываем его
        if (searchTerm === '' && noResultsMessageElement) {
            removeNoResultsMessage();
            setTimeout(() => {
                filterLeaderboardCards(searchTerm);
            }, 300);
        } else {
            filterLeaderboardCards(searchTerm);
        }
    } else if (currentTab === 'add-friend') {
        // Аналогично для вкладки добавления друзей
        if (searchTerm === '' && noResultsMessageElement) {
            removeNoResultsMessage();
            setTimeout(() => {
                filterFriendCards(searchTerm);
            }, 300);
        } else {
            filterFriendCards(searchTerm);
        }
    }
}

/**
 * Удаляет сообщение "Игроки не найдены" с анимацией
 */
function removeNoResultsMessage() {
    if (!noResultsMessageElement) return;
    
    // Плавно скрываем сообщение
    noResultsMessageElement.style.transition = 'opacity 0.3s ease, transform 0.3s ease';
    noResultsMessageElement.style.opacity = '0';
    noResultsMessageElement.style.transform = 'translateY(10px)';
    
    // Удаляем сообщение после анимации
    setTimeout(() => {
        if (noResultsMessageElement && noResultsMessageElement.parentNode) {
            noResultsMessageElement.parentNode.removeChild(noResultsMessageElement);
        }
        noResultsMessageElement = null;
    }, 300);
}

/**
 * Фильтрует карточки игроков в лидерборде
 * @param {string} searchTerm - Поисковый запрос
 */
function filterLeaderboardCards(searchTerm) {
    const playerCards = document.querySelectorAll('.player-card');
    let visibleCount = 0;
    
    // Сохраняем оригинальные ранги при первом поиске, если они еще не сохранены
    if (Object.keys(originalRanks).length === 0) {
        saveOriginalRanks();
    }
    
    playerCards.forEach((card) => {
        const playerName = card.querySelector('.player-nickname').textContent.toLowerCase();
        const isMatch = playerName.includes(searchTerm);
        const osuId = card.getAttribute('data-osuid');
        
        if (isMatch) {
            visibleCount++;
            card.style.display = '';
            
            // Восстанавливаем оригинальный ранг и топ-класс
            if (originalRanks[osuId]) {
                const rankContainer = card.querySelector('.player-rank');
                if (rankContainer) {
                    rankContainer.textContent = originalRanks[osuId].rank;
                }
                
                // Восстанавливаем класс для топ-3
                card.classList.remove('top-1', 'top-2', 'top-3');
                if (originalRanks[osuId].topClass) {
                    card.classList.add(originalRanks[osuId].topClass);
                }
            }
        } else {
            card.style.display = 'none';
        }
    });
    
    // Показываем или скрываем сообщение о пустых результатах с анимацией
    handleNoResultsMessage(visibleCount, '.leaderboard-grid');
    
    // Обновляем скроллбар лидерборда
    import('./leaderboard/leaderboardScrollbar.js').then(module => {
        if (typeof module.initLeaderboardScrollbar === 'function') {
            setTimeout(() => module.initLeaderboardScrollbar(), 100);
        }
    }).catch(error => {
        console.error('Ошибка при обновлении скроллбара лидерборда:', error);
    });
}

/**
 * Фильтрует карточки друзей
 * @param {string} searchTerm - Поисковый запрос
 */
function filterFriendCards(searchTerm) {
    const friendCards = document.querySelectorAll('.friend-card');
    let visibleCount = 0;
    
    friendCards.forEach(card => {
        const friendName = card.querySelector('.friend-name').textContent.toLowerCase();
        const isMatch = friendName.includes(searchTerm);
        
        if (isMatch) {
            visibleCount++;
            card.style.display = '';
        } else {
            card.style.display = 'none';
        }
    });
    
    // Показываем или скрываем сообщение о пустых результатах с анимацией
    handleNoResultsMessage(visibleCount, '.add-friend-content');
    
    // Обновляем скроллбар друзей
    import('./addFriends/addFriendsScrollbar.js').then(module => {
        if (typeof module.initAddFriendsScrollbar === 'function') {
            setTimeout(() => module.initAddFriendsScrollbar(), 100);
        }
    }).catch(error => {
        console.error('Ошибка при обновлении скроллбара друзей:', error);
    });
}

/**
 * Обрабатывает показ/скрытие сообщения об отсутствии результатов
 * @param {number} visibleCount - Количество видимых элементов
 * @param {string} containerSelector - Селектор контейнера
 */
function handleNoResultsMessage(visibleCount, containerSelector) {
    // Если уже идет процесс создания сообщения, прерываем
    if (messageCreationInProgress) return;
    
    const container = document.querySelector(containerSelector);
    if (!container) return;
    
    // Если есть видимые элементы, скрываем сообщение
    if (visibleCount > 0) {
        if (noResultsMessageElement) {
            removeNoResultsMessage();
        }
        return;
    }
    
    // Если нет видимых элементов и сообщение уже отображается, ничего не делаем
    if (noResultsMessageElement && noResultsMessageElement.parentNode) {
        return;
    }
    
    // Устанавливаем флаг создания
    messageCreationInProgress = true;
    
    // Задержка перед показом сообщения
    setTimeout(() => {
        // Проверяем, не был ли элемент создан за время задержки
        if (noResultsMessageElement) {
            messageCreationInProgress = false;
            return;
        }
        
        // Создаем сообщение
        noResultsMessageElement = document.createElement('p');
        noResultsMessageElement.className = 'no-search-results';
        noResultsMessageElement.textContent = 'Игроки не найдены';
        noResultsMessageElement.style.textAlign = 'center';
        noResultsMessageElement.style.margin = '30px auto';
        noResultsMessageElement.style.color = '#8a8da8';
        noResultsMessageElement.style.fontSize = '18px';
        noResultsMessageElement.style.width = '100%';
        noResultsMessageElement.style.opacity = '0';
        noResultsMessageElement.style.transform = 'translateY(10px)';
        noResultsMessageElement.style.transition = 'opacity 0.3s ease, transform 0.3s ease';
        
        // Добавляем сообщение в контейнер
        container.appendChild(noResultsMessageElement);
        
        // Запускаем анимацию появления
        setTimeout(() => {
            if (noResultsMessageElement) {
                noResultsMessageElement.style.opacity = '1';
                noResultsMessageElement.style.transform = 'translateY(0)';
            }
            messageCreationInProgress = false;
        }, 10);
    }, 150);
}