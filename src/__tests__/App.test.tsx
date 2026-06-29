import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { getStoredTheme, storeTheme, applyTheme } from '../hooks/useUiTheme';
import { BlogIntroduction } from '../components/BlogIntroduction';
import App, { isAboutPath } from '../App';

vi.mock('../components/FeatureSlider', () => ({
  FeatureSlider: () => <div>FeatureSlider Mock</div>,
}));

vi.mock('@/components/ui/tooltip', () => ({
  TooltipProvider: ({ children }: any) => <>{children}</>,
  Tooltip: ({ children }: any) => <>{children}</>,
  TooltipTrigger: ({ children }: any) => <>{children}</>,
  TooltipContent: ({ children }: any) => <>{children}</>,
}));

vi.mock('@/components/ui/dialog', () => ({
  Dialog: ({ children }: any) => <>{children}</>,
  DialogContent: ({ children }: any) => <>{children}</>,
  DialogHeader: ({ children }: any) => <>{children}</>,
  DialogTitle: ({ children }: any) => <>{children}</>,
  DialogDescription: ({ children }: any) => <>{children}</>,
}));

vi.mock('@/components/ui/select', () => ({
  Select: ({ children }: any) => <>{children}</>,
  SelectContent: ({ children }: any) => <>{children}</>,
  SelectItem: ({ children }: any) => <>{children}</>,
  SelectTrigger: ({ children }: any) => <>{children}</>,
  SelectValue: ({ children }: any) => <>{children}</>,
}));

vi.mock('@/components/ui/checkbox', () => ({
  Checkbox: ({ children, checked, onCheckedChange, ...props }: any) => (
    <input
      type="checkbox"
      checked={checked}
      onChange={(e) => onCheckedChange?.(e.target.checked)}
      {...props}
    />
  ),
}));

vi.mock('@/components/ui/dropdown-menu', () => ({
  DropdownMenu: ({ children }: any) => <>{children}</>,
  DropdownMenuContent: ({ children }: any) => <>{children}</>,
  DropdownMenuItem: ({ children }: any) => <>{children}</>,
  DropdownMenuLabel: ({ children }: any) => <>{children}</>,
  DropdownMenuSeparator: ({ children }: any) => <>{children}</>,
  DropdownMenuTrigger: ({ children }: any) => <>{children}</>,
}));

vi.mock('@/components/ui/avatar', () => ({
  Avatar: ({ children }: any) => <>{children}</>,
  AvatarFallback: ({ children }: any) => <>{children}</>,
}));

vi.mock('@/components/ui/scroll-area', () => ({
  ScrollArea: ({ children }: any) => <div>{children}</div>,
}));

const filterMotionProps = ({ children, whileHover, whileInView, whileTap, initial, animate, exit, transition, variants, viewport, ...props }: any) => props;

vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, whileHover, whileInView, whileTap, initial, animate, exit, transition, variants, viewport, ...props }: any) => <div {...props}>{children}</div>,
    section: ({ children, whileHover, whileInView, whileTap, initial, animate, exit, transition, variants, viewport, ...props }: any) => <section {...props}>{children}</section>,
    h1: ({ children, whileHover, whileInView, whileTap, initial, animate, exit, transition, variants, viewport, ...props }: any) => <h1 {...props}>{children}</h1>,
    p: ({ children, whileHover, whileInView, whileTap, initial, animate, exit, transition, variants, viewport, ...props }: any) => <p {...props}>{children}</p>,
    span: ({ children, whileHover, whileInView, whileTap, initial, animate, exit, transition, variants, viewport, ...props }: any) => <span {...props}>{children}</span>,
    button: ({ children, whileHover, whileInView, whileTap, initial, animate, exit, transition, variants, viewport, ...props }: any) => <button {...props}>{children}</button>,
  },
  AnimatePresence: ({ children }: any) => <>{children}</>,
  useAnimation: () => ({ start: vi.fn(), stop: vi.fn() }),
  useInView: () => true,
}));

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
    render(<App />);
    expect(screen.queryAllByText(/Professional/i).length).toBeGreaterThan(0);
  });
});
