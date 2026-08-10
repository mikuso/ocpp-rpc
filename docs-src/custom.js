// Force all navigation group accordions to always be open.
// TypeDoc's accordion handler reads localStorage and may set details.open = false;
// we use a MutationObserver on the nav container to re-open any that get closed.
(function () {
    function openNavAccordions(root) {
        var nav = root || document;
        nav.querySelectorAll('nav.tsd-navigation details.tsd-accordion').forEach(function (el) {
            if (!el.open) el.open = true;
        });
    }

    // Rename the top nav link from the project name to "API Index"
    function renameNavIndexLink() {
        var link = document.querySelector('nav.tsd-navigation > a');
        if (link) link.textContent = 'API Index';
    }

    // Run once the nav container is populated (TypeDoc inserts nav items dynamically)
    var container = document.getElementById('tsd-nav-container');
    if (container) {
        var observer = new MutationObserver(function () {
            openNavAccordions();
        });
        observer.observe(container, { childList: true, subtree: true, attributes: true, attributeFilter: ['open'] });
    }

    // Also run on DOMContentLoaded and after a short delay as a safety net
    document.addEventListener('DOMContentLoaded', function () {
        openNavAccordions();
        renameNavIndexLink();
    });
    setTimeout(function () { openNavAccordions(); renameNavIndexLink(); }, 500);
    setTimeout(function () { openNavAccordions(); renameNavIndexLink(); }, 1500);
})();
