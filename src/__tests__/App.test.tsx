import React from 'react';
import { render } from '@testing-library/react';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { getStoredTheme, storeTheme, applyTheme } from '../hooks/useUiTheme';
import { BlogIntroduction } from '../components/BlogIntroduction';
import App, { isAboutPath } from '../App';

describe('theme helpers', () => {
  beforeEach(() => {
    localStorage.clear();
    document.documentElement.className = '';
  });

  it('reads default when nothing stored', () => {
    expect(getStoredTheme()).toBe('modern');
    expect(getStoredTheme('sunset')).toBe('sunset');
  });

  it('retrieves value from localStorage when available', () => {
    localStorage.setItem('uiTheme', 'midnight');
    expect(getStoredTheme()).toBe('midnight');
  });

  it('storeTheme saves to localStorage', () => {
    storeTheme('nature');
    expect(localStorage.getItem('uiTheme')).toBe('nature');
  });

  it('applyTheme updates the document root class', () => {
    applyTheme('sunset');
    expect(document.documentElement.classList.contains('theme-sunset')).toBe(true);
    applyTheme('modern');
    expect(document.documentElement.classList.contains('theme-sunset')).toBe(false);
    expect(document.documentElement.classList.contains('theme-modern')).toBe(true);
  });
});

describe('App Component', () => {
  it('detects about pathname via helper', () => {
    window.history.pushState({}, '', '/about');
    expect(isAboutPath()).toBe(true);
  });

  it('renders hero heading and call to action', () => {
    const { getByRole } = render(<App />);
    expect(getByRole('heading', { level: 2 }).textContent).toContain(
      'Professional'
    );
  });
});
