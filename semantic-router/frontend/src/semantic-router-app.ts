import { LitElement, html, css } from 'lit';
import { customElement, state } from 'lit/decorators.js';
import './log-viewer';
import './components/config-view';
import './semantic-router-test-tab';
import './route-manager';
import './llm-manager';
import { sharedStyles } from './shared-styles';

@customElement('semantic-router-app')
export class SemanticRouterApp extends LitElement {
  @state()
  private activeTab = 'logs';

  static styles = [
    sharedStyles,
    css`
      :host {
        flex-direction: column;
      }

      nav {
        display: flex;
        gap: 2rem;
        padding: 0 2.5rem;
        background-color: var(--surface-color);
        border-bottom: 1px solid var(--border-color);
        box-shadow: var(--shadow-sm);
      }

      .tab {
        padding: 1.25rem 0;
        cursor: pointer;
        border-bottom: 2px solid transparent;
        transition: var(--transition-speed);
        color: var(--text-secondary);
        font-weight: 600;
        text-transform: uppercase;
        letter-spacing: 0.05em;
        font-size: 0.8125rem;
        user-select: none;
      }

      .tab:hover {
        color: var(--text-color);
      }

      .tab.active {
        color: var(--primary-color);
        border-bottom-color: var(--primary-color);
      }

      main {
        flex: 1;
        display: flex;
        flex-direction: column;
        padding: 2.5rem;
        background-color: var(--bg-color);
        overflow: hidden;
      }

      .content-area {
        background-color: var(--surface-color);
        border-radius: var(--border-radius);
        min-height: 500px;
        flex: 1;
        border: 1px solid var(--border-color);
        box-shadow: var(--shadow-md);
        animation: slideUp 0.4s cubic-bezier(0.16, 1, 0.3, 1);
        overflow: hidden;
        display: flex;
        flex-direction: column;
      }

      .empty-state h2 {
        margin-bottom: 0.5rem;
        color: var(--text-color);
      }
    `
  ];

  render() {
    return html`
      <nav>
        <div 
          class="tab ${this.activeTab === 'logs' ? 'active' : ''}" 
          @click="${() => this.activeTab = 'logs'}"
          id="tab-logs"
        >
          Logs
        </div>
        <div 
          class="tab ${this.activeTab === 'routes' ? 'active' : ''}" 
          @click="${() => this.activeTab = 'routes'}"
          id="tab-routes"
        >
          Routes
        </div>
        <div 
          class="tab ${this.activeTab === 'llms' ? 'active' : ''}" 
          @click="${() => this.activeTab = 'llms'}"
          id="tab-llms"
        >
          LLMs
        </div>
        <div 
          class="tab ${this.activeTab === 'config' ? 'active' : ''}" 
          @click="${() => this.activeTab = 'config'}"
          id="tab-config"
        >
          Config
        </div>
        <div 
          class="tab ${this.activeTab === 'test' ? 'active' : ''}" 
          @click="${() => this.activeTab = 'test'}"
          id="tab-test"
        >
          Test
        </div>
      </nav>
      <main>
        <div class="content-area">
          ${this._renderTabContent()}
        </div>
      </main>
    `;
  }

  private _renderTabContent() {
    switch (this.activeTab) {
      case 'logs':
        return html`<log-viewer></log-viewer>`;
      case 'routes':
        return html`<route-manager></route-manager>`;

      case 'llms':
        return html`<llm-manager></llm-manager>`;
      case 'config':
        return html`<config-view></config-view>`;
      case 'test':
        return html`<semantic-router-test-tab></semantic-router-test-tab>`;
      default:
        return html``;
    }
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'semantic-router-app': SemanticRouterApp;
  }
}
