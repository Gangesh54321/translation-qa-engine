export function getStoredTheme(defaultTheme = 'modern') {
  if (typeof window !== 'undefined') {
    return localStorage.getItem('uiTheme') || defaultTheme;
  }
  return defaultTheme;
}

export function storeTheme(theme: string) {
  if (typeof window !== 'undefined') {
    localStorage.setItem('uiTheme', theme);
  }
}

export function applyTheme(theme: string) {
  if (typeof window !== 'undefined') {
    const root = window.document.documentElement;
    // Remove other theme classes
    Array.from(root.classList).forEach(c => {
      if (c.startsWith('theme-')) {
        root.classList.remove(c);
      }
    });
    root.classList.add(`theme-${theme}`);
  }
}
