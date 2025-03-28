// router.js

import { getNewsTemplate } from './news/newsTemplate.js';
import { getFastGameTemplate, initFastGameHandlers } from './fast-game/fastGameTemplate.js';
import { getRatingGameTemplate } from './rating-game/ratingGameTemplate.js';
import { getProfileTemplate } from './profile/profileTemplate.js';
import { getLeaderboardTemplate } from './leaderboard/leaderboardTemplate.js';
import { siteSettingsModalShow } from './site-settings/siteSettings.js';
import { initNewsScrollbar } from './news/newsScrollbar.js';
import { initLeaderboardScrollbar } from './leaderboard/leaderboardScrollbar.js';
import { getAddFriendsTemplate } from './addFriends/addFriendsTemplate.js';
import { initAddFriendsScrollbar } from './addFriends/addFriendsScrollbar.js';
import { getNotificationsTemplate } from './notifications/notificationsTemplate.js';
import { initSearch } from './search.js'; // Добавляем импорт функции инициализации поиска
import { 
    currentUserOsuId, 
    checkAndRedrawNotificationsContainer, 
    showToast, 
    setProfileButtonActive,
    addNotificationEventListenersToCard,
    updateNotificationCount,
    updateNotificationCountAfterAction,
    setupAuthButtonAnimations,
    handlePlayerCardClick,
    fetchUserData
} from './active.js';

const contentBlock = document.querySelector('.content');

/**
 * Загружает содержимое для выбранной вкладки
 * @param {string} tabClass - Класс выбранной вкладки
 * @param {Object} userData - Данные пользователя (для профиля)
 * @param {boolean} isOwnProfile - Флаг собственного профиля
 */
async function loadContent(tabClass, userData = null, isOwnProfile = false) {
    const animationsDisabled = localStorage.getItem('animationsDisabled') === 'true';
    contentBlock.classList.remove('visible');
    
    const fadeOutDelay = animationsDisabled ? 0 : 250;
    const fadeInDelay = animationsDisabled ? 0 : 10;

    // Ждем анимацию исчезновения текущего контента
    if (!animationsDisabled) {
        await new Promise(resolve => setTimeout(resolve, fadeOutDelay));
    }

    try {
        let template;
        
        switch (tabClass) {
            case 'news':
                template = getNewsTemplate();
                contentBlock.innerHTML = template;
                initNewsScrollbar();
                break;
                
            case 'fast-game':
                template = getFastGameTemplate();
                contentBlock.innerHTML = template;
                setTimeout(() => {
                    initFastGameHandlers();
                }, fadeInDelay);
                break;
                
            case 'rating-game':
                template = getRatingGameTemplate();
                contentBlock.innerHTML = template;
                break;
                
            case 'profile':
                await handleProfileTab(userData, isOwnProfile);
                break;
                
            case 'leaderboard':
                await handleLeaderboardTab();
                break;
                
            case 'site-settings':
                siteSettingsModalShow();
                return;
                
            case 'add-friend':
                await handleAddFriendTab();
                break;
                
            case 'notifications':
                await handleNotificationsTab();
                break;
                
            default:
                template = '<p>Контент не найден</p>';
                contentBlock.innerHTML = template;
        }

        // Делаем контент видимым с анимацией появления
        setTimeout(() => contentBlock.classList.add('visible'), fadeInDelay);
        
        // Инициализируем поиск для активной вкладки
        initSearch(tabClass);
    } catch (error) {
        console.error(`Ошибка при загрузке содержимого для вкладки ${tabClass}:`, error);
        contentBlock.innerHTML = `<p>Ошибка при загрузке содержимого</p>`;
        setTimeout(() => contentBlock.classList.add('visible'), fadeInDelay);
    }
}

/**
 * Обрабатывает вкладку профиля
 * @param {Object} userData - Данные пользователя
 * @param {boolean} isOwnProfile - Флаг собственного профиля
 */
