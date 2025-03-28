// active.js
import { handleTabChange } from './router.js';
import { siteSettingsModalShow } from './site-settings/siteSettings.js';
import { getNotificationsTemplate, getNotificationCardTemplate } from './notifications/notificationsTemplate.js';
import { initializeMatchmaking } from './fast-game/fastGameMatchmaking.js';

// Глобальные переменные
export let currentUserOsuId = null;
let ws;
let lastNotificationSoundTime = 0;
const notificationSoundCooldown = 2000; // 2 секунды
let reconnectAttempts = 0;
const maxReconnectDelay = 30000; // Максимальная задержка 30 секунд

/**
 * Устанавливает или убирает класс active для кнопки профиля
 * @param {boolean} isActive - Флаг активности
 */
export function setProfileButtonActive(isActive) {
    const profileButton = document.querySelector('.profile-btn');
    if (profileButton) {
        if (isActive) {
            profileButton.classList.add('active');
        } else {
            profileButton.classList.remove('active');
        }
    }
}

/**
 * Воспроизводит звук уведомления с учетом настроек и кулдауна
 */
function playNotificationSound() {
    const notificationsDisabled = localStorage.getItem('notificationsDisabled') === 'true';
    if (notificationsDisabled) return;
    
    const currentTime = Date.now();
    if (currentTime - lastNotificationSoundTime >= notificationSoundCooldown) {
        const audio = new Audio('/sounds/notification.mp3');
        audio.volume = 0.6;
        audio.play().catch(error => console.error('Ошибка при воспроизведении звука:', error));
        lastNotificationSoundTime = currentTime;
    }
}

/**
 * Отображает тост с сообщением
 * @param {string} message - Сообщение для отображения
 * @param {string} type - Тип уведомления (primary, success, error, warning, info)
 * @param {string} title - Заголовок уведомления (опционально)
 * @param {number} duration - Продолжительность отображения в мс (опционально)
 */
export function showToast(message, type = 'primary', title = null, duration = 3000) {
    const toastContainer = document.querySelector('.toast-container');
    if (!toastContainer) return;
    
    // Определяем заголовок в зависимости от типа, если не указан явно
    let toastTitle = title;
    if (!toastTitle) {
        switch (type) {
            case 'success': toastTitle = 'Успех'; break;
            case 'error': toastTitle = 'Ошибка'; break;
            case 'warning': toastTitle = 'Внимание'; break;
            case 'info': toastTitle = 'Информация'; break;
            default: toastTitle = 'Уведомление';
        }
    }
    
    // Создаем новый тост
    const toast = document.createElement('div');
    toast.classList.add('toast', type);
    
    // Ограничиваем количество отображаемых тостов (максимум 3)
    const existingToasts = document.querySelectorAll('.toast');
    if (existingToasts.length >= 3) {
        const oldestToast = existingToasts[0];
        oldestToast.classList.remove('show');
        setTimeout(() => oldestToast.remove(), 300);
    }
    
    toast.innerHTML = `
        <div class="toast-icon"></div>
        <div class="toast-content">
            <div class="toast-title">${toastTitle}</div>
            <div class="toast-message">${message}</div>
        </div>
        <div class="toast-close"></div>
        <div class="toast-progress"></div>
    `;
    
    // Обработчик для закрытия тоста по клику на крестик
    const closeBtn = toast.querySelector('.toast-close');
    closeBtn.addEventListener('click', () => {
        toast.classList.remove('show');
        setTimeout(() => toast.remove(), 300);
    });
    
    // Добавляем тост в контейнер
    toastContainer.appendChild(toast);
    
    // Анимация появления
    setTimeout(() => toast.classList.add('show'), 10);
    
    // Автоматическое скрытие и удаление через указанное время
    const timeoutId = setTimeout(() => {
        toast.classList.remove('show');
        setTimeout(() => toast.remove(), 300);
    }, duration);
    
    // Останавливаем таймер при наведении мыши на тост
    toast.addEventListener('mouseenter', () => {
        clearTimeout(timeoutId);
    });
    
    // Возобновляем таймер при уходе мыши с тоста
    toast.addEventListener('mouseleave', () => {
        setTimeout(() => {
            toast.classList.remove('show');
            setTimeout(() => toast.remove(), 300);
        }, 1000);
    });
    
    // Воспроизводим звук уведомления (если не отключен)
    if (type !== 'error') {
        playNotificationSound();
    }
}

