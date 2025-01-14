import React from 'react';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { NavModelItem } from '@grafana/data';
import { render } from 'test/redux-rtl';
import { NavBarMenu } from './NavBarMenu';

describe('NavBarMenu', () => {
  const mockOnClose = jest.fn();
  const mockNavItems: NavModelItem[] = [];

  beforeEach(() => {
    render(<NavBarMenu onClose={mockOnClose} navItems={mockNavItems} />);
  });

  it('should render the component', () => {
    const sidemenu = screen.getByTestId('navbarmenu');
    expect(sidemenu).toBeInTheDocument();
  });

  it('has a close button', () => {
    const closeButton = screen.getByRole('button', { name: 'Close navigation menu' });
    expect(closeButton).toBeInTheDocument();
  });

  it('clicking the close button calls the onClose callback', async () => {
    const closeButton = screen.getByRole('button', { name: 'Close navigation menu' });
    expect(closeButton).toBeInTheDocument();
    await userEvent.click(closeButton);
    expect(mockOnClose).toHaveBeenCalled();
  });
});
