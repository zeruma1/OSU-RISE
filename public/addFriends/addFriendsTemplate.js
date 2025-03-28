// public/addFriends/addFriendsTemplate.js
export function getAddFriendsTemplate(users) {
    // Проверяем, достаточно ли у нас пользователей
    if (!users || users.length === 0) {
        return `
            <div class="add-friend-container">
                <!-- Заголовок раздела в стиле новостей -->
                <div class="add-friend-header">
                    <h1 class="add-friend-title">Добавление Друзей</h1>
                    <p class="add-friend-subtitle">Находи новых друзей, отправляй запросы и расширяй свою сеть контактов для совместных игр</p>
                </div>
                
                <div class="add-friend-empty-state">
                    <div class="empty-state-card">
                        <div class="add-friend-circle-graphics">
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
                        <h2 class="empty-title">Расширяй свой круг общения!</h2>
                        <p class="empty-description">Найди новых друзей и создавай совместные игры. Авторизуйся, чтобы начать!</p>
                        <div class="cta-button auth-button">Авторизоваться</div>
                    </div>
                </div>
            </div>
        `;
    }

    const friendsHtml = users.map(user => {
        // Используем реальные данные игрока
        return `
        <div class="friend-card" data-osuid="${user.osuId}">
            <div class="friend-avatar-wrapper">
                <img src="${user.customAvatarUrl || user.avatarUrl || 'img/default-avatar.png'}" alt="Аватар" class="friend-avatar">
            </div>
            <div class="friend-info">
                <div class="friend-name-row">
                    <h3 class="friend-name">${user.username}</h3>
                    <div class="friend-flag-wrapper">
                        <img src="flags/russianfederation.png" alt="RU" class="friend-flag">
                    </div>
                </div>
                <div class="friend-stats">
                    <div class="friend-stat">
                        <div class="friend-stat-icon rating-icon"></div>
                        <span class="friend-stat-value">${user.elo || 0}</span>
                    </div>
                    <div class="friend-stat">
                        <div class="friend-stat-icon games-icon"></div>
                        <span class="friend-stat-value">${(user.ratingWins || 0) + (user.fastWins || 0)}</span>
                    </div>
                </div>
            </div>
            <button class="friend-add-btn" data-osuid="${user.osuId}" data-username="${user.username}">
                <span class="friend-add-icon"></span>
            </button>
        </div>
        `;
    }).join('');

    return `
        <div class="add-friend-container">
            <!-- Заголовок раздела в стиле новостей -->
            <div class="add-friend-header">
                <h1 class="add-friend-title">Добавление Друзей</h1>
                <p class="add-friend-subtitle">Находи новых друзей, отправляй запросы и расширяй свою сеть контактов для совместных игр</p>
            </div>
            
            <div class="add-friend-content">
                ${friendsHtml}
            </div>
            
            <!-- Кастомный скроллбар -->
            <div class="add-friend-custom-scrollbar">
                <div class="add-friend-custom-scrollbar-track">
                    <div class="add-friend-custom-scrollbar-thumb" style="top: 0;"></div>
                </div>
            </div>
        </div>
    `;
}