/**
 * Устанавливает WebSocket соединение и настраивает обработчики сообщений
 */
function connectWebSocket() {
    // Используем относительный URL для WebSocket, чтобы работало в разных окружениях
    const wsProtocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsHost = window.location.host;
    
    console.log('Попытка подключения к WebSocket...');
    ws = new WebSocket(`${wsProtocol}//${wsHost}`);
    
    ws.onopen = () => {
        console.log('WebSocket подключен');
        reconnectAttempts = 0; // Сбрасываем счетчик попыток при успешном подключении
        
        if (currentUserOsuId) {
            ws.send(JSON.stringify({ type: 'auth', userId: currentUserOsuId }));
        }
        
        // Инициализируем модуль поиска игры
        initializeMatchmaking(ws);
    };
    
    ws.onmessage = (event) => {
        try {
            const data = JSON.parse(event.data);
            
            // Обработка различных типов сообщений
            switch (data.type) {
                case 'friendRequest':
                    handleFriendRequest(data);
                    break;
                case 'friendRequestAccepted':
                    handleFriendRequestAccepted(data);
                    updateNotificationCount(data.count);
                    break;
                case 'friendRequestDeclined':
                    handleFriendRequestDeclined(data);
                    updateNotificationCount(data.count);
                    break;
                case 'friendRequestCancelled':
                    handleRequestCancelled(data);
                    updateNotificationCount(data.count);
                    break;
                case 'notificationCount':
                    updateNotificationCount(data.count);
                    break;
                case 'matchFound':
                case 'matchCancelled':
                case 'matchAccepted':
                case 'matchmakingTimeout':
                    // Создаем и диспатчим кастомное событие для модуля поиска игры
                    const matchmakingEvent = new CustomEvent('matchmakingMessage', { detail: data });
                    document.dispatchEvent(matchmakingEvent);
                    break;
                default:
                    console.log('Неизвестный тип сообщения:', data.type);
            }
        } catch (error) {
            console.error('Ошибка при обработке WebSocket сообщения:', error);
        }
    };
    
    ws.onclose = () => {
        console.log('WebSocket отключен, планируем переподключение...');
        
        // Используем экспоненциальную задержку перед повторным подключением
        const delay = Math.min(1000 * Math.pow(1.5, reconnectAttempts), maxReconnectDelay);
        reconnectAttempts++;
        
        console.log(`Переподключение через ${delay/1000} секунд (попытка ${reconnectAttempts})`);
        setTimeout(connectWebSocket, delay);
    };
    
    ws.onerror = (error) => {
        console.error('Ошибка WebSocket:', error);
    };
}

/**
 * Обработчик сообщения о запросе в друзья
 * @param {Object} data - Данные сообщения
 */
function handleFriendRequest(data) {
    const notificationsDisabled = localStorage.getItem('notificationsDisabled') === 'true';
    if (!notificationsDisabled) {
        playNotificationSound();
    }
    
    const currentTab = localStorage.getItem('activeTab');
    if (currentTab === 'notifications') {
        updateNotificationsRealtime(data);
    }
    
    updateNotificationCount(data.count);
    
    // Показываем тост о новом запросе в друзья
    showToast(`${data.from.username} хочет добавить вас в друзья`, 'info');
    
    // Обновляем кнопки на страницах, если пользователь просматривает профиль
    updateFriendButtonsRealtime(data.from.osuId, 'incoming-request', data.requestId);
}

/**
 * Обработчик сообщения о принятии запроса в друзья
 * @param {Object} data - Данные сообщения
 */
function handleFriendRequestAccepted(data) {
    updateFriendButtonsRealtime(data.fromOsuId, 'friends');
    showToast(`${data.fromUsername} принял вашу заявку в друзья!`, 'success');
}

/**
 * Обработчик сообщения о отклонении запроса в друзья
 * @param {Object} data - Данные сообщения
 */
function handleFriendRequestDeclined(data) {
    updateFriendButtonsRealtime(data.fromOsuId, 'not_friends');
    showToast(`${data.fromUsername} отклонил вашу заявку в друзья`, 'warning');
}

