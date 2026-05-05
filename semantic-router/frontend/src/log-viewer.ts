import { LitElement, html, css } from 'lit';
import { customElement, state } from 'lit/decorators.js';
import './components/sr-badge';
import './components/sr-button';

interface LogEntry {
  id: string;
  timestamp: string;
  duration: number;
  route?: number;
  query: string;
  request: string;
  response: string;
  failure_reason?: string;
  llm?: number;
  original_id?: string;
}

@customElement('log-viewer')
export class LogViewer extends LitElement {
  @state() private logs: LogEntry[] = [];
  @state() private filteredLogs: LogEntry[] = [];
  @state() private selectedLogId: string | null = null;
  @state() private filterText = '';
  @state() private sortColumn: keyof LogEntry = 'timestamp';
  @state() private sortDirection: 'asc' | 'desc' = 'desc';
  @state() private loading = true;

  // UI State
  @state() private splitHeight = 300; // Height of bottom area
  @state() private columnWidths: Record<string, number> = {
    timestamp: 180,
    route: 100,
    query: 300,
    response: 300,
    duration: 100
  };

  private pollInterval?: number;
  private isResizingSplit = false;
  private isResizingColumn = false;
  private currentResizingColumn: string | null = null;
  private startX = 0;
  private startY = 0;
  private startWidth = 0;
  private startHeight = 0;

  static styles = css`
    :host {
      display: flex;
      flex-direction: column;
      height: 100%;
      width: 100%;
      overflow: hidden;
      color: var(--text-color);
    }

    .toolbar {
      padding: 0.75rem 1rem;
      background-color: var(--surface-color);
      border-bottom: 1px solid rgba(255, 255, 255, 0.1);
      display: flex;
      gap: 1rem;
      align-items: center;
    }

    .search-input {
      background: rgba(255, 255, 255, 0.05);
      border: 1px solid rgba(255, 255, 255, 0.1);
      border-radius: 4px;
      padding: 0.5rem 0.75rem;
      color: white;
      font-size: 0.875rem;
      width: 300px;
      outline: none;
      transition: border-color 0.2s;
    }

    .search-input:focus {
      border-color: var(--primary-color);
    }

    .main-container {
      flex: 1;
      display: flex;
      flex-direction: column;
      overflow: hidden;
      position: relative;
    }

    .grid-container {
      flex: 1;
      overflow: auto;
      background: #1e1e1e;
    }

    table {
      width: 100%;
      border-collapse: separate;
      border-spacing: 0;
      table-layout: fixed;
    }

    th {
      position: sticky;
      top: 0;
      background: #2d2d2d;
      padding: 0.75rem;
      text-align: left;
      font-size: 0.75rem;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      color: var(--text-secondary);
      border-bottom: 1px solid rgba(255, 255, 255, 0.1);
      z-index: 10;
      user-select: none;
    }

    th.sortable {
      cursor: pointer;
    }

    th.sortable:hover {
      background: #363636;
      color: white;
    }

    .resizer {
      position: absolute;
      right: 0;
      top: 0;
      width: 4px;
      height: 100%;
      cursor: col-resize;
      z-index: 11;
    }

    .resizer:hover, .resizer.active {
      background: var(--primary-color);
    }

    td {
      padding: 0.6rem 0.75rem;
      font-size: 0.875rem;
      border-bottom: 1px solid rgba(255, 255, 255, 0.05);
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
      color: var(--text-secondary);
    }

    tr:hover td {
      background: rgba(255, 255, 255, 0.02);
      color: white;
    }

    tr.selected td {
      background: rgba(100, 108, 255, 0.1);
      color: white;
      border-left: 2px solid var(--primary-color);
    }

    .split-divider {
      height: 4px;
      background: #2d2d2d;
      cursor: row-resize;
      transition: background 0.2s;
      z-index: 20;
    }

    .split-divider:hover, .split-divider.active {
      background: var(--primary-color);
    }

    .detail-view {
      background: #1a1a1a;
      overflow: auto;
      border-top: 1px solid rgba(255, 255, 255, 0.1);
    }

    .detail-content {
      padding: 1.5rem;
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
      gap: 1.5rem;
    }

    .detail-card {
      background: rgba(255, 255, 255, 0.03);
      border-radius: 8px;
      padding: 1rem;
      border: 1px solid rgba(255, 255, 255, 0.05);
    }

    .detail-card h3 {
      margin-top: 0;
      margin-bottom: 0.75rem;
      font-size: 0.875rem;
      color: var(--text-secondary);
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }

    .detail-card pre {
      margin: 0;
      white-space: pre-wrap;
      word-break: break-all;
      font-family: 'JetBrains Mono', monospace;
      font-size: 0.8125rem;
      color: #e0e0e0;
      background: #000;
      padding: 0.75rem;
      border-radius: 4px;
    }

    .split-divider.active {
      background: var(--primary-color);
    }

    .detail-view {
      background: #1a1a1a;
      overflow: auto;
      border-top: 1px solid rgba(255, 255, 255, 0.1);
    }

    .detail-content {
      padding: 1.5rem;
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
      gap: 1.5rem;
    }

    .detail-card {
      background: rgba(255, 255, 255, 0.03);
      border-radius: 8px;
      padding: 1rem;
      border: 1px solid rgba(255, 255, 255, 0.05);
    }

    .detail-card h3 {
      margin-top: 0;
      margin-bottom: 0.75rem;
      font-size: 0.875rem;
      color: var(--text-secondary);
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }

    .detail-card pre {
      margin: 0;
      white-space: pre-wrap;
      word-break: break-all;
      font-family: 'JetBrains Mono', monospace;
      font-size: 0.8125rem;
      color: #e0e0e0;
      background: #000;
      padding: 0.75rem;
      border-radius: 4px;
    }
  `;

