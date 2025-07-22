// Dark Mode Toggle Functionality
(function() {
    // Get the current theme from localStorage or default to 'light'
    const getCurrentTheme = () => {
        return localStorage.getItem('theme') || 'light';
    };

    // Set the theme and save to localStorage
    const setTheme = (theme) => {
        document.documentElement.setAttribute('data-theme', theme);
        localStorage.setItem('theme', theme);
        
        // Update all toggle buttons
        const toggles = document.querySelectorAll('.theme-toggle');
        toggles.forEach(toggle => {
            const slider = toggle.querySelector('.theme-toggle-slider');
            if (theme === 'dark') {
                toggle.setAttribute('aria-label', 'Switch to light mode');
                toggle.title = 'Switch to light mode';
            } else {
                toggle.setAttribute('aria-label', 'Switch to dark mode');
                toggle.title = 'Switch to dark mode';
            }
        });
    };

    // Toggle between light and dark themes
    const toggleTheme = () => {
        const currentTheme = getCurrentTheme();
        const newTheme = currentTheme === 'light' ? 'dark' : 'light';
        setTheme(newTheme);
    };

    // Initialize theme on page load
    const initializeTheme = () => {
        const savedTheme = getCurrentTheme();
        setTheme(savedTheme);
    };

    // Add event listeners to all theme toggle buttons
    const initializeToggleButtons = () => {
        const toggleButtons = document.querySelectorAll('.theme-toggle');
        toggleButtons.forEach(button => {
            button.addEventListener('click', toggleTheme);
        });
    };

    // Initialize everything when DOM is loaded
    document.addEventListener('DOMContentLoaded', () => {
        initializeTheme();
        initializeToggleButtons();
    });

    // Also run initialization immediately in case DOM is already loaded
    if (document.readyState === 'loading') {
        // DOM not yet loaded, wait for DOMContentLoaded
    } else {
        // DOM already loaded
        initializeTheme();
        initializeToggleButtons();
    }

    // Make functions available globally for dynamic content
    window.initializeThemeToggle = initializeToggleButtons;
    window.setTheme = setTheme;
    window.getCurrentTheme = getCurrentTheme;
})();
