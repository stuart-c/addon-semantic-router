import { expect, test, beforeEach } from 'vitest';
import './semantic-router-app';
import { SemanticRouterApp } from './semantic-router-app';

beforeEach(() => {
  document.body.innerHTML = '<semantic-router-app></semantic-router-app>';
});

test('renders with initial logs tab active', async () => {
  const el = document.querySelector('semantic-router-app') as SemanticRouterApp;
  await el.updateComplete;
  
  const activeTab = el.shadowRoot?.querySelector('.tab.active');
  expect(activeTab?.textContent?.trim()).toBe('Logs');
});

test('changes tab on click', async () => {
  const el = document.querySelector('semantic-router-app') as SemanticRouterApp;
  await el.updateComplete;
  
  const routesTab = el.shadowRoot?.querySelector('#tab-routes') as HTMLElement;
  routesTab.click();
  
  await el.updateComplete;
  
  const activeTab = el.shadowRoot?.querySelector('.tab.active');
  expect(activeTab?.textContent?.trim()).toBe('Routes');
  
  const heading = el.shadowRoot?.querySelector('.empty-state h2');
  expect(heading?.textContent).toBe('Routes');
});
