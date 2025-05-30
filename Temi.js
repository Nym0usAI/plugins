/**
 * Universal Lamp Themes Manager
 * Provides functionality to manage and apply color themes for lamps
 */

class LampThemes {
    constructor() {
        this.themes = {
            'default': ['#FFFFFF', '#F5F5F5', '#E0E0E0'],
            'sunset': ['#FF7E5F', '#FEB47B', '#FFD89E'],
            'ocean': ['#0077B6', '#00B4D8', '#90E0EF'],
            'forest': ['#2E8B57', '#3CB371', '#8FBC8F'],
            'berry': ['#8A2BE2', '#DA70D6', '#FF69B4'],
            'fire': ['#FF4500', '#FF8C00', '#FFA500'],
            'ice': ['#ADD8E6', '#87CEFA', '#B0E0E6'],
            'autumn': ['#D2691E', '#CD853F', '#F4A460'],
            'spring': ['#FF69B4', '#FFB6C1', '#FFD700'],
            'neon': ['#FF00FF', '#00FFFF', '#FFFF00']
        };

        this.currentTheme = 'default';
        this.customThemes = {};
    }

    /**
     * Get all available theme names
     * @returns {Array} List of theme names
     */
    getThemeList() {
        return Object.keys(this.themes).concat(Object.keys(this.customThemes));
    }

    /**
     * Add or update a custom theme
     * @param {string} name - Theme name
     * @param {Array} colors - Array of 3 color hex codes
     */
    setCustomTheme(name, colors) {
        if (!Array.isArray(colors) || colors.length !== 3) {
            throw new Error('Theme must contain exactly 3 colors');
        }
        this.customThemes[name] = colors;
    }

    /**
     * Remove a custom theme
     * @param {string} name - Theme name to remove
     */
    removeCustomTheme(name) {
        delete this.customThemes[name];
    }

    /**
     * Apply a theme to the lamp
     * @param {string} name - Theme name to apply
     * @param {Object} lamp - Lamp controller object
     */
    applyTheme(name, lamp) {
        const allThemes = {...this.themes, ...this.customThemes};
        
        if (!allThemes[name]) {
            console.warn(`Theme "${name}" not found, using default`);
            name = 'default';
        }

        this.currentTheme = name;
        const colors = allThemes[name];

        if (lamp && typeof lamp.setColor === 'function') {
            // Apply colors to lamp zones (assuming 3-zone lamp)
            lamp.setColor(0, colors[0]); // Main zone
            lamp.setColor(1, colors[1]); // Secondary zone
            lamp.setColor(2, colors[2]); // Accent zone
        } else {
            console.error('Invalid lamp controller provided');
        }
    }

    /**
     * Get current theme name
     * @returns {string} Current theme name
     */
    getCurrentTheme() {
        return this.currentTheme;
    }

    /**
      * Get colors of current theme
      * @returns {Array} Current theme colors
      */
    getCurrentColors() {
        const allThemes = {...this.themes, ...this.customThemes};
        return allThemes[this.currentTheme] || allThemes['default'];
    }
}

// Example usage:
// const themeManager = new LampThemes();
// themeManager.applyTheme('ocean', myLampController);