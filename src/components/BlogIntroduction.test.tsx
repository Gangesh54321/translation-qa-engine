import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
// mock the image import used by the component
vi.mock('../../blog/assets/home_page.png', () => ({
  default: 'home_page.png',
}));

import { BlogIntroduction } from './BlogIntroduction';

describe('BlogIntroduction', () => {
  it('renders key sections and feature highlights', () => {
    render(<BlogIntroduction />);
    expect(screen.getByText(/Industry Standard/i)).toBeTruthy();
    expect(screen.getByText(/Scaleable Speed/i)).toBeTruthy();
    expect(screen.getByText(/AI Guided Rules/i)).toBeTruthy();
    expect(screen.getByRole('heading', { level: 2, name: /Get Started Today/i })).toBeTruthy();
  });
});
