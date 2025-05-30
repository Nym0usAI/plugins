/**
 * Универсальный скрипт для переключения тем
 * Работает на любом сайте без дополнительных требований
 */

// Доступные цветовые темы
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
  },
  // Можно добавить дополнительные темы
  blue: {
    '--bg-color': '#e6f3ff',
    '--text-color': '#003366',
    '--primary-color': '#0066cc',
    '--surface-color': '#cce6ff'
  }
};

// Применяет выбранную тему
function applyTheme(themeName) {
  const theme = themes[themeName] || themes.light;
  
  // Применяем все CSS-переменные из темы
  Object.entries(theme).forEach(([property, value]) => {
    document.documentElement.style.setProperty(property, value);
  });
  
  // Сохраняем в localStorage
  localStorage.setItem('theme', themeName);
  
  // Генерируем событие для других скриптов
  document.dispatchEvent(new CustomEvent('themeChanged', { detail: themeName }));
}

// Переключает тему на следующую
function cycleThemes() {
  const themeNames = Object.keys(themes);
  const currentTheme = localStorage.getItem('theme') || 'light';
  const currentIndex = themeNames.indexOf(currentTheme);
  const nextIndex = (currentIndex + 1) % themeNames.length;
  
  applyTheme(themeNames[nextIndex]);
}

// Инициализирует тему при загрузке
function initTheme() {
  // Проверяем предпочтения пользователя
  const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
  const savedTheme = localStorage.getItem('theme');
  
  // Приоритет: сохранённая тема > системные настройки > светлая
  const initialTheme = savedTheme || (prefersDark ? 'dark' : 'light');
  applyTheme(initialTheme);
  
  // Можно вызвать initTheme() вручную или автоматически:
  if (document.readyState === 'complete') {
    initTheme();
  } else {
    window.addEventListener('load', initTheme);
  }
}

// Создаём кнопку для переключения тем (если нужно)
function createThemeButton() {
  const btn = document.createElement('button');
  btn.id = 'theme-toggle';
  btn.textContent = '🌓';
  btn.style.position = 'fixed';
  btn.style.bottom = '20px';
  btn.style.right = '20px';
  btn.style.zIndex = '9999';
  btn.style.padding = '10px';
  btn.style.borderRadius = '50%';
  btn.style.border = 'none';
  btn.style.cursor = 'pointer';
  btn.style.background = 'var(--primary-color)';
  btn.style.color = 'var(--text-color)';
  
  btn.addEventListener('click', cycleThemes);
  document.body.appendChild(btn);
}

// Автоматическая инициализация
(function() {
  // Инициализируем тему
  initTheme();
  
  // Опционально: создаём кнопку переключения
  // Раскомментировать если нужно:
  // createThemeButton();
  
  // Следим за изменениями системных предпочтений
  window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', e => {
    if (!localStorage.getItem('theme')) {
      applyTheme(e.matches ? 'dark' : 'light');
    }
  });
})();

// Делаем функции доступными глобально
window.ThemeSwitcher = {
  applyTheme,
  cycleThemes,
  initTheme,
  themes
};
