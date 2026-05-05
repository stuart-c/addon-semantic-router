import { expect, test, beforeEach, vi } from 'vitest';
import './semantic-router-test-tab';
import { SemanticRouterTestTab } from './semantic-router-test-tab';

// Mock fetch
const mockFetch = vi.fn();
vi.stubGlobal('fetch', mockFetch);

beforeEach(() => {
  document.body.innerHTML = '<semantic-router-test-tab></semantic-router-test-tab>';
  mockFetch.mockReset();
});

test('renders initial state correctly', async () => {
  const el = document.querySelector('semantic-router-test-tab') as SemanticRouterTestTab;
  await el.updateComplete;
  
  const textarea = el.shadowRoot?.querySelector('textarea');
  const button = el.shadowRoot?.querySelector('button');
  
  expect(textarea).toBeTruthy();
  expect(button).toBeTruthy();
  expect(button?.disabled).toBe(true); // Disabled because prompt is empty
});

test('enables button when prompt is entered', async () => {
  const el = document.querySelector('semantic-router-test-tab') as SemanticRouterTestTab;
  await el.updateComplete;
  
  const textarea = el.shadowRoot?.querySelector('textarea') as HTMLTextAreaElement;
  textarea.value = 'hello';
  textarea.dispatchEvent(new Event('input'));
  
  await el.updateComplete;
  
  const button = el.shadowRoot?.querySelector('button') as HTMLButtonElement;
  expect(button.disabled).toBe(false);
});

test('calls API and displays response', async () => {
  const mockResponse = {
    route: 'greeting',
    llm: 'gpt-4',
    choices: [{ message: { content: 'Hello there!' } }]
  };
  
  mockFetch.mockResolvedValueOnce({
    ok: true,
    json: async () => mockResponse,
  });

  const el = document.querySelector('semantic-router-test-tab') as SemanticRouterTestTab;
  await el.updateComplete;
  
  const textarea = el.shadowRoot?.querySelector('textarea') as HTMLTextAreaElement;
  textarea.value = 'hi';
  textarea.dispatchEvent(new Event('input'));
  
  await el.updateComplete;
  
  const button = el.shadowRoot?.querySelector('button') as HTMLButtonElement;
  button.click();
  
  await el.updateComplete; // Wait for loading state
  
  expect(mockFetch).toHaveBeenCalledWith('/query', expect.objectContaining({
    method: 'POST',
    body: JSON.stringify({
      model: 'default',
      messages: [{ role: 'user', content: 'hi' }]
    })
  }));
  
  await vi.waitUntil(() => !el.shadowRoot?.querySelector('.loader'));
  await el.updateComplete;
  
  const responseArea = el.shadowRoot?.querySelector('.response-section');
  expect(responseArea).toBeTruthy();
  expect(responseArea?.textContent).toContain('Route: greeting');
  expect(responseArea?.textContent).toContain('LLM: gpt-4');
  expect(responseArea?.querySelector('pre')?.textContent).toBe('Hello there!');
});

test('displays error message on API failure', async () => {
  mockFetch.mockResolvedValueOnce({
    ok: false,
    status: 500,
    json: async () => ({ detail: 'Internal Server Error' }),
  });

  const el = document.querySelector('semantic-router-test-tab') as SemanticRouterTestTab;
  await el.updateComplete;
  
  const textarea = el.shadowRoot?.querySelector('textarea') as HTMLTextAreaElement;
  textarea.value = 'hi';
  textarea.dispatchEvent(new Event('input'));
  
  await el.updateComplete;
  
  const button = el.shadowRoot?.querySelector('button') as HTMLButtonElement;
  button.click();
  
  await vi.waitUntil(() => el.shadowRoot?.querySelector('.error'));
  await el.updateComplete;
  
  const errorArea = el.shadowRoot?.querySelector('.error');
  expect(errorArea?.textContent).toBe('Internal Server Error');
});
