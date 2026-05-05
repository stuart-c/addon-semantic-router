import { LitElement, html, css } from 'lit';
import { customElement, state } from 'lit/decorators.js';

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

  // New Route Form State
  @state() private showAddRouteModal = false;
  @state() private newRouteName = '';
  @state() private newRouteLlmId: number | null = null;

  static styles = css`
    :host {
      display: flex;
      height: 100%;
      width: 100%;
      overflow: hidden;
      color: var(--text-color);
    }

    .sidebar {
      width: 300px;
      border-right: 1px solid rgba(255, 255, 255, 0.1);
      display: flex;
      flex-direction: column;
      background: rgba(255, 255, 255, 0.02);
    }

    .sidebar-header {
      padding: 1.5rem;
      border-bottom: 1px solid rgba(255, 255, 255, 0.05);
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    .sidebar-header h2 {
      margin: 0;
      font-size: 1rem;
      text-transform: uppercase;
      letter-spacing: 0.1em;
      color: var(--text-secondary);
    }

    .route-list {
      flex: 1;
      overflow-y: auto;
      padding: 0.5rem;
    }

    .route-item {
      padding: 0.75rem 1rem;
      border-radius: 6px;
      cursor: pointer;
      margin-bottom: 0.25rem;
      transition: all 0.2s;
      display: flex;
      justify-content: space-between;
      align-items: center;
      border: 1px solid transparent;
    }

    .route-item:hover {
      background: rgba(255, 255, 255, 0.05);
    }

    .route-item.selected {
      background: rgba(100, 108, 255, 0.1);
      border-color: rgba(100, 108, 255, 0.3);
      color: var(--primary-color);
    }

    .route-name {
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
      background: #1e1e1e;
    }

    .empty-state {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      height: 100%;
      color: var(--text-secondary);
      opacity: 0.7;
    }

    .detail-header {
      padding: 1.5rem 2rem;
      border-bottom: 1px solid rgba(255, 255, 255, 0.05);
      background: rgba(255, 255, 255, 0.02);
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
    }

    .section h3 {
      font-size: 1.1rem;
      margin-bottom: 1rem;
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
    }

    input[type="text"], select {
      width: 100%;
      padding: 0.75rem;
      background: rgba(0, 0, 0, 0.2);
      border: 1px solid rgba(255, 255, 255, 0.1);
      border-radius: 4px;
      color: white;
      font-size: 0.9rem;
      transition: border-color 0.2s;
    }

    input:focus, select:focus {
      outline: none;
      border-color: var(--primary-color);
    }

    .utterance-list {
      display: flex;
      flex-direction: column;
      gap: 0.75rem;
    }

    .utterance-item {
      display: flex;
      gap: 0.5rem;
      align-items: center;
      background: rgba(255, 255, 255, 0.03);
      padding: 0.5rem 0.75rem;
      border-radius: 4px;
      border: 1px solid rgba(255, 255, 255, 0.05);
    }

    .utterance-input {
      flex: 1;
      background: transparent !important;
      border: none !important;
      padding: 0.25rem !important;
    }

    .btn {
      padding: 0.5rem 1rem;
      border-radius: 4px;
      border: none;
      cursor: pointer;
      font-weight: 500;
      transition: all 0.2s;
      display: inline-flex;
      align-items: center;
      gap: 0.5rem;
      font-size: 0.875rem;
    }

    .btn-primary {
      background: var(--primary-color);
      color: white;
    }

    .btn-primary:hover {
      background: var(--primary-hover);
    }

    .btn-ghost {
      background: transparent;
      color: var(--text-secondary);
    }

    .btn-ghost:hover {
      background: rgba(255, 255, 255, 0.05);
      color: white;
    }

    .btn-danger {
      background: rgba(255, 71, 87, 0.1);
      color: #ff4757;
    }

    .btn-danger:hover {
      background: #ff4757;
      color: white;
    }

    .btn-icon {
      padding: 0.4rem;
      border-radius: 4px;
    }

    /* Modal Styles */
    .modal-overlay {
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: rgba(0, 0, 0, 0.7);
      backdrop-filter: blur(4px);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 1000;
    }

    .modal {
      background: var(--surface-color);
      border: 1px solid rgba(255, 255, 255, 0.1);
      border-radius: 12px;
      width: 400px;
      padding: 2rem;
      box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.5);
    }

    .modal h2 {
      margin-top: 0;
      margin-bottom: 1.5rem;
    }

    .modal-actions {
      display: flex;
      justify-content: flex-end;
      gap: 1rem;
      margin-top: 2rem;
    }

    .badge {
      padding: 2px 6px;
      border-radius: 4px;
      font-size: 0.7rem;
      font-weight: 600;
      text-transform: uppercase;
    }

    .badge-enabled {
      background: rgba(46, 213, 115, 0.2);
      color: #2ed573;
    }

    .badge-disabled {
      background: rgba(255, 71, 87, 0.2);
      color: #ff4757;
    }
  `;

  connectedCallback() {
    super.connectedCallback();
    this.fetchInitialData();
  }

  async fetchInitialData() {
    this.loading = true;
    try {
      const [routesRes, llmsRes] = await Promise.all([
        fetch('/api/route'),
        fetch('/api/llm')
      ]);

      if (!routesRes.ok || !llmsRes.ok) throw new Error('Failed to fetch data');

      this.routes = await routesRes.json();
      this.llms = await llmsRes.json();

      if (this.routes.length > 0 && this.selectedRouteId === null) {
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

      if (!res.ok) throw new Error('Failed to create route');

      const newRoute = await res.json();
      this.routes = [...this.routes, { ...newRoute, utterances: [] }];
      this.selectedRouteId = newRoute.id;
      this.showAddRouteModal = false;
      this.newRouteName = '';
      this.newRouteLlmId = null;
    } catch (err) {
      alert((err as Error).message);
    }
  }

  async deleteRoute(id: number) {
    if (!confirm('Are you sure you want to delete this route?')) return;

    try {
      const res = await fetch(`/api/route/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Failed to delete route');

      this.routes = this.routes.filter(r => r.id !== id);
      if (this.selectedRouteId === id) {
        this.selectedRouteId = this.routes.length > 0 ? this.routes[0].id : null;
      }
    } catch (err) {
      alert((err as Error).message);
    }
  }

  async updateRouteConfig(updates: Partial<Route>) {
    if (!this.selectedRouteId) return;

    try {
      const res = await fetch(`/api/route/${this.selectedRouteId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates)
      });

      if (!res.ok) throw new Error('Failed to update route');

      const updated = await res.json();
      this.routes = this.routes.map(r => r.id === updated.id ? { ...r, ...updated } : r);
    } catch (err) {
      alert((err as Error).message);
    }
  }

  async addUtterance(routeId: number) {
    const utterance = prompt('Enter new utterance:');
    if (!utterance) return;

    try {
      const res = await fetch(`/api/route/${routeId}/utterance`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ utterance })
      });

      if (!res.ok) throw new Error('Failed to add utterance');

      const newUtt = await res.json();
      this.routes = this.routes.map(r => 
        r.id === routeId 
          ? { ...r, utterances: [...r.utterances, newUtt] } 
          : r
      );
    } catch (err) {
      alert((err as Error).message);
    }
  }

  async deleteUtterance(routeId: number, uttId: number) {
    try {
      const res = await fetch(`/api/route/${routeId}/utterance/${uttId}`, {
        method: 'DELETE'
      });

      if (!res.ok) throw new Error('Failed to delete utterance');

      this.routes = this.routes.map(r => 
        r.id === routeId 
          ? { ...r, utterances: r.utterances.filter(u => u.id !== uttId) } 
          : r
      );
    } catch (err) {
      alert((err as Error).message);
    }
  }

  async updateUtterance(routeId: number, uttId: number, utterance: string) {
    try {
      const res = await fetch(`/api/route/${routeId}/utterance/${uttId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ utterance })
      });

      if (!res.ok) throw new Error('Failed to update utterance');

      const updated = await res.json();
      this.routes = this.routes.map(r => 
        r.id === routeId 
          ? { ...r, utterances: r.utterances.map(u => u.id === uttId ? updated : u) } 
          : r
      );
    } catch (err) {
      alert((err as Error).message);
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
          <h2>Routes</h2>
          <button class="btn btn-ghost btn-icon" @click="${() => this.showAddRouteModal = true}" title="Add Route">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <line x1="12" y1="5" x2="12" y2="19"></line>
              <line x1="5" y1="12" x2="19" y2="12"></line>
            </svg>
          </button>
        </div>
        <div class="route-list">
          ${this.routes.map(route => html`
            <div 
              class="route-item ${this.selectedRouteId === route.id ? 'selected' : ''}"
              @click="${() => this.selectedRouteId = route.id}"
            >
              <div class="route-name">${route.name}</div>
              <div class="badge ${route.enabled ? 'badge-enabled' : 'badge-disabled'}">
                ${route.enabled ? 'On' : 'Off'}
              </div>
            </div>
          `)}
        </div>
      </div>

      <div class="main-content">
        ${selectedRoute ? html`
          <div class="detail-header">
            <div>
              <h1 style="margin:0; font-size: 1.5rem;">${selectedRoute.name}</h1>
              <span style="font-size: 0.875rem; color: var(--text-secondary)">Route ID: ${selectedRoute.id}</span>
            </div>
            <button class="btn btn-danger" @click="${() => this.deleteRoute(selectedRoute.id)}">
              Delete Route
            </button>
          </div>

          <div class="detail-body">
            <div class="section">
              <h3>General Configuration</h3>
              <div class="form-group">
                <label>Route Name</label>
                <input 
                  type="text" 
                  .value="${selectedRoute.name}" 
                  @change="${(e: any) => this.updateRouteConfig({ name: e.target.value })}"
                >
              </div>
              <div class="form-group">
                <label>Assigned LLM</label>
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
              </div>
              <div class="form-group">
                <label style="display: flex; align-items: center; gap: 0.5rem; cursor: pointer;">
                  <input 
                    type="checkbox" 
                    ?checked="${selectedRoute.enabled}"
                    @change="${(e: any) => this.updateRouteConfig({ enabled: e.target.checked })}"
                  >
                  Enabled
                </label>
              </div>
            </div>

            <div class="section">
              <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem;">
                <h3 style="margin:0">Utterances</h3>
                <button class="btn btn-primary btn-ghost" @click="${() => this.addUtterance(selectedRoute.id)}">
                  + Add Utterance
                </button>
              </div>
              <div class="utterance-list">
                ${selectedRoute.utterances.map(utt => html`
                  <div class="utterance-item">
                    <input 
                      type="text" 
                      class="utterance-input"
                      .value="${utt.utterance}"
                      @change="${(e: any) => this.updateUtterance(selectedRoute.id, utt.id, e.target.value)}"
                    >
                    <button class="btn btn-ghost btn-icon btn-danger" @click="${() => this.deleteUtterance(selectedRoute.id, utt.id)}">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M3 6h18"></path>
                        <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                      </svg>
                    </button>
                  </div>
                `)}
                ${selectedRoute.utterances.length === 0 ? html`
                  <div style="text-align: center; padding: 2rem; color: var(--text-secondary); background: rgba(255,255,255,0.02); border-radius: 8px;">
                    No utterances defined for this route.
                  </div>
                ` : ''}
              </div>
            </div>
          </div>
        ` : html`
          <div class="empty-state">
            <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1" style="margin-bottom: 1rem; opacity: 0.5;">
              <path d="M9 17l6-5-6-5"></path>
              <circle cx="12" cy="12" r="10"></circle>
            </svg>
            <h2>No Route Selected</h2>
            <p>Select a route from the sidebar or create a new one.</p>
            <button class="btn btn-primary" @click="${() => this.showAddRouteModal = true}" style="margin-top: 1rem;">
              Create First Route
            </button>
          </div>
        `}
      </div>

      ${this.showAddRouteModal ? html`
        <div class="modal-overlay" @click="${() => this.showAddRouteModal = false}">
          <div class="modal" @click="${(e: Event) => e.stopPropagation()}">
            <h2>Add New Route</h2>
            <div class="form-group">
              <label>Route Name</label>
              <input 
                type="text" 
                placeholder="e.g. Greeting, Technical Support"
                .value="${this.newRouteName}"
                @input="${(e: any) => this.newRouteName = e.target.value}"
              >
            </div>
            <div class="form-group">
              <label>Assign LLM</label>
              <select 
                @change="${(e: any) => this.newRouteLlmId = parseInt(e.target.value)}"
              >
                <option value="" disabled ?selected="${this.newRouteLlmId === null}">Select an LLM</option>
                ${this.llms.map(llm => html`
                  <option value="${llm.id}">${llm.name}</option>
                `)}
              </select>
            </div>
            <div class="modal-actions">
              <button class="btn btn-ghost" @click="${() => this.showAddRouteModal = false}">Cancel</button>
              <button 
                class="btn btn-primary" 
                ?disabled="${!this.newRouteName || this.newRouteLlmId === null}"
                @click="${this.addRoute}"
              >
                Create Route
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
    'route-manager': RouteManager;
  }
}
