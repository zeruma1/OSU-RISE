/**
 * Генерирует HTML-шаблон для страницы уведомлений
 * @param {Array} notifications - Массив уведомлений
 * @param {boolean} isAuthenticated - Флаг авторизации пользователя
 * @param {boolean} useDemoData - Флаг для отображения демо-данных
 * @returns {string} HTML-шаблон
 */
export function getNotificationsTemplate(notifications, isAuthenticated = true, useDemoData = false) {
    // Если пользователь не авторизован
    if (!isAuthenticated) {
        return `
            <div class="notifications-container">
                <!-- Заголовок раздела в стиле новостей -->
                <div class="notifications-header">
                    <h1 class="notifications-title">Уведомления</h1>
                    <p class="notifications-subtitle">Следи за активностью друзей, получай важные уведомления и не пропускай приглашения в игру</p>
                </div>
                
                <div class="notifications-empty-state">
                    <div class="empty-state-card">
                        <div class="notifications-circle-graphics">
                            <div class="circle c1"></div>
                            <div class="circle c2"></div>
                            <div class="circle c3"></div>
                            <div class="line l1"></div>
                            <div class="line l2"></div>
                            <div class="sparkle s1"></div>
                            <div class="sparkle s2"></div>
                            <div class="sparkle s3"></div>
                            <div class="sparkle s4"></div>
                            <div class="sparkle s5"></div>
                        </div>
                        <h2 class="empty-title">Будь всегда в курсе!</h2>
                        <p class="empty-description">Получай уведомления о новых заявках в друзья и приглашениях в игру. Авторизуйся для начала!</p>
                        <div class="cta-button auth-button">Авторизоваться</div>
                    </div>
                </div>
            </div>
        `;
    }

    // Если пользователь авторизован
    let notificationCards = '';
    
    if (notifications && notifications.length > 0) {
        // Генерируем карточки уведомлений
        notificationCards = notifications.map(notification => 
            getNotificationCardTemplate(notification)
        ).join('');
    } else {
        // Сообщение об отсутствии уведомлений
        notificationCards = `
            <p class="no-notifications-message">
                Нет новых уведомлений
            </p>
        `;
    }

    // Возвращаем полный шаблон
    return `
        <div class="notifications-container">
            <!-- Заголовок раздела в стиле новостей -->
            <div class="notifications-header">
                <h1 class="notifications-title">Уведомления</h1>
                <p class="notifications-subtitle">Следи за активностью друзей, получай важные уведомления и не пропускай приглашения в игру</p>
            </div>
            
            <div class="notifications-grid-container">
                <div class="notifications-grid">
                    ${notificationCards}
                </div>
                
                <!-- Кастомный скроллбар -->
                <div class="notifications-custom-scrollbar">
                    <div class="notifications-custom-scrollbar-track">
                        <div class="notifications-custom-scrollbar-thumb"></div>
                    </div>
                </div>
            </div>
        </div>
    `;
}

/**
 * Генерирует HTML-шаблон для карточки уведомления
 * @param {Object} notification - Уведомление
 * @returns {string} HTML-шаблон карточки
 */
export function getNotificationCardTemplate(notification) {
    // Безопасное получение данных с проверкой на undefined
    const id = notification._id || '';
    const username = notification.from?.username || 'Пользователь';
    const avatarUrl = notification.from?.customAvatarUrl || notification.from?.avatarUrl || '/img/default-avatar.png';
    
    return `
        <div class="notification-card friend-request" data-request-id="${id}">
            <img src="${avatarUrl}" alt="Аватар" class="notification-avatar">
            <div class="notification-info">
                <p class="notification-username">${username}</p>
                <p class="notification-text">Хочет добавить тебя в друзья</p>
            </div>
            <div class="notification-actions">
                <button class="accept-btn">Принять</button>
                <button class="decline-btn">Отклонить</button>
            </div>
        </div>
    `;
}