  connectedCallback() {
    super.connectedCallback();
    this.fetchLogs();
    this.pollInterval = setInterval(() => this.fetchLogs(true), 5000);
    window.addEventListener('mousemove', this.handleGlobalMouseMove);
    window.addEventListener('mouseup', this.handleGlobalMouseUp);
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    if (this.pollInterval) clearInterval(this.pollInterval);
    window.removeEventListener('mousemove', this.handleGlobalMouseMove);
    window.removeEventListener('mouseup', this.handleGlobalMouseUp);
  }

  async fetchLogs(isSilent = false) {
    if (!isSilent) this.loading = true;
    try {
      const response = await fetch('api/log');
      if (!response.ok) throw new Error('Failed to fetch logs');
      const data = await response.json();
      this.logs = data;
      this.applyFilters();
    } catch (err) {
      console.error('Failed to fetch logs:', err);
    } finally {
      if (!isSilent) this.loading = false;
    }
  }

  private applyFilters() {
    let result = [...this.logs];

    if (this.filterText) {
      const search = this.filterText.toLowerCase();
      result = result.filter(log => 
        log.query?.toLowerCase().includes(search) || 
        log.response?.toLowerCase().includes(search) ||
        log.id.toLowerCase().includes(search)
      );
    }

    result.sort((a, b) => {
      const valA = a[this.sortColumn] ?? '';
      const valB = b[this.sortColumn] ?? '';
      
      if (valA < valB) return this.sortDirection === 'asc' ? -1 : 1;
      if (valA > valB) return this.sortDirection === 'asc' ? 1 : -1;
      return 0;
    });

    this.filteredLogs = result;
  }

  private handleSort(column: keyof LogEntry) {
    if (this.sortColumn === column) {
      this.sortDirection = this.sortDirection === 'asc' ? 'desc' : 'asc';
    } else {
      this.sortColumn = column;
      this.sortDirection = 'desc';
    }
    this.applyFilters();
  }

  private handleFilter(e: Event) {
    this.filterText = (e.target as HTMLInputElement).value;
    this.applyFilters();
  }

  // Resizing Logic
  private handleColumnResizeStart(e: MouseEvent, column: string) {
    e.stopPropagation();
    this.isResizingColumn = true;
    this.currentResizingColumn = column;
    this.startX = e.pageX;
    this.startWidth = this.columnWidths[column];
    document.body.style.cursor = 'col-resize';
  }

  private handleSplitResizeStart(e: MouseEvent) {
    e.stopPropagation();
    this.isResizingSplit = true;
    this.startY = e.pageY;
    this.startHeight = this.splitHeight;
    document.body.style.cursor = 'row-resize';
  }

  private handleGlobalMouseMove = (e: MouseEvent) => {
    if (this.isResizingColumn && this.currentResizingColumn) {
      const delta = e.pageX - this.startX;
      this.columnWidths = {
        ...this.columnWidths,
        [this.currentResizingColumn]: Math.max(50, this.startWidth + delta)
      };
    } else if (this.isResizingSplit) {
      const delta = this.startY - e.pageY; // Drag up increases bottom height
      this.splitHeight = Math.max(100, Math.min(window.innerHeight - 200, this.startHeight + delta));
    }
  };