async function handleProfileTab(userData, isOwnProfile) {
    if (!userData) {
        // Проверяем сохраненный профиль в localStorage
        const profileOsuId = localStorage.getItem('profileOsuId');
        const storedIsOwnProfile = localStorage.getItem('isOwnProfile') === 'true';
        
        if (profileOsuId) {
            // Пытаемся загрузить профиль из localStorage
            userData = await fetchUserData(profileOsuId);
            isOwnProfile = storedIsOwnProfile;
        } else {
            // Если нет сохраненного профиля, загружаем свой профиль
            const profileButton = document.querySelector('.profile-btn');
            if (!profileButton) {
                contentBlock.innerHTML = '<p>Ошибка: не удалось найти кнопку профиля</p>';
                return;
            }
            
            const osuId = profileButton.getAttribute('data-osuid');
            userData = await fetchUserData(osuId);
            isOwnProfile = true;
        }
    }

    if (userData) {
        // Сохраняем данные профиля в localStorage для восстановления после обновления страницы
        localStorage.setItem('profileOsuId', userData.osuId);
        localStorage.setItem('isOwnProfile', isOwnProfile.toString());
        localStorage.setItem('activeTab', 'profile');

        // Устанавливаем активный стиль для кнопки профиля, если это свой профиль
        setProfileButtonActive(isOwnProfile);

        const template = getProfileTemplate(userData, isOwnProfile);
        contentBlock.innerHTML = template;
        
        if (isOwnProfile) {
            // Обработчик для редактирования аватара
            initOwnProfileHandlers();
        } else {
            // Обработчик для кнопки добавления в друзья
            await initFriendButtonHandlers(userData.osuId);
        }
    } else {
        contentBlock.innerHTML = '<p>Ошибка при загрузке профиля</p>';
    }
}

/**
 * Инициализирует обработчики для своего профиля
 */
function initOwnProfileHandlers() {
    const editAvatarIcon = document.querySelector('.edit-avatar-icon');
    if (editAvatarIcon) {
        editAvatarIcon.addEventListener('click', () => {
            const fileInput = document.createElement('input');
            fileInput.type = 'file';
            fileInput.accept = 'image/*';
            fileInput.onchange = async () => {
                const file = fileInput.files[0];
                if (file) {
                    const formData = new FormData();
                    formData.append('avatar', file);
                    try {
                        const response = await fetch('/api/upload-avatar', {
                            method: 'POST',
                            body: formData
                        });
                        
                        if (response.ok) {
                            const updatedUser = await response.json();
                            const avatarToShow = updatedUser.customAvatarUrl || updatedUser.avatarUrl;
                            
                            // Обновляем аватар на странице
                            document.querySelector('.profile-avatar img').src = avatarToShow;
                            
                            // Обновляем аватар в меню
                            const profileButton = document.querySelector('.profile-btn');
                            if (profileButton) profileButton.querySelector('img').src = avatarToShow;
                            
                            showToast('Вы успешно изменили аватарку');
                        } else {
                            const error = await response.json();
                            showToast(error.error || 'Ошибка при загрузке аватарки', 'error');
                        }
                    } catch (error) {
                        console.error('Ошибка при загрузке аватарки:', error);
                        showToast('Ошибка при загрузке аватарки', 'error');
                    }
                }
            };
            fileInput.click();
        });
    }
}

/**
 * Инициализирует обработчики для кнопки добавления в друзья
 * @param {string|number} osuId - ID пользователя
 */
async function initFriendButtonHandlers(osuId) {
    const addFriendBtn = document.querySelector('.profile-add-friend');
    if (!addFriendBtn) return;
    
    try {
        const statusResponse = await fetch(`/api/friend-status/${osuId}`);
        if (!statusResponse.ok) throw new Error('Ошибка при получении статуса дружбы');
        
        const { status, hasIncomingRequest, requestId } = await statusResponse.json();
        
        // Получаем имя пользователя для кнопки
        const username = addFriendBtn.getAttribute('data-username');
        
        // Обновляем кнопку с учетом наличия входящей заявки
        updateFriendButton(addFriendBtn, status, hasIncomingRequest, requestId);
        
        addFriendBtn.addEventListener('click', async () => {
            await handleFriendRequest(osuId, addFriendBtn, username);
        });
    } catch (error) {
        console.error('Ошибка при инициализации кнопки добавления в друзья:', error);
        addFriendBtn.textContent = 'Ошибка';
        addFriendBtn.disabled = true;
    }
}

/**
 * Обрабатывает вкладку лидерборда
 */
async function handleLeaderboardTab() {
    // При загрузке лидерборда, убираем сохраненный профиль из localStorage
    localStorage.removeItem('profileOsuId');
    localStorage.removeItem('isOwnProfile');
    
    // Снимаем выделение с кнопки профиля
    setProfileButtonActive(false);
    
    const template = await getLeaderboardTemplate();
    contentBlock.innerHTML = template;
    initLeaderboardScrollbar();
    
    // Добавляем обработчики для карточек игроков
    document.querySelectorAll('.player-card').forEach(card => {
        card.addEventListener('click', (event) => handlePlayerCardClick(event, 'data-osuid'));
    });
    
    // Обработчик для кнопки авторизации в пустом состоянии
    const authButton = document.querySelector('.leaderboard-empty-state .auth-button');
    setupAuthButtonAnimations(authButton, '.leaderboard-circle-graphics');
}

