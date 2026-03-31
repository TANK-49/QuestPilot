(function () {
    'use strict';

    let hasInjected = false;

    function injectQuestCode() {
        chrome.runtime.sendMessage({ action: 'executeQuestCode' }, (response) => {
            if (chrome.runtime.lastError) {
                setTimeout(injectQuestCode, 3000);
            } else if (response && response.success) {
                hasInjected = true;
            } else {
                setTimeout(injectQuestCode, 3000);
            }
        });
    }

    function tryInject() {
        if (window.location.pathname.includes('/quest-home') && !hasInjected) {
            setTimeout(injectQuestCode, 2000);
        }
    }

    function init() {
        tryInject();

        let lastUrl = window.location.href;
        new MutationObserver(() => {
            const currentUrl = window.location.href;
            if (currentUrl !== lastUrl) {
                lastUrl = currentUrl;
                hasInjected = false;
                tryInject();
            }
        }).observe(document.body, {
            childList: true,
            subtree: true
        });
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();