/**
 * Обработчик сообщения об отмене запроса в друзья
 * @param {Object} data - Данные сообщения
 */
function handleRequestCancelled(data) {
    const notificationCard = document.querySelector(`.notification-card[data-request-id="${data.requestId}"]`);
    if (notificationCard) {
        notificationCard.classList.add('fade-out');
        notificationCard.addEventListener('animationend', () => {
            notificationCard.remove();
            checkAndRedrawNotificationsContainer();
        }, { once: true });
    }
    
    updateNotificationCount(data.count);
}

/**
 * Обновляет счетчик уведомлений
 * @param {number} count - Количество непрочитанных уведомлений
 */
export function updateNotificationCount(count) {
    const notificationCountElem = document.querySelector('.notification-count');
    if (notificationCountElem) {
        if (count > 0) {
            notificationCountElem.textContent = count;
            notificationCountElem.classList.add('visible');
        } else {
            notificationCountElem.classList.remove('visible');
        }
    }
}

/**
 * Обновляет список уведомлений в реальном времени
 * @param {Object} data - Данные о новом уведомлении
 */
async function updateNotificationsRealtime(data) {
    const notificationsContainer = document.querySelector('.notifications-container');
    if (!notificationsContainer) return;
    
    const notificationsGrid = document.querySelector('.notifications-grid');
    if (!notificationsGrid) return;
    
    const existingCard = notificationsContainer.querySelector(`.notification-card[data-request-id="${data.requestId}"]`);
    if (existingCard) return; // Карточка уже существует
    
    // Более точный селектор для текста "Нет уведомлений"
    const noNotificationsMessage = notificationsGrid.querySelector('.no-notifications-message');
    
    if (noNotificationsMessage) {
        // Если есть текст "Нет уведомлений", удаляем его
        noNotificationsMessage.remove();
    }
    
    // Добавляем новую карточку в начало сетки
    const newCardHTML = getNotificationCardTemplate({ _id: data.requestId, from: data.from });
    notificationsGrid.insertAdjacentHTML('afterbegin', newCardHTML);
    const newCard = notificationsGrid.querySelector(`.notification-card[data-request-id="${data.requestId}"]`);
    newCard.classList.add('fade-in');
    addNotificationEventListenersToCard(newCard);
    
    // Обновляем скроллбар, если он инициализирован
    import('./notifications/notificationsScrollbar.js').then(module => {
        if (typeof module.updateScrollbarThumb === 'function') {
            module.updateScrollbarThumb();
        }
    }).catch(error => {
        console.error('Ошибка при обновлении скроллбара:', error);
    });
}

/**
 * Обновляет кнопки добавления в друзья в реальном времени
 * @param {string} osuId - ID пользователя
 * @param {string} status - Новый статус (friends, not_friends, pending, incoming-request)
 * @param {string} requestId - ID запроса (опционально)
 */
function updateFriendButtonsRealtime(osuId, status, requestId = null) {
    // Проверяем кнопку на странице профиля
    const profileContainer = document.querySelector('.profile-container');
    if (profileContainer) {
        const addFriendBtn = profileContainer.querySelector('.profile-add-friend');
        if (addFriendBtn && addFriendBtn.getAttribute('data-osuid') === osuId.toString()) {
            // Определяем имя пользователя для тостов
            const username = addFriendBtn.getAttribute('data-username') || '';
            
            // Удаляем все классы состояний
            addFriendBtn.classList.remove('friends', 'pending', 'not-friends', 'incoming-request');
            
            // Устанавливаем атрибут requestId, если он есть
            if (requestId) {
                addFriendBtn.setAttribute('data-request-id', requestId);
            } else {
                addFriendBtn.removeAttribute('data-request-id');
            }
            
            // Обновляем стили и текст в зависимости от статуса
            if (status === 'friends') {
                addFriendBtn.textContent = 'Сообщение';
                addFriendBtn.classList.add('friends');
            } else if (status === 'pending') {
                addFriendBtn.textContent = 'Отменить заявку';
                addFriendBtn.classList.add('pending');
            } else if (status === 'not_friends') {
                addFriendBtn.textContent = 'Добавить в друзья';
                addFriendBtn.classList.add('not-friends');
            } else if (status === 'incoming-request') {
                addFriendBtn.textContent = 'Принять заявку';
                addFriendBtn.classList.add('incoming-request');
            }
        }
    }
    
    // Проверяем кнопки в списке друзей
    const friendAddButtons = document.querySelectorAll(`.friend-add-btn[data-osuid="${osuId}"]`);
    friendAddButtons.forEach(btn => {
        // Удаляем все классы состояний
        btn.classList.remove('friends', 'pending', 'incoming-request');
        
        // Устанавливаем атрибут requestId, если он есть
        if (requestId) {
            btn.setAttribute('data-request-id', requestId);
        } else {
            btn.removeAttribute('data-request-id');
        }
        
        // Добавляем соответствующий класс
        if (status === 'friends' || status === 'pending' || status === 'incoming-request') {
            btn.classList.add(status);
        }
    });
}

