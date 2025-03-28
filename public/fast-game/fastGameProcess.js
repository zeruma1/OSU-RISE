// public/fast-game/fastGameProcess.js
import { showToast } from '../active.js';

/**
 * Генерирует HTML-шаблон для процесса быстрой игры
 * @returns {string} HTML-шаблон
 */
export function getFastGameProcessTemplate() {
    return `
        <div class="fast-game-process-container">
            <!-- Верхние блоки: информация о комнате и статус игроков -->
            <div class="fast-game-room-info-container">
                <!-- Улучшенный блок с информацией о комнате -->
                <div class="fast-game-room-info">
                    <div class="fast-game-card-shine"></div>
                    <div class="fast-game-card-glow"></div>
                    <h2 class="fast-game-room-info-title">Информация о комнате</h2>
                    <div class="fast-game-room-details">
                        <div class="fast-game-room-item">
                            <div class="fast-game-room-item-icon">
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                    <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
                                    <polyline points="9 22 9 12 15 12 15 22"></polyline>
                                </svg>
                            </div>
                            <span class="fast-game-room-item-label">Название комнаты:</span>
                            <span class="fast-game-room-item-value">OsuRise_Match_12345</span>
                            <button class="fast-game-copy-btn" data-copy="OsuRise_Match_12345">
                                <img src="/img/copy-icon.svg" alt="Копировать">
                            </button>
                        </div>
                        <div class="fast-game-room-item">
                            <div class="fast-game-room-item-icon">
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                    <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
                                    <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
                                </svg>
                            </div>
                            <span class="fast-game-room-item-label">Пароль:</span>
                            <span class="fast-game-room-item-value">fastgame123</span>
                            <button class="fast-game-copy-btn" data-copy="fastgame123">
                                <img src="/img/copy-icon.svg" alt="Копировать">
                            </button>
                        </div>
                    </div>
                </div>

                <!-- Улучшенный блок статуса подключения игроков -->
                <div class="fast-game-players-status">
                    <div class="fast-game-card-shine"></div>
                    <div class="fast-game-card-glow"></div>
                    <h2 class="fast-game-players-status-title">Статус игроков</h2>
                    <div class="fast-game-player-status-list">
                        <div class="fast-game-player-status-item">
                            <div class="fast-game-player-avatar-container">
                                <div class="fast-game-player-avatar-glow connected"></div>
                                <img src="https://a.ppy.sh/2225708" alt="Аватар игрока" class="fast-game-player-avatar">
                                <div class="fast-game-player-avatar-badge">Вы</div>
                            </div>
                            <div class="fast-game-player-info">
                                <div class="fast-game-player-name">WhiteRaven</div>
                                <div class="fast-game-connection-status">
                                    <span class="fast-game-status-indicator connected"></span>
                                    Подключены к комнате
                                </div>
                            </div>
                        </div>
                        <div class="fast-game-player-status-item">
                            <div class="fast-game-player-avatar-container">
                                <div class="fast-game-player-avatar-glow waiting"></div>
                                <img src="https://a.ppy.sh/4504101" alt="Аватар оппонента" class="fast-game-player-avatar">
                            </div>
                            <div class="fast-game-player-info">
                                <div class="fast-game-player-name">ShadowBlade</div>
                                <div class="fast-game-connection-status">
                                    <span class="fast-game-status-indicator waiting"></span>
                                    Ожидание подключения...
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Улучшенные блоки с картами (Best of 5) -->
            <div class="fast-game-maps-container">
                <!-- Карта 1 (с улучшенным дизайном) -->
                <div class="fast-game-map-card completed winner-you">
                    <div class="fast-game-map-background" style="background-image: url('https://assets.ppy.sh/beatmaps/1264535/covers/cover.jpg');"></div>
                    <div class="fast-game-map-overlay"></div>
                    <div class="fast-game-winner-highlight"></div>
                    <div class="fast-game-map-content">
                        <div class="fast-game-map-header">
                            <div class="fast-game-map-title-area">
                                <h3 class="fast-game-map-title">Imagine Dragons - Believer</h3>
                                <div class="fast-game-map-artist">Mapped by Sotarks</div>
                            </div>
                            <div class="fast-game-map-mod-badge mod-hd">HD</div>
                        </div>
                        
                        <div class="fast-game-map-stats">
                            <div class="fast-game-map-star">
                                <span class="star-icon">★</span>
                                <span class="fast-game-map-star-value">5.3</span>
                            </div>
                            <div class="fast-game-map-stat length-stat">
                                <span class="fast-game-map-stat-value">3:24</span>
                            </div>
                            <div class="fast-game-map-stat bpm-stat">
                                <span class="fast-game-map-stat-value">125 BPM</span>
                            </div>
                            <div class="fast-game-map-stat cs-stat">
                                <span class="fast-game-map-stat-value">4</span>
                            </div>
                            <div class="fast-game-map-stat ar-stat">
                                <span class="fast-game-map-stat-value">9.3</span>
                            </div>
                        </div>
                        
                        <div class="fast-game-map-status-badge completed">
                            <span class="fast-game-status-icon"></span>
                            Игра завершена
                        </div>
                        
                        <div class="fast-game-map-results">
                            <div class="fast-game-player-result winner">
                                <div class="fast-game-result-highlight"></div>
                                <img src="https://a.ppy.sh/2225708" alt="Аватар игрока" class="fast-game-result-avatar">
                                <div class="fast-game-result-details">
                                    <div class="fast-game-result-name">Вы (WhiteRaven)</div>
                                    <div class="fast-game-result-score">987,654</div>
                                    <div class="fast-game-result-accuracy">Точность: 98.76%</div>
                                </div>
                                <div class="fast-game-result-badge">Победа</div>
                            </div>
                            <div class="fast-game-player-result">
                                <img src="https://a.ppy.sh/4504101" alt="Аватар оппонента" class="fast-game-result-avatar">
                                <div class="fast-game-result-details">
                                    <div class="fast-game-result-name">ShadowBlade</div>
                                    <div class="fast-game-result-score">865,432</div>
                                    <div class="fast-game-result-accuracy">Точность: 96.54%</div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Карта 2 (с улучшенным дизайном) -->
                <div class="fast-game-map-card completed winner-opponent">
                    <div class="fast-game-map-background" style="background-image: url('https://assets.ppy.sh/beatmaps/771159/covers/cover.jpg');"></div>
                    <div class="fast-game-map-overlay"></div>
                    <div class="fast-game-winner-highlight opponent"></div>
                    <div class="fast-game-map-content">
                        <div class="fast-game-map-header">
                            <div class="fast-game-map-title-area">
                                <h3 class="fast-game-map-title">YOASOBI - Racing Into The Night</h3>
                                <div class="fast-game-map-artist">Mapped by Monstrata</div>
                            </div>
                            <div class="fast-game-map-mod-badge mod-dt">DT</div>
                        </div>
                        
                        <div class="fast-game-map-stats">
                            <div class="fast-game-map-star">
                                <span class="star-icon">★</span>
                                <span class="fast-game-map-star-value">6.2</span>
                            </div>
                            <div class="fast-game-map-stat length-stat">
                                <span class="fast-game-map-stat-value">3:58</span>
                            </div>
                            <div class="fast-game-map-stat bpm-stat">
                                <span class="fast-game-map-stat-value">130 BPM</span>
                            </div>
                            <div class="fast-game-map-stat cs-stat">
                                <span class="fast-game-map-stat-value">4.2</span>
                            </div>
                            <div class="fast-game-map-stat ar-stat">
                                <span class="fast-game-map-stat-value">9.6</span>
                            </div>
                        </div>
                        
                        <div class="fast-game-map-status-badge completed">
                            <span class="fast-game-status-icon"></span>
                            Игра завершена
                        </div>
                        
                        <div class="fast-game-map-results">
                            <div class="fast-game-player-result">
                                <img src="https://a.ppy.sh/2225708" alt="Аватар игрока" class="fast-game-result-avatar">
                                <div class="fast-game-result-details">
                                    <div class="fast-game-result-name">Вы (WhiteRaven)</div>
                                    <div class="fast-game-result-score">756,321</div>
                                    <div class="fast-game-result-accuracy">Точность: 95.43%</div>
                                </div>
                            </div>
                            <div class="fast-game-player-result winner">
                                <div class="fast-game-result-highlight"></div>
                                <img src="https://a.ppy.sh/4504101" alt="Аватар оппонента" class="fast-game-result-avatar">
                                <div class="fast-game-result-details">
                                    <div class="fast-game-result-name">ShadowBlade</div>
                                    <div class="fast-game-result-score">878,965</div>
                                    <div class="fast-game-result-accuracy">Точность: 97.21%</div>
                                </div>
                                <div class="fast-game-result-badge">Победа</div>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Карта 4 (с улучшенным дизайном) -->
                <div class="fast-game-map-card waiting">
                    <div class="fast-game-map-background" style="background-image: url('https://assets.ppy.sh/beatmaps/771159/covers/cover.jpg');"></div>
                    <div class="fast-game-map-overlay"></div>
                    <div class="fast-game-map-content">
                        <div class="fast-game-map-header">
                            <div class="fast-game-map-title-area">
                                <h3 class="fast-game-map-title">Aimer - Brave Shine</h3>
                                <div class="fast-game-map-artist">Mapped by Doormat</div>
                            </div>
                            <div class="fast-game-map-mod-badge mod-hd">HD</div>
                        </div>
                        
                        <div class="fast-game-map-stats">
                            <div class="fast-game-map-star">
                                <span class="star-icon">★</span>
                                <span class="fast-game-map-star-value">5.7</span>
                            </div>
                            <div class="fast-game-map-stat length-stat">
                                <span class="fast-game-map-stat-value">4:12</span>
                            </div>
                            <div class="fast-game-map-stat bpm-stat">
                                <span class="fast-game-map-stat-value">178 BPM</span>
                            </div>
                            <div class="fast-game-map-stat cs-stat">
                                <span class="fast-game-map-stat-value">4</span>
                            </div>
                            <div class="fast-game-map-stat ar-stat">
                                <span class="fast-game-map-stat-value">9.4</span>
                            </div>
                        </div>
                        
                        <div class="fast-game-map-status-badge waiting">
                            <span class="fast-game-status-icon"></span>
                            Ожидание начала игры
                        </div>
                    </div>
                </div>

                <!-- Карта 5 (с улучшенным дизайном) -->
                <div class="fast-game-map-card waiting">
                    <div class="fast-game-map-background" style="background-image: url('https://assets.ppy.sh/beatmaps/1264535/covers/cover.jpg');"></div>
                    <div class="fast-game-map-overlay"></div>
                    <div class="fast-game-map-content">
                        <div class="fast-game-map-header">
                            <div class="fast-game-map-title-area">
                                <h3 class="fast-game-map-title">LiSA - Gurenge</h3>
                                <div class="fast-game-map-artist">Mapped by Reform</div>
                            </div>
                            <div class="fast-game-map-mod-badge mod-dt">DT</div>
                        </div>
                        
                        <div class="fast-game-map-stats">
                            <div class="fast-game-map-star">
                                <span class="star-icon">★</span>
                                <span class="fast-game-map-star-value">6.1</span>
                            </div>
                            <div class="fast-game-map-stat length-stat">
                                <span class="fast-game-map-stat-value">3:45</span>
                            </div>
                            <div class="fast-game-map-stat bpm-stat">
                                <span class="fast-game-map-stat-value">142 BPM</span>
                            </div>
                            <div class="fast-game-map-stat cs-stat">
                                <span class="fast-game-map-stat-value">4.2</span>
                            </div>
                            <div class="fast-game-map-stat ar-stat">
                                <span class="fast-game-map-stat-value">9.5</span>
                            </div>
                        </div>
                        
                        <div class="fast-game-map-status-badge waiting">
                            <span class="fast-game-status-icon"></span>
                            Ожидание начала игры
                        </div>
                    </div>
                </div>
            </div>

            <!-- Улучшенный блок победителя матча (будет виден в конце) -->
            <div class="fast-game-winner-container">
                <div class="fast-game-winner-card">
                    <div class="fast-game-winner-particles"></div>
                    <div class="fast-game-winner-glow"></div>
                    <div class="fast-game-card-shine winner-shine"></div>
                    <h2 class="fast-game-winner-title">Победитель матча</h2>
                    <div class="fast-game-winner-player">
                        <div class="fast-game-winner-crown-container">
                            <div class="fast-game-winner-crown-glow"></div>
                            <img src="https://cdn-icons-png.flaticon.com/512/2829/2829656.png" alt="Корона" class="fast-game-winner-crown">
                        </div>
                        <div class="fast-game-winner-avatar-wrapper">
                            <div class="fast-game-winner-avatar-glow"></div>
                            <div class="fast-game-winner-avatar">
                                <img src="https://a.ppy.sh/2225708" alt="Аватар победителя">
                            </div>
                            <div class="fast-game-winner-avatar-confetti"></div>
                        </div>
                        <div class="fast-game-winner-name">Вы (WhiteRaven)</div>
                        <div class="fast-game-winner-score">
                            Счёт: <span class="fast-game-winner-score-value">3:2</span>
                        </div>
                        <div class="fast-game-winner-badge">VICTORY</div>
                        <div class="fast-game-winner-stats">
                            <div class="fast-game-winner-stat">
                                <span class="fast-game-winner-stat-label">Средняя точность</span>
                                <span class="fast-game-winner-stat-value">96.7%</span>
                            </div>
                            <div class="fast-game-winner-stat">
                                <span class="fast-game-winner-stat-label">Лучший скор</span>
                                <span class="fast-game-winner-stat-value">987,654</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            
            <!-- Улучшенные кнопки действий -->
            <div class="fast-game-actions">
                <button class="fast-game-new-match-btn">
                    <span class="fast-game-btn-icon">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <polyline points="23 4 23 10 17 10"></polyline>
                            <polyline points="1 20 1 14 7 14"></polyline>
                            <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"></path>
                        </svg>
                    </span>
                    Новый матч
                </button>
                <button class="fast-game-share-btn">
                    <span class="fast-game-btn-icon">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <circle cx="18" cy="5" r="3"></circle>
                            <circle cx="6" cy="12" r="3"></circle>
                            <circle cx="18" cy="19" r="3"></circle>
                            <line x1="8.59" y1="13.51" x2="15.42" y2="17.49"></line>
                            <line x1="15.41" y1="6.51" x2="8.59" y2="10.49"></line>
                        </svg>
                    </span>
                    Поделиться
                </button>
            </div>
        </div>
    `;
}

/**
 * Инициализирует обработчики событий для процесса быстрой игры
 */
export function initFastGameProcessHandlers() {
    // Обработчик для кнопки "Новый матч"
    const newMatchBtn = document.querySelector('.fast-game-new-match-btn');
    if (newMatchBtn) {
        newMatchBtn.addEventListener('click', () => {
            // Перезагрузка страницы быстрой игры
            import('./fastGameTemplate.js').then(module => {
                document.querySelector('.content').innerHTML = module.getFastGameTemplate();
                module.initFastGameHandlers();
            }).catch(error => {
                console.error('Ошибка при загрузке шаблона быстрой игры:', error);
            });
        });
    }

    // Обработчик для кнопки "Поделиться"
    const shareBtn = document.querySelector('.fast-game-share-btn');
    if (shareBtn) {
        shareBtn.addEventListener('click', () => {
            showToast('Функционал "Поделиться" находится в разработке');
        });
    }

    // Обработчики для кнопок копирования
    const copyBtns = document.querySelectorAll('.fast-game-copy-btn');
    copyBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            const textToCopy = btn.getAttribute('data-copy');
            if (textToCopy) {
                navigator.clipboard.writeText(textToCopy).then(() => {
                    showToast('Текст скопирован в буфер обмена');
                }).catch(err => {
                    console.error('Ошибка при копировании текста:', err);
                    showToast('Не удалось скопировать текст', 'error');
                });
            }
        });
    });
}