import React from 'react';
import { render, screen } from '@testing-library/react';
import { TraceViewContainer } from './TraceViewContainer';
import { frameOld } from './TraceView.test';
import { ExploreId } from 'app/types';
import { configureStore } from '../../../store/configureStore';
import { getDefaultTimeRange, LoadingState } from '@grafana/data';
import { Provider } from 'react-redux';
import userEvent from '@testing-library/user-event';

function renderTraceViewContainer(frames = [frameOld]) {
  const store = configureStore();
  const mockPanelData = {
    state: LoadingState.Done,
    series: [],
    timeRange: getDefaultTimeRange(),
  };

  const { container, baseElement } = render(
    <Provider store={store}>
      <TraceViewContainer
        exploreId={ExploreId.left}
        dataFrames={frames}
        splitOpenFn={() => {}}
        queryResponse={mockPanelData}
      />
    </Provider>
  );
  return {
    header: container.children[0],
    timeline: container.children[1],
    container,
    baseElement,
  };
}

describe('TraceViewContainer', () => {
  it('toggles children visibility', async () => {
    renderTraceViewContainer();
    expect(screen.queryAllByText('', { selector: 'div[data-test-id="span-view"]' }).length).toBe(3);
    await userEvent.click(screen.getAllByText('', { selector: 'span[data-test-id="SpanTreeOffset--indentGuide"]' })[0]);
    expect(screen.queryAllByText('', { selector: 'div[data-test-id="span-view"]' }).length).toBe(1);

    await userEvent.click(screen.getAllByText('', { selector: 'span[data-test-id="SpanTreeOffset--indentGuide"]' })[0]);
    expect(screen.queryAllByText('', { selector: 'div[data-test-id="span-view"]' }).length).toBe(3);
  });

  it('toggles collapses and expands one level of spans', async () => {
    renderTraceViewContainer();
    expect(screen.queryAllByText('', { selector: 'div[data-test-id="span-view"]' }).length).toBe(3);
    await userEvent.click(screen.getByLabelText('Collapse +1'));
    expect(screen.queryAllByText('', { selector: 'div[data-test-id="span-view"]' }).length).toBe(2);
    await userEvent.click(screen.getByLabelText('Expand +1'));
    expect(screen.queryAllByText('', { selector: 'div[data-test-id="span-view"]' }).length).toBe(3);
  });

  it('toggles collapses and expands all levels', async () => {
    renderTraceViewContainer();
    expect(screen.queryAllByText('', { selector: 'div[data-test-id="span-view"]' }).length).toBe(3);
    await userEvent.click(screen.getByLabelText('Collapse All'));
    expect(screen.queryAllByText('', { selector: 'div[data-test-id="span-view"]' }).length).toBe(1);
    await userEvent.click(screen.getByLabelText('Expand All'));
    expect(screen.queryAllByText('', { selector: 'div[data-test-id="span-view"]' }).length).toBe(3);
  });

  it('searches for spans', async () => {
    renderTraceViewContainer();
    await userEvent.type(screen.getByPlaceholderText('Find...'), '1ed38015486087ca');
    expect(
      (screen.queryAllByText('', { selector: 'div[data-test-id="span-view"]' })[0].parentNode! as HTMLElement).className
    ).toContain('rowMatchingFilter');
  });

  it('can select next/prev results', async () => {
    renderTraceViewContainer();
    await userEvent.type(screen.getByPlaceholderText('Find...'), 'logproto');
    const nextResultButton = screen.getByTestId('trace-page-search-bar-next-result-button');
    const prevResultButton = screen.getByTestId('trace-page-search-bar-prev-result-button');
    const suffix = screen.getByTestId('trace-page-search-bar-suffix');

    await userEvent.click(nextResultButton);
    expect(suffix.textContent).toBe('1 of 2');
    expect(
      (screen.queryAllByText('', { selector: 'div[data-test-id="span-view"]' })[1].parentNode! as HTMLElement).className
    ).toContain('rowFocused');
    await userEvent.click(nextResultButton);
    expect(suffix.textContent).toBe('2 of 2');
    expect(
      (screen.queryAllByText('', { selector: 'div[data-test-id="span-view"]' })[2].parentNode! as HTMLElement).className
    ).toContain('rowFocused');
    await userEvent.click(nextResultButton);
    expect(suffix.textContent).toBe('1 of 2');
    expect(
      (screen.queryAllByText('', { selector: 'div[data-test-id="span-view"]' })[1].parentNode! as HTMLElement).className
    ).toContain('rowFocused');
    await userEvent.click(prevResultButton);
    expect(suffix.textContent).toBe('2 of 2');
    expect(
      (screen.queryAllByText('', { selector: 'div[data-test-id="span-view"]' })[2].parentNode! as HTMLElement).className
    ).toContain('rowFocused');
    await userEvent.click(prevResultButton);
    expect(suffix.textContent).toBe('1 of 2');
    expect(
      (screen.queryAllByText('', { selector: 'div[data-test-id="span-view"]' })[1].parentNode! as HTMLElement).className
    ).toContain('rowFocused');
    await userEvent.click(prevResultButton);
    expect(suffix.textContent).toBe('2 of 2');
    expect(
      (screen.queryAllByText('', { selector: 'div[data-test-id="span-view"]' })[2].parentNode! as HTMLElement).className
    ).toContain('rowFocused');
  });
});
