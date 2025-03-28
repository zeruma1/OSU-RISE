// Основная функция инициализации раздела новостей
export function initNewsScrollbar() {
    // Определяем тип устройства
    const isMobile = isMobileDevice();
    
    // Инициализируем основные компоненты
    setupNewsSection();
    
    // Инициализируем кастомный скроллбар только для десктопа
    if (!isMobile) {
        initCustomScrollbar();
    } else {
        // Для мобильных устройств скрываем кастомный скроллбар и применяем оптимизации
        hideCustomScrollbar();
        applyMobileScrollingOptimizations();
    }
    
    // Наблюдатель за DOM для обработки динамически загружаемых элементов
    setupDOMObserver();
}

// Проверка, является ли устройство мобильным
function isMobileDevice() {
    const userAgent = navigator.userAgent || navigator.vendor || window.opera;
    // iOS определение
    const isIOS = /iPad|iPhone|iPod/.test(userAgent) && !window.MSStream;
    // Android определение
    const isAndroid = /android/i.test(userAgent);
    // Общая проверка сенсорных устройств и проверка по размеру
    const isTouch = ('ontouchstart' in window) || (navigator.maxTouchPoints > 0);
    // Проверка по размеру окна (телефоны обычно < 768px по ширине)
    const isSmallScreen = window.innerWidth <= 768;
    
    return isIOS || isAndroid || (isTouch && isSmallScreen);
}

// Скрываем кастомный скроллбар полностью
function hideCustomScrollbar() {
    const scrollbar = document.querySelector('.news-custom-scrollbar');
    if (scrollbar) {
        scrollbar.style.display = 'none';
    }
}

// Применение оптимизаций для мобильного скроллинга
function applyMobileScrollingOptimizations() {
    const newsGrid = document.querySelector('.news-grid');
    if (!newsGrid) return;
    
    // Оптимизированный скроллинг для мобильных
    // 1. Добавляем webkit-overflow-scrolling для инерции на iOS
    newsGrid.style.webkitOverflowScrolling = 'touch';
    
    // 2. Добавляем аппаратное ускорение
    newsGrid.style.transform = 'translateZ(0)';
    newsGrid.style.willChange = 'scroll-position';
    
    // 3. Улучшаем плавность скроллинга на iOS/Safari
    if (/iPad|iPhone|iPod/.test(navigator.userAgent)) {
        newsGrid.style.overflow = 'auto';
        newsGrid.style.webkitOverflowScrolling = 'touch';
    }
    
    // 4. Убираем padding-right чтобы не было пустого пространства справа
    newsGrid.style.paddingRight = '0';
    
    // 5. Используем пассивный обработчик для оптимизации производительности
    const originalScrollListener = newsGrid.onscroll;
    newsGrid.onscroll = null;
    newsGrid.addEventListener('scroll', function(e) {
        // Вызываем оригинальный обработчик, если он был
        if (typeof originalScrollListener === 'function') {
            originalScrollListener.call(newsGrid, e);
        }
    }, { passive: true });
}

function setupNewsSection() {
    // Добавляем обработчики событий для карточек
    const newsCards = document.querySelectorAll('.news-card');
    // Анимация появления карточек при загрузке
    newsCards.forEach((card, index) => {
        // Устанавливаем индекс для задержки анимации
        card.style.setProperty('--card-index', index);
        // Добавляем эффекты при наведении
        addCardHoverEffects(card);
    });
    // Инициализируем паттерны для изображений
    initializeCardBackgrounds();
    // Обработчик изменения размера окна
    window.addEventListener('resize', () => {
        // Обновляем скроллбар при изменении размера окна
        updateScrollbarThumb();
    });
}

function addCardHoverEffects(card) {
    // Добавляем эффект свечения при наведении
    card.addEventListener('mouseenter', (e) => {
        const rect = card.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        card.style.setProperty('--mouse-x', `${x}px`);
        card.style.setProperty('--mouse-y', `${y}px`);
    });
}

function initializeCardBackgrounds() {
    // Инициализация фоновых узоров для карточек
    const cardImages = document.querySelectorAll('.news-card-image');
    cardImages.forEach((imageContainer) => {
        // Создаем уникальный фоновый узор для каждой карточки
        createPatternBackground(imageContainer);
    });
    // Добавляем CSS для стилей, связанных с анимацией
    addAnimationStyles();
}

function createPatternBackground(container) {
    // Создаем уникальный фоновый узор для каждой карточки
    const pattern = document.createElement('div');
    pattern.classList.add('news-pattern-bg');
    // Используем один тип градиента для всех карточек для единообразия
    pattern.style.background = `
        linear-gradient(135deg, rgba(255, 102, 170, 0.2) 0%, rgba(217, 22, 140, 0.2) 100%)
    `;
    container.appendChild(pattern);
}

function addAnimationStyles() {
    // Проверяем, не добавлены ли уже стили
    if (document.getElementById('news-animation-styles')) return;
    // Добавляем стили для анимаций карточек
    const style = document.createElement('style');
    style.id = 'news-animation-styles';
    style.textContent = `
        .news-pattern-bg {
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            z-index: 1;
            opacity: 0.8;
            transition: opacity 0.3s ease;
        }
        .news-card:hover .news-pattern-bg {
            opacity: 1;
        }
    `;
    document.head.appendChild(style);
}

// Функция инициализации кастомного скроллбара
function initCustomScrollbar() {
    const newsGrid = document.querySelector('.news-grid');
    const scrollbar = document.querySelector('.news-custom-scrollbar');
    const scrollbarTrack = document.querySelector('.news-custom-scrollbar-track');
    const scrollbarThumb = document.querySelector('.news-custom-scrollbar-thumb');
    
    if (!newsGrid || !scrollbar || !scrollbarTrack || !scrollbarThumb) return;
    
    // Показываем скроллбар
    scrollbar.classList.add('visible');
    
    // Обновляем размер и позицию ползунка скроллбара
    updateScrollbarThumb();
    
    // Оптимизированный обработчик скролла с использованием requestAnimationFrame для плавности
    let ticking = false;
    newsGrid.addEventListener('scroll', () => {
        if (!ticking) {
            window.requestAnimationFrame(() => {
                updateScrollbarThumb();
                ticking = false;
            });
            ticking = true;
        }
    });
    
    // Переменные для отслеживания позиции при перетаскивании
    let isDragging = false;
    let startY = 0;
    let startScrollTop = 0;
    
    // Обработчики событий для перетаскивания ползунка
    scrollbarThumb.addEventListener('mousedown', (e) => {
        isDragging = true;
        startY = e.clientY;
        startScrollTop = newsGrid.scrollTop;
        document.body.style.userSelect = 'none'; // Предотвращаем выделение текста при перетаскивании
        
        // Добавляем класс для стилизации активного состояния
        scrollbarThumb.classList.add('active');
    });
    
    document.addEventListener('mousemove', (e) => {
        if (!isDragging) return;
        
        const deltaY = e.clientY - startY;
        const trackHeight = scrollbarTrack.clientHeight;
        const contentHeight = newsGrid.scrollHeight;
        const viewportHeight = newsGrid.clientHeight;
        
        // Вычисляем новую позицию скролла
        const scrollOffset = (deltaY / trackHeight) * contentHeight;
        newsGrid.scrollTop = startScrollTop + scrollOffset;
    });
    
    document.addEventListener('mouseup', () => {
        if (isDragging) {
            isDragging = false;
            document.body.style.userSelect = '';
            
            // Удаляем класс активного состояния
            scrollbarThumb.classList.remove('active');
        }
    });
    
    // Обработчик клика по треку для быстрого перемещения
    scrollbarTrack.addEventListener('click', (e) => {
        // Игнорируем клики на сам ползунок
        if (e.target === scrollbarThumb) return;
        
        const trackRect = scrollbarTrack.getBoundingClientRect();
        const clickPosition = e.clientY - trackRect.top;
        const trackHeight = trackRect.height;
        const contentHeight = newsGrid.scrollHeight;
        const viewportHeight = newsGrid.clientHeight;
        
        // Вычисляем позицию скролла относительно клика
        const scrollRatio = clickPosition / trackHeight;
        newsGrid.scrollTop = scrollRatio * (contentHeight - viewportHeight);
    });
}

// Функция обновления положения и размера ползунка скроллбара
function updateScrollbarThumb() {
    const newsGrid = document.querySelector('.news-grid');
    const scrollbarThumb = document.querySelector('.news-custom-scrollbar-thumb');
    const scrollbarTrack = document.querySelector('.news-custom-scrollbar-track');
    const scrollbar = document.querySelector('.news-custom-scrollbar');
    
    if (!newsGrid || !scrollbarThumb || !scrollbarTrack || !scrollbar) return;
    
    const contentHeight = newsGrid.scrollHeight;
    const viewportHeight = newsGrid.clientHeight;
    const trackHeight = scrollbarTrack.clientHeight;
    
    // Вычисляем высоту ползунка пропорционально соотношению viewport/content
    const thumbHeight = Math.max(
        (viewportHeight / contentHeight) * trackHeight,
        40 // Минимальная высота ползунка в px
    );
    
    // Вычисляем позицию ползунка
    const scrollRatio = contentHeight <= viewportHeight ? 0 : newsGrid.scrollTop / (contentHeight - viewportHeight);
    const thumbPosition = scrollRatio * (trackHeight - thumbHeight);
    
    // Обновляем стили ползунка
    scrollbarThumb.style.height = `${thumbHeight}px`;
    // Используем transform вместо top для лучшей производительности
    scrollbarThumb.style.transform = `translateY(${thumbPosition}px)`;
    
    // Проверяем, нужен ли скроллбар (если контент не превышает высоту области просмотра)
    if (contentHeight <= viewportHeight) {
        scrollbar.style.display = 'none';
    } else {
        scrollbar.style.display = 'block';
    }
}

function setupDOMObserver() {
    // Определяем, мобильное ли устройство
    const isMobile = isMobileDevice();
    
    // Создаем наблюдатель за изменениями DOM
    const observer = new MutationObserver((mutations) => {
        mutations.forEach((mutation) => {
            if (mutation.addedNodes.length > 0) {
                mutation.addedNodes.forEach((node) => {
                    // Проверяем, является ли добавленный узел элементом с нужным классом
                    if (node.classList && node.classList.contains('news-card')) {
                        // Обрабатываем новую карточку
                        const index = Array.from(document.querySelectorAll('.news-card')).indexOf(node);
                        node.style.setProperty('--card-index', index);
                        
                        // Эффекты при наведении только для десктопа
                        if (!isMobile) {
                            addCardHoverEffects(node);
                            // Обрабатываем изображение в карточке
                            const imageContainer = node.querySelector('.news-card-image');
                            if (imageContainer) {
                                createPatternBackground(imageContainer);
                            }
                            // Обновляем скроллбар только для десктопа
                            updateScrollbarThumb();
                        }
                    }
                });
            }
        });
    });
    
    // Начинаем наблюдение за содержимым контента
    const contentNode = document.querySelector('.content');
    if (contentNode) {
        observer.observe(contentNode, { childList: true, subtree: true });
    }
}