/**
 * Обрабатывает вкладку добавления друзей
 */
async function handleAddFriendTab() {
    // При загрузке списка друзей, убираем сохраненный профиль из localStorage
    localStorage.removeItem('profileOsuId');
    localStorage.removeItem('isOwnProfile');
    
    // Снимаем выделение с кнопки профиля
    setProfileButtonActive(false);

    try {
        const response = await fetch('/api/users');
        if (!response.ok) throw new Error(`Ошибка при получении списка пользователей: ${response.statusText}`);
        
        const users = await response.json();
        const template = getAddFriendsTemplate(users);
        contentBlock.innerHTML = template;
        initAddFriendsScrollbar();
        
        // Добавляем обработчики для карточек пользователей
        document.querySelectorAll('.friend-card').forEach(card => {
            card.addEventListener('click', (event) => handlePlayerCardClick(event, 'data-osuid', 'friend-add-btn'));
        });
        
        // Добавляем обработчики для кнопок добавления в друзья
        const friendAddButtons = document.querySelectorAll('.friend-add-btn');
        
        // Инициализация начальных состояний всех кнопок
        for (const btn of friendAddButtons) {
            const osuId = btn.getAttribute('data-osuid');
            const username = btn.getAttribute('data-username');
            try {
                const statusResponse = await fetch(`/api/friend-status/${osuId}`);
                if (statusResponse.ok) {
                    const { status, hasIncomingRequest, requestId } = await statusResponse.json();
                    updateFriendButtonState(btn, status, hasIncomingRequest, requestId);
                }
            } catch (error) {
                console.error('Ошибка при получении статуса дружбы:', error);
            }
        }
        
        // Добавляем обработчики событий для кнопок
        friendAddButtons.forEach(btn => {
            btn.addEventListener('click', async (event) => {
                event.stopPropagation(); // Предотвращаем переход на профиль
                
                const osuId = btn.getAttribute('data-osuid');
                const username = btn.getAttribute('data-username');
                if (osuId === currentUserOsuId) {
                    showToast('Вы не можете отправить запрос в друзья самому себе', 'warning');
                    return;
                }
                
                try {
                    // Получаем текущий статус дружбы
                    const statusResponse = await fetch(`/api/friend-status/${osuId}`);
                    if (!statusResponse.ok) throw new Error('Не удалось получить статус дружбы');
                    
                    const { status, hasIncomingRequest, requestId } = await statusResponse.json();
                    
                    // Проверяем, есть ли входящая заявка
                    if (hasIncomingRequest && requestId) {
                        // Принимаем входящую заявку
                        const acceptResponse = await fetch('/api/friend-request/accept', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ requestId })
                        });
                        
                        if (acceptResponse.ok) {
                            showToast(`Вы теперь друзья с ${username}`, 'success');
                            updateFriendButtonState(btn, 'friends');
                        } else {
                            const error = await acceptResponse.json();
                            showToast(error.error || 'Ошибка при принятии заявки', 'error');
                        }
                    } else if (status === 'not_friends') {
                        // Отправляем запрос в друзья
                        const response = await fetch('/api/friend-request', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ toOsuId: osuId })
                        });
                        
                        if (response.ok) {
                            showToast('Заявка в друзья отправлена', 'success');
                            updateFriendButtonState(btn, 'pending');
                        } else {
                            const error = await response.json();
                            showToast(error.error || 'Ошибка при отправке заявки', 'error');
                        }
                    } else if (status === 'pending') {
                        // Отменяем запрос в друзья
                        const requestResponse = await fetch(`/api/friend-request/${osuId}`);
                        if (!requestResponse.ok) throw new Error('Не удалось получить ID запроса');
                        
                        const { requestId } = await requestResponse.json();
                        if (requestId) {
                            const deleteResponse = await fetch(`/api/friend-request/${requestId}`, {
                                method: 'DELETE'
                            });
                            
                            if (deleteResponse.ok) {
                                showToast('Вы отменили заявку в друзья', 'info');
                                updateFriendButtonState(btn, 'not_friends');
                            } else {
                                const error = await deleteResponse.json();
                                showToast(error.error || 'Ошибка при отмене заявки', 'error');
                            }
                        }
                    } else if (status === 'friends') {
                        // Пользователи уже друзья
                        showToast('Вы уже друзья с этим пользователем', 'info');
                    }
                } catch (error) {
                    console.error('Ошибка при обработке запроса в друзья:', error);
                    showToast('Произошла ошибка. Попробуйте позже', 'error');
                }
            });
        });
    } catch (error) {
        console.error('Ошибка при загрузке списка пользователей:', error);
        contentBlock.innerHTML = `
            <p style="text-align: center; font-size: 25px; font-weight: 500; margin-top: 150px; color: gray;">
                Ошибка при загрузке списка пользователей: ${error.message}
            </p>
        `;
    }
}

