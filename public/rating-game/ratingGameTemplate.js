export function getRatingGameTemplate() {
    return `
        <div class="rating-game-container">
            <!-- Заголовок раздела в стиле новостей -->
            <div class="rating-game-header">
                <h1 class="rating-game-title">Рейтинговый Режим</h1>
                <p class="rating-game-subtitle">Вызови достойных соперников, докажи свое мастерство и покори вершину рейтинга в соревновательных матчах</p>
            </div>
            
            <!-- Карточка рейтинговой игры в стиле новостной карточки -->
            <div class="rating-game-card">
                <!-- Декоративный баннер с эффектами -->
                <div class="rating-game-card-banner">
                    <!-- Декоративные элементы -->
                    <div class="rating-game-card-banner-circle-1"></div>
                    <div class="rating-game-card-banner-circle-2"></div>
                </div>
                
                <!-- Контент карточки -->
                <div class="rating-game-card-content">
                    <h2 class="rating-game-card-title">Рейтинговый поединок 1 VS 1</h2>
                    <!-- Декоративный разделитель -->
                    <div class="rating-game-divider"></div>
                    <!-- Кнопка начала поиска -->
                    <button class="rating-game-btn">НАЧАТЬ ПОДБОР</button>
                </div>
            </div>
        </div>
    `;
}