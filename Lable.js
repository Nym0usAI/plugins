(function () {
    'use strict';

    Lampa.Platform.tv();

    function applyStyleToCards(cards) {
        cards.forEach(card => {
            let typeElement = card.querySelector('.card__type');
            if (typeElement && typeElement.textContent !== 'Сериал') {
                typeElement.textContent = 'Сериал';
                typeElement.style.fontSize = '0.9em';
            }
        });
    }

    document.addEventListener('DOMContentLoaded', function () {
        let cards = document.querySelectorAll('.card--tv');
        applyStyleToCards(cards);
    });

    const observer = new MutationObserver(function (mutations) {
        mutations.forEach(mutation => {
            if (mutation.addedNodes.length) {
                mutation.addedNodes.forEach(node => {
                    if (node.nodeType === 1) {
                        if (node.matches('.card--tv')) {
                            applyStyleToCards([node]);
                        }

                        const innerCards = node.querySelectorAll('.card--tv');
                        if (innerCards.length > 0) {
                            applyStyleToCards(innerCards);
                        }
                    }
                });
            }
        });
    });

    observer.observe(document.body, {
        childList: true,
        subtree: true
    });

})();