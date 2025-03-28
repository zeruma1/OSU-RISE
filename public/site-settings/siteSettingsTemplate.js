export function getSiteSettingsTemplate() {
    return `
        <div class="modal-content">
            <div class="modal-header">
                <h2>Настройки сайта</h2>
            </div>
            <div class="modal-body">
                <ul class="settings-list">
                    <li class="settings-item">
                        <div class="setting-info">
                            <div class="setting-icon">
                                <img src="https://cdn-icons-png.flaticon.com/512/7646/7646966.png" width="20" height="20" alt="Intro icon">
                            </div>
                            <span>Отключить приветственное интро</span>
                        </div>
                        <input type="checkbox" class="settings-checkbox" id="disable-intro-checkbox">
                    </li>
                    <li class="settings-item">
                        <div class="setting-info">
                            <div class="setting-icon">
                                <img src="https://cdn-icons-png.flaticon.com/512/9187/9187591.png" width="20" height="20" alt="Animation icon">
                            </div>
                            <span>Отключить плавные анимации</span>
                        </div>
                        <input type="checkbox" class="settings-checkbox" id="disable-animations-checkbox">
                    </li>
                    <li class="settings-item">
                        <div class="setting-info">
                            <div class="setting-icon">
                                <img src="https://cdn-icons-png.flaticon.com/512/3602/3602123.png" width="20" height="20" alt="Notifications icon">
                            </div>
                            <span>Отключить уведомления</span>
                        </div>
                        <input type="checkbox" class="settings-checkbox" id="disable-notifications-checkbox">
                    </li>
                    <li class="settings-item">
                        <div class="setting-info">
                            <div class="setting-icon">
                                <img src="https://cdn-icons-png.flaticon.com/512/4175/4175207.png" width="20" height="20" alt="Sound icon">
                            </div>
                            <span>Отключить все звуки</span>
                        </div>
                        <input type="checkbox" class="settings-checkbox" id="disable-sounds-checkbox">
                    </li>
                </ul>
            </div>
        </div>
    `;
}