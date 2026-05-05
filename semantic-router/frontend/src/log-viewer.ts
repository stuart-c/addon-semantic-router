import { LitElement, html, css } from 'lit';
import { customElement, state } from 'lit/decorators.js';

interface LogEntry {
  id: number;
  timestamp: string;
  route: string;
  prompt: string;
  response: string;
  llm: string;
}

@customElement('log-viewer')
export class LogViewer extends LitElement {
  @state() private logs: LogEntry[] = [];
  @state() private selectedLog: LogEntry | null = null;
  @state() private loading = true;

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

    .log-grid {
      flex: 1;
      display: flex;
      flex-direction: column;
      border-right: 1px solid var(--border-color);
      background: rgba(255, 255, 255, 0.01);
    }

    .grid-header {
      display: grid;
      grid-template-columns: 180px 140px 140px 1fr;
      padding: 1rem 1.5rem;
      background: rgba(0, 0, 0, 0.2);
      border-bottom: 1px solid var(--border-color);
      font-size: 0.75rem;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.1em;
      color: var(--text-secondary);
    }

    .grid-body {
      flex: 1;
      overflow-y: auto;
    }

    .log-row {
      display: grid;
      grid-template-columns: 180px 140px 140px 1fr;
      padding: 0.875rem 1.5rem;
      border-bottom: 1px solid rgba(255, 255, 255, 0.03);
      cursor: pointer;
      transition: all var(--transition-speed);
      font-size: 0.875rem;
    }

    .log-row:hover {
      background: var(--surface-hover);
    }

    .log-row.selected {
      background: var(--primary-light);
      color: var(--primary-color);
    }

    .timestamp { font-family: 'JetBrains Mono', monospace; font-size: 0.75rem; opacity: 0.8; }
    .route-name { font-weight: 600; }
    .llm-name { color: var(--text-secondary); }
    .prompt-preview { 
      color: var(--text-muted);
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .detail-view {
      width: 500px;
      display: flex;
      flex-direction: column;
      background: var(--bg-color);
      box-shadow: -10px 0 30px rgba(0,0,0,0.3);
      z-index: 10;
    }

    .detail-header {
      padding: 1.5rem;
      border-bottom: 1px solid var(--border-color);
      background: var(--surface-color);
    }

    .detail-header h2 {
      margin: 0;
      font-size: 1.25rem;
      font-weight: 700;
    }

    .detail-content {
      padding: 1.5rem;
      flex: 1;
      overflow-y: auto;
      display: flex;
      flex-direction: column;
      gap: 2rem;
    }

    .detail-section h3 {
      font-size: 0.75rem;
      text-transform: uppercase;
      letter-spacing: 0.1em;
      color: var(--text-secondary);
      margin-top: 0;
      margin-bottom: 1rem;
      display: flex;
      align-items: center;
      gap: 0.5rem;
    }

    .detail-section h3 svg {
      color: var(--primary-color);
    }

    .bubble {
      background: var(--surface-color);
      padding: 1.25rem;
      border-radius: 12px;
      border: 1px solid var(--border-color);
      font-size: 0.9375rem;
      line-height: 1.6;
      font-family: 'Inter', sans-serif;
    }

    pre {
      margin: 0;
      white-space: pre-wrap;
      font-family: 'JetBrains Mono', monospace;
      font-size: 0.875rem;
    }

    .empty-detail {
      flex: 1;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      color: var(--text-muted);
      text-align: center;
      padding: 3rem;
    }

    .badge {
      padding: 4px 10px;
      border-radius: 6px;
      font-size: 0.75rem;
      font-weight: 700;
      background: var(--primary-light);
      color: var(--primary-color);
    }
  `;

  connectedCallback() {
    super.connectedCallback();
    this.fetchLogs();
  }

  async fetchLogs() {
    this.loading = true;
    try {
      const res = await fetch('/api/log');
      if (!res.ok) throw new Error('Failed to fetch logs');
      this.logs = await res.json();
      this.logs.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    } catch (err) {
      console.error(err);
    } finally {
      this.loading = false;
    }
  }

  private _formatDate(isoString: string) {
    const d = new Date(isoString);
    return d.toLocaleString('en-US', { 
      month: 'short', 
      day: 'numeric', 
      hour: '2-digit', 
      minute: '2-digit',
      second: '2-digit',
      hour12: false 
    });
  }

  render() {
    return html`
      <div class="log-grid">
        <div class="grid-header">
          <div>Timestamp</div>
          <div>Route</div>
          <div>LLM</div>
          <div>Prompt Preview</div>
        </div>
        <div class="grid-body">
          ${this.logs.map(log => html`
            <div 
              class="log-row ${this.selectedLog?.id === log.id ? 'selected' : ''}"
              @click="${() => this.selectedLog = log}"
            >
              <div class="timestamp">${this._formatDate(log.timestamp)}</div>
              <div class="route-name">${log.route}</div>
              <div class="llm-name">${log.llm}</div>
              <div class="prompt-preview">${log.prompt}</div>
            </div>
          `)}
          ${this.logs.length === 0 && !this.loading ? html`
            <div style="padding: 4rem; text-align: center; color: var(--text-muted);">
              No activity logs found.
            </div>
          ` : ''}
        </div>
      </div>

      <div class="detail-view">
        ${this.selectedLog ? html`
          <div class="detail-header">
            <h2>Request Trace</h2>
            <div style="margin-top: 0.5rem; font-size: 0.75rem; color: var(--text-muted);">
              Log ID: ${this.selectedLog.id} • ${this._formatDate(this.selectedLog.timestamp)}
            </div>
          </div>
          <div class="detail-content">
            <div class="detail-section">
              <h3>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path></svg>
                User Prompt
              </h3>
              <div class="bubble">${this.selectedLog.prompt}</div>
            </div>
            
            <div class="detail-section">
              <h3>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="9 11 12 14 22 4"></polyline><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"></path></svg>
                Routing Decision
              </h3>
              <div style="display: flex; gap: 1rem;">
                <div class="badge">Route: ${this.selectedLog.route}</div>
                <div class="badge" style="background: rgba(255,255,255,0.05); color: var(--text-secondary);">Provider: ${this.selectedLog.llm}</div>
              </div>
            </div>

            <div class="detail-section">
              <h3>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><rect x="2" y="3" width="20" height="14" rx="2" ry="2"></rect><line x1="8" y1="21" x2="16" y2="21"></line><line x1="12" y1="17" x2="12" y2="21"></line></svg>
                LLM Response
              </h3>
              <div class="bubble" style="background: rgba(0,0,0,0.3)">
                <pre>${this.selectedLog.response}</pre>
              </div>
            </div>
          </div>
        ` : html`
          <div class="empty-detail">
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1" style="margin-bottom: 1.5rem; opacity: 0.2">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
              <polyline points="14 2 14 8 20 8"></polyline>
              <line x1="16" y1="13" x2="8" y2="13"></line>
              <line x1="16" y1="17" x2="8" y2="17"></line>
              <polyline points="10 9 9 9 8 9"></polyline>
            </svg>
            <p>Select a log entry from the list to view the full execution trace.</p>
          </div>
        `}
      </div>
    `;
  }
}
