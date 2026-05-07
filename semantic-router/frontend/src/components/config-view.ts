import { LitElement, html, css } from 'lit';
import { customElement, state } from 'lit/decorators.js';
import { sharedStyles } from '../shared-styles';
import './sr-button';

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

  static styles = [
    sharedStyles,
    css`
      :host {
        display: flex;
        animation: fadeIn 0.4s ease-out;
      }

      .config-card {
        background-color: var(--surface-color);
        border-radius: var(--border-radius);
        padding: 2.5rem;
        border: 1px solid var(--border-color);
        max-width: 640px;
        margin: 2rem auto;
        box-shadow: var(--shadow-lg);
      }

      .config-card h2 {
        margin-bottom: 2rem;
      }

      .actions {
        display: flex;
        justify-content: flex-end;
        gap: 1rem;
        margin-top: 3rem;
      }

      .feedback {
        margin-top: 2rem;
        padding: 1rem 1.25rem;
        border-radius: var(--border-radius-sm);
        font-size: 0.9375rem;
        font-weight: 500;
        display: flex;
        align-items: center;
        gap: 0.75rem;
        animation: slideUp 0.3s cubic-bezier(0.16, 1, 0.3, 1);
      }

      .feedback.success {
        background-color: hsla(145, 63%, 42%, 0.1);
        color: hsl(145, 63%, 62%);
        border: 1px solid hsla(145, 63%, 42%, 0.2);
      }

      .feedback.error {
        background-color: hsla(0, 84%, 60%, 0.1);
        color: hsl(0, 84%, 60%);
        border: 1px solid hsla(0, 84%, 60%, 0.2);
      }

      .loader {
        display: flex;
        flex-direction: column;
        justify-content: center;
        align-items: center;
        height: 400px;
        color: var(--text-secondary);
        gap: 1.5rem;
      }

      .spinner {
        width: 32px;
        height: 32px;
        border: 3px solid var(--border-color);
        border-radius: 50%;
        border-top-color: var(--primary-color);
        animation: spin 0.8s linear infinite;
      }

      @keyframes spin {
        to { transform: rotate(360deg); }
      }
    `
  ];

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
          <sr-button variant="primary" @click="${this._fetchData}">Retry</sr-button>
        </div>
      `;
    }

    return html`
      <div class="main-content">
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
          <sr-button 
            variant="primary" 
            ?disabled="${this.isSaving}"
            @click="${this._saveConfig}"
          >
            ${this.isSaving ? 'Saving...' : 'Save Configuration'}
          </sr-button>
        </div>
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
