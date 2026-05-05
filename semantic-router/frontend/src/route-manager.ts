import { LitElement, html, css } from 'lit';
import { customElement, state } from 'lit/decorators.js';
import { sharedStyles } from './shared-styles';
import './components/sr-button';
import './components/sr-badge';
import './components/sr-form-group';
import './components/sr-list-item';
import './components/sr-empty-state';

interface RouteUtterance {
  id: number;
  route_id: number;
  utterance: string;
}

interface Route {
  id: number;
  name: string;
  llm: number;
  enabled: boolean;
  utterances: RouteUtterance[];
}

interface LLM {
  id: number;
  name: string;
  url: string;
  model: string | null;
  enabled: boolean;
}

@customElement('route-manager')
export class RouteManager extends LitElement {
  @state() private routes: Route[] = [];
  @state() private llms: LLM[] = [];
  @state() private selectedRouteId: number | null = null;
  @state() private loading = true;
  @state() private error: string | null = null;
  @state() private confirmingDelete = false;
  @state() private newUtterance = '';


  // New Route Form State
  @state() private isAdding = false;
  @state() private newRouteName = '';
  @state() private newRouteLlmId: number | null = null;

  static styles = [
    sharedStyles,
    css`
      .route-list {
        flex: 1;
        overflow-y: auto;
        padding: 0.5rem;
      }

      .utterance-list {
        display: flex;
        flex-direction: column;
        gap: 1rem;
      }

      .utterance-item {
        display: flex;
        gap: 0.75rem;
        align-items: center;
        background-color: var(--bg-color);
        padding: 0.75rem 1.25rem;
        border-radius: var(--border-radius-sm);
        border: 1px solid var(--border-color);
        transition: var(--transition-speed);
      }

      .utterance-item:focus-within {
        border-color: var(--primary-color);
        box-shadow: 0 0 0 3px hsla(var(--primary-h), var(--primary-s), var(--primary-l), 0.1);
      }

      .utterance-input {
        flex: 1;
        background: transparent !important;
        border: none !important;
        padding: 0 !important;
        font-size: 0.9375rem;
        color: var(--text-color);
      }

      .error-banner {
        background-color: hsla(0, 84%, 60%, 0.1);
        color: hsl(0, 84%, 60%);
        padding: 1rem 1.5rem;
        border-radius: var(--border-radius-sm);
        margin-bottom: 1.5rem;
        font-size: 0.875rem;
        font-weight: 500;
        border: 1px solid hsla(0, 84%, 60%, 0.2);
        display: flex;
        justify-content: space-between;
        align-items: center;
      }
    `
  ];

  connectedCallback() {
    super.connectedCallback();
    this.fetchInitialData();
  }

  async fetchInitialData() {
    this.loading = true;
    this.error = null;
    try {
      const [routesRes, llmsRes] = await Promise.all([
        fetch('/api/route'),
        fetch('/api/llm')
      ]);

      if (!routesRes.ok || !llmsRes.ok) throw new Error('Failed to fetch data');

      this.routes = await routesRes.json();
      this.llms = await llmsRes.json();

      if (this.routes.length > 0 && this.selectedRouteId === null && !this.isAdding) {
        this.selectedRouteId = this.routes[0].id;
      }
    } catch (err) {
      this.error = (err as Error).message;
    } finally {
      this.loading = false;
    }
  }

  async addRoute() {
    if (!this.newRouteName || this.newRouteLlmId === null) return;
    this.error = null;

    try {
      const res = await fetch('/api/route', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: this.newRouteName,
          llm: this.newRouteLlmId,
          enabled: true
        })
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.detail || 'Failed to create route');
      }

      const newRoute = await res.json();
      this.routes = [...this.routes, { ...newRoute, utterances: [] }];
      this.selectedRouteId = newRoute.id;
      this.isAdding = false;
      this.newRouteName = '';
      this.newRouteLlmId = null;
    } catch (err) {
      this.error = (err as Error).message;
    }
  }

  async deleteRoute(id: number) {
    if (!this.confirmingDelete) {
      this.confirmingDelete = true;
      setTimeout(() => { this.confirmingDelete = false; }, 3000);
      return;
    }

    this.error = null;
    try {
      const res = await fetch(`/api/route/${id}`, { method: 'DELETE' });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.detail || 'Failed to delete route');
      }

      this.routes = this.routes.filter(r => r.id !== id);
      this.confirmingDelete = false;
      if (this.selectedRouteId === id) {
        this.selectedRouteId = this.routes.length > 0 ? this.routes[0].id : null;
      }
    } catch (err) {
      this.error = (err as Error).message;
      this.confirmingDelete = false;
    }
  }

  async updateRouteConfig(updates: Partial<Route>) {
    if (!this.selectedRouteId) return;
    this.error = null;

    try {
      const res = await fetch(`/api/route/${this.selectedRouteId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates)
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.detail || 'Failed to update route');
      }

      const updated = await res.json();
      this.routes = this.routes.map(r => r.id === updated.id ? { ...r, ...updated } : r);
    } catch (err) {
      this.error = (err as Error).message;
    }
  }

  async addUtterance(routeId: number) {
    if (!this.newUtterance) return;
    this.error = null;

    try {
      const res = await fetch(`/api/route/${routeId}/utterance`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ utterance: this.newUtterance })
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.detail || 'Failed to add utterance');
      }

      const newUtt = await res.json();
      this.routes = this.routes.map(r => 
        r.id === routeId 
          ? { ...r, utterances: [...r.utterances, newUtt] } 
          : r
      );
      this.newUtterance = '';
    } catch (err) {
      this.error = (err as Error).message;
    }
  }

  async deleteUtterance(routeId: number, uttId: number) {
    this.error = null;
    try {
      const res = await fetch(`/api/route/${routeId}/utterance/${uttId}`, {
        method: 'DELETE'
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.detail || 'Failed to delete utterance');
      }

      this.routes = this.routes.map(r => 
        r.id === routeId 
          ? { ...r, utterances: r.utterances.filter(u => u.id !== uttId) } 
          : r
      );
    } catch (err) {
      this.error = (err as Error).message;
    }
  }

  async updateUtterance(routeId: number, uttId: number, utterance: string) {
    this.error = null;
    try {
      const res = await fetch(`/api/route/${routeId}/utterance/${uttId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ utterance })
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.detail || 'Failed to update utterance');
      }

      const updated = await res.json();
      this.routes = this.routes.map(r => 
        r.id === routeId 
          ? { ...r, utterances: r.utterances.map(u => u.id === uttId ? updated : u) } 
          : r
      );
    } catch (err) {
      this.error = (err as Error).message;
    }
  }

  private _handleSelectRoute(id: number) {
    this.selectedRouteId = id;
    this.isAdding = false;
    this.error = null;
    this.confirmingDelete = false;
  }

  private _handleStartAdding() {
    this.isAdding = true;
    this.selectedRouteId = null;
    this.error = null;
  }

  private _handleCancelAdding() {
    this.isAdding = false;
    this.error = null;
    if (this.routes.length > 0) {
      this.selectedRouteId = this.routes[0].id;
    }
  }

  render() {
    if (this.loading) {
      return html`<div class="empty-state">Loading routes...</div>`;
    }

    const selectedRoute = this.routes.find(r => r.id === this.selectedRouteId);

    return html`
      <div class="sidebar">
        <div class="sidebar-header">
          <div style="display: flex; justify-content: space-between; align-items: center;">
            <h2>Routes</h2>
            <sr-button variant="ghost" iconOnly @click="${this._handleStartAdding}" title="Add Route">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <line x1="12" y1="5" x2="12" y2="19"></line>
                <line x1="5" y1="12" x2="19" y2="12"></line>
              </svg>
            </sr-button>
          </div>
        </div>
        <div class="route-list">
          ${this.routes.map(route => html`
            <sr-list-item 
              .selected="${this.selectedRouteId === route.id}"
              .title="${route.name}"
              @click="${() => this._handleSelectRoute(route.id)}"
            >
              <sr-badge slot="suffix" variant="${route.enabled ? 'enabled' : 'disabled'}">
                ${route.enabled ? 'On' : 'Off'}
              </sr-badge>
            </sr-list-item>
          `)}
        </div>
      </div>

      <div class="main-content">
        ${this.error ? html`
          <div style="padding: 2.5rem 2.5rem 0 2.5rem; max-width: 900px; margin: 0 auto; width: 100%;">
            <div class="error-banner">
              <span>${this.error}</span>
              <sr-button variant="ghost" iconOnly @click="${() => this.error = null}">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <line x1="18" y1="6" x2="6" y2="18"></line>
                  <line x1="6" y1="6" x2="18" y2="18"></line>
                </svg>
              </sr-button>
            </div>
          </div>
        ` : ''}

        ${this.isAdding ? html`
          <div class="detail-header">
            <div>
              <h2>Create New Route</h2>
              <span style="font-size: 0.8125rem; color: var(--text-tertiary); font-weight: 600; text-transform: uppercase; letter-spacing: 0.05em;">Configure a new routing path</span>
            </div>
            <div style="display: flex; gap: 1rem;">
              <sr-button variant="ghost" @click="${this._handleCancelAdding}">Cancel</sr-button>
              <sr-button 
                ?disabled="${!this.newRouteName || this.newRouteLlmId === null}"
                @click="${this.addRoute}"
              >
                Create Route
              </sr-button>
            </div>
          </div>
          <div class="detail-body">
            <div class="section fade-in">
              <h3>General Configuration</h3>
              <sr-form-group label="Route Name">
                <input 
                  type="text" 
                  placeholder="e.g. Greeting, Technical Support"
                  .value="${this.newRouteName}"
                  @input="${(e: any) => this.newRouteName = e.target.value}"
                >
              </sr-form-group>
              <sr-form-group label="Assign LLM">
                <select 
                  @change="${(e: any) => this.newRouteLlmId = parseInt(e.target.value)}"
                >
                  <option value="" disabled ?selected="${this.newRouteLlmId === null}">Select an LLM</option>
                  ${this.llms.map(llm => html`
                    <option value="${llm.id}">${llm.name}</option>
                  `)}
                </select>
              </sr-form-group>
            </div>
          </div>
        ` : selectedRoute ? html`
          <div class="detail-header">
            <div>
              <h2>${selectedRoute.name}</h2>
              <span style="font-size: 0.8125rem; color: var(--text-tertiary); font-weight: 600; text-transform: uppercase; letter-spacing: 0.05em;">Route ID: ${selectedRoute.id}</span>
            </div>
            <sr-button 
              variant="${this.confirmingDelete ? 'primary' : 'danger'}" 
              @click="${() => this.deleteRoute(selectedRoute.id)}"
            >
              ${this.confirmingDelete ? 'Click Again to Confirm' : 'Delete Route'}
            </sr-button>
          </div>

          <div class="detail-body">
            <div class="section">
              <h3>General Configuration</h3>
              <sr-form-group label="Route Name">
                <input 
                  type="text" 
                  .value="${selectedRoute.name}" 
                  @change="${(e: any) => this.updateRouteConfig({ name: e.target.value })}"
                >
              </sr-form-group>
              <sr-form-group label="Assigned LLM">
                <select 
                  .value="${selectedRoute.llm.toString()}"
                  @change="${(e: any) => this.updateRouteConfig({ llm: parseInt(e.target.value) })}"
                >
                  ${this.llms.map(llm => html`
                    <option value="${llm.id}" ?selected="${llm.id === selectedRoute.llm}">
                      ${llm.name} (${llm.model || 'Default Model'})
                    </option>
                  `)}
                </select>
              </sr-form-group>
              <sr-form-group label="Status">
                <label style="display: flex; align-items: center; gap: 0.5rem; cursor: pointer;">
                  <input 
                    type="checkbox" 
                    ?checked="${selectedRoute.enabled}"
                    @change="${(e: any) => this.updateRouteConfig({ enabled: e.target.checked })}"
                  >
                  Enabled
                </label>
              </sr-form-group>
            </div>

            <div class="section">
              <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem;">
                <h3 style="margin:0">Utterances</h3>
              </div>
              <div class="utterance-list">
                ${selectedRoute.utterances.map(utt => html`
                  <div class="utterance-item fade-in">
                    <input 
                      type="text" 
                      class="utterance-input"
                      .value="${utt.utterance}"
                      @change="${(e: any) => this.updateUtterance(selectedRoute.id, utt.id, e.target.value)}"
                    >
                    <sr-button variant="ghost" iconOnly @click="${() => this.deleteUtterance(selectedRoute.id, utt.id)}">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M3 6h18"></path>
                        <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                      </svg>
                    </sr-button>
                  </div>
                `)}
                
                <div class="utterance-item" style="border-style: dashed; background-color: transparent;">
                  <input 
                    type="text" 
                    class="utterance-input"
                    placeholder="Type a new utterance and press enter..."
                    .value="${this.newUtterance}"
                    @input="${(e: any) => this.newUtterance = e.target.value}"
                    @keydown="${(e: KeyboardEvent) => e.key === 'Enter' && this.addUtterance(selectedRoute.id)}"
                  >
                  <sr-button variant="ghost" iconOnly @click="${() => this.addUtterance(selectedRoute.id)}" ?disabled="${!this.newUtterance}">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                      <line x1="12" y1="5" x2="12" y2="19"></line>
                      <line x1="5" y1="12" x2="19" y2="12"></line>
                    </svg>
                  </sr-button>
                </div>

                ${selectedRoute.utterances.length === 0 && !this.newUtterance ? html`
                  <div style="text-align: center; padding: 1rem; color: var(--text-tertiary); font-style: italic; font-size: 0.875rem;">
                    No utterances defined for this route.
                  </div>
                ` : ''}
              </div>
            </div>
          </div>
        ` : html`
          <sr-empty-state 
            title="No Route Selected" 
            description="Select a route from the sidebar or create a new one to get started."
          >
            <svg slot="icon" width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
              <path d="M9 17l6-5-6-5"></path>
              <circle cx="12" cy="12" r="10"></circle>
            </svg>
            <sr-button slot="actions" @click="${this._handleStartAdding}">
              Create First Route
            </sr-button>
          </sr-empty-state>
        `}
      </div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'route-manager': RouteManager;
  }
}
