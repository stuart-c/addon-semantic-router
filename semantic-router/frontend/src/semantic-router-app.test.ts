import { expect, test, beforeEach } from 'vitest';
import './semantic-router-app';
import { SemanticRouterApp } from './semantic-router-app';

beforeEach(() => {
  document.body.innerHTML = '<semantic-router-app></semantic-router-app>';
});

test('renders with initial logs tab active', async () => {
  const el = document.querySelector('semantic-router-app') as SemanticRouterApp;
  await el.updateComplete;
  
  const logsTab = el.shadowRoot?.querySelector('wa-tab[panel="logs"]');
  expect(logsTab?.textContent?.trim()).toBe('Logs');
  expect(logsTab?.hasAttribute('active')).toBe(true);
});

test('changes tab on click', async () => {
  const el = document.querySelector('semantic-router-app') as SemanticRouterApp;
  await el.updateComplete;
  
  const routesTab = el.shadowRoot?.querySelector('wa-tab[panel="routes"]') as HTMLElement;
  routesTab.click();
  
  await el.updateComplete;
  
  const activeTab = el.shadowRoot?.querySelector('wa-tab[panel="routes"]');
  expect(activeTab?.hasAttribute('active')).toBe(true);
  
  const routeManager = el.shadowRoot?.querySelector('route-manager');
  expect(routeManager).not.toBeNull();
});

