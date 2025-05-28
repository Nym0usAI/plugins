// Основная функция изменения цветов
function applyColors() {
  // Для элементов .card__vote
  document.querySelectorAll('.card__vote').forEach(el => {
    const rating = parseFloat(el.textContent.trim());
    el.style.background = 'rgba(0, 0, 0, 0.8)';
    
    if(rating >= 0 && rating <= 3) el.style.color = '#e74c3c';
    else if(rating > 3 && rating <= 5) el.style.color = '#e67e22';
    else if(rating > 5 && rating <= 6.5) el.style.color = '#f1c40f';
    else if(rating > 6.5 && rating < 8) el.style.color = '#3498db';
    else if(rating >= 8 && rating <= 10) el.style.color = '#2ecc71';
  });

  // Для элементов .full-start__rate > div, .info__rate > span
  document.querySelectorAll('.full-start__rate > div, .info__rate > span').forEach(el => {
    const rating = parseFloat(el.textContent.trim());
    
    if(rating >= 0 && rating <= 3) el.style.color = '#e74c3c';
    else if(rating > 3 && rating <= 5) el.style.color = '#e67e22';
    else if(rating > 5 && rating <= 6.5) el.style.color = '#f1c40f';
    else if(rating > 6.5 && rating < 8) el.style.color = '#3498db';
    else if(rating >= 8 && rating <= 10) el.style.color = '#2ecc71';
  });
}

// Инициализация
document.addEventListener('DOMContentLoaded', () => {
  setTimeout(applyColors, 500);
});

const observer = new MutationObserver(applyColors);
observer.observe(document.body, {childList: true, subtree: true});
Lampa.Platform.tv()