/**
 * Обновляет состояние кнопки добавления в друзья в списке друзей
 * @param {HTMLElement} button - Кнопка добавления в друзья
 * @param {string} status - Статус отношений (not_friends, pending, friends)
 * @param {boolean} hasIncomingRequest - Есть ли входящая заявка
 * @param {string} requestId - ID запроса дружбы
 */
function updateFriendButtonState(button, status, hasIncomingRequest = false, requestId = null) {
    // Удаляем все статусные классы
    button.classList.remove('pending', 'friends', 'incoming-request');
    
    // Добавляем атрибут с ID запроса, если он есть
    if (requestId) {
        button.setAttribute('data-request-id', requestId);
    } else {
        button.removeAttribute('data-request-id');
    }
    
    // Добавляем класс в зависимости от статуса и наличия входящей заявки
    if (status === 'not_friends' && hasIncomingRequest) {
        button.classList.add('incoming-request');
    } else if (status === 'pending') {
        button.classList.add('pending');
    } else if (status === 'friends') {
        button.classList.add('friends');
    }
}

/**
 * Обрабатывает вкладку уведомлений
 */
async function handleNotificationsTab() {
    // При загрузке уведомлений, убираем сохраненный профиль из localStorage
    localStorage.removeItem('profileOsuId');
    localStorage.removeItem('isOwnProfile');
    
    // Снимаем выделение с кнопки профиля
    setProfileButtonActive(false);

    try {
        if (!currentUserOsuId) {
            // Используем шаблон для неавторизованного пользователя
            const template = getNotificationsTemplate([], false);
            contentBlock.innerHTML = template;
            
            // Добавляем обработчик для кнопки авторизации в пустом состоянии
            const authButton = document.querySelector('.notifications-empty-state .auth-button');
            setupAuthButtonAnimations(authButton, '.notifications-circle-graphics');
            
            return;
        }
        
        const response = await fetch('/api/notifications');
        if (!response.ok) throw new Error('Ошибка при получении уведомлений');
        
        const notifications = await response.json();
        const template = getNotificationsTemplate(notifications, true);
        contentBlock.innerHTML = template;
        
        // Добавляем обработчики для карточек уведомлений
        document.querySelectorAll('.notification-card').forEach(card => {
            addNotificationEventListenersToCard(card);
        });
        
        // Обновляем счетчик уведомлений
        updateNotificationCount(notifications.length);
        
        // Инициализируем скроллбар для уведомлений
        import('./notifications/notificationsScrollbar.js').then(module => {
            if (typeof module.initNotificationsScrollbar === 'function') {
                module.initNotificationsScrollbar();
            }
        }).catch(error => {
            console.error('Ошибка при загрузке модуля скроллбара:', error);
        });
    } catch (error) {
        console.error('Ошибка при загрузке уведомлений:', error);
        contentBlock.innerHTML = `
            <div class="notifications-container">
                <!-- Заголовок раздела в стиле новостей -->
                <div class="notifications-header">
                    <h1 class="notifications-title">Уведомления</h1>
                    <p class="notifications-subtitle">Следи за активностью друзей, получай важные уведомления и не пропускай приглашения в игру</p>
                </div>
                
                <div class="notifications-grid-container">
                    <div class="notifications-grid">
                        <p class="no-notifications-message">
                            Ошибка при загрузке уведомлений: ${error.message}
                        </p>
                    </div>
                </div>
            </div>
        `;
    }
}

/**
 * Обновляет текст кнопки добавления в друзья в зависимости от статуса
 * @param {HTMLElement} button - Кнопка добавления в друзья
 * @param {string} status - Статус отношений между пользователями
 * @param {boolean} hasIncomingRequest - Есть ли входящая заявка
 * @param {string} requestId - ID запроса дружбы
 */
