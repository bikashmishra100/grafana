import { render, screen, waitFor, within } from '@testing-library/react';
import React from 'react';
import { select } from 'react-select-event';
import { Dimensions, VariableQueryType } from '../../types';
import { setupMockedDataSource } from '../../__mocks__/CloudWatchDataSource';
import { VariableQueryEditor, Props } from './VariableQueryEditor';

const defaultQuery = {
  queryType: VariableQueryType.Regions,
  namespace: '',
  region: '',
  metricName: '',
  dimensionKey: '',
  ec2Filters: '',
  instanceID: '',
  attributeName: '',
  resourceType: '',
  tags: '',
  refId: '',
};

const ds = setupMockedDataSource();

ds.datasource.getRegions = jest.fn().mockResolvedValue([
  { label: 'a1', value: 'a1' },
  { label: 'b1', value: 'b1' },
  { label: 'c1', value: 'c1' },
]);
ds.datasource.getNamespaces = jest.fn().mockResolvedValue([
  { label: 'x2', value: 'x2' },
  { label: 'y2', value: 'y2' },
  { label: 'z2', value: 'z2' },
]);
ds.datasource.getMetrics = jest.fn().mockResolvedValue([
  { label: 'h3', value: 'h3' },
  { label: 'i3', value: 'i3' },
  { label: 'j3', value: 'j3' },
]);
ds.datasource.getDimensionKeys = jest
  .fn()
  .mockImplementation((namespace: string, region: string, dimensionFilters?: Dimensions) => {
    if (!!dimensionFilters) {
      return Promise.resolve([
        { label: 's4', value: 's4' },
        { label: 'v4', value: 'v4' },
      ]);
    }
    if (region === 'a1') {
      return Promise.resolve([
        { label: 'q4', value: 'q4' },
        { label: 'r4', value: 'r4' },
        { label: 's4', value: 's4' },
      ]);
    }
    return Promise.resolve([{ label: 't4', value: 't4' }]);
  });
ds.datasource.getDimensionValues = jest.fn().mockResolvedValue([
  { label: 'foo', value: 'foo' },
  { label: 'bar', value: 'bar' },
]);
ds.datasource.getVariables = jest.fn().mockReturnValue([]);

const onChange = jest.fn();
const defaultProps: Props = {
  onChange: onChange,
  query: defaultQuery,
  datasource: ds.datasource,
  onRunQuery: () => {},
};

describe('VariableEditor', () => {
  beforeEach(() => {
    onChange.mockClear();
  });
  describe('and a new variable is created', () => {
    it('should trigger a query using the first query type in the array', async () => {
      const props = defaultProps;
      props.query = defaultQuery;
      render(<VariableQueryEditor {...props} />);

      await waitFor(() => {
        const querySelect = screen.queryByRole('combobox', { name: 'Query Type' });
        expect(querySelect).toBeInTheDocument();
        expect(screen.queryByText('Regions')).toBeInTheDocument();
        // Should not render any fields besides Query Type
        const regionSelect = screen.queryByRole('combobox', { name: 'Region' });
        expect(regionSelect).not.toBeInTheDocument();
      });
    });
  });

  describe('and an existing variable is edited', () => {
    it('should trigger new query using the saved query type', async () => {
      const props = defaultProps;
      props.query = {
        ...defaultQuery,
        queryType: VariableQueryType.Metrics,
        namespace: 'z2',
        region: 'a1',
      };
      render(<VariableQueryEditor {...props} />);

      await waitFor(() => {
        const querySelect = screen.queryByRole('combobox', { name: 'Query Type' });
        expect(querySelect).toBeInTheDocument();
        expect(screen.queryByText('Metrics')).toBeInTheDocument();
        const regionSelect = screen.queryByRole('combobox', { name: 'Region' });
        expect(regionSelect).toBeInTheDocument();
        expect(screen.queryByText('a1')).toBeInTheDocument();
        const namespaceSelect = screen.queryByRole('combobox', { name: 'Namespace' });
        expect(namespaceSelect).toBeInTheDocument();
        expect(screen.queryByText('z2')).toBeInTheDocument();
        // Should only render Query Type, Region, and Namespace selectors
        const metricSelect = screen.queryByRole('combobox', { name: 'Metric' });
        expect(metricSelect).not.toBeInTheDocument();
      });
    });
    it('should parse dimensionFilters correctly', async () => {
      const props = defaultProps;
      props.query = {
        ...defaultQuery,
        queryType: VariableQueryType.DimensionValues,
        namespace: 'z2',
        region: 'a1',
        metricName: 'i3',
        dimensionKey: 's4',
        dimensionFilters: { s4: 'foo' },
      };
      render(<VariableQueryEditor {...props} />);

      const filterItem = screen.getByTestId('cloudwatch-dimensions-filter-item');
      expect(filterItem).toBeInTheDocument();
      expect(within(filterItem).getByText('s4')).toBeInTheDocument();
      expect(within(filterItem).getByText('foo')).toBeInTheDocument();

      // change filter key
      const keySelect = screen.getByRole('combobox', { name: 'Dimensions filter key' });
      // confirms getDimensionKeys was called with filter and that the element uses keysForDimensionFilter
      await select(keySelect, 'v4', {
        container: document.body,
      });
      expect(ds.datasource.getDimensionKeys).toHaveBeenCalledWith('z2', 'a1', {}, '');
      expect(onChange).toHaveBeenCalledWith({
        ...defaultQuery,
        queryType: VariableQueryType.DimensionValues,
        namespace: 'z2',
        region: 'a1',
        metricName: 'i3',
        dimensionKey: 's4',
        dimensionFilters: { v4: undefined },
      });

      // set filter value
      const valueSelect = screen.getByRole('combobox', { name: 'Dimensions filter value' });
      await select(valueSelect, 'bar', {
        container: document.body,
      });
      expect(onChange).toHaveBeenCalledWith({
        ...defaultQuery,
        queryType: VariableQueryType.DimensionValues,
        namespace: 'z2',
        region: 'a1',
        metricName: 'i3',
        dimensionKey: 's4',
        dimensionFilters: { v4: 'bar' },
      });
    });
  });
  describe('and a different region is selected', () => {
    it('should clear invalid fields', async () => {
      const props = defaultProps;
      props.query = {
        ...defaultQuery,
        queryType: VariableQueryType.DimensionValues,
        namespace: 'z2',
        region: 'a1',
        metricName: 'i3',
        dimensionKey: 's4',
        dimensionFilters: { s4: 'foo' },
      };
      render(<VariableQueryEditor {...props} />);

      const querySelect = screen.queryByLabelText('Query Type');
      expect(querySelect).toBeInTheDocument();
      expect(screen.queryByText('Dimension Values')).toBeInTheDocument();
      const regionSelect = screen.getByRole('combobox', { name: 'Region' });
      await select(regionSelect, 'b1', {
        container: document.body,
      });

      expect(ds.datasource.getMetrics).toHaveBeenCalledWith('z2', 'b1');
      expect(ds.datasource.getDimensionKeys).toHaveBeenCalledWith('z2', 'b1');
      expect(props.onChange).toHaveBeenCalledWith({
        ...defaultQuery,
        refId: 'CloudWatchVariableQueryEditor-VariableQuery',
        queryType: VariableQueryType.DimensionValues,
        namespace: 'z2',
        region: 'b1',
        // metricName i3 exists in the new region and should not be removed
        metricName: 'i3',
        // dimensionKey s4 and valueDimension do not exist in the new region and should be removed
        dimensionKey: '',
        dimensionFilters: {},
      });
    });
  });
});
