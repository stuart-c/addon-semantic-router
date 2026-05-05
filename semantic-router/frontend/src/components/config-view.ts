import { LitElement, html, css } from 'lit';
import { customElement, state } from 'lit/decorators.js';

interface LLM {
  id: number;
  name: string;
}

interface Config {
  default_llm: number | null;
  log_level: string;
  log_retention: number;
}

@customElement('config-view')
export class ConfigView extends LitElement {
  @state() private config: Config | null = null;
  @state() private llms: LLM[] = [];
  @state() private isLoading = true;
  @state() private isSaving = false;
  @state() private feedback: { message: string; type: 'success' | 'error' } | null = null;

  static styles = css`
    :host {
      display: block;
      animation: fadeIn 0.4s ease-out;
    }

    .config-card {
      background: var(--surface-color);
      border-radius: var(--border-radius);
      padding: 2rem;
      border: 1px solid rgba(255, 255, 255, 0.05);
      max-width: 600px;
      margin: 0 auto;
      box-shadow: 0 10px 30px -10px rgba(0, 0, 0, 0.5);
    }

    h2 {
      margin-top: 0;
      margin-bottom: 1.5rem;
      font-size: 1.5rem;
      font-weight: 600;
      background: linear-gradient(45deg, var(--primary-color), #acb1ff);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
    }

    .form-group {
      margin-bottom: 1.5rem;
    }

    label {
      display: block;
      margin-bottom: 0.5rem;
      color: var(--text-secondary);
      font-size: 0.875rem;
      font-weight: 500;
    }

    select, input {
      width: 100%;
      padding: 0.75rem 1rem;
      background-color: rgba(0, 0, 0, 0.2);
      border: 1px solid rgba(255, 255, 255, 0.1);
      border-radius: 6px;
      color: var(--text-color);
      font-size: 1rem;
      transition: all 0.2s ease;
      font-family: inherit;
    }

    select:focus, input:focus {
      outline: none;
      border-color: var(--primary-color);
      background-color: rgba(0, 0, 0, 0.3);
      box-shadow: 0 0 0 2px rgba(100, 108, 255, 0.2);
    }

    select option {
      background-color: var(--surface-color);
      color: var(--text-color);
    }

    .actions {
      display: flex;
      justify-content: flex-end;
      gap: 1rem;
      margin-top: 2.5rem;
    }

    button {
      padding: 0.75rem 1.5rem;
      border-radius: 6px;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.2s ease;
      border: none;
      font-family: inherit;
      font-size: 0.9rem;
    }

    .btn-primary {
      background: linear-gradient(135deg, var(--primary-color), var(--primary-hover));
      color: white;
      box-shadow: 0 4px 15px -5px rgba(100, 108, 255, 0.4);
    }

    .btn-primary:hover:not(:disabled) {
      transform: translateY(-1px);
      box-shadow: 0 6px 20px -5px rgba(100, 108, 255, 0.5);
    }

    .btn-primary:active:not(:disabled) {
      transform: translateY(0);
    }

    .btn-primary:disabled {
      opacity: 0.6;
      cursor: not-allowed;
    }

    .feedback {
      margin-top: 1.5rem;
      padding: 1rem;
      border-radius: 6px;
      font-size: 0.9rem;
      display: flex;
      align-items: center;
      gap: 0.5rem;
      animation: slideIn 0.3s ease-out;
    }

    @keyframes slideIn {
      from { opacity: 0; transform: translateX(-10px); }
      to { opacity: 1; transform: translateX(0); }
    }

    .feedback.success {
      background-color: rgba(76, 175, 80, 0.1);
      color: #81c784;
      border: 1px solid rgba(76, 175, 80, 0.2);
    }

    .feedback.error {
      background-color: rgba(244, 67, 54, 0.1);
      color: #e57373;
      border: 1px solid rgba(244, 67, 54, 0.2);
    }

    @keyframes fadeIn {
      from { opacity: 0; transform: translateY(10px); }
      to { opacity: 1; transform: translateY(0); }
    }

    .loader {
      display: flex;
      flex-direction: column;
      justify-content: center;
      align-items: center;
      height: 300px;
      color: var(--text-secondary);
      gap: 1rem;
    }

    .spinner {
      width: 30px;
      height: 30px;
      border: 3px solid rgba(255, 255, 255, 0.1);
      border-radius: 50%;
      border-top-color: var(--primary-color);
      animation: spin 1s linear infinite;
    }

    @keyframes spin {
      to { transform: rotate(360deg); }
    }
  `;

  async firstUpdated() {
    await this._fetchData();
  }

  private async _fetchData() {
    this.isLoading = true;
    try {
      const [configRes, llmsRes] = await Promise.all([
        fetch('/api/config'),
        fetch('/api/llm')
      ]);

      if (!configRes.ok || !llmsRes.ok) throw new Error('Failed to fetch data');

      this.config = await configRes.json();
      this.llms = await llmsRes.json();
    } catch (e) {
      this.feedback = { message: 'Error loading configuration', type: 'error' };
    } finally {
      this.isLoading = false;
    }
  }

  private async _saveConfig() {
    if (!this.config) return;
    this.isSaving = true;
    this.feedback = null;

    try {
      const res = await fetch('/api/config', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          default_llm: this.config.default_llm,
          log_level: this.config.log_level,
          log_retention: this.config.log_retention
        })
      });

      if (!res.ok) throw new Error('Failed to save configuration');
      
      this.config = await res.json();
      this.feedback = { message: 'Configuration saved successfully', type: 'success' };
      
      // Clear success feedback after 3 seconds
      setTimeout(() => {
        if (this.feedback?.type === 'success') {
          this.feedback = null;
        }
      }, 3000);
    } catch (e) {
      this.feedback = { message: 'Error saving configuration', type: 'error' };
    } finally {
      this.isSaving = false;
    }
  }

  render() {
    if (this.isLoading) {
      return html`
        <div class="loader">
          <div class="spinner"></div>
          <p>Loading configuration...</p>
        </div>
      `;
    }

    if (!this.config) {
      return html`
        <div class="loader">
          <p>Failed to load configuration.</p>
          <button class="btn-primary" @click="${this._fetchData}">Retry</button>
        </div>
      `;
    }

    return html`
      <div class="config-card">
        <h2>Global Configuration</h2>
        
        <div class="form-group">
          <label for="default_llm">Default LLM</label>
          <select 
            id="default_llm"
            @change="${(e: any) => this.config!.default_llm = e.target.value ? Number(e.target.value) : null}"
          >
            <option value="" ?selected="${this.config.default_llm === null}">None</option>
            ${this.llms.map(llm => html`
              <option value="${llm.id}" ?selected="${this.config?.default_llm === llm.id}">
                ${llm.name}
              </option>
            `)}
          </select>
        </div>

        <div class="form-group">
          <label for="log_level">Log Level</label>
          <select 
            id="log_level"
            @change="${(e: any) => this.config!.log_level = e.target.value}"
          >
            <option value="all" ?selected="${this.config.log_level === 'all'}">All</option>
            <option value="default" ?selected="${this.config.log_level === 'default'}">Default</option>
            <option value="error" ?selected="${this.config.log_level === 'error'}">Error</option>
          </select>
        </div>

        <div class="form-group">
          <label for="log_retention">Log Retention (days)</label>
          <input 
            type="number" 
            id="log_retention"
            .value="${String(this.config.log_retention)}"
            @input="${(e: any) => this.config!.log_retention = Number(e.target.value)}"
            min="1"
            max="365"
          >
        </div>

        ${this.feedback ? html`
          <div class="feedback ${this.feedback.type}">
            ${this.feedback.type === 'success' ? '✓' : '✗'} ${this.feedback.message}
          </div>
        ` : ''}

        <div class="actions">
          <button 
            class="btn-primary" 
            ?disabled="${this.isSaving}"
            @click="${this._saveConfig}"
          >
            ${this.isSaving ? 'Saving...' : 'Save Configuration'}
          </button>
        </div>
      </div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'config-view': ConfigView;
  }
}