function updateFriendButton(button, status, hasIncomingRequest = false, requestId = null) {
    // Удаляем все статусные классы
    button.classList.remove('friends', 'pending', 'not-friends', 'incoming-request');
    
    // Добавляем атрибут с ID запроса, если он есть
    if (requestId) {
        button.setAttribute('data-request-id', requestId);
    } else {
        button.removeAttribute('data-request-id');
    }
    
    // Обновляем текст и класс в зависимости от статуса
    if (status === 'friends') {
        button.textContent = 'Сообщение';
        button.classList.add('friends');
    } else if (status === 'pending') {
        button.textContent = 'Отменить заявку';
        button.classList.add('pending');
    } else if (status === 'not_friends') {
        if (hasIncomingRequest) {
            button.textContent = 'Принять заявку';
            button.classList.add('incoming-request');
        } else {
            button.textContent = 'Добавить в друзья';
            button.classList.add('not-friends');
        }
    } else {
        button.textContent = 'Добавить в друзья';
        button.classList.add('not-friends');
    }
}

/**
 * Обрабатывает нажатие на кнопку добавления в друзья
 * @param {string|number} osuId - ID пользователя
 * @param {HTMLElement} button - Кнопка добавления в друзья
 * @param {string} username - Имя пользователя
 */
async function handleFriendRequest(osuId, button, username) {
    try {
        // Получаем текущий статус дружбы
        const statusResponse = await fetch(`/api/friend-status/${osuId}`);
        if (!statusResponse.ok) throw new Error('Не удалось получить статус дружбы');
        
        const { status, hasIncomingRequest, requestId } = await statusResponse.json();
        
        // Проверяем, есть ли входящая заявка
        if (status === 'not_friends' && hasIncomingRequest && requestId) {
            // Принимаем входящую заявку
            const acceptResponse = await fetch('/api/friend-request/accept', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ requestId })
            });
            
            if (acceptResponse.ok) {
                updateFriendButton(button, 'friends');
                showToast(`Вы теперь друзья с ${username}`, 'success');
            } else {
                const error = await acceptResponse.json();
                showToast(error.error || 'Ошибка при принятии заявки', 'error');
            }
        } else if (status === 'not_friends') {
            // Отправляем запрос в друзья
            const response = await fetch('/api/friend-request', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ toOsuId: osuId })
            });
            
            if (response.ok) {
                updateFriendButton(button, 'pending');
                showToast('Заявка в друзья отправлена');
            } else {
                const error = await response.json();
                showToast(error.error || 'Ошибка при отправке заявки', 'error');
            }
        } else if (status === 'pending') {
            // Отменяем запрос в друзья
            if (requestId) {
                const deleteResponse = await fetch(`/api/friend-request/${requestId}`, {
                    method: 'DELETE'
                });
                
                if (deleteResponse.ok) {
                    updateFriendButton(button, 'not_friends');
                    showToast('Вы отменили заявку в друзья', 'info');
                } else {
                    const error = await deleteResponse.json();
                    showToast(error.error || 'Ошибка при отмене заявки', 'error');
                }
            } else {
                const requestResponse = await fetch(`/api/friend-request/${osuId}`);
                if (!requestResponse.ok) throw new Error('Не удалось получить ID запроса');
                
                const { requestId } = await requestResponse.json();
                if (requestId) {
                    const deleteResponse = await fetch(`/api/friend-request/${requestId}`, {
                        method: 'DELETE'
                    });
                    
                    if (deleteResponse.ok) {
                        updateFriendButton(button, 'not_friends');
                        showToast('Вы отменили заявку в друзья', 'info');
                    } else {
                        const error = await deleteResponse.json();
                        showToast(error.error || 'Ошибка при отмене заявки', 'error');
                    }
                }
            }
        } else if (status === 'friends') {
            // Переход к сообщениям (пока не реализовано)
            showToast('Функция обмена сообщениями пока не реализована', 'info');
        }
    } catch (error) {
        console.error('Ошибка при обработке запроса в друзья:', error);
        showToast('Произошла ошибка. Попробуйте позже', 'error');
    }
}

/**
 * Обрабатывает смену вкладки
 * @param {string} activeTabClass - Класс активной вкладки
 * @param {Object} userData - Данные пользователя (для профиля)
 * @param {boolean} isOwnProfile - Флаг собственного профиля
 */
export function handleTabChange(activeTabClass, userData = null, isOwnProfile = false) {
    loadContent(activeTabClass, userData, isOwnProfile);
}