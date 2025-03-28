export function initLeaderboardScrollbar() {
    const leaderboardContainer = document.querySelector('.leaderboard-container');
    if (!leaderboardContainer) {
        console.error('Контейнер лидерборда не найден');
        return;
    }

    const contentWrapper = leaderboardContainer.querySelector('.leaderboard-content-wrapper');
    if (!contentWrapper) {
        console.error('Обертка контента лидерборда не найдена');
        return;
    }

    const leaderboardContent = contentWrapper.querySelector('.leaderboard-scrollable-content');
    const leaderboardScrollbar = contentWrapper.querySelector('.leaderboard-custom-scrollbar');
    const leaderboardScrollbarTrack = leaderboardScrollbar?.querySelector('.leaderboard-custom-scrollbar-track');
    const leaderboardScrollbarThumb = leaderboardScrollbar?.querySelector('.leaderboard-scrollbar-thumb');

    if (!leaderboardContent || !leaderboardScrollbar || !leaderboardScrollbarThumb) {
        console.error('Не удалось найти элементы скроллбара лидерборда');
        return;
    }

    // Проверка видимости скроллбара
    function updateScrollbarVisibility() {
        const contentHeight = leaderboardContent.scrollHeight;
        const containerHeight = contentWrapper.clientHeight;
        leaderboardScrollbar.style.display = contentHeight <= containerHeight ? 'none' : 'block';
    }

    // Обновление высоты ползунка
    function updateThumbHeight() {
        const contentHeight = leaderboardContent.scrollHeight;
        const containerHeight = contentWrapper.clientHeight;
        if (contentHeight > containerHeight) {
            const thumbHeight = Math.max(20, (containerHeight / contentHeight) * containerHeight);
            leaderboardScrollbarThumb.style.height = `${thumbHeight}px`;
        }
    }

    // Обновление положения ползунка
    function updateThumbPosition() {
        const scrollTop = leaderboardContent.scrollTop;
        const contentHeight = leaderboardContent.scrollHeight;
        const containerHeight = contentWrapper.clientHeight;
        const thumbHeight = parseFloat(leaderboardScrollbarThumb.style.height) || 20;
        const maxScroll = contentHeight - containerHeight;
        if (maxScroll <= 0) return;
        const maxThumbTop = containerHeight - thumbHeight;
        const thumbTop = (scrollTop / maxScroll) * maxThumbTop;
        leaderboardScrollbarThumb.style.top = `${Math.max(0, Math.min(thumbTop, maxThumbTop))}px`;
    }

    // Инициализация
    updateScrollbarVisibility();
    updateThumbHeight();
    updateThumbPosition();

    // Обновление при прокрутке контента
    leaderboardContent.addEventListener('scroll', () => {
        updateThumbPosition();
    });

    // Обновление при изменении размера окна
    window.addEventListener('resize', () => {
        setTimeout(() => {
            updateScrollbarVisibility();
            updateThumbHeight();
            updateThumbPosition();
        }, 100);
    });

    // Перетаскивание ползунка
    let isDragging = false;
    let startY;
    let startTop;

    leaderboardScrollbarThumb.addEventListener('mousedown', (e) => {
        isDragging = true;
        startY = e.clientY;
        startTop = parseFloat(leaderboardScrollbarThumb.style.top) || 0;
        e.preventDefault();
    });

    document.addEventListener('mousemove', (e) => {
        if (!isDragging) return;
        const deltaY = e.clientY - startY;
        const containerHeight = contentWrapper.clientHeight;
        const thumbHeight = parseFloat(leaderboardScrollbarThumb.style.height) || 20;
        const maxTop = containerHeight - thumbHeight;
        let newTop = startTop + deltaY;
        newTop = Math.max(0, Math.min(newTop, maxTop));
        leaderboardScrollbarThumb.style.top = `${newTop}px`;

        const scrollRatio = newTop / maxTop;
        const contentHeight = leaderboardContent.scrollHeight;
        const maxScroll = contentHeight - containerHeight;
        leaderboardContent.scrollTop = scrollRatio * maxScroll;
    });

    document.addEventListener('mouseup', () => {
        isDragging = false;
    });

    // Клик по треку
    if (leaderboardScrollbarTrack) {
        leaderboardScrollbarTrack.addEventListener('click', (e) => {
            const trackRect = leaderboardScrollbarTrack.getBoundingClientRect();
            const clickY = e.clientY - trackRect.top;
            const thumbHeight = parseFloat(leaderboardScrollbarThumb.style.height) || 20;
            const currentTop = parseFloat(leaderboardScrollbarThumb.style.top) || 0;
            const containerHeight = contentWrapper.clientHeight;

            if (clickY < currentTop) {
                leaderboardContent.scrollTop -= containerHeight;
            } else if (clickY > currentTop + thumbHeight) {
                leaderboardContent.scrollTop += containerHeight;
            }
            updateThumbPosition();
        });
    }

    // Отслеживание изменений контента
    const observer = new MutationObserver(() => {
        updateScrollbarVisibility();
        updateThumbHeight();
        updateThumbPosition();
    });
    observer.observe(leaderboardContent, { childList: true, subtree: true });
}