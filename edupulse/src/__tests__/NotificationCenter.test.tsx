import React from 'react';
import { render, screen } from '@testing-library/react';
import NotificationCenter from '../components/NotificationCenter';

test('renders NotificationCenter', () => {
  render(<NotificationCenter />);
  expect(screen.getByRole('status') || screen.getByText(/notifications/i)).toBeDefined();
});
