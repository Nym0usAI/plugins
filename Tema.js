// Функция для применения темы
function applyTheme(theme) {
    // Основные цвета для тем
    const themes = {
        dark: {
            '--bg-color': '#121212',
            '--text-color': '#ffffff',
            '--primary-color': '#bb86fc',
            '--primary-variant': '#3700b3',
            '--secondary-color': '#03dac6',
            '--surface-color': '#1e1e1e',
            '--error-color': '#cf6679'
        },
        light: {
            '--bg-color': '#ffffff',
            '--text-color': '#000000',
            '--primary-color': '#6200ee',
            '--primary-variant': '#3700b3',
            '--secondary-color': '#03dac6',
            '--surface-color': '#f5f5f5',
            '--error-color': '#b00020'
        }
    };

    // Применяем выбранную тему
    const selectedTheme = themes[theme] || themes.light;
    Object.entries(selectedTheme).forEach(([property, value]) => {
        document.documentElement.style.setProperty(property, value);
    });

    // Сохраняем выбор темы в localStorage
    localStorage.setItem('theme', theme);
}

// Функция для переключения темы
function toggleTheme() {
    const currentTheme = localStorage.getItem('theme') || 'light';
    const newTheme = currentTheme === 'light' ? 'dark' : 'light';
    applyTheme(newTheme);
}

// Инициализация темы при загрузке страницы
function initializeTheme() {
    const savedTheme = localStorage.getItem('theme') || 'light';
    applyTheme(savedTheme);
    
    // Добавляем обработчик для кнопки переключения темы
    const themeToggleBtn = document.getElementById('theme-toggle');
    if (themeToggleBtn) {
        themeToggleBtn.addEventListener('click', toggleTheme);
    }
}

// Инициализируем тему при загрузке страницы
window.addEventListener('DOMContentLoaded', initializeTheme);