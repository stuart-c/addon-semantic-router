import { expect, test, beforeEach, vi } from 'vitest';
import './llm-manager';
import { LLMManager } from './llm-manager';

// Mock fetch
const mockFetch = vi.fn();
vi.stubGlobal('fetch', mockFetch);

const mockLLMs = [
  { id: 1, name: 'Test LLM', url: 'http://test.com', model: 'gpt-4', secret: '***', timeout: 30, enabled: true }
];

beforeEach(() => {
  mockFetch.mockReset();
  mockFetch.mockImplementation((url) => {
    if (url === '/api/llm') return Promise.resolve({ ok: true, json: () => Promise.resolve(mockLLMs) });
    return Promise.resolve({ ok: false });
  });
});

test('renders LLMs after fetching', async () => {
  document.body.innerHTML = '<llm-manager></llm-manager>';
  const el = document.querySelector('llm-manager') as LLMManager;
  
  await el.updateComplete;
  // Wait for async fetchLlms
  await new Promise(resolve => setTimeout(resolve, 200));
  await el.updateComplete;

  const llmItems = el.shadowRoot?.querySelectorAll('sr-list-item');
  expect(llmItems?.length).toBe(1);
  expect((llmItems?.[0] as any).title).toBe('Test LLM');
});

test('shows detail view when LLM is selected', async () => {
    document.body.innerHTML = '<llm-manager></llm-manager>';
    const el = document.querySelector('llm-manager') as LLMManager;
    
    await el.updateComplete;
    await new Promise(resolve => setTimeout(resolve, 200));
    await el.updateComplete;
  
    const heading = el.shadowRoot?.querySelector('.detail-header h2');
    expect(heading?.textContent).toBe('Test LLM');

    const inputs = el.shadowRoot?.querySelectorAll('input');
    // Name, URL, Model, Secret, Timeout, Status
    expect(inputs?.length).toBeGreaterThanOrEqual(5);
});
