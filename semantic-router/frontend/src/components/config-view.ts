import { LitElement, html, css } from 'lit';
import { customElement, state } from 'lit/decorators.js';
import { sharedStyles } from '../shared-styles';
import './sr-button';
import '@awesome.me/webawesome/dist/components/select/select.js';
import '@awesome.me/webawesome/dist/components/option/option.js';
import '@awesome.me/webawesome/dist/components/input/input.js';
import '@awesome.me/webawesome/dist/components/spinner/spinner.js';
import '@awesome.me/webawesome/dist/components/callout/callout.js';

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
        margin-bottom: 2.5rem;
      }

      .actions {
        display: flex;
        justify-content: flex-end;
        gap: 1rem;
        margin-top: 3rem;
      }

      wa-select, wa-input {
        margin-bottom: 1.5rem;
      }

      .feedback {
        margin-top: 2rem;
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

      wa-spinner {
        font-size: 2rem;
        --track-width: 3px;
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
          <wa-spinner></wa-spinner>
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
        
        <wa-select 
          id="default_llm"
          label="Default LLM"
          help-text="Choose the primary LLM for routing"
          value="${this.config.default_llm ? String(this.config.default_llm) : ''}"
          @wa-change="${(e: any) => this.config!.default_llm = e.target.value ? Number(e.target.value) : null}"
        >
          <wa-option value="">None</wa-option>
          ${this.llms.map(llm => html`
            <wa-option value="${llm.id}">
              ${llm.name}
            </wa-option>
          `)}
        </wa-select>

        <wa-select 
          id="log_level"
          label="Log Level"
          help-text="Control the verbosity of the application logs"
          value="${this.config.log_level}"
          @wa-change="${(e: any) => this.config!.log_level = e.target.value}"
        >
          <wa-option value="all">All</wa-option>
          <wa-option value="default">Default</wa-option>
          <wa-option value="error">Error</wa-option>
        </wa-select>

        <wa-input 
          id="log_retention"
          label="Log Retention"
          help-text="Number of days to keep logs in the database"
          type="number" 
          .value="${String(this.config.log_retention)}"
          @wa-input="${(e: any) => this.config!.log_retention = Number(e.target.value)}"
          min="1"
          max="365"
        >
          <span slot="suffix">days</span>
        </wa-input>

        ${this.feedback ? html`
          <div class="feedback">
            <wa-callout variant="${this.feedback.type === 'success' ? 'success' : 'danger'}">
              ${this.feedback.message}
            </wa-callout>
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
