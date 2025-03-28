// auth.js
import { getOsuAuthModalTemplate, getOsuAuthSuccessModalTemplate } from './modals/osuAuth/osuAuthModalTemplate.js';

document.addEventListener('DOMContentLoaded', () => {
    const authButton = document.querySelector('.authOsu-btn button');

    /**
     * Открывает всплывающее окно авторизации через osu!
     */
    function openAuthPopup() {
        // Добавляем модальное окно в DOM
        document.body.insertAdjacentHTML('beforeend', getOsuAuthModalTemplate());
        const modalOverlay = document.querySelector('.osu-auth-modal-overlay');
        
        // Показываем модальное окно
        modalOverlay.style.display = 'flex';
        
        // Используем requestAnimationFrame для надежного изменения opacity
        // Это гарантирует, что изменение применится после рендеринга DOM
        requestAnimationFrame(() => {
            requestAnimationFrame(() => {
                modalOverlay.style.opacity = '1';
            });
        });
        
        // Открываем попап-окно авторизации
        const popup = window.open('/auth/osu', 'osuAuth', 'width=600,height=700,left=0,top=0');
        
        // Проверяем состояние попап-окна
        const checkPopupClosed = setInterval(() => {
            if (!popup || popup.closed) {
                // Останавливаем проверку
                clearInterval(checkPopupClosed);
                
                // Проверяем, существует ли модальное окно в DOM
                if (modalOverlay && modalOverlay.parentNode) {
                    // Плавно скрываем модальное окно
                    modalOverlay.style.opacity = '0';
                    
                    // Удаляем модальное окно после завершения анимации
                    setTimeout(() => {
                        if (modalOverlay && modalOverlay.parentNode) {
                            modalOverlay.remove();
                        }
                    }, 300); // Увеличено время до 300мс для более надежной анимации
                }
            }
        }, 500);
    }

    /**
     * Показывает модальное окно об успешной авторизации и перезагружает страницу
     */
    function showSuccessModal() {
        const currentModal = document.querySelector('.osu-auth-modal-overlay');
        if (currentModal) {
            // Плавно скрываем текущее модальное окно
            currentModal.style.opacity = '0';
            
            setTimeout(() => {
                currentModal.remove();
                
                // Показываем модальное окно успеха
                document.body.insertAdjacentHTML('beforeend', getOsuAuthSuccessModalTemplate());
                const successModal = document.querySelector('.osu-auth-modal-overlay');
                successModal.style.display = 'flex';
                
                // Используем requestAnimationFrame для надежного изменения opacity
                requestAnimationFrame(() => {
                    requestAnimationFrame(() => {
                        successModal.style.opacity = '1';
                    });
                });
                
                // Перезагружаем страницу через 3 секунды
                setTimeout(() => {
                    location.reload();
                }, 3000);
            }, 300); // Увеличено время для лучшей плавности
        }
    }

    // Привязываем обработчик к кнопке авторизации
    if (authButton) {
        authButton.addEventListener('click', openAuthPopup);
    }

    // Обрабатываем сообщение об успешной авторизации
    window.addEventListener('message', (event) => {
        // Проверяем источник сообщения для безопасности
        if (event.origin === window.location.origin && event.data === 'auth_success') {
            showSuccessModal();
        }
    });
});