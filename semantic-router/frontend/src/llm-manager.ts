import { LitElement, html, css } from 'lit';
import { customElement, state } from 'lit/decorators.js';
import { sharedStyles } from './shared-styles';
import './components/sr-button';
import './components/sr-badge';
import './components/sr-form-group';
import './components/sr-list-item';
import './components/sr-empty-state';
import '@awesome.me/webawesome/dist/components/input/input.js';
import '@awesome.me/webawesome/dist/components/checkbox/checkbox.js';
import '@awesome.me/webawesome/dist/components/select/select.js';
import '@awesome.me/webawesome/dist/components/option/option.js';
import '@awesome.me/webawesome/dist/components/alert/alert.js';
import '@awesome.me/webawesome/dist/components/spinner/spinner.js';
import '@awesome.me/webawesome/dist/components/icon/icon.js';

interface LLM {
  id: number;
  name: string;
  url: string;
  secret: string;
  model: string | null;
  timeout: number;
  enabled: boolean;
}

@customElement('llm-manager')
export class LLMManager extends LitElement {
  @state() private llms: LLM[] = [];
  @state() private selectedLlmId: number | null = null;
  @state() private loading = true;
  @state() private error: string | null = null;
  @state() private confirmingDelete = false;

  @state() private availableModels: string[] = [];
  @state() private fetchingModels = false;

  // New LLM Form State
  @state() private isAdding = false;
  @state() private newLlm = {
    name: '',
    url: '',
    secret: '',
    model: '',
    timeout: 30,
    enabled: true
  };

  static styles = [
    sharedStyles,
    css`
      .llm-list {
        flex: 1;
        overflow-y: auto;
        padding: 0.5rem;
      }

      wa-input, wa-select {
        width: 100%;
        margin-bottom: 1.25rem;
      }

      .loading-container {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        height: 100%;
        gap: 1rem;
        color: var(--wa-color-neutral-500);
      }
    `
  ];

  connectedCallback() {
    super.connectedCallback();
    this.fetchLlms();
  }

  async fetchLlms() {
    this.loading = true;
    this.error = null;
    try {
      const res = await fetch('/api/llm');
      if (!res.ok) throw new Error('Failed to fetch LLMs');
      this.llms = await res.json();
      if (this.llms.length > 0 && this.selectedLlmId === null && !this.isAdding) {
        this.selectedLlmId = this.llms[0].id;
      }
    } catch (err) {
      this.error = (err as Error).message;
    } finally {
      this.loading = false;
    }
  }

  async addLlm() {
    if (!this.newLlm.name || !this.newLlm.url) return;
    this.error = null;

    try {
      const res = await fetch('/api/llm', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(this.newLlm)
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.detail || 'Failed to create LLM');
      }

      const created = await res.json();
      this.llms = [...this.llms, created];
      this.selectedLlmId = created.id;
      this.isAdding = false;
      this.newLlm = {
        name: '',
        url: '',
        secret: '',
        model: '',
        timeout: 30,
        enabled: true
      };
    } catch (err) {
      this.error = (err as Error).message;
    }
  }

  async deleteLlm(id: number) {
    if (!this.confirmingDelete) {
      this.confirmingDelete = true;
      setTimeout(() => { this.confirmingDelete = false; }, 3000);
      return;
    }

    this.error = null;
    try {
      const res = await fetch(`/api/llm/${id}`, { method: 'DELETE' });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.detail || 'Failed to delete LLM');
      }

      this.llms = this.llms.filter(l => l.id !== id);
      this.confirmingDelete = false;
      if (this.selectedLlmId === id) {
        this.selectedLlmId = this.llms.length > 0 ? this.llms[0].id : null;
      }
    } catch (err) {
      this.error = (err as Error).message;
      this.confirmingDelete = false;
    }
  }

  async fetchAvailableModels(url: string, secret: string, id?: number) {
    if (!url && !id) {
      this.error = 'API URL is required to fetch models.';
      return;
    }
    
    this.fetchingModels = true;
    this.error = null;
    try {
      const res = await fetch('/api/llm/models', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          url, 
          secret: secret === '***' ? '' : secret,
          id
        })
      });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.detail || 'Failed to fetch models');
      }
      this.availableModels = await res.json();
      if (this.availableModels.length === 0) {
        this.error = 'No models found from this endpoint.';
      }
    } catch (err) {
      this.error = (err as Error).message;
    } finally {
      this.fetchingModels = false;
    }
  }

  async updateLlmConfig(updates: Partial<LLM>) {
    if (!this.selectedLlmId) return;
    this.error = null;

    // Filter out masked secret if it wasn't changed
    const dataToUpdate = { ...updates };
    if (dataToUpdate.secret === '***') {
      delete dataToUpdate.secret;
    }

    try {
      const res = await fetch(`/api/llm/${this.selectedLlmId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(dataToUpdate)
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.detail || 'Failed to update LLM');
      }

      const updated = await res.json();
      this.llms = this.llms.map(l => l.id === updated.id ? updated : l);
    } catch (err) {
      this.error = (err as Error).message;
    }
  }

  private _handleSelectLlm(id: number) {
    this.selectedLlmId = id;
    this.isAdding = false;
    this.error = null;
    this.confirmingDelete = false;
  }

  private _handleStartAdding() {
    this.isAdding = true;
    this.selectedLlmId = null;
    this.error = null;
    this.availableModels = [];
  }

  private _handleCancelAdding() {
    this.isAdding = false;
    this.error = null;
    if (this.llms.length > 0) {
      this.selectedLlmId = this.llms[0].id;
    }
  }

  render() {
    if (this.loading) {
      return html`
        <div class="loading-container">
          <wa-spinner style="font-size: 3rem; --track-width: 4px;"></wa-spinner>
          <p>Loading LLMs...</p>
        </div>
      `;
    }

    const selectedLlm = this.llms.find(l => l.id === this.selectedLlmId);

    return html`
      <div class="sidebar">
        <div class="sidebar-header">
          <div style="display: flex; justify-content: space-between; align-items: center;">
            <h2>LLMs</h2>
            <sr-button variant="ghost" iconOnly @click="${this._handleStartAdding}" title="Add LLM">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <line x1="12" y1="5" x2="12" y2="19"></line>
                <line x1="5" y1="12" x2="19" y2="12"></line>
              </svg>
            </sr-button>
          </div>
        </div>
        <div class="llm-list">
          ${this.llms.map(llm => html`
            <sr-list-item 
              .selected="${this.selectedLlmId === llm.id}"
              .title="${llm.name}"
              @click="${() => this._handleSelectLlm(llm.id)}"
            >
              <sr-badge slot="suffix" variant="${llm.enabled ? 'enabled' : 'disabled'}">
                ${llm.enabled ? 'On' : 'Off'}
              </sr-badge>
            </sr-list-item>
          `)}
        </div>
      </div>

      <div class="main-content">
        ${this.error ? html`
          <div style="padding: 2.5rem 2.5rem 0 2.5rem; max-width: 900px; margin: 0 auto; width: 100%;">
            <wa-alert variant="danger" open closable @wa-after-hide="${() => this.error = null}">
              <wa-icon slot="icon" name="exclamation-octagon"></wa-icon>
              <strong>Error</strong><br />
              ${this.error}
            </wa-alert>
          </div>
        ` : ''}

        ${this.isAdding ? html`
          <div class="detail-header">
            <div>
              <h2>Add New LLM</h2>
              <span style="font-size: 0.8125rem; color: var(--text-tertiary); font-weight: 600; text-transform: uppercase; letter-spacing: 0.05em;">Configure a new LLM provider</span>
            </div>
            <div style="display: flex; gap: 1rem;">
              <sr-button variant="ghost" @click="${this._handleCancelAdding}">Cancel</sr-button>
              <sr-button 
                ?disabled="${!this.newLlm.name || !this.newLlm.url}"
                @click="${this.addLlm}"
              >
                Create LLM
              </sr-button>
            </div>
          </div>
          <div class="detail-body">
            <div class="section fade-in">
              <h3>General Configuration</h3>
              <wa-input 
                label="LLM Name"
                placeholder="e.g. OpenAI GPT-4"
                .value="${this.newLlm.name}"
                @wa-input="${(e: any) => this.newLlm.name = e.target.value}"
              ></wa-input>
              
              <wa-input 
                label="API URL"
                help-text="The full endpoint URL for the chat completions API"
                placeholder="https://api.openai.com/v1/chat/completions"
                .value="${this.newLlm.url}"
                @wa-input="${(e: any) => this.newLlm.url = e.target.value}"
              ></wa-input>

              <wa-input 
                label="API Secret / Key"
                type="password" 
                placeholder="sk-..."
                .value="${this.newLlm.secret}"
                @wa-input="${(e: any) => this.newLlm.secret = e.target.value}"
                password-toggle
              ></wa-input>

              <div style="display: flex; gap: 0.5rem; align-items: flex-end; margin-bottom: 1.25rem;">
                <wa-input 
                  label="Model Name"
                  placeholder="e.g. gpt-4o"
                  .value="${this.newLlm.model}"
                  @wa-input="${(e: any) => this.newLlm.model = e.target.value}"
                  style="flex: 1; margin-bottom: 0;"
                >
                  <wa-option slot="list" value=""></wa-option>
                  ${this.availableModels.map(m => html`<wa-option value="${m}">${m}</wa-option>`)}
                </wa-input>
                <sr-button 
                  variant="secondary" 
                  @click="${() => this.fetchAvailableModels(this.newLlm.url, this.newLlm.secret)}" 
                  ?disabled="${this.fetchingModels || !this.newLlm.url}"
                >
                  ${this.fetchingModels ? 'Loading...' : 'Fetch'}
                </sr-button>
              </div>

              <wa-input 
                label="Timeout (seconds)"
                type="number"
                .value="${String(this.newLlm.timeout)}"
                @wa-input="${(e: any) => this.newLlm.timeout = parseInt(e.target.value)}"
              ></wa-input>

              <wa-checkbox 
                ?checked="${this.newLlm.enabled}"
                @wa-change="${(e: any) => this.newLlm.enabled = e.target.checked}"
              >
                Enabled
              </wa-checkbox>
            </div>
          </div>
        ` : selectedLlm ? html`
          <div class="detail-header">
            <div>
              <h2>${selectedLlm.name}</h2>
              <span style="font-size: 0.8125rem; color: var(--text-tertiary); font-weight: 600; text-transform: uppercase; letter-spacing: 0.05em;">LLM ID: ${selectedLlm.id}</span>
            </div>
            <sr-button 
              variant="${this.confirmingDelete ? 'primary' : 'danger'}" 
              @click="${() => this.deleteLlm(selectedLlm.id)}"
            >
              ${this.confirmingDelete ? 'Click Again to Confirm' : 'Delete LLM'}
            </sr-button>
          </div>

          <div class="detail-body">
            <div class="section">
              <h3>General Configuration</h3>
              <wa-input 
                label="LLM Name"
                .value="${selectedLlm.name}" 
                @wa-change="${(e: any) => this.updateLlmConfig({ name: e.target.value })}"
              ></wa-input>

              <wa-input 
                label="API URL"
                help-text="The full endpoint URL for the chat completions API"
                .value="${selectedLlm.url}" 
                @wa-change="${(e: any) => this.updateLlmConfig({ url: e.target.value })}"
                placeholder="https://api.openai.com/v1/chat/completions"
              ></wa-input>

              <wa-input 
                label="API Secret / Key"
                type="password" 
                .value="${selectedLlm.secret}" 
                @focus="${(e: any) => { if (e.target.value === '***') e.target.value = ''; }}"
                @blur="${(e: any) => { if (e.target.value === '') e.target.value = '***'; }}"
                @wa-change="${(e: any) => this.updateLlmConfig({ secret: e.target.value })}"
                placeholder="Enter new secret to update"
                password-toggle
              ></wa-input>

              <div style="display: flex; gap: 0.5rem; align-items: flex-end; margin-bottom: 1.25rem;">
                <wa-input 
                  label="Model Name"
                  .value="${selectedLlm.model || ''}" 
                  @wa-change="${(e: any) => this.updateLlmConfig({ model: e.target.value })}"
                  placeholder="e.g. gpt-4o"
                  style="flex: 1; margin-bottom: 0;"
                >
                  ${this.availableModels.map(m => html`<wa-option value="${m}">${m}</wa-option>`)}
                </wa-input>
                <sr-button 
                  variant="secondary" 
                  @click="${() => this.fetchAvailableModels(selectedLlm.url, selectedLlm.secret, selectedLlm.id)}" 
                  ?disabled="${this.fetchingModels || !selectedLlm.url}"
                >
                  ${this.fetchingModels ? 'Loading...' : 'Fetch'}
                </sr-button>
              </div>

              <wa-input 
                label="Timeout (seconds)"
                type="number"
                .value="${selectedLlm.timeout.toString()}" 
                @wa-change="${(e: any) => this.updateLlmConfig({ timeout: parseInt(e.target.value) })}"
              ></wa-input>

              <wa-checkbox 
                ?checked="${selectedLlm.enabled}"
                @wa-change="${(e: any) => this.updateLlmConfig({ enabled: e.target.checked })}"
              >
                Enabled
              </wa-checkbox>
            </div>
          </div>
        ` : html`
          <sr-empty-state 
            title="No LLM Selected" 
            description="Select an LLM from the sidebar or create a new one to get started."
          >
            <svg slot="icon" width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1">
              <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path>
            </svg>
            <sr-button slot="actions" @click="${this._handleStartAdding}">
              Add First LLM
            </sr-button>
          </sr-empty-state>
        `}
      </div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'llm-manager': LLMManager;
  }
}
