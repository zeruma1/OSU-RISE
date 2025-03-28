// fastGameTemplate.js
import { startMatchmaking } from './fastGameMatchmaking.js';

/**
 * Генерирует HTML-шаблон для страницы быстрой игры
 * @returns {string} HTML-шаблон
 */
export function getFastGameTemplate() {
    return `
        <div class="fast-game-container">
            <!-- Заголовок раздела -->
            <div class="fast-game-header">
                <h1 class="fast-game-title">Быстрая Игра</h1>
                <p class="fast-game-subtitle">
                    Испытай свои навыки в динамичных поединках без рейтинговых последствий, 
                    разогрейся перед рейтинговыми матчами
                </p>
            </div>
            
            <!-- Карточка быстрой игры -->
            <div class="fast-game-card">
                <!-- Декоративный баннер с эффектами -->
                <div class="fast-game-card-banner">
                    <div class="fast-game-card-banner-circle-1"></div>
                    <div class="fast-game-card-banner-circle-2"></div>
                </div>
                
                <!-- Контент карточки -->
                <div class="fast-game-card-content">
                    <h2 class="fast-game-card-title">Быстрый поединок 1 VS 1</h2>
                    <div class="fast-game-divider"></div>
                    <button class="fast-game-btn">НАЧАТЬ ПОДБОР</button>
                </div>
            </div>
        </div>
    `;
}

/**
 * Инициализирует обработчики событий для страницы быстрой игры
 */
export function initFastGameHandlers() {
    const startButton = document.querySelector('.fast-game-btn');
    if (startButton) {
        startButton.addEventListener('click', startMatchmaking);
    }
}