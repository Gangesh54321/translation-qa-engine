import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
// mock the image import used by the component
vi.mock('../../blog/assets/home_page.png', () => ({
  default: 'home_page.png',
}));

import { BlogIntroduction } from './BlogIntroduction';

vi.mock('@/components/ui/tooltip', () => ({
  TooltipProvider: ({ children }: any) => <div>{children}</div>,
  Tooltip: ({ children }: any) => <div>{children}</div>,
  TooltipTrigger: ({ children }: any) => <div>{children}</div>,
  TooltipContent: ({ children }: any) => <div>{children}</div>,
}));

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

describe('BlogIntroduction', () => {
  it('renders key sections and feature highlights', () => {
    render(<BlogIntroduction />);
    expect(screen.getByText(/Linguistic Accuracy/i)).toBeTruthy();
    expect(screen.getByText(/Ultra-Fast Analysis/i)).toBeTruthy();
    expect(screen.getByText(/Context-Aware AI/i)).toBeTruthy();
    expect(screen.getByText(/Get Started Today/i)).toBeTruthy();
  });
});
