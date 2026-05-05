import { expect, test, describe, beforeEach, vi } from 'vitest';
import { html, render } from 'lit';
import './log-viewer';
import { LogViewer } from './log-viewer';

describe('LogViewer', () => {
  let element: LogViewer;

  beforeEach(async () => {
    // Mock fetch for logs
    const mockLogs = [
      {
        id: 'log-1',
        timestamp: '2026-05-05T12:00:00Z',
        duration: 0.123,
        route: 1,
        query: 'hello world',
        request: '{}',
        response: 'hi there',
      }
    ];

    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(mockLogs),
    }));

    element = document.createElement('log-viewer') as LogViewer;
    document.body.appendChild(element);
    await element.updateComplete;
  });

  test('renders logs table', async () => {
    const table = element.shadowRoot?.querySelector('table');
    expect(table).toBeDefined();
    
    // Wait for data to load
    await new Promise(resolve => setTimeout(resolve, 100));
    await element.updateComplete;

    const rows = element.shadowRoot?.querySelectorAll('tbody tr');
    expect(rows?.length).toBeGreaterThan(0);
    expect(rows?.[0].textContent).toContain('hello world');
  });

  test('filters logs', async () => {
    const searchInput = element.shadowRoot?.querySelector('.search-input') as HTMLInputElement;
    searchInput.value = 'non-existent';
    searchInput.dispatchEvent(new Event('input'));
    
    await element.updateComplete;
    const rows = element.shadowRoot?.querySelectorAll('tbody tr');
    // It should show the "No logs found" row
    expect(rows?.[0].textContent).toContain('No logs found');
  });

  test('selects log to show details', async () => {
    // Wait for data
    await new Promise(resolve => setTimeout(resolve, 100));
    await element.updateComplete;

    const firstRow = element.shadowRoot?.querySelector('tbody tr') as HTMLElement;
    firstRow.click();
    
    await element.updateComplete;
    const detailView = element.shadowRoot?.querySelector('.detail-view');
    expect(detailView?.textContent).toContain('Metadata');
    expect(detailView?.textContent).toContain('log-1');
  });
});
