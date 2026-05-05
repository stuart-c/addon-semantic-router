import { LitElement, html, css } from 'lit';
import { customElement, state } from 'lit/decorators.js';
import './log-viewer';
import './components/config-view';
import './semantic-router-test-tab';
import './route-manager';
import './llm-manager';

@customElement('semantic-router-app')
export class SemanticRouterApp extends LitElement {
  @state() private activeTab = 'logs';

  static styles = css`
    :host {
      display: flex;
      flex-direction: column;
      width: 100%;
      height: 100vh;
      background-color: var(--bg-color);
      color: var(--text-color);
      overflow: hidden;
    }

    header {
      padding: 1.25rem 2.5rem;
      background: rgba(30, 41, 59, 0.7);
      backdrop-filter: blur(12px);
      border-bottom: 1px solid var(--border-color);
      display: flex;
      justify-content: space-between;
      align-items: center;
      z-index: 100;
    }

    .brand {
      display: flex;
      align-items: center;
      gap: 1rem;
    }

    .logo {
      width: 32px;
      height: 32px;
      background: linear-gradient(135deg, var(--primary-color), #818cf8);
      border-radius: 8px;
      display: flex;
      align-items: center;
      justify-content: center;
      color: white;
      font-weight: 800;
      box-shadow: 0 0 20px rgba(99, 102, 241, 0.4);
    }

    h1 {
      margin: 0;
      font-size: 1.25rem;
      font-weight: 700;
      letter-spacing: -0.02em;
      background: linear-gradient(to right, #fff, var(--text-secondary));
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
    }

    nav {
      display: flex;
      gap: 0.5rem;
      padding: 0.5rem 2.5rem;
      background: rgba(15, 23, 42, 0.4);
      border-bottom: 1px solid var(--border-color);
      z-index: 90;
    }

    .tab {
      padding: 0.75rem 1.25rem;
      cursor: pointer;
      border-radius: 8px;
      transition: all var(--transition-speed);
      color: var(--text-secondary);
      font-weight: 600;
      font-size: 0.875rem;
      display: flex;
      align-items: center;
      gap: 0.6rem;
      user-select: none;
    }

    .tab:hover {
      background: var(--surface-hover);
      color: var(--text-color);
    }

    .tab.active {
      background: var(--primary-light);
      color: var(--primary-color);
    }

    .tab svg {
      opacity: 0.7;
    }

    .tab.active svg {
      opacity: 1;
    }

    main {
      flex: 1;
      overflow: hidden;
      display: flex;
      flex-direction: column;
      position: relative;
    }

    .content-area {
      flex: 1;
      animation: slideUp 0.4s cubic-bezier(0.16, 1, 0.3, 1);
      overflow: hidden;
    }

    @keyframes slideUp {
      from { opacity: 0; transform: translateY(10px); }
      to { opacity: 1; transform: translateY(0); }
    }

    .status-bar {
      padding: 0.5rem 2.5rem;
      background: var(--surface-color);
      border-top: 1px solid var(--border-color);
      display: flex;
      justify-content: flex-end;
      font-size: 0.75rem;
      color: var(--text-muted);
    }
  `;

  render() {
    return html`
      <header>
        <div class="brand">
          <div class="logo">S</div>
          <h1>Semantic Router</h1>
        </div>
      </header>
      <nav>
        <div class="tab ${this.activeTab === 'logs' ? 'active' : ''}" @click="${() => this.activeTab = 'logs'}">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
          </svg>
          Logs
        </div>
        <div class="tab ${this.activeTab === 'routes' ? 'active' : ''}" @click="${() => this.activeTab = 'routes'}">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <polyline points="9 11 12 14 22 4"></polyline>
            <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"></path>
          </svg>
          Routes
        </div>
        <div class="tab ${this.activeTab === 'llms' ? 'active' : ''}" @click="${() => this.activeTab = 'llms'}">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <rect x="2" y="3" width="20" height="14" rx="2" ry="2"></rect>
            <line x1="8" y1="21" x2="16" y2="21"></line>
            <line x1="12" y1="17" x2="12" y2="21"></line>
          </svg>
          LLMs
        </div>
        <div class="tab ${this.activeTab === 'config' ? 'active' : ''}" @click="${() => this.activeTab = 'config'}">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <circle cx="12" cy="12" r="3"></circle>
            <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path>
          </svg>
          Config
        </div>
        <div class="tab ${this.activeTab === 'test' ? 'active' : ''}" @click="${() => this.activeTab = 'test'}">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <polygon points="5 3 19 12 5 21 5 3"></polygon>
          </svg>
          Test
        </div>
      </nav>
      <main>
        <div class="content-area">
          ${this._renderTabContent()}
        </div>
      </main>
      <div class="status-bar">
        <span>Connected to Router Engine v0.1.12</span>
      </div>
    `;
  }

  private _renderTabContent() {
    switch (this.activeTab) {
      case 'logs': return html`<log-viewer></log-viewer>`;
      case 'routes': return html`<route-manager></route-manager>`;
      case 'llms': return html`<llm-manager></llm-manager>`;
      case 'config': return html`<config-view></config-view>`;
      case 'test': return html`<semantic-router-test-tab></semantic-router-test-tab>`;
      default: return html``;
    }
  }
}
