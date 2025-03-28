// notificationsScrollbar.js
// Основная функция инициализации раздела уведомлений
export function initNotificationsScrollbar() {
    // Определяем тип устройства
    const isMobile = isMobileDevice();
    
    // Инициализируем основные компоненты
    setupNotificationsSection();
    
    // Инициализируем кастомный скроллбар только для десктопа
    if (!isMobile) {
        initCustomScrollbar();
    } else {
        // Для мобильных устройств скрываем кастомный скроллбар и применяем оптимизации
        hideCustomScrollbar();
        applyMobileScrollingOptimizations();
    }
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
    const scrollbar = document.querySelector('.notifications-custom-scrollbar');
    if (scrollbar) {
        scrollbar.style.display = 'none';
    }
}

// Применение оптимизаций для мобильного скроллинга
function applyMobileScrollingOptimizations() {
    const notificationsGrid = document.querySelector('.notifications-grid');
    if (!notificationsGrid) return;
    
    // Оптимизированный скроллинг для мобильных
    notificationsGrid.style.webkitOverflowScrolling = 'touch';
    notificationsGrid.style.transform = 'translateZ(0)';
    notificationsGrid.style.willChange = 'scroll-position';
    
    // Улучшаем плавность скроллинга на iOS/Safari
    if (/iPad|iPhone|iPod/.test(navigator.userAgent)) {
        notificationsGrid.style.overflow = 'auto';
        notificationsGrid.style.webkitOverflowScrolling = 'touch';
    }
    
    // Убираем padding-right чтобы не было пустого пространства справа
    notificationsGrid.style.paddingRight = '0';
    
    // Используем пассивный обработчик для оптимизации производительности
    const originalScrollListener = notificationsGrid.onscroll;
    notificationsGrid.onscroll = null;
    notificationsGrid.addEventListener('scroll', function(e) {
        if (typeof originalScrollListener === 'function') {
            originalScrollListener.call(notificationsGrid, e);
        }
    }, { passive: true });
}

// Настройка базовых элементов секции уведомлений
function setupNotificationsSection() {
    // Добавляем анимации для карточек уведомлений
    const notificationCards = document.querySelectorAll('.notification-card');
    notificationCards.forEach((card, index) => {
        // Добавляем эффекты при наведении
        addCardHoverEffects(card);
    });
    
    // Обработчик изменения размера окна
    window.addEventListener('resize', () => {
        // Обновляем скроллбар при изменении размера окна
        updateScrollbarThumb();
    });
}

// Добавление эффектов при наведении на карточку
function addCardHoverEffects(card) {
    card.addEventListener('mouseenter', (e) => {
        const rect = card.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        card.style.setProperty('--mouse-x', `${x}px`);
        card.style.setProperty('--mouse-y', `${y}px`);
    });
}

// Функция инициализации кастомного скроллбара
function initCustomScrollbar() {
    const notificationsGrid = document.querySelector('.notifications-grid');
    const scrollbar = document.querySelector('.notifications-custom-scrollbar');
    const scrollbarTrack = document.querySelector('.notifications-custom-scrollbar-track');
    const scrollbarThumb = document.querySelector('.notifications-custom-scrollbar-thumb');
    
    if (!notificationsGrid || !scrollbar || !scrollbarTrack || !scrollbarThumb) return;
    
    // Показываем скроллбар
    scrollbar.classList.add('visible');
    
    // Обновляем размер и позицию ползунка скроллбара
    updateScrollbarThumb();
    
    // Оптимизированный обработчик скролла с использованием requestAnimationFrame для плавности
    let ticking = false;
    notificationsGrid.addEventListener('scroll', () => {
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
        startScrollTop = notificationsGrid.scrollTop;
        document.body.style.userSelect = 'none'; // Предотвращаем выделение текста при перетаскивании
        
        // Добавляем класс для стилизации активного состояния
        scrollbarThumb.classList.add('active');
    });
    
    document.addEventListener('mousemove', (e) => {
        if (!isDragging) return;
        
        const deltaY = e.clientY - startY;
        const trackHeight = scrollbarTrack.clientHeight;
        const contentHeight = notificationsGrid.scrollHeight;
        const viewportHeight = notificationsGrid.clientHeight;
        
        // Вычисляем новую позицию скролла
        const scrollOffset = (deltaY / trackHeight) * contentHeight;
        notificationsGrid.scrollTop = startScrollTop + scrollOffset;
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
        const contentHeight = notificationsGrid.scrollHeight;
        const viewportHeight = notificationsGrid.clientHeight;
        
        // Вычисляем позицию скролла относительно клика
        const scrollRatio = clickPosition / trackHeight;
        notificationsGrid.scrollTop = scrollRatio * (contentHeight - viewportHeight);
    });
}

// Функция обновления положения и размера ползунка скроллбара
function updateScrollbarThumb() {
    const notificationsGrid = document.querySelector('.notifications-grid');
    const scrollbarThumb = document.querySelector('.notifications-custom-scrollbar-thumb');
    const scrollbarTrack = document.querySelector('.notifications-custom-scrollbar-track');
    const scrollbar = document.querySelector('.notifications-custom-scrollbar');
    
    if (!notificationsGrid || !scrollbarThumb || !scrollbarTrack || !scrollbar) return;
    
    const contentHeight = notificationsGrid.scrollHeight;
    const viewportHeight = notificationsGrid.clientHeight;
    const trackHeight = scrollbarTrack.clientHeight;
    
    // Вычисляем высоту ползунка пропорционально соотношению viewport/content
    const thumbHeight = Math.max(
        (viewportHeight / contentHeight) * trackHeight,
        40 // Минимальная высота ползунка в px
    );
    
    // Вычисляем позицию ползунка
    const scrollRatio = contentHeight <= viewportHeight ? 0 : notificationsGrid.scrollTop / (contentHeight - viewportHeight);
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