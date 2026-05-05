import { LitElement, html, css } from 'lit';
import { customElement, state } from 'lit/decorators.js';

@customElement('config-view')
export class ConfigView extends LitElement {
  @state() private config: any = null;
  @state() private loading = true;

  static styles = css`
    :host {
      display: block;
      padding: 3rem;
      animation: fadeIn 0.4s ease-out;
      color: var(--text-color);
      max-width: 800px;
      margin: 0 auto;
    }

    @keyframes fadeIn {
      from { opacity: 0; transform: translateY(10px); }
      to { opacity: 1; transform: translateY(0); }
    }

    h2 {
      font-size: 1.875rem;
      font-weight: 800;
      margin-top: 0;
      margin-bottom: 0.5rem;
      letter-spacing: -0.025em;
    }

    .subtitle {
      color: var(--text-secondary);
      margin-bottom: 3rem;
      font-size: 1rem;
    }

    .section {
      background: var(--surface-color);
      border: 1px solid var(--border-color);
      border-radius: 16px;
      padding: 2rem;
      margin-bottom: 2rem;
      box-shadow: var(--shadow-md);
    }

    .section-header {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      margin-bottom: 2rem;
      padding-bottom: 1rem;
      border-bottom: 1px solid var(--border-color);
    }

    .section-header h3 {
      margin: 0;
      font-size: 1.125rem;
      font-weight: 700;
    }

    .section-header svg {
      color: var(--primary-color);
    }

    .form-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 2rem;
    }

    .form-group {
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
    }

    label {
      font-size: 0.8125rem;
      font-weight: 700;
      color: var(--text-secondary);
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }

    .value-box {
      padding: 0.875rem 1.25rem;
      background: rgba(0, 0, 0, 0.2);
      border: 1px solid var(--border-color);
      border-radius: 10px;
      font-family: 'JetBrains Mono', monospace;
      font-size: 0.875rem;
      color: var(--primary-color);
    }

    .hint {
      font-size: 0.75rem;
      color: var(--text-muted);
      margin-top: 0.25rem;
    }

    .actions {
      display: flex;
      justify-content: flex-end;
      margin-top: 2rem;
    }

    .btn {
      padding: 0.75rem 1.5rem;
      border-radius: 10px;
      font-weight: 700;
      cursor: pointer;
      transition: all var(--transition-speed);
      border: none;
      font-family: inherit;
    }

    .btn-outline {
      background: transparent;
      border: 1px solid var(--border-color);
      color: var(--text-color);
    }

    .btn-outline:hover {
      background: var(--surface-hover);
    }

    .loader {
      display: flex;
      justify-content: center;
      padding: 5rem;
    }

    .spinner {
      width: 40px;
      height: 40px;
      border: 4px solid var(--border-color);
      border-top-color: var(--primary-color);
      border-radius: 50%;
      animation: spin 1s linear infinite;
    }

    @keyframes spin {
      to { transform: rotate(360deg); }
    }
  `;

  connectedCallback() {
    super.connectedCallback();
    this.fetchConfig();
  }

  async fetchConfig() {
    this.loading = true;
    try {
      // In a real app, we'd fetch this from the backend
      // For now, we'll simulate some global config
      await new Promise(r => setTimeout(r, 800));
      this.config = {
        version: "0.1.12",
        environment: "production",
        log_level: "INFO",
        persistence_path: "/data/semantic_router.db",
        embedding_model: "fastembed/BAAI/bge-small-en-v1.5",
        last_trained: "2024-05-02 14:30:00"
      };
    } catch (err) {
      console.error(err);
    } finally {
      this.loading = false;
    }
  }

  render() {
    if (this.loading) {
      return html`<div class="loader"><div class="spinner"></div></div>`;
    }

    return html`
      <h2>System Configuration</h2>
      <p class="subtitle">Global settings and metadata for the Semantic Router engine.</p>

      <div class="section">
        <div class="section-header">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"></path></svg>
          <h3>Core Engine</h3>
        </div>
        <div class="form-grid">
          <div class="form-group">
            <label>Engine Version</label>
            <div class="value-box">${this.config.version}</div>
          </div>
          <div class="form-group">
            <label>Runtime Environment</label>
            <div class="value-box">${this.config.environment}</div>
          </div>
          <div class="form-group">
            <label>Embedding Model</label>
            <div class="value-box">${this.config.embedding_model}</div>
            <div class="hint">Model used for vectorizing training utterances</div>
          </div>
          <div class="form-group">
            <label>Last Index Refresh</label>
            <div class="value-box">${this.config.last_trained}</div>
          </div>
        </div>
      </div>

      <div class="section">
        <div class="section-header">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><rect x="2" y="2" width="20" height="8" rx="2" ry="2"></rect><rect x="2" y="14" width="20" height="8" rx="2" ry="2"></rect><line x1="6" y1="6" x2="6.01" y2="6"></line><line x1="6" y1="18" x2="6.01" y2="18"></line></svg>
          <h3>Infrastructure</h3>
        </div>
        <div class="form-grid">
          <div class="form-group">
            <label>Database Path</label>
            <div class="value-box">${this.config.persistence_path}</div>
          </div>
          <div class="form-group">
            <label>Logging Verbosity</label>
            <div class="value-box">${this.config.log_level}</div>
          </div>
        </div>
      </div>

      <div class="actions">
        <button class="btn btn-outline" @click="${() => this.fetchConfig()}">
          Refresh Metadata
        </button>
      </div>
    `;
  }
}
