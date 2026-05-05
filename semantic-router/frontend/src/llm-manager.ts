import { LitElement, html, css } from 'lit';
import { customElement, state } from 'lit/decorators.js';

interface LLM {
  id: number;
  name: string;
  url: string;
  model: string | null;
  enabled: boolean;
}

@customElement('llm-manager')
export class LLMManager extends LitElement {
  @state() private llms: LLM[] = [];
  @state() private selectedLlmId: number | null = null;
  @state() private loading = true;

  // New LLM Form State
  @state() private showAddLlmModal = false;
  @state() private newLlmName = '';
  @state() private newLlmUrl = '';
  @state() private newLlmModel = '';

  static styles = css`
    :host {
      display: flex;
      height: 100%;
      width: 100%;
      overflow: hidden;
      color: var(--text-color);
      animation: fadeIn 0.4s ease-out;
    }

    @keyframes fadeIn {
      from { opacity: 0; transform: translateY(10px); }
      to { opacity: 1; transform: translateY(0); }
    }

    .sidebar {
      width: 300px;
      border-right: 1px solid var(--border-color);
      display: flex;
      flex-direction: column;
      background: rgba(255, 255, 255, 0.02);
    }

    .sidebar-header {
      padding: 1.5rem;
      border-bottom: 1px solid var(--border-color);
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    .sidebar-header h2 {
      margin: 0;
      font-size: 0.875rem;
      text-transform: uppercase;
      letter-spacing: 0.1em;
      color: var(--text-secondary);
    }

    .llm-list {
      flex: 1;
      overflow-y: auto;
      padding: 0.5rem;
    }

    .llm-item {
      padding: 0.75rem 1rem;
      border-radius: var(--border-radius);
      cursor: pointer;
      margin-bottom: 0.25rem;
      transition: all var(--transition-speed);
      display: flex;
      justify-content: space-between;
      align-items: center;
      border: 1px solid transparent;
    }

    .llm-item:hover {
      background: var(--surface-hover);
    }

    .llm-item.selected {
      background: var(--primary-light);
      border-color: rgba(99, 102, 241, 0.3);
      color: var(--primary-color);
    }

    .llm-name {
      font-weight: 500;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .main-content {
      flex: 1;
      overflow-y: auto;
      display: flex;
      flex-direction: column;
      background: rgba(15, 23, 42, 0.5);
    }

    .empty-state {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      height: 100%;
      color: var(--text-secondary);
      text-align: center;
      padding: 2rem;
    }

    .detail-header {
      padding: 1.5rem 2rem;
      border-bottom: 1px solid var(--border-color);
      background: rgba(255, 255, 255, 0.01);
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    .detail-body {
      padding: 2rem;
      max-width: 800px;
    }

    .section {
      margin-bottom: 2.5rem;
      background: var(--surface-color);
      padding: 1.5rem;
      border-radius: var(--border-radius);
      border: 1px solid var(--border-color);
      box-shadow: var(--shadow-sm);
    }

    .section h3 {
      font-size: 1.1rem;
      margin-top: 0;
      margin-bottom: 1.5rem;
      color: var(--text-color);
      display: flex;
      align-items: center;
      gap: 0.5rem;
    }

    .form-group {
      margin-bottom: 1.5rem;
    }

    label {
      display: block;
      margin-bottom: 0.5rem;
      font-size: 0.875rem;
      color: var(--text-secondary);
      font-weight: 500;
    }

    input[type="text"], input[type="url"], select {
      width: 100%;
      padding: 0.75rem 1rem;
      background: rgba(0, 0, 0, 0.2);
      border: 1px solid var(--border-color);
      border-radius: 8px;
      color: white;
      font-size: 0.95rem;
      transition: all var(--transition-speed);
    }

    input:focus, select:focus {
      outline: none;
      border-color: var(--primary-color);
      box-shadow: 0 0 0 3px var(--primary-light);
    }

    .btn {
      padding: 0.6rem 1.2rem;
      border-radius: 8px;
      border: none;
      cursor: pointer;
      font-weight: 600;
      transition: all var(--transition-speed);
      display: inline-flex;
      align-items: center;
      justify-content: center;
      gap: 0.5rem;
      font-size: 0.875rem;
      font-family: inherit;
    }

    .btn-primary {
      background: var(--primary-color);
      color: white;
      box-shadow: var(--shadow-md);
    }

    .btn-primary:hover:not(:disabled) {
      background: var(--primary-hover);
      transform: translateY(-1px);
      box-shadow: var(--shadow-lg);
    }

    .btn-ghost {
      background: transparent;
      color: var(--text-secondary);
    }

    .btn-ghost:hover {
      background: var(--surface-hover);
      color: white;
    }

    .btn-danger {
      background: rgba(239, 68, 68, 0.1);
      color: #ef4444;
    }

    .btn-danger:hover {
      background: #ef4444;
      color: white;
    }

    .modal-overlay {
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: rgba(0, 0, 0, 0.8);
      backdrop-filter: blur(8px);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 1000;
      animation: fadeIn 0.2s ease-out;
    }

    .modal {
      background: var(--surface-color);
      border: 1px solid var(--border-color);
      border-radius: 16px;
      width: 100%;
      max-width: 450px;
      padding: 2rem;
      box-shadow: var(--shadow-lg);
    }

    .modal h2 {
      margin-top: 0;
      margin-bottom: 1.5rem;
      font-size: 1.5rem;
    }

    .modal-actions {
      display: flex;
      justify-content: flex-end;
      gap: 1rem;
      margin-top: 2rem;
    }

    .badge {
      padding: 2px 8px;
      border-radius: 6px;
      font-size: 0.75rem;
      font-weight: 700;
      text-transform: uppercase;
    }

    .badge-enabled {
      background: rgba(34, 197, 94, 0.1);
      color: #22c55e;
    }

    .badge-disabled {
      background: rgba(239, 68, 68, 0.1);
      color: #ef4444;
    }

    .loader {
      width: 24px;
      height: 24px;
      border: 3px solid var(--border-color);
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
    this.fetchLLMs();
  }

  async fetchLLMs() {
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

  async addLLM() {
    if (!this.newLlmName || !this.newLlmUrl) return;

    try {
      const res = await fetch('/api/llm', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: this.newLlmName,
          url: this.newLlmUrl,
          model: this.newLlmModel || null,
          enabled: true
        })
      });

      if (!res.ok) throw new Error('Failed to create LLM');

      const newLlm = await res.json();
      this.llms = [...this.llms, newLlm];
      this.selectedLlmId = newLlm.id;
      this.showAddLlmModal = false;
      this.newLlmName = '';
      this.newLlmUrl = '';
      this.newLlmModel = '';
    } catch (err) {
      alert((err as Error).message);
    }
  }

  async deleteLLM(id: number) {
    if (!confirm('Are you sure you want to delete this LLM? This may affect routes using it.')) return;

    try {
      const res = await fetch(`/api/llm/${id}`, { method: 'DELETE' });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.detail || 'Failed to delete LLM');
      }

      this.llms = this.llms.filter(l => l.id !== id);
      if (this.selectedLlmId === id) {
        this.selectedLlmId = this.llms.length > 0 ? this.llms[0].id : null;
      }
    } catch (err) {
      alert((err as Error).message);
    }
  }

  async updateLLMConfig(updates: Partial<LLM>) {
    if (!this.selectedLlmId) return;

    try {
      const res = await fetch(`/api/llm/${this.selectedLlmId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates)
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
      return html`
        <div class="empty-state">
          <div class="loader"></div>
          <p style="margin-top: 1rem">Loading LLM configurations...</p>
        </div>
      `;
    }

    const selectedLlm = this.llms.find(l => l.id === this.selectedLlmId);

    return html`
      <div class="sidebar">
        <div class="sidebar-header">
          <h2>LLM Providers</h2>
          <button class="btn btn-ghost" @click="${() => this.showAddLlmModal = true}" title="Add LLM">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
              <line x1="12" y1="5" x2="12" y2="19"></line>
              <line x1="5" y1="12" x2="19" y2="12"></line>
            </svg>
            <span>Add LLM</span>
          </button>
        </div>
        <div class="llm-list">
          ${this.llms.map(llm => html`
            <div 
              class="llm-item ${this.selectedLlmId === llm.id ? 'selected' : ''}"
              @click="${() => this.selectedLlmId = llm.id}"
            >
              <div class="llm-name">${llm.name}</div>
              <div class="badge ${llm.enabled ? 'badge-enabled' : 'badge-disabled'}">
                ${llm.enabled ? 'On' : 'Off'}
              </div>
            </div>
          `)}
          ${this.llms.length === 0 ? html`
            <div style="padding: 2rem; text-align: center; color: var(--text-secondary); font-size: 0.875rem;">
              No LLMs configured.
            </div>
          ` : ''}
        </div>
      </div>

      <div class="main-content">
        ${selectedLlm ? html`
          <div class="detail-header">
            <div>
              <h1 style="margin:0; font-size: 1.5rem; font-weight: 600;">${selectedLlm.name}</h1>
              <span style="font-size: 0.875rem; color: var(--text-secondary)">ID: ${selectedLlm.id}</span>
            </div>
            <button class="btn btn-danger" @click="${() => this.deleteLLM(selectedLlm.id)}">
              Delete Provider
            </button>
          </div>

          <div class="detail-body">
            <div class="section">
              <h3>Connection Settings</h3>
              <div class="form-group">
                <label>Provider Name</label>
                <input 
                  type="text" 
                  .value="${selectedLlm.name}" 
                  @change="${(e: any) => this.updateLLMConfig({ name: e.target.value })}"
                >
              </div>
              <div class="form-group">
                <label>API URL</label>
                <input 
                  type="url" 
                  .value="${selectedLlm.url}" 
                  @change="${(e: any) => this.updateLLMConfig({ url: e.target.value })}"
                  placeholder="https://api.openai.com/v1"
                >
              </div>
              <div class="form-group">
                <label>Model ID (Optional)</label>
                <input 
                  type="text" 
                  .value="${selectedLlm.model || ''}" 
                  @change="${(e: any) => this.updateLLMConfig({ model: e.target.value || null })}"
                  placeholder="gpt-4o, claude-3-opus, etc."
                >
              </div>
              <div class="form-group" style="margin-bottom: 0">
                <label style="display: flex; align-items: center; gap: 0.75rem; cursor: pointer; user-select: none;">
                  <input 
                    type="checkbox" 
                    style="width: auto"
                    ?checked="${selectedLlm.enabled}"
                    @change="${(e: any) => this.updateLLMConfig({ enabled: e.target.checked })}"
                  >
                  <span>Enabled</span>
                </label>
              </div>
            </div>
          </div>
        ` : html`
          <div class="empty-state">
            <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1" style="margin-bottom: 1.5rem; opacity: 0.2; color: var(--primary-color)">
              <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path>
            </svg>
            <h2>No Provider Selected</h2>
            <p>Select an LLM provider from the sidebar or configure a new one.</p>
            <button class="btn btn-primary" @click="${() => this.showAddLlmModal = true}" style="margin-top: 1.5rem;">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                <line x1="12" y1="5" x2="12" y2="19"></line>
                <line x1="5" y1="12" x2="19" y2="12"></line>
              </svg>
              Add Your First Provider
            </button>
          </div>
        `}
      </div>

      ${this.showAddLlmModal ? html`
        <div class="modal-overlay" @click="${() => this.showAddLlmModal = false}">
          <div class="modal" @click="${(e: Event) => e.stopPropagation()}">
            <h2>Add New LLM</h2>
            <div class="form-group">
              <label>Provider Name</label>
              <input 
                type="text" 
                placeholder="e.g. OpenAI, Anthropic, Local LLM"
                .value="${this.newLlmName}"
                @input="${(e: any) => this.newLlmName = e.target.value}"
              >
            </div>
            <div class="form-group">
              <label>API URL</label>
              <input 
                type="url" 
                placeholder="https://api.openai.com/v1"
                .value="${this.newLlmUrl}"
                @input="${(e: any) => this.newLlmUrl = e.target.value}"
              >
            </div>
            <div class="form-group">
              <label>Model ID (Optional)</label>
              <input 
                type="text" 
                placeholder="e.g. gpt-4o"
                .value="${this.newLlmModel}"
                @input="${(e: any) => this.newLlmModel = e.target.value}"
              >
            </div>
            <div class="modal-actions">
              <button class="btn btn-ghost" @click="${() => this.showAddLlmModal = false}">Cancel</button>
              <button 
                class="btn btn-primary" 
                ?disabled="${!this.newLlmName || !this.newLlmUrl}"
                @click="${this.addLLM}"
              >
                Add Provider
              </button>
            </div>
          </div>
        </div>
      ` : ''}
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'llm-manager': LLMManager;
  }
}