/**
 * Добавляет обработчики событий для карточки уведомления
 * @param {HTMLElement} card - Карточка уведомления
 */
export function addNotificationEventListenersToCard(card) {
    const acceptBtn = card.querySelector('.accept-btn');
    const declineBtn = card.querySelector('.decline-btn');
    
    if (acceptBtn) {
        acceptBtn.addEventListener('click', async () => {
            const requestId = card.getAttribute('data-request-id');
            try {
                const response = await fetch('/api/friend-request/accept', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ requestId })
                });
                
                if (response.ok) {
                    const username = card.querySelector('.notification-username').textContent;
                    showToast(`Теперь вы с ${username} друзья!`, 'success');
                    card.classList.add('fade-out');
                    card.addEventListener('animationend', () => {
                        card.remove();
                        checkAndRedrawNotificationsContainer();
                        updateNotificationCountAfterAction();
                    }, { once: true });
                } else {
                    const error = await response.json();
                    showToast(error.error || 'Ошибка при принятии запроса', 'error');
                }
            } catch (error) {
                console.error('Ошибка при принятии запроса в друзья:', error);
                showToast('Ошибка при принятии запроса', 'error');
            }
        });
    }
    
    if (declineBtn) {
        declineBtn.addEventListener('click', async () => {
            const requestId = card.getAttribute('data-request-id');
            try {
                const response = await fetch('/api/friend-request/decline', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ requestId })
                });
                
                if (response.ok) {
                    const username = card.querySelector('.notification-username').textContent;
                    showToast(`Вы отклонили заявку ${username}`, 'warning');
                    card.classList.add('fade-out');
                    card.addEventListener('animationend', () => {
                        card.remove();
                        checkAndRedrawNotificationsContainer();
                        updateNotificationCountAfterAction();
                    }, { once: true });
                } else {
                    const error = await response.json();
                    showToast(error.error || 'Ошибка при отклонении запроса', 'error');
                }
            } catch (error) {
                console.error('Ошибка при отклонении запроса в друзья:', error);
                showToast('Ошибка при отклонении запроса', 'error');
            }
        });
    }
}

/**
 * Обновляет счетчик уведомлений после действия с уведомлением
 */
export async function updateNotificationCountAfterAction() {
    try {
        const response = await fetch('/api/notifications');
        if (!response.ok) throw new Error('Ошибка при получении уведомлений');
        const notifications = await response.json();
        updateNotificationCount(notifications.length);
    } catch (error) {
        console.error('Ошибка при обновлении счетчика уведомлений:', error);
    }
}

/**
 * Проверяет и перерисовывает контейнер уведомлений, если они все удалены
 */
export function checkAndRedrawNotificationsContainer() {
    const notificationsContainer = document.querySelector('.notifications-container');
    if (!notificationsContainer) return;
    
    const notificationsGrid = document.querySelector('.notifications-grid');
    if (!notificationsGrid) return;
    
    const cards = notificationsGrid.querySelectorAll('.notification-card');
    
    if (cards.length === 0) {
        // Удаляем все содержимое сетки
        notificationsGrid.innerHTML = '';
        
        // Добавляем текст "Нет новых уведомлений"
        const noNotificationsMessage = document.createElement('p');
        noNotificationsMessage.className = 'no-notifications-message';
        noNotificationsMessage.textContent = 'Нет новых уведомлений';
        notificationsGrid.appendChild(noNotificationsMessage);
        
        // Обновляем скроллбар, если он инициализирован
        import('./notifications/notificationsScrollbar.js').then(module => {
            if (typeof module.updateScrollbarThumb === 'function') {
                module.updateScrollbarThumb();
            }
        }).catch(error => {
            console.error('Ошибка при обновлении скроллбара:', error);
        });
    }
}

