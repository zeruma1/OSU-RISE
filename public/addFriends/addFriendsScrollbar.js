// addFriendsScrollbar.js 
export function initAddFriendsScrollbar() {
    // Поиск необходимых элементов
    const addFriendContainer = document.querySelector('.add-friend-container');
    if (!addFriendContainer) {
        console.warn('Контейнер .add-friend-container не найден');
        return;
    }

    const addFriendContent = addFriendContainer.querySelector('.add-friend-content');
    if (!addFriendContent) {
        console.warn('Контейнер .add-friend-content не найден');
        return;
    }

    const addFriendScrollbar = addFriendContainer.querySelector('.add-friend-custom-scrollbar');
    if (!addFriendScrollbar) {
        console.warn('Скроллбар .add-friend-custom-scrollbar не найден');
        return;
    }

    const addFriendScrollbarTrack = addFriendScrollbar.querySelector('.add-friend-custom-scrollbar-track');
    if (!addFriendScrollbarTrack) {
        console.warn('Трек скроллбара .add-friend-custom-scrollbar-track не найден');
        return;
    }

    const addFriendScrollbarThumb = addFriendScrollbar.querySelector('.add-friend-custom-scrollbar-thumb');
    if (!addFriendScrollbarThumb) {
        console.warn('Ползунок скроллбара .add-friend-custom-scrollbar-thumb не найден');
        return;
    }

    // Функция обновления скроллбара
    function updateAddFriendScrollbar() {
        // Получаем точные размеры и позиции элементов
        const contentRect = addFriendContent.getBoundingClientRect();
        const containerRect = addFriendContainer.getBoundingClientRect();
        
        // Вычисляем относительное положение контента внутри контейнера
        const contentTop = contentRect.top - containerRect.top;
        
        // Устанавливаем позицию и высоту скроллбара точно по контенту
        addFriendScrollbar.style.top = `${contentTop}px`;
        addFriendScrollbar.style.height = `${contentRect.height}px`;
        
        const contentHeight = addFriendContent.scrollHeight;
        const containerHeight = addFriendContent.clientHeight;
        
        if (contentHeight <= containerHeight) {
            // Скрываем скроллбар, если все содержимое помещается
            addFriendScrollbar.style.display = 'none';
        } else {
            // Показываем скроллбар и устанавливаем размер ползунка
            addFriendScrollbar.style.display = 'block';
            const trackHeight = addFriendScrollbar.clientHeight;
            const thumbHeight = Math.max(40, (containerHeight / contentHeight) * trackHeight);
            addFriendScrollbarThumb.style.height = `${thumbHeight}px`;
            
            // Обновляем позицию ползунка
            updateThumbPosition();
        }
    }

    // Функция обновления позиции ползунка
    function updateThumbPosition() {
        const scrollTop = addFriendContent.scrollTop;
        const contentHeight = addFriendContent.scrollHeight;
        const containerHeight = addFriendContent.clientHeight;
        const trackHeight = addFriendScrollbar.clientHeight;
        const thumbHeight = parseFloat(addFriendScrollbarThumb.style.height);
        
        // Вычисляем позицию ползунка на основе прокрутки контента
        const scrollRatio = contentHeight <= containerHeight ? 0 : scrollTop / (contentHeight - containerHeight);
        const thumbTop = scrollRatio * (trackHeight - thumbHeight);
        
        // Устанавливаем позицию ползунка
        addFriendScrollbarThumb.style.top = `${Math.max(0, thumbTop)}px`;
    }

    // Инициализируем скроллбар
    updateAddFriendScrollbar();

    // Обработчик события прокрутки контента
    addFriendContent.addEventListener('scroll', updateThumbPosition);

    // Обработчик изменения размера окна
    window.addEventListener('resize', () => {
        setTimeout(updateAddFriendScrollbar, 100);
    });

    // Переменные для обработки перетаскивания ползунка
    let isDragging = false;
    let startY;
    let startTop;

    // Обработчик нажатия на ползунок
    addFriendScrollbarThumb.addEventListener('mousedown', (e) => {
        isDragging = true;
        startY = e.clientY;
        startTop = parseFloat(addFriendScrollbarThumb.style.top) || 0;
        document.body.style.userSelect = 'none'; // Запрещаем выделение текста при перетаскивании
        e.preventDefault();
    });

    // Обработчик перемещения мыши
    document.addEventListener('mousemove', (e) => {
        if (!isDragging) return;
        
        const deltaY = e.clientY - startY;
        const trackHeight = addFriendScrollbar.clientHeight;
        const thumbHeight = parseFloat(addFriendScrollbarThumb.style.height);
        
        // Вычисляем новую позицию ползунка
        const maxTop = trackHeight - thumbHeight;
        let newTop = Math.max(0, Math.min(startTop + deltaY, maxTop));
        addFriendScrollbarThumb.style.top = `${newTop}px`;
        
        // Прокручиваем контент
        const scrollRatio = newTop / maxTop;
        const contentHeight = addFriendContent.scrollHeight;
        const containerHeight = addFriendContent.clientHeight;
        addFriendContent.scrollTop = scrollRatio * (contentHeight - containerHeight);
    });

    // Обработчик отпускания кнопки мыши
    document.addEventListener('mouseup', () => {
        if (isDragging) {
            isDragging = false;
            document.body.style.userSelect = ''; // Возвращаем возможность выделения текста
        }
    });

    // Обработчик клика по треку скроллбара
    addFriendScrollbarTrack.addEventListener('click', (e) => {
        // Игнорируем клики по ползунку
        if (e.target === addFriendScrollbarThumb) return;
        
        const trackRect = addFriendScrollbarTrack.getBoundingClientRect();
        const clickY = e.clientY - trackRect.top;
        const thumbHeight = parseFloat(addFriendScrollbarThumb.style.height);
        const trackHeight = addFriendScrollbar.clientHeight;
        
        // Вычисляем новую позицию ползунка
        let newTop = clickY - (thumbHeight / 2);
        newTop = Math.max(0, Math.min(newTop, trackHeight - thumbHeight));
        addFriendScrollbarThumb.style.top = `${newTop}px`;
        
        // Прокручиваем контент
        const scrollRatio = newTop / (trackHeight - thumbHeight);
        const contentHeight = addFriendContent.scrollHeight;
        const containerHeight = addFriendContent.clientHeight;
        addFriendContent.scrollTop = scrollRatio * (contentHeight - containerHeight);
    });

    // Наблюдаем за изменениями контента
    const observer = new MutationObserver(() => {
        setTimeout(updateAddFriendScrollbar, 100);
    });
    observer.observe(addFriendContent, { childList: true, subtree: true });

    // Поддержка прокрутки колесиком мыши при наведении на скроллбар
    addFriendScrollbar.addEventListener('wheel', (e) => {
        e.preventDefault();
        const delta = e.deltaY || e.detail || e.wheelDelta;
        addFriendContent.scrollTop += delta > 0 ? 40 : -40;
    });

    // Инициализируем с задержкой, чтобы стили успели применится
    setTimeout(updateAddFriendScrollbar, 100);
    
    // Добавляем обработчик события DOMContentLoaded для надежности
    document.addEventListener('DOMContentLoaded', () => {
        setTimeout(updateAddFriendScrollbar, 200);
    });
    
    // Дополнительные интервалы обновления для большей надежности
    setTimeout(updateAddFriendScrollbar, 500);
    setTimeout(updateAddFriendScrollbar, 1000);
}