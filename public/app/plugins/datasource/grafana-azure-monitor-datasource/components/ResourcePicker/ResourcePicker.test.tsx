import { act, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import React from 'react';

import ResourcePicker from '.';
import createMockResourcePickerData from '../../__mocks__/resourcePickerData';
import {
  createMockResourceGroupsBySubscription,
  createMockSubscriptions,
  mockResourcesByResourceGroup,
} from '../../__mocks__/resourcePickerRows';
import { ResourceRowType } from './types';

const noResourceURI = '';
const singleSubscriptionSelectionURI = '/subscriptions/def-456';
const singleResourceGroupSelectionURI = '/subscriptions/def-456/resourceGroups/dev-3';
const singleResourceSelectionURI =
  '/subscriptions/def-456/resourceGroups/dev-3/providers/Microsoft.Compute/virtualMachines/db-server';

const noop: any = () => {};
const defaultProps = {
  templateVariables: [],
  resourceURI: noResourceURI,
  resourcePickerData: createMockResourcePickerData({
    getSubscriptions: jest.fn().mockResolvedValue(createMockSubscriptions()),
    getResourceGroupsBySubscriptionId: jest.fn().mockResolvedValue(createMockResourceGroupsBySubscription()),
    getResourcesForResourceGroup: jest.fn().mockResolvedValue(mockResourcesByResourceGroup()),
  }),
  onCancel: noop,
  onApply: noop,
  selectableEntryTypes: [
    ResourceRowType.Subscription,
    ResourceRowType.ResourceGroup,
    ResourceRowType.Resource,
    ResourceRowType.Variable,
  ],
};

describe('AzureMonitor ResourcePicker', () => {
  beforeEach(() => {
    window.HTMLElement.prototype.scrollIntoView = function () {};
  });
  it('should pre-load subscriptions when there is no existing selection', async () => {
    render(<ResourcePicker {...defaultProps} resourceURI={noResourceURI} />);
    const subscriptionCheckbox = await screen.findByLabelText('Primary Subscription');
    expect(subscriptionCheckbox).toBeInTheDocument();
    expect(subscriptionCheckbox).not.toBeChecked();
    const uncheckedCheckboxes = await screen.findAllByRole('checkbox', { checked: false });
    expect(uncheckedCheckboxes.length).toBe(3);
  });

  it('should show a subscription as selected if there is one saved', async () => {
    render(<ResourcePicker {...defaultProps} resourceURI={singleSubscriptionSelectionURI} />);
    const subscriptionCheckbox = await screen.findByLabelText('Dev Subscription');
    expect(subscriptionCheckbox).toBeChecked();
  });

  it('should show a resourceGroup as selected if there is one saved', async () => {
    render(<ResourcePicker {...defaultProps} resourceURI={singleResourceGroupSelectionURI} />);
    const resourceGroupCheckbox = await screen.findByLabelText('A Great Resource Group');
    expect(resourceGroupCheckbox).toBeChecked();
  });

  it('should show a resource as selected if there is one saved', async () => {
    render(<ResourcePicker {...defaultProps} resourceURI={singleResourceSelectionURI} />);
    const resourceCheckbox = await screen.findByLabelText('db-server');
    expect(resourceCheckbox).toBeChecked();
  });

  it('should be able to expand a subscription when clicked and reveal resource groups', async () => {
    render(<ResourcePicker {...defaultProps} />);
    const expandSubscriptionButton = await screen.findByLabelText('Expand Primary Subscription');
    expect(expandSubscriptionButton).toBeInTheDocument();
    expect(screen.queryByLabelText('A Great Resource Group')).not.toBeInTheDocument();
    expandSubscriptionButton.click();
    expect(await screen.findByLabelText('A Great Resource Group')).toBeInTheDocument();
  });

  it('should call onApply with a new subscription uri when a user selects it', async () => {
    const onApply = jest.fn();
    render(<ResourcePicker {...defaultProps} onApply={onApply} />);
    const subscriptionCheckbox = await screen.findByLabelText('Primary Subscription');
    expect(subscriptionCheckbox).toBeInTheDocument();
    expect(subscriptionCheckbox).not.toBeChecked();
    subscriptionCheckbox.click();
    const applyButton = screen.getByRole('button', { name: 'Apply' });
    applyButton.click();
    expect(onApply).toBeCalledTimes(1);
    expect(onApply).toBeCalledWith('/subscriptions/def-123');
  });

  it('should call onApply with a new subscription uri when a user types it', async () => {
    const onApply = jest.fn();
    render(<ResourcePicker {...defaultProps} onApply={onApply} />);
    const subscriptionCheckbox = await screen.findByLabelText('Primary Subscription');
    expect(subscriptionCheckbox).toBeInTheDocument();
    expect(subscriptionCheckbox).not.toBeChecked();

    const advancedSection = screen.getByText('Advanced');
    advancedSection.click();

    const advancedInput = await screen.findByLabelText('Resource URI');
    await userEvent.type(advancedInput, '/subscriptions/def-123');

    const applyButton = screen.getByRole('button', { name: 'Apply' });
    applyButton.click();

    expect(onApply).toBeCalledTimes(1);
    expect(onApply).toBeCalledWith('/subscriptions/def-123');
  });

  describe('when rendering resource picker without any selectable entry types', () => {
    it('renders no checkboxes', async () => {
      await act(async () => {
        render(<ResourcePicker {...defaultProps} selectableEntryTypes={[]} />);
      });
      const checkboxes = screen.queryAllByRole('checkbox');
      expect(checkboxes.length).toBe(0);
    });
  });
});
