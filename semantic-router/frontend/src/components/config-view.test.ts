import { expect, test, beforeEach, vi } from 'vitest';
import './config-view';
import { ConfigView } from './config-view';

// Mock fetch
const mockFetch = vi.fn();
vi.stubGlobal('fetch', mockFetch);

beforeEach(() => {
  mockFetch.mockReset();
  document.body.innerHTML = '';
});

test('renders loading state initially', async () => {
  mockFetch.mockImplementation(() => new Promise(() => {})); // Never resolves

  document.body.innerHTML = '<config-view></config-view>';
  const el = document.querySelector('config-view') as ConfigView;
  await el.updateComplete;
  
  expect(el.shadowRoot?.querySelector('wa-spinner')).toBeTruthy();
});

test('renders form after data is loaded', async () => {
  mockFetch.mockImplementation((url) => {
    if (url === '/api/config') {
      return Promise.resolve({
        ok: true,
        json: async () => ({ default_llm: 1, log_level: 'all', log_retention: 60 })
      });
    }
    if (url === '/api/llm') {
      return Promise.resolve({
        ok: true,
        json: async () => [{ id: 1, name: 'GPT-4' }]
      });
    }
    return Promise.reject(new Error('Unknown URL: ' + url));
  });

  document.body.innerHTML = '<config-view></config-view>';
  const el = document.querySelector('config-view') as ConfigView;
  
  // Wait for all async work
  await new Promise(resolve => setTimeout(resolve, 300));
  await el.updateComplete;

  expect(el.shadowRoot?.querySelector('h2')?.textContent).toBe('Global Configuration');
  
  const logLevelSelect = el.shadowRoot?.querySelector('#log_level') as any;
  expect(logLevelSelect.value).toBe('all');
  
  const logRetentionInput = el.shadowRoot?.querySelector('#log_retention') as any;
  expect(logRetentionInput.value).toBe('60');
  
  const llmSelect = el.shadowRoot?.querySelector('#default_llm') as any;
  expect(llmSelect.value).toBe('1');
});

test('saves configuration correctly', async () => {
  mockFetch.mockImplementation((url) => {
    if (url === '/api/config') {
      return Promise.resolve({
        ok: true,
        json: async () => ({ default_llm: 1, log_level: 'all', log_retention: 60 })
      });
    }
    if (url === '/api/llm') {
      return Promise.resolve({
        ok: true,
        json: async () => [{ id: 1, name: 'GPT-4' }]
      });
    }
    return Promise.reject(new Error('Unknown URL'));
  });

  document.body.innerHTML = '<config-view></config-view>';
  const el = document.querySelector('config-view') as ConfigView;
  await new Promise(resolve => setTimeout(resolve, 300));
  await el.updateComplete;

  // Change log level
  const select = el.shadowRoot?.querySelector('#log_level') as any;
  select.value = 'error';
  select.dispatchEvent(new CustomEvent('wa-change'));

  // Mock save response
  mockFetch.mockImplementation((url, init) => {
    if (url === '/api/config' && init?.method === 'PUT') {
      return Promise.resolve({
        ok: true,
        json: async () => ({ default_llm: 1, log_level: 'error', log_retention: 60 })
      });
    }
    return Promise.resolve({ ok: true, json: async () => [] });
  });

  const saveBtn = el.shadowRoot?.querySelector('sr-button') as HTMLElement;
  saveBtn.click();

  await el.updateComplete;
  expect(saveBtn.textContent?.trim()).toContain('Saving...');

  await new Promise(resolve => setTimeout(resolve, 300));
  await el.updateComplete;

  expect(el.shadowRoot?.querySelector('wa-callout[variant="success"]')).toBeTruthy();
  expect(el.shadowRoot?.querySelector('wa-callout[variant="success"]')?.textContent).toContain('Configuration saved successfully');
});

test('handles save error correctly', async () => {
  mockFetch.mockImplementation((url) => {
    if (url === '/api/config') {
      return Promise.resolve({
        ok: true,
        json: async () => ({ default_llm: 1, log_level: 'all', log_retention: 60 })
      });
    }
    if (url === '/api/llm') {
      return Promise.resolve({
        ok: true,
        json: async () => [{ id: 1, name: 'GPT-4' }]
      });
    }
    return Promise.reject(new Error('Unknown URL'));
  });

  document.body.innerHTML = '<config-view></config-view>';
  const el = document.querySelector('config-view') as ConfigView;
  await new Promise(resolve => setTimeout(resolve, 300));
  await el.updateComplete;

  // Mock save failure
  mockFetch.mockImplementation((url, init) => {
    if (url === '/api/config' && init?.method === 'PUT') {
      return Promise.resolve({
        ok: false
      });
    }
    return Promise.resolve({ ok: true, json: async () => [] });
  });

  const saveBtn = el.shadowRoot?.querySelector('sr-button') as HTMLElement;
  saveBtn.click();

  await new Promise(resolve => setTimeout(resolve, 300));
  await el.updateComplete;

  expect(el.shadowRoot?.querySelector('wa-callout[variant="danger"]')).toBeTruthy();
  expect(el.shadowRoot?.querySelector('wa-callout[variant="danger"]')?.textContent).toContain('Error saving configuration');
});
