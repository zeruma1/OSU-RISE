let showAuthModal; // Функция для показа модального окна авторизации

export function setAuthModalFunction(authModalFunction) {
    showAuthModal = authModalFunction;
}

export async function getLeaderboardTemplate() {
    try {
        const response = await fetch('/api/leaderboard');
        if (!response.ok) {
            throw new Error('Ошибка при получении данных лидерборда');
        }
        const users = await response.json();

        if (users.length === 0) {
            return `
                <div class="leaderboard-container">
                    <!-- Заголовок лидерборда в стиле новостей -->
                    <div class="leaderboard-header">
                        <h1 class="leaderboard-title">Таблица Лидеров</h1>
                        <p class="leaderboard-subtitle">Покажи своё мастерство, соревнуйся с лучшими игроками и заслужи место среди элиты сообщества</p>
                    </div>
                    
                    <div class="leaderboard-empty-state">
                        <div class="empty-state-card">
                            <div class="leaderboard-circle-graphics">
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
                            <h2 class="empty-title">Стань легендой игры!</h2>
                            <p class="empty-description">Таблица лидеров ожидает отважных игроков. Авторизуйся и войди в историю!</p>
                            <div class="cta-button auth-button">Авторизоваться</div>
                        </div>
                    </div>
                </div>
            `;
        } else {
            return `
                <div class="leaderboard-container">
                    <!-- Заголовок лидерборда в стиле новостей -->
                    <div class="leaderboard-header">
                        <h1 class="leaderboard-title">Таблица Лидеров</h1>
                        <p class="leaderboard-subtitle">Покажи своё мастерство, соревнуйся с лучшими игроками и заслужи место среди элиты сообщества</p>
                    </div>
                    
                    <div class="leaderboard-content-wrapper">
                        <div class="leaderboard-scrollable-content">
                            <div class="leaderboard-grid">
                                ${users.map((user, index) => `
                                    <a href="#" class="player-card ${index < 3 ? 'top-' + (index + 1) : ''}" data-osuid="${user.osuId}" style="--index: ${index}">
                                        <div class="player-rank-container">
                                            <div class="player-rank">${index + 1}</div>
                                        </div>
                                        <div class="player-avatar-container">
                                            <img class="player-avatar" src="${user.customAvatarUrl || user.avatarUrl}" alt="Avatar">
                                        </div>
                                        <div class="player-info">
                                            <span class="player-nickname">${user.username}</span>
                                            <div class="player-stats">
                                                <div class="stat">
                                                    <span class="stat-label">ELO:</span>
                                                    <span class="stat-value">${user.elo}</span>
                                                </div>
                                                <div class="stat">
                                                    <span class="stat-label">Рейтинг побед:</span>
                                                    <span class="stat-value">${user.ratingWins}</span>
                                                </div>
                                                <div class="stat">
                                                    <span class="stat-label">Быстрые игры:</span>
                                                    <span class="stat-value">${user.fastWins}</span>
                                                </div>
                                                <div class="stat">
                                                    <span class="stat-label">Плейкаунт:</span>
                                                    <span class="stat-value">${user.playcount}</span>
                                                </div>
                                            </div>
                                        </div>
                                    </a>
                                `).join('')}
                            </div>
                        </div>
                        <div class="leaderboard-custom-scrollbar">
                            <div class="leaderboard-scrollbar-thumb"></div>
                        </div>
                    </div>
                </div>
            `;
        }
    } catch (error) {
        console.error('Ошибка при загрузке лидерборда:', error);
        return `
            <div class="leaderboard-container">
                <!-- Заголовок лидерборда в стиле новостей -->
                <div class="leaderboard-header">
                    <h1 class="leaderboard-title">Таблица Лидеров</h1>
                    <p class="leaderboard-subtitle">Покажи своё мастерство, соревнуйся с лучшими игроками и заслужи место среди элиты сообщества</p>
                </div>
                
                <p style="color: #ff6680; text-align: center; margin-top: 50px; font-size: 18px;">Ошибка при загрузке лидерборда</p>
            </div>
        `;
    }
}