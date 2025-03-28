export function getProfileTemplate(userData, isOwnProfile) {
    const avatarToShow = userData.customAvatarUrl || userData.avatarUrl;
    const bannerUrl = userData.bannerUrl || ''; // Путь к баннеру или пустая строка, если баннера нет
    const avatarWrapperClass = isOwnProfile ? 'avatar-wrapper own-profile' : 'avatar-wrapper';
    
    // Расчет процента для прогресс-баров
    const winratePercent = userData.winrate || 0;
    
    // Более продуманная система для ELO: макс. примерно 5000, но шкала более нелинейная
    // Делаем шкалу нелинейной, чтобы низкие значения не выглядели совсем маленькими
    const eloBase = 2000; // Базовое значение для хорошего заполнения полосы
    const eloPercentage = Math.min(100, Math.sqrt((userData.elo || 0) / eloBase) * 70); 
    
    // Более реалистичная шкала сложности: 7* обычно уже высокая сложность
    const avgDifficultyPercentage = Math.min(100, ((userData.avgDifficulty || 0) / 11) * 100);

    return `
        <div class="profile-container">
            <!-- Шапка профиля с баннером и основной информацией -->
            <div class="profile-header">
                <div class="profile-banner" style="background-image: url('${bannerUrl}');"></div>
                
                <div class="profile-avatar-area">
                    <div class="profile-avatar">
                        <div class="${avatarWrapperClass}">
                            <img class="avatar-image" src="${avatarToShow}" alt="Аватар пользователя">
                            ${isOwnProfile ? `
                            <div class="edit-avatar">
                                <img src="/img/editAvatar.svg" alt="Изменить аватар" class="edit-avatar-icon">
                            </div>
                            ` : ''}
                        </div>
                    </div>
                    
                    <div class="profile-name-badges">
                        <div class="profile-nickname">
                            <p>${userData.username}</p>
                            ${!isOwnProfile ? `
                            <button class="profile-add-friend" data-osuid="${userData.osuId}" data-username="${userData.username}">
                                Добавить в друзья
                            </button>` : ''}
                        </div>
                        
                        <div class="profile-flag">
                            <img src="/flags/russianfederation.png" alt="Флаг">
                            <p>Russian Federation</p>
                        </div>
                    </div>
                </div>
            </div>
            
            <!-- Контент профиля -->
            <div class="profile-content">
                <!-- Секция прогресса -->
                <div class="profile-progress">
                    <div class="progress-title">
                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 20v-6M6 20V10M18 20V4"/></svg>
                        Статистика игрока
                    </div>
                    
                    <div class="progress-bars">
                        <div class="progress-item">
                            <div class="progress-label">
                                <span>Винрейт</span>
                                <span>${userData.winrate}%</span>
                            </div>
                            <div class="progress-bar-bg">
                                <div class="progress-bar-fill" style="width: ${winratePercent}%"></div>
                            </div>
                        </div>
                        
                        <div class="progress-item">
                            <div class="progress-label">
                                <span>ELO Рейтинг</span>
                                <span>${userData.elo}</span>
                            </div>
                            <div class="progress-bar-bg">
                                <div class="progress-bar-fill" style="width: ${eloPercentage}%"></div>
                            </div>
                        </div>
                        
                        <div class="progress-item">
                            <div class="progress-label">
                                <span>Средняя сложность</span>
                                <span>${userData.avgDifficulty}*</span>
                            </div>
                            <div class="progress-bar-bg">
                                <div class="progress-bar-fill" style="width: ${avgDifficultyPercentage}%"></div>
                            </div>
                        </div>
                    </div>
                </div>
                
                <!-- Секции информации -->
                <div class="profile-info-sections">
                    <!-- Секция статистики -->
                    <div class="profile-stats-container">
                        <div class="stats-title">
                            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="12 2 2 7 12 12 22 7 12 2"/><polyline points="2 17 12 22 22 17"/><polyline points="2 12 12 17 22 12"/></svg>
                            Детальная статистика
                        </div>
                        
                        <div class="stats-grid">
                            <div class="stat-item">
                                <div class="stat-label">Место в рейтинге</div>
                                <div class="stat-value highlighted-stat">${userData.rank === 1 ? '<span class="first-place">№1</span>' : `№${userData.rank}`}</div>
                            </div>
                            
                            <div class="stat-item">
                                <div class="stat-label">ELO</div>
                                <div class="stat-value">${userData.elo}</div>
                            </div>
                            
                            <div class="stat-item">
                                <div class="stat-label">Победы в рейтинговой</div>
                                <div class="stat-value">${userData.ratingWins}</div>
                            </div>
                            
                            <div class="stat-item">
                                <div class="stat-label">Победы в обычной</div>
                                <div class="stat-value">${userData.fastWins}</div>
                            </div>
                            
                            <div class="stat-item">
                                <div class="stat-label">Любимый мод</div>
                                <div class="stat-value">${userData.favMod}</div>
                            </div>
                            
                            <div class="stat-item">
                                <div class="stat-label">AVG Difficulty</div>
                                <div class="stat-value">${userData.avgDifficulty}*</div>
                            </div>
                            
                            <div class="stat-item">
                                <div class="stat-label">Winrate</div>
                                <div class="stat-value">${userData.winrate}%</div>
                            </div>
                            
                            <div class="stat-item">
                                <div class="stat-label">Сыграно матчей</div>
                                <div class="stat-value">${userData.playcount}</div>
                            </div>
                        </div>
                    </div>
                    
                    <!-- Секция "Обо мне" -->
                    <div class="profile-bio-container">
                        <div class="bio-title">
                            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
                            Обо мне
                        </div>
                        
                        <div class="bio-content">
                            <div class="profile-bio">
                                <textarea placeholder="Напишите что-нибудь..">${userData.bio || ''}</textarea>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `;
}