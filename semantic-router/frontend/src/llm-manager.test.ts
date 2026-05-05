import { expect, test, beforeEach, vi } from 'vitest';
import './llm-manager';
import { LLMManager } from './llm-manager';

// Mock fetch
const mockFetch = vi.fn();
(window as any).fetch = mockFetch;

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
  await new Promise(resolve => setTimeout(resolve, 50));
  await el.updateComplete;

  const llmItems = el.shadowRoot?.querySelectorAll('.llm-item');
  expect(llmItems?.length).toBe(1);
  expect(llmItems?.[0].textContent?.includes('Test LLM')).toBe(true);
});

test('shows detail view when LLM is selected', async () => {
    document.body.innerHTML = '<llm-manager></llm-manager>';
    const el = document.querySelector('llm-manager') as LLMManager;
    
    await el.updateComplete;
    await new Promise(resolve => setTimeout(resolve, 50));
    await el.updateComplete;
  
    const heading = el.shadowRoot?.querySelector('.detail-header h1');
    expect(heading?.textContent).toBe('Test LLM');

    const inputs = el.shadowRoot?.querySelectorAll('input[type="text"]');
    // Name, URL, Model (Timeout is number)
    expect(inputs?.length).toBeGreaterThanOrEqual(3);
});
