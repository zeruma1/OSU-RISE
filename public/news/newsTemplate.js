export function getNewsTemplate() {
    return `
        <div class="news-container">
            <div class="news-header">
                <h1 class="news-title">Новости OSU!RISE</h1>
                <p class="news-subtitle">Актуальные обновления, анонсы и события нашего сообщества</p>
            </div>
            
            <div class="news-grid-container">
                <div class="news-grid">
                    <div class="news-card featured" style="--card-index: 0;">
                        <div class="news-card-image">
                            <!-- В будущем можно добавить реальные изображения -->
                        </div>
                        <div class="news-card-content">
                            <span class="news-card-date">10.03.2025</span>
                            <h2 class="news-card-title">Масштабный реворкинг OSU!RISE</h2>
                            <p class="news-card-description">Мы полностью обновили платформу! Новый интерфейс, улучшенная производительность и множество новых функций — всё для того, чтобы сделать ваш опыт ещё лучше.</p>
                            <div class="news-card-divider"></div>
                        </div>
                    </div>
                    
                    <div class="news-card" style="--card-index: 1;">
                        <div class="news-card-image">
                            <!-- В будущем можно добавить реальные изображения -->
                        </div>
                        <div class="news-card-content">
                            <span class="news-card-date">02.03.2025</span>
                            <h2 class="news-card-title">Новые возможности для игроков</h2>
                            <p class="news-card-description">Запущены новые режимы игры и расширена система прогресса. Теперь вы можете отслеживать свои достижения ещё эффективнее.</p>
                            <div class="news-card-divider"></div>
                        </div>
                    </div>
                    
                    <div class="news-card" style="--card-index: 2;">
                        <div class="news-card-image">
                            <!-- В будущем можно добавить реальные изображения -->
                        </div>
                        <div class="news-card-content">
                            <span class="news-card-date">25.02.2025</span>
                            <h2 class="news-card-title">Весенний турнир OSU!RISE</h2>
                            <p class="news-card-description">Приглашаем всех на ежегодный весенний турнир! Регистрация уже открыта, а призовой фонд в этом году стал ещё больше.</p>
                            <div class="news-card-divider"></div>
                        </div>
                    </div>
                    
                    <div class="news-card" style="--card-index: 3;">
                        <div class="news-card-image">
                            <!-- В будущем можно добавить реальные изображения -->
                        </div>
                        <div class="news-card-content">
                            <span class="news-card-date">18.02.2025</span>
                            <h2 class="news-card-title">Обновление системы рейтинга</h2>
                            <p class="news-card-description">Мы пересмотрели алгоритм расчёта рейтинга для более справедливой оценки навыков игроков. Ваш текущий рейтинг был пересчитан согласно новой системе.</p>
                            <div class="news-card-divider"></div>
                        </div>
                    </div>
                    
                    <div class="news-card" style="--card-index: 4;">
                        <div class="news-card-image">
                            <!-- В будущем можно добавить реальные изображения -->
                        </div>
                        <div class="news-card-content">
                            <span class="news-card-date">10.02.2025</span>
                            <h2 class="news-card-title">Улучшения быстрой игры</h2>
                            <p class="news-card-description">Оптимизирован процесс поиска матчей и добавлены новые опции настройки. Теперь играть стало ещё удобнее!</p>
                            <div class="news-card-divider"></div>
                        </div>
                    </div>
                    
                    <div class="news-card" style="--card-index: 5;">
                        <div class="news-card-image">
                            <!-- В будущем можно добавить реальные изображения -->
                        </div>
                        <div class="news-card-content">
                            <span class="news-card-date">01.02.2025</span>
                            <h2 class="news-card-title">Запуск OSU!RISE</h2>
                            <p class="news-card-description">Мы рады представить вам нашу новую платформу! OSU!RISE создан с любовью к сообществу и стремлением предоставить лучший опыт для всех игроков.</p>
                            <div class="news-card-divider"></div>
                        </div>
                    </div>
                </div>
                
                <!-- Кастомный скроллбар теперь внутри news-grid-container -->
                <div class="news-custom-scrollbar">
                    <div class="news-custom-scrollbar-track">
                        <div class="news-custom-scrollbar-thumb"></div>
                    </div>
                </div>
            </div>
        </div>
    `;
}