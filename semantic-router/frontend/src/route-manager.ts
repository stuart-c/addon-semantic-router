import { LitElement, html, css } from 'lit';
import { customElement, state } from 'lit/decorators.js';
import { sharedStyles } from './shared-styles';
import './components/sr-button';
import './components/sr-badge';
import './components/sr-form-group';
import './components/sr-list-item';
import './components/sr-empty-state';
import '@awesome.me/webawesome/dist/components/input/input.js';
import '@awesome.me/webawesome/dist/components/select/select.js';
import '@awesome.me/webawesome/dist/components/option/option.js';
import '@awesome.me/webawesome/dist/components/checkbox/checkbox.js';
import '@awesome.me/webawesome/dist/components/icon/icon.js';
import '@awesome.me/webawesome/dist/components/callout/callout.js';
import '@awesome.me/webawesome/dist/components/spinner/spinner.js';

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
        padding: 0.5rem 1rem;
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

      wa-input, wa-select {
        width: 100%;
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
      return html`
        <div class="loading-container">
          <wa-spinner style="font-size: 3rem; --track-width: 4px;"></wa-spinner>
          <p>Loading routes...</p>
        </div>
      `;
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
            <wa-callout variant="danger" open closable @wa-after-hide="${() => this.error = null}">
              <wa-icon slot="icon" name="exclamation-octagon"></wa-icon>
              <strong>Error</strong><br />
              ${this.error}
            </wa-callout>
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
              <wa-input 
                label="Route Name"
                placeholder="e.g. Greeting, Technical Support"
                .value="${this.newRouteName}"
                @wa-input="${(e: any) => this.newRouteName = e.target.value}"
              ></wa-input>
              <wa-select 
                label="Assign LLM"
                placeholder="Select an LLM"
                value="${this.newRouteLlmId ? String(this.newRouteLlmId) : ''}"
                @wa-change="${(e: any) => this.newRouteLlmId = parseInt(e.target.value)}"
              >
                ${this.llms.map(llm => html`
                  <wa-option value="${llm.id}">${llm.name}</wa-option>
                `)}
              </wa-select>
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
              <wa-input 
                label="Route Name"
                .value="${selectedRoute.name}" 
                @wa-change="${(e: any) => this.updateRouteConfig({ name: e.target.value })}"
              ></wa-input>
              <wa-select 
                label="Assigned LLM"
                value="${selectedRoute.llm.toString()}"
                @wa-change="${(e: any) => this.updateRouteConfig({ llm: parseInt(e.target.value) })}"
              >
                ${this.llms.map(llm => html`
                  <wa-option value="${llm.id}">
                    ${llm.name} (${llm.model || 'Default Model'})
                  </wa-option>
                `)}
              </wa-select>
              <wa-checkbox 
                ?checked="${selectedRoute.enabled}"
                @wa-change="${(e: any) => this.updateRouteConfig({ enabled: e.target.checked })}"
              >
                Enabled
              </wa-checkbox>
            </div>

            <div class="section">
              <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem;">
                <h3 style="margin:0">Utterances</h3>
              </div>
              <div class="utterance-list">
                ${selectedRoute.utterances.map(utt => html`
                  <div class="utterance-item fade-in">
                    <wa-input 
                      class="utterance-input"
                      .value="${utt.utterance}"
                      @wa-change="${(e: any) => this.updateUtterance(selectedRoute.id, utt.id, e.target.value)}"
                    ></wa-input>
                    <sr-button variant="ghost" iconOnly @click="${() => this.deleteUtterance(selectedRoute.id, utt.id)}">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M3 6h18"></path>
                        <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                      </svg>
                    </sr-button>
                  </div>
                `)}
                
                <div class="utterance-item" style="border-style: dashed; background-color: transparent;">
                  <wa-input 
                    class="utterance-input"
                    placeholder="Type a new utterance and press enter..."
                    .value="${this.newUtterance}"
                    @wa-input="${(e: any) => this.newUtterance = e.target.value}"
                    @keydown="${(e: KeyboardEvent) => e.key === 'Enter' && this.addUtterance(selectedRoute.id)}"
                  ></wa-input>
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
