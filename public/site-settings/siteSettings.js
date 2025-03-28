import { getSiteSettingsTemplate } from '/site-settings/siteSettingsTemplate.js';

// Инициализация класса animations-disabled при загрузке страницы
document.addEventListener('DOMContentLoaded', () => {
    const animationsDisabled = localStorage.getItem('animationsDisabled') === 'true';
    document.body.classList.toggle('animations-disabled', animationsDisabled);
    // Устанавливаем начальное состояние чекбокса при загрузке страницы
    const animationsCheckbox = document.querySelector('#disable-animations-checkbox');
    if (animationsCheckbox) {
        animationsCheckbox.checked = animationsDisabled;
    }
});

export function siteSettingsModalShow() {
    if (document.querySelector('.siteSettingsModal-overlay')) return;

    const modalOverlay = document.createElement('div');
    modalOverlay.classList.add('siteSettingsModal-overlay');
    modalOverlay.innerHTML = getSiteSettingsTemplate();

    document.body.appendChild(modalOverlay);

    // Функция для инициализации состояния чекбоксов
    const initializeCheckboxes = () => {
        const checkboxes = [
            { id: '#disable-intro-checkbox', key: 'introDisabled' },
            { id: '#disable-animations-checkbox', key: 'animationsDisabled' },
            { id: '#disable-notifications-checkbox', key: 'notificationsDisabled' },
            { id: '#disable-sounds-checkbox', key: 'soundsDisabled' },
        ];

        checkboxes.forEach(({ id, key }) => {
            const checkbox = modalOverlay.querySelector(id);
            if (checkbox) {
                // Устанавливаем состояние из localStorage или false по умолчанию
                checkbox.checked = localStorage.getItem(key) === 'true';
            }
        });
    };

    // Инициализируем состояние чекбоксов
    initializeCheckboxes();

    // Функция для добавления обработчиков событий
    const addCheckboxListeners = () => {
        const checkboxes = [
            { id: '#disable-intro-checkbox', key: 'introDisabled' },
            { id: '#disable-animations-checkbox', key: 'animationsDisabled', action: (checked) => {
                document.body.classList.toggle('animations-disabled', checked);
            }},
            { id: '#disable-notifications-checkbox', key: 'notificationsDisabled' },
            { id: '#disable-sounds-checkbox', key: 'soundsDisabled' },
        ];

        checkboxes.forEach(({ id, key, action }) => {
            const checkbox = modalOverlay.querySelector(id);
            if (checkbox) {
                checkbox.addEventListener('change', () => {
                    localStorage.setItem(key, checkbox.checked);
                    if (action) action(checkbox.checked); // Выполняем дополнительное действие, если есть
                });
            }
        });
    };

    // Добавляем обработчики событий
    addCheckboxListeners();

    // Закрытие модального окна по клику на overlay
    modalOverlay.addEventListener('click', (e) => {
        if (e.target === modalOverlay) {
            siteSettingsModalClose();
        }
    });

    // Убираем задержку анимации появления, если анимации отключены
    const animationsDisabled = localStorage.getItem('animationsDisabled') === 'true';
    const fadeInDelay = animationsDisabled ? 0 : 10;
    setTimeout(() => {
        modalOverlay.classList.add('visible');
    }, fadeInDelay);
}

export function siteSettingsModalClose() {
    const modal = document.querySelector('.siteSettingsModal-overlay');
    if (modal) {
        modal.classList.remove('visible');
        document.dispatchEvent(new Event('siteSettingsModalClosed'));
        setTimeout(() => {
            modal.remove();
        }, 200);
    }
}