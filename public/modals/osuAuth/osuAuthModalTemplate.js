// Шаблон для процесса авторизации
export function getOsuAuthModalTemplate() {
  return `
    <div class="osu-auth-modal-overlay">
      <div class="osu-auth-modal">
        <h2 class="modal-title">Авторизуем вас..</h2>
        <div class="Loader"></div>
        <p class="modal-subtitle">Продолжите привязку в открывшемся окне</p>
      </div>
    </div>
  `;
}

// Шаблон для успешной авторизации
export function getOsuAuthSuccessModalTemplate() {
  return `
    <div class="osu-auth-modal-overlay">
      <div class="osu-auth-modal">
        <h2 class="modal-title">Успешная авторизация!</h2>
        <div class="Loader success"></div>
        <p class="modal-subtitle">Сейчас перезагрузим страницу..</p>
      </div>
    </div>
  `;
}