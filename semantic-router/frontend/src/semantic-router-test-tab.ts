import { LitElement, html, css } from 'lit';
import { customElement, state } from 'lit/decorators.js';

@customElement('semantic-router-test-tab')
export class SemanticRouterTestTab extends LitElement {
  @state() private prompt = '';
  @state() private response: any = null;
  @state() private loading = false;
  @state() private error = '';

  static styles = css`
    :host {
      display: block;
      padding: 2.5rem;
      animation: fadeIn 0.4s ease-out;
      color: var(--text-color);
      max-width: 900px;
      margin: 0 auto;
    }

    @keyframes fadeIn {
      from { opacity: 0; transform: translateY(10px); }
      to { opacity: 1; transform: translateY(0); }
    }

    .test-container {
      display: flex;
      flex-direction: column;
      gap: 2rem;
    }

    .input-group {
      display: flex;
      flex-direction: column;
      gap: 0.75rem;
    }

    label {
      font-weight: 700;
      color: var(--text-secondary);
      font-size: 0.75rem;
      text-transform: uppercase;
      letter-spacing: 0.1em;
    }

    textarea {
      width: 100%;
      min-height: 160px;
      padding: 1.25rem;
      background-color: rgba(0, 0, 0, 0.2);
      border: 1px solid var(--border-color);
      border-radius: var(--border-radius);
      color: var(--text-color);
      font-family: inherit;
      font-size: 1rem;
      resize: vertical;
      transition: all var(--transition-speed);
      box-shadow: inset 0 2px 4px 0 rgb(0 0 0 / 0.05);
    }

    textarea:focus {
      outline: none;
      border-color: var(--primary-color);
      background-color: rgba(0, 0, 0, 0.3);
      box-shadow: 0 0 0 3px var(--primary-light);
    }

    .actions {
      display: flex;
      justify-content: flex-end;
    }

    .btn-submit {
      padding: 1rem 3rem;
      background: var(--primary-color);
      color: white;
      border: none;
      border-radius: 99px;
      font-weight: 700;
      font-size: 1rem;
      cursor: pointer;
      transition: all var(--transition-speed);
      display: flex;
      align-items: center;
      gap: 0.75rem;
      box-shadow: var(--shadow-md);
    }

    .btn-submit:hover:not(:disabled) {
      background: var(--primary-hover);
      transform: translateY(-2px);
      box-shadow: var(--shadow-lg);
    }

    .btn-submit:active:not(:disabled) {
      transform: translateY(0);
    }

    .btn-submit:disabled {
      opacity: 0.5;
      cursor: not-allowed;
      filter: grayscale(1);
    }

    .result-section {
      margin-top: 1rem;
      background: var(--surface-color);
      border-radius: var(--border-radius);
      border: 1px solid var(--border-color);
      overflow: hidden;
      box-shadow: var(--shadow-lg);
    }

    .result-header {
      padding: 1rem 1.5rem;
      background: rgba(255, 255, 255, 0.03);
      border-bottom: 1px solid var(--border-color);
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    .result-title {
      font-weight: 700;
      font-size: 0.8125rem;
      color: var(--text-secondary);
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }

    .route-badge {
      padding: 4px 12px;
      background: var(--primary-light);
      color: var(--primary-color);
      border-radius: 99px;
      font-size: 0.75rem;
      font-weight: 700;
      border: 1px solid rgba(99, 102, 241, 0.2);
    }

    .result-content {
      padding: 1.5rem;
    }

    pre {
      margin: 0;
      white-space: pre-wrap;
      word-break: break-word;
      font-family: 'JetBrains Mono', monospace;
      font-size: 0.9375rem;
      line-height: 1.6;
      color: #e2e8f0;
    }

    .error-box {
      background: rgba(239, 68, 68, 0.1);
      border: 1px solid rgba(239, 68, 68, 0.2);
      color: #f87171;
      padding: 1.25rem;
      border-radius: var(--border-radius);
      display: flex;
      align-items: center;
      gap: 1rem;
      font-weight: 500;
    }

    .spinner {
      width: 20px;
      height: 20px;
      border: 3px solid rgba(255, 255, 255, 0.3);
      border-top-color: white;
      border-radius: 50%;
      animation: spin 0.8s linear infinite;
    }

    @keyframes spin {
      to { transform: rotate(360deg); }
    }
  `;

  render() {
    return html`
      <div class="test-container">
        <div class="input-group">
          <label for="prompt">Interactive Router Tester</label>
          <textarea
            id="prompt"
            placeholder="Type a natural language request to see how the router classifies it..."
            .value="${this.prompt}"
            @input="${(e: any) => this.prompt = e.target.value}"
            ?disabled="${this.loading}"
          ></textarea>
        </div>

        <div class="actions">
          <button class="btn-submit" @click="${this._handleTest}" ?disabled="${this.loading || !this.prompt.trim()}">
            ${this.loading ? html`<div class="spinner"></div>` : html`
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                <polygon points="5 3 19 12 5 21 5 3"></polygon>
              </svg>
            `}
            <span>${this.loading ? 'Processing...' : 'Run Router Inference'}</span>
          </button>
        </div>

        ${this.error ? html`
          <div class="error-box">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
              <circle cx="12" cy="12" r="10"></circle>
              <line x1="12" y1="8" x2="12" y2="12"></line>
              <line x1="12" y1="16" x2="12.01" y2="16"></line>
            </svg>
            ${this.error}
          </div>
        ` : ''}

        ${this.response ? html`
          <div class="result-section">
            <div class="result-header">
              <span class="result-title">Inference Result</span>
              <div style="display: flex; gap: 0.75rem">
                <span class="route-badge">Route: ${this.response.route || 'N/A'}</span>
                <span class="route-badge" style="background: rgba(255,255,255,0.05); color: var(--text-secondary); border: 1px solid var(--border-color)">
                  LLM: ${this.response.llm || 'N/A'}
                </span>
              </div>
            </div>
            <div class="result-content">
              <pre>${this.response.choices?.[0]?.message?.content || JSON.stringify(this.response, null, 2)}</pre>
            </div>
          </div>
        ` : ''}
      </div>
    `;
  }

  private async _handleTest() {
    if (!this.prompt.trim()) return;

    this.loading = true;
    this.error = '';
    this.response = null;

    try {
      const res = await fetch('/query', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: 'default',
          messages: [{ role: 'user', content: this.prompt }]
        })
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.detail || `Server returned error ${res.status}`);
      }

      this.response = await res.json();
    } catch (e: any) {
      this.error = e.message || 'Connection to inference engine failed';
    } finally {
      this.loading = false;
    }
  }
}
