import { LitElement, html, css } from 'lit';
import { customElement, state } from 'lit/decorators.js';
import { sharedStyles } from './shared-styles';
import './components/sr-button';
import './components/sr-badge';
import './components/sr-modal';
import './components/sr-form-group';
import './components/sr-list-item';
import './components/sr-empty-state';

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

  // New LLM Form State
  @state() private showAddLlmModal = false;
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
    `
  ];

  connectedCallback() {
    super.connectedCallback();
    this.fetchLlms();
  }

  async fetchLlms() {
    this.loading = true;
    try {
      const res = await fetch('/api/llm');
      if (!res.ok) throw new Error('Failed to fetch LLMs');
      this.llms = await res.json();
      if (this.llms.length > 0 && this.selectedLlmId === null) {
        this.selectedLlmId = this.llms[0].id;
      }
    } catch (err) {
      console.error(err);
    } finally {
      this.loading = false;
    }
  }

  async addLlm() {
    if (!this.newLlm.name || !this.newLlm.url) return;

    try {
      const res = await fetch('/api/llm', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(this.newLlm)
      });

      if (!res.ok) throw new Error('Failed to create LLM');

      const created = await res.json();
      this.llms = [...this.llms, created];
      this.selectedLlmId = created.id;
      this.showAddLlmModal = false;
      this.newLlm = {
        name: '',
        url: '',
        secret: '',
        model: '',
        timeout: 30,
        enabled: true
      };
    } catch (err) {
      alert((err as Error).message);
    }
  }

  async deleteLlm(id: number) {
    if (!confirm('Are you sure you want to delete this LLM? This may affect routes using it.')) return;

    try {
      const res = await fetch(`/api/llm/${id}`, { method: 'DELETE' });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.detail || 'Failed to delete LLM');
      }

      this.llms = this.llms.filter(l => l.id !== id);
      if (this.selectedLlmId === id) {
        this.selectedLlmId = this.llms.length > 0 ? this.llms[0].id : null;
      }
    } catch (err) {
      alert((err as Error).message);
    }
  }

  async updateLlmConfig(updates: Partial<LLM>) {
    if (!this.selectedLlmId) return;

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

      if (!res.ok) throw new Error('Failed to update LLM');

      const updated = await res.json();
      this.llms = this.llms.map(l => l.id === updated.id ? updated : l);
    } catch (err) {
      alert((err as Error).message);
    }
  }

  render() {
    if (this.loading) {
      return html`<div class="empty-state">Loading LLMs...</div>`;
    }

    const selectedLlm = this.llms.find(l => l.id === this.selectedLlmId);

    return html`
      <div class="sidebar">
        <div class="sidebar-header">
          <h2>LLMs</h2>
          <sr-button variant="ghost" iconOnly @click="${() => this.showAddLlmModal = true}" title="Add LLM">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <line x1="12" y1="5" x2="12" y2="19"></line>
              <line x1="5" y1="12" x2="19" y2="12"></line>
            </svg>
          </sr-button>
        </div>
        <div class="llm-list">
          ${this.llms.map(llm => html`
            <sr-list-item 
              .selected="${this.selectedLlmId === llm.id}"
              .title="${llm.name}"
              @click="${() => this.selectedLlmId = llm.id}"
            >
              <sr-badge slot="suffix" variant="${llm.enabled ? 'enabled' : 'disabled'}">
                ${llm.enabled ? 'On' : 'Off'}
              </sr-badge>
            </sr-list-item>
          `)}
        </div>
      </div>

      <div class="main-content">
        ${selectedLlm ? html`
          <div class="detail-header">
            <div>
              <h1 style="margin:0; font-size: 1.5rem;">${selectedLlm.name}</h1>
              <span style="font-size: 0.875rem; color: var(--text-secondary)">LLM ID: ${selectedLlm.id}</span>
            </div>
            <sr-button variant="danger" @click="${() => this.deleteLlm(selectedLlm.id)}">
              Delete LLM
            </sr-button>
          </div>

          <div class="detail-body">
            <div class="section">
              <h3>General Configuration</h3>
              <sr-form-group label="LLM Name">
                <input 
                  type="text" 
                  .value="${selectedLlm.name}" 
                  @change="${(e: any) => this.updateLlmConfig({ name: e.target.value })}"
                >
              </sr-form-group>
              <sr-form-group label="API URL" description="The full endpoint URL for the chat completions API">
                <input 
                  type="text" 
                  .value="${selectedLlm.url}" 
                  @change="${(e: any) => this.updateLlmConfig({ url: e.target.value })}"
                  placeholder="https://api.openai.com/v1/chat/completions"
                >
              </sr-form-group>
              <sr-form-group label="API Secret / Key">
                <input 
                  type="password" 
                  .value="${selectedLlm.secret}" 
                  @focus="${(e: any) => { if (e.target.value === '***') e.target.value = ''; }}"
                  @blur="${(e: any) => { if (e.target.value === '') e.target.value = '***'; }}"
                  @change="${(e: any) => this.updateLlmConfig({ secret: e.target.value })}"
                  placeholder="Enter new secret to update"
                >
              </sr-form-group>
              <sr-form-group label="Model Name">
                <input 
                  type="text" 
                  .value="${selectedLlm.model || ''}" 
                  @change="${(e: any) => this.updateLlmConfig({ model: e.target.value })}"
                  placeholder="e.g. gpt-4o"
                >
              </sr-form-group>
              <sr-form-group label="Timeout (seconds)">
                <input 
                  type="number" 
                  .value="${selectedLlm.timeout.toString()}" 
                  @change="${(e: any) => this.updateLlmConfig({ timeout: parseInt(e.target.value) })}"
                >
              </sr-form-group>
              <sr-form-group label="Status">
                <label style="display: flex; align-items: center; gap: 0.5rem; cursor: pointer;">
                  <input 
                    type="checkbox" 
                    ?checked="${selectedLlm.enabled}"
                    @change="${(e: any) => this.updateLlmConfig({ enabled: e.target.checked })}"
                  >
                  Enabled
                </label>
              </sr-form-group>
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
            <sr-button slot="actions" @click="${() => this.showAddLlmModal = true}">
              Add First LLM
            </sr-button>
          </sr-empty-state>
        `}
      </div>

      <sr-modal 
        .open="${this.showAddLlmModal}" 
        title="Add New LLM"
        @close="${() => this.showAddLlmModal = false}"
      >
        <sr-form-group label="LLM Name">
          <input 
            type="text" 
            placeholder="e.g. OpenAI GPT-4"
            .value="${this.newLlm.name}"
            @input="${(e: any) => this.newLlm.name = e.target.value}"
          >
        </sr-form-group>
        <sr-form-group label="API URL">
          <input 
            type="text" 
            placeholder="https://api.openai.com/v1/chat/completions"
            .value="${this.newLlm.url}"
            @input="${(e: any) => this.newLlm.url = e.target.value}"
          >
        </sr-form-group>
        <sr-form-group label="API Secret / Key">
          <input 
            type="password" 
            placeholder="sk-..."
            .value="${this.newLlm.secret}"
            @input="${(e: any) => this.newLlm.secret = e.target.value}"
          >
        </sr-form-group>
        <sr-form-group label="Model Name">
          <input 
            type="text" 
            placeholder="gpt-4"
            .value="${this.newLlm.model}"
            @input="${(e: any) => this.newLlm.model = e.target.value}"
          >
        </sr-form-group>

        <div slot="actions">
          <sr-button variant="ghost" @click="${() => this.showAddLlmModal = false}">Cancel</sr-button>
          <sr-button 
            ?disabled="${!this.newLlm.name || !this.newLlm.url}"
            @click="${this.addLlm}"
          >
            Add LLM
          </sr-button>
        </div>
      </sr-modal>
    `;
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'llm-manager': LLMManager;
  }
}
