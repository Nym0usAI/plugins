// Универсальный переключатель тем
const ThemeSwitcher = (() => {
  const themes = {
    light: {
      '--bg': '#ffffff',
      '--text': '#000000',
      '--primary': '#6200ee',
      '--secondary': '#03dac6',
      '--surface': '#f5f5f5'
    },
    dark: {
      '--bg': '#121212',
      '--text': '#ffffff',
      '--primary': '#bb86fc',
      '--secondary': '#03dac6',
      '--surface': '#1e1e1e'
    }
  };

  function apply(themeName) {
    const theme = themes[themeName] || themes.light;
    Object.entries(theme).forEach(([prop, value]) => {
      document.documentElement.style.setProperty(prop, value);
    });
    localStorage.setItem('theme', themeName);
  }

  function toggle() {
    const current = localStorage.getItem('theme') || 'light';
    apply(current === 'light' ? 'dark' : 'light');
  }

  function init() {
    const saved = localStorage.getItem('theme');
    const systemDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    apply(saved || (systemDark ? 'dark' : 'light'));
  }

  return {
    init,
    apply,
    toggle,
    themes
  };
})();

// Автоматическая инициализация
document.addEventListener('DOMContentLoaded', ThemeSwitcher.init);

// Создание кнопки переключения (опционально)
const themeBtn = document.createElement('button');
themeBtn.innerHTML = '🌓';
themeBtn.style.position = 'fixed';
themeBtn.style.bottom = '20px';
themeBtn.style.right = '20px';
themeBtn.style.zIndex = '1000';
themeBtn.style.background = 'var(--primary)';
themeBtn.style.color = 'var(--text)';
themeBtn.style.border = 'none';
themeBtn.style.borderRadius = '50%';
themeBtn.style.width = '40px';
themeBtn.style.height = '40px';
themeBtn.style.cursor = 'pointer';
themeBtn.onclick = ThemeSwitcher.toggle;

document.body.appendChild(themeBtn);
