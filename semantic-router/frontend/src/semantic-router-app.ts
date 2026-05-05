import { LitElement, html, css } from 'lit';
import { customElement, state } from 'lit/decorators.js';

@customElement('semantic-router-app')
export class SemanticRouterApp extends LitElement {
  @state()
  private activeTab = 'logs';

  static styles = css`
    :host {
      display: flex;
      flex-direction: column;
      width: 100%;
      height: 100vh;
      background-color: var(--bg-color);
      color: var(--text-color);
      font-family: inherit;
    }

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
      padding: 2rem;
      min-height: 400px;
      border: 1px solid rgba(255, 255, 255, 0.05);
      animation: fadeIn 0.4s ease-out;
    }

    @keyframes fadeIn {
      from { opacity: 0; transform: translateY(10px); }
      to { opacity: 1; transform: translateY(0); }
    }

    .empty-state {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      height: 100%;
      color: var(--text-secondary);
      text-align: center;
    }

    .empty-state h2 {
      margin-bottom: 0.5rem;
      color: var(--text-color);
    }
  `;

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
        return html`
          <div class="empty-state">
            <h2>Logs</h2>
            <p>Real-time logs will appear here.</p>
          </div>
        `;
      case 'routes':
        return html`
          <div class="empty-state">
            <h2>Routes</h2>
            <p>Configure your semantic routes.</p>
          </div>
        `;
      case 'llms':
        return html`
          <div class="empty-state">
            <h2>LLMs</h2>
            <p>Manage your LLM configurations.</p>
          </div>
        `;
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