/**
 * Настраивает обработчики анимаций для авторизационных кнопок
 * @param {HTMLElement} authButton - Кнопка авторизации
 * @param {string} containerSelector - Селектор для контейнера с графикой
 */
export function setupAuthButtonAnimations(authButton, containerSelector) {
    if (!authButton) return;
    
    // Получаем флаг отключения анимаций из localStorage
    const animationsDisabled = localStorage.getItem('animationsDisabled') === 'true';
    
    // Добавляем обработчик для кнопки авторизации
    authButton.addEventListener('click', () => {
        // Вызываем модальное окно авторизации
        const authOsuBtn = document.querySelector('.authOsu-btn button');
        if (authOsuBtn) {
            authOsuBtn.click();
        }
    });
    
    // Если анимации разрешены, добавляем эффекты при наведении
    if (!animationsDisabled) {
        // Добавляем анимацию при наведении
        authButton.addEventListener('mouseenter', () => {
            const sparkles = document.querySelectorAll(`${containerSelector} .sparkle`);
            const circles = document.querySelectorAll(`${containerSelector} .circle`);
            
            sparkles.forEach(sparkle => {
                sparkle.style.animationDuration = '1.5s';
            });
            
            circles.forEach(circle => {
                circle.style.transform = 'scale(1.1)';
                circle.style.transition = 'transform 0.3s ease';
            });
        });
        
        authButton.addEventListener('mouseleave', () => {
            const sparkles = document.querySelectorAll(`${containerSelector} .sparkle`);
            const circles = document.querySelectorAll(`${containerSelector} .circle`);
            
            sparkles.forEach(sparkle => {
                sparkle.style.animationDuration = '';
            });
            
            circles.forEach(circle => {
                circle.style.transform = '';
            });
        });
    }
}

/**
 * Обрабатывает клик по карточке игрока (профиль, рейтинг, друзья)
 * @param {Event} event - Событие клика
 * @param {string} dataAttribute - Атрибут с ID пользователя (например, 'data-osuid')
 * @param {string} ignoreBtnClass - Класс кнопки, при клике на которую не происходит переход на профиль
 */
export function handlePlayerCardClick(event, dataAttribute, ignoreBtnClass = null) {
    // Проверяем, не является ли целью клика кнопка, которую нужно игнорировать
    if (ignoreBtnClass && event.target.closest(`.${ignoreBtnClass}`)) {
        return;
    }
    
    const card = event.currentTarget;
    const osuId = card.getAttribute(dataAttribute);
    const isOwnProfile = osuId === currentUserOsuId;
    
    if (isOwnProfile) {
        handleTabChange('profile', null, true);
    } else {
        fetchUserData(osuId)
            .then(userData => {
                if (userData) {
                    handleTabChange('profile', userData, false);
                } else {
                    showToast('Не удалось загрузить данные пользователя', 'error');
                }
            });
    }
}

/**
 * Получает данные пользователя по ID
 * @param {string|number} osuId - ID пользователя
 * @returns {Promise<Object|null>} - Данные пользователя или null в случае ошибки
 */
export async function fetchUserData(osuId) {
    try {
        const response = await fetch(`/api/user/${osuId}`);
        if (!response.ok) throw new Error('Ошибка при получении данных пользователя');
        return await response.json();
    } catch (error) {
        console.error('Ошибка при загрузке данных пользователя:', error);
        showToast('Не удалось загрузить данные пользователя', 'error');
        return null;
    }
}