  private handleGlobalMouseUp = () => {
    this.isResizingColumn = false;
    this.isResizingSplit = false;
    this.currentResizingColumn = null;
    document.body.style.cursor = '';
  };

  private selectLog(id: string) {
    this.selectedLogId = id;
  }

  private renderHeader(column: keyof LogEntry, label: string) {
    return html`
      <th 
        class="sortable" 
        style="width: ${this.columnWidths[column as string]}px"
        @click="${() => this.handleSort(column)}"
      >
        ${label} ${this.sortColumn === column ? (this.sortDirection === 'asc' ? '↑' : '↓') : ''}
        <div 
          class="resizer" 
          @mousedown="${(e: MouseEvent) => this.handleColumnResizeStart(e, column as string)}"
        ></div>
      </th>
    `;
  }

  render() {
    const selectedLog = this.logs.find(l => l.id === this.selectedLogId);

    return html`
      <div class="toolbar">
        <input 
          type="text" 
          class="search-input" 
          placeholder="Filter logs..." 
          .value="${this.filterText}"
          @input="${this.handleFilter}"
        >
        ${this.loading ? html`<span style="font-size: 0.75rem; color: var(--text-secondary)">Updating...</span>` : ''}
      </div>

      <div class="main-container">
        <div class="grid-container">
          <table>
            <thead>
              <tr>
                ${this.renderHeader('timestamp', 'Timestamp')}
                ${this.renderHeader('route', 'Route')}
                ${this.renderHeader('query', 'Query')}
                ${this.renderHeader('response', 'Response')}
                ${this.renderHeader('duration', 'Dur (s)')}
              </tr>
            </thead>
            <tbody>
              ${this.filteredLogs.map(log => html`
                <tr 
                  class="${this.selectedLogId === log.id ? 'selected' : ''}"
                  @click="${() => this.selectLog(log.id)}"
                >
                  <td>${new Date(log.timestamp).toLocaleString()}</td>
                  <td>${log.route ?? '-'}</td>
                  <td title="${log.query}">${log.query}</td>
                  <td title="${log.response}">${log.response}</td>
                  <td>${log.duration.toFixed(3)}</td>
                </tr>
              `)}
              ${this.filteredLogs.length === 0 && !this.loading ? html`
                <tr><td colspan="5" style="text-align: center; padding: 2rem;">No logs found</td></tr>
              ` : ''}
            </tbody>
          </table>
        </div>

        <div 
          class="split-divider ${this.isResizingSplit ? 'active' : ''}"
          @mousedown="${this.handleSplitResizeStart}"
        ></div>

        <div class="detail-view" style="height: ${this.splitHeight}px">
          ${selectedLog ? html`
            <div class="detail-content">
              <div class="detail-card" style="grid-column: span 2">
                <h3>Metadata</h3>
                <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 1rem;">
                  <div>
                    <label style="display:block; font-size: 0.75rem; color: var(--text-secondary)">ID</label>
                    <span style="font-family: monospace; font-size: 0.875rem;">${selectedLog.id}</span>
                  </div>
                  <div>
                    <label style="display:block; font-size: 0.75rem; color: var(--text-secondary)">Timestamp</label>
                    <span>${new Date(selectedLog.timestamp).toLocaleString()}</span>
                  </div>
                  <div>
                    <label style="display:block; font-size: 0.75rem; color: var(--text-secondary)">Status</label>
                    <sr-badge variant="${selectedLog.failure_reason ? 'disabled' : 'enabled'}">
                      ${selectedLog.failure_reason ? 'Failed' : 'Success'}
                    </sr-badge>
                  </div>
                </div>
              </div>

              <div class="detail-card">
                <h3>Query</h3>
                <pre>${selectedLog.query}</pre>
              </div>

              <div class="detail-card">
                <h3>Response</h3>
                <pre>${selectedLog.response}</pre>
              </div>

              ${selectedLog.request ? html`
                <div class="detail-card">
                  <h3>Full Request</h3>
                  <pre>${selectedLog.request}</pre>
                </div>
              ` : ''}

              ${selectedLog.failure_reason ? html`
                <div class="detail-card">
                  <h3>Failure Reason</h3>
                  <pre style="color: #ff4757;">${selectedLog.failure_reason}</pre>
                </div>
              ` : ''}
            </div>
          ` : html`
            <div style="display: flex; align-items: center; justify-content: center; height: 100%; color: var(--text-secondary);">
              Select a log entry to view details
            </div>
          `}
        </div>
      </div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'log-viewer': LogViewer;
  }
}
