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

    .route-list {
      flex: 1;
      overflow-y: auto;
      padding: 0.5rem;
    }

    .route-item {
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

    .route-item:hover {
      background: var(--surface-hover);
    }

    .route-item.selected {
      background: var(--primary-light);
      border-color: rgba(99, 102, 241, 0.3);
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
      background: rgba(15, 23, 42, 0.5);
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

    input[type="text"], select {
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

    .utterance-list {
      display: flex;
      flex-direction: column;
      gap: 0.75rem;
    }

    .utterance-item {
      display: flex;
      gap: 0.5rem;
      align-items: center;
      background: rgba(0, 0, 0, 0.2);
      padding: 0.5rem 1rem;
      border-radius: 8px;
      border: 1px solid var(--border-color);
      transition: all var(--transition-speed);
    }

    .utterance-item:focus-within {
      border-color: var(--primary-color);
      background: rgba(0, 0, 0, 0.3);
    }

    .utterance-input {
      flex: 1;
      background: transparent !important;
      border: none !important;
      padding: 0.25rem !important;
      color: white;
      font-size: 0.9rem;
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
      console.error(err);
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
      return html`
        <div class="empty-state">
          <div class="loader"></div>
          <p style="margin-top: 1rem">Loading routes...</p>
        </div>
      `;
    }

    const selectedRoute = this.routes.find(r => r.id === this.selectedRouteId);

    return html`
      <div class="sidebar">
        <div class="sidebar-header">
          <h2>Routes</h2>
          <button class="btn btn-ghost" @click="${() => this.showAddRouteModal = true}" title="Add Route">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
              <line x1="12" y1="5" x2="12" y2="19"></line>
              <line x1="5" y1="12" x2="19" y2="12"></line>
            </svg>
            <span>Add Route</span>
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
              <h1 style="margin:0; font-size: 1.5rem; font-weight: 600;">${selectedRoute.name}</h1>
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
                <label>Assigned LLM Provider</label>
                <select 
                  .value="${selectedRoute.llm.toString()}"
                  @change="${(e: any) => this.updateRouteConfig({ llm: parseInt(e.target.value) })}"
                >
                  ${this.llms.map(llm => html`
                    <option value="${llm.id}" ?selected="${llm.id === selectedRoute.llm}">
                      ${llm.name} (${llm.model || 'Default Model'})
                    </option>
                  `)}
                  ${this.llms.length === 0 ? html`<option value="" disabled>No LLMs configured</option>` : ''}
                </select>
              </div>
              <div class="form-group" style="margin-bottom: 0">
                <label style="display: flex; align-items: center; gap: 0.75rem; cursor: pointer; user-select: none;">
                  <input 
                    type="checkbox" 
                    style="width: auto"
                    ?checked="${selectedRoute.enabled}"
                    @change="${(e: any) => this.updateRouteConfig({ enabled: e.target.checked })}"
                  >
                  <span>Route Enabled</span>
                </label>
              </div>
            </div>

            <div class="section">
              <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.5rem;">
                <h3 style="margin:0">Training Utterances</h3>
                <button class="btn btn-primary" @click="${() => this.addUtterance(selectedRoute.id)}">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                    <line x1="12" y1="5" x2="12" y2="19"></line>
                    <line x1="5" y1="12" x2="19" y2="12"></line>
                  </svg>
                  <span>Add Utterance</span>
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
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                        <path d="M3 6h18"></path>
                        <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                      </svg>
                    </button>
                  </div>
                `)}
                ${selectedRoute.utterances.length === 0 ? html`
                  <div style="text-align: center; padding: 3rem; color: var(--text-muted); background: rgba(0,0,0,0.1); border-radius: 12px; border: 1px dashed var(--border-color);">
                    <p style="margin:0">No utterances defined for this route.</p>
                    <p style="font-size: 0.8125rem; margin-top: 0.5rem;">Utterances are used to train the router to recognize this intent.</p>
                  </div>
                ` : ''}
              </div>
            </div>
          </div>
        ` : html`
          <div class="empty-state">
            <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1" style="margin-bottom: 1.5rem; opacity: 0.2; color: var(--primary-color)">
              <path d="M9 17l6-5-6-5"></path>
              <circle cx="12" cy="12" r="10"></circle>
            </svg>
            <h2>No Route Selected</h2>
            <p>Select a route from the sidebar or create a new one to get started.</p>
            <button class="btn btn-primary" @click="${() => this.showAddRouteModal = true}" style="margin-top: 1.5rem;">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                <line x1="12" y1="5" x2="12" y2="19"></line>
                <line x1="5" y1="12" x2="19" y2="12"></line>
              </svg>
              Create First Route
            </button>
          </div>
        `}
      </div>

      ${this.showAddRouteModal ? html`
        <div class="modal-overlay" @click="${() => this.showAddRouteModal = false}">
          <div class="modal" @click="${(e: Event) => e.stopPropagation()}">
            <h2>New Route</h2>
            <div class="form-group">
              <label>Route Name</label>
              <input 
                type="text" 
                placeholder="e.g. Technical Support, Sales"
                .value="${this.newRouteName}"
                @input="${(e: any) => this.newRouteName = e.target.value}"
              >
            </div>
            <div class="form-group">
              <label>LLM Provider</label>
              <select 
                @change="${(e: any) => this.newRouteLlmId = parseInt(e.target.value)}"
              >
                <option value="" disabled ?selected="${this.newRouteLlmId === null}">Choose a provider...</option>
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