// Инициализация при загрузке страницы
document.addEventListener('DOMContentLoaded', () => {
    const menuItems = document.querySelectorAll('.menu > div');
    const actionBtns = document.querySelectorAll('.action-btns > div[data-tab]');
    const profileButton = document.querySelector('.profile-btn');
    const newsTab = document.querySelector('.news');
    let previousActiveTab = null;
    
    // Получаем настройки из localStorage
    const animationsDisabled = localStorage.getItem('animationsDisabled') === 'true';
    
    // Получаем ID текущего пользователя
    if (profileButton) {
        currentUserOsuId = profileButton.getAttribute('data-osuid');
    }
    
    // Подключаемся к WebSocket серверу
    connectWebSocket();
    
    /**
     * Удаляет активные стили со всех элементов навигации
     */
    function removeActiveStyles() {
        menuItems.forEach(item => item.classList.remove('active'));
        actionBtns.forEach(btn => btn.classList.remove('active'));
        if (profileButton) profileButton.classList.remove('active');
    }
    
    /**
     * Устанавливает активные стили для выбранного элемента
     * @param {HTMLElement} tab - Выбранный элемент навигации
     */
    function setActiveStyles(tab) {
        tab.classList.add('active');
        const img = tab.querySelector('img');
        if (img && !animationsDisabled) {
            img.classList.add('rotate-wiggle');
            setTimeout(() => img.classList.remove('rotate-wiggle'), 600);
        }
    }
    
    /**
     * Устанавливает активную вкладку и загружает ее содержимое
     * @param {HTMLElement} tab - Выбранный элемент навигации
     */
    function setActiveTab(tab) {
        const tabClass = tab.getAttribute('data-tab') || tab.classList[0];
        const knownTabs = ['news', 'rating-game', 'fast-game', 'leaderboard', 'site-settings', 'profile', 'add-friend', 'notifications'];
        if (!knownTabs.includes(tabClass)) {
            console.error(`Вкладка ${tabClass} не найдена`);
            return;
        }
        
        // Особая обработка для настроек сайта
        if (tabClass === 'site-settings') {
            previousActiveTab = document.querySelector('.menu > div.active, .action-btns > div.active') || newsTab;
            removeActiveStyles();
            setActiveStyles(tab);
            siteSettingsModalShow();
            return;
        }
        
        // Устанавливаем активные стили и загружаем содержимое
        removeActiveStyles();
        setActiveStyles(tab);
        
        // Сохраняем активную вкладку в localStorage
        localStorage.setItem('activeTab', tabClass);
        
        handleTabChange(tabClass);
    }
    
    // Добавляем обработчики событий для элементов навигации
    menuItems.forEach(item => item.addEventListener('click', () => setActiveTab(item)));
    actionBtns.forEach(btn => btn.addEventListener('click', () => setActiveTab(btn)));
    if (profileButton) profileButton.addEventListener('click', () => setActiveTab(profileButton));
    
    // Загружаем последнюю активную вкладку из localStorage
    const activeTabClass = localStorage.getItem('activeTab');
    
    // Определяем, какую вкладку загрузить
    if (activeTabClass) {
        if (activeTabClass === 'profile') {
            // Если активная вкладка - профиль, загружаем его напрямую
            // Проверяем, свой ли это профиль
            const isOwnProfile = localStorage.getItem('isOwnProfile') === 'true';
            
            if (isOwnProfile && profileButton) {
                // Если это свой профиль и есть кнопка профиля, выделяем её
                setActiveStyles(profileButton);
            } else {
                // Иначе просто снимаем все выделения
                removeActiveStyles();
            }
            
            // Загружаем профиль
            handleTabChange('profile');
        } else {
            // Для других вкладок ищем соответствующий элемент
            const activeTab = document.querySelector(`.${activeTabClass}`) || document.querySelector(`[data-tab="${activeTabClass}"]`);
            if (activeTab) {
                setActiveTab(activeTab);
            } else {
                setActiveTab(newsTab);
            }
        }
    } else {
        setActiveTab(newsTab);
    }
    
    // Обработчик для закрытия модального окна настроек
    document.addEventListener('siteSettingsModalClosed', () => {
        if (previousActiveTab) {
            removeActiveStyles();
            setActiveStyles(previousActiveTab);
            previousActiveTab = null;
        }
    });
    
    // Инициализация счетчика уведомлений при загрузке страницы
    if (currentUserOsuId) {
        updateNotificationCountAfterAction();
    }
});