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
      header {
        padding: 1rem 2rem;
        background-color: var(--surface-color);
        border-bottom: 1px solid rgba(255, 255, 255, 0.1);
        display: flex;
        justify-content: space-between;
        align-items: center;
      }

      h1 {
        margin: 0;
        font-size: 1.5rem;
        font-weight: 600;
        background: linear-gradient(45deg, #646cff, #acb1ff);
        -webkit-background-clip: text;
        -webkit-text-fill-color: transparent;
      }

      nav {
        display: flex;
        gap: 1rem;
        padding: 0 2rem;
        background-color: var(--surface-color);
        box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
      }

      .tab {
        padding: 1rem 0.5rem;
        cursor: pointer;
        border-bottom: 2px solid transparent;
        transition: all var(--transition-speed);
        color: var(--text-secondary);
        font-weight: 500;
        text-transform: uppercase;
        letter-spacing: 0.05em;
        font-size: 0.875rem;
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
        padding: 2rem;
        overflow-y: auto;
      }

      .content-area {
        background-color: var(--surface-color);
        border-radius: var(--border-radius);
        min-height: 400px;
        height: calc(100vh - 180px); /* Adjust based on header/nav height */
        border: 1px solid rgba(255, 255, 255, 0.05);
        animation: fadeIn 0.4s ease-out;
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
      <header>
        <h1>Semantic Router</h1>
      </header>
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
