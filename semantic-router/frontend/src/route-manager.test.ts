import { expect, test, beforeEach, vi } from 'vitest';
import './route-manager';
import { RouteManager } from './route-manager';

// Mock fetch
const mockFetch = vi.fn();
vi.stubGlobal('fetch', mockFetch);


const mockRoutes = [
  { id: 1, name: 'Test Route', llm: 1, enabled: true, utterances: [{ id: 1, route_id: 1, utterance: 'Hello' }] }
];

const mockLLMs = [
  { id: 1, name: 'Test LLM', url: 'http://test.com', model: 'gpt-4', enabled: true }
];

beforeEach(() => {
  mockFetch.mockReset();
  mockFetch.mockImplementation((url) => {
    if (url === '/api/route') return Promise.resolve({ ok: true, json: () => Promise.resolve(mockRoutes) });
    if (url === '/api/llm') return Promise.resolve({ ok: true, json: () => Promise.resolve(mockLLMs) });
    return Promise.resolve({ ok: false });
  });
});

test('renders routes after fetching', async () => {
  document.body.innerHTML = '<route-manager></route-manager>';
  const el = document.querySelector('route-manager') as RouteManager;
  
  await el.updateComplete;
  // Wait for async fetchInitialData
  await new Promise(resolve => setTimeout(resolve, 200));
  await el.updateComplete;

  const routeItems = el.shadowRoot?.querySelectorAll('sr-list-item');
  expect(routeItems?.length).toBe(1);
  expect((routeItems?.[0] as any).title).toBe('Test Route');
});

test('shows detail view when route is selected', async () => {
    document.body.innerHTML = '<route-manager></route-manager>';
    const el = document.querySelector('route-manager') as RouteManager;
    
    await el.updateComplete;
    await new Promise(resolve => setTimeout(resolve, 200));
    await el.updateComplete;
  
    const heading = el.shadowRoot?.querySelector('.detail-header h1');
    expect(heading?.textContent).toBe('Test Route');

    const utterances = el.shadowRoot?.querySelectorAll('.utterance-item');
    expect(utterances?.length).toBe(1);
});
