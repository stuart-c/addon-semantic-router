import { LitElement, html, css } from 'lit';
import { customElement, state } from 'lit/decorators.js';
import { sharedStyles } from './shared-styles';

@customElement('semantic-router-test-tab')
export class SemanticRouterTestTab extends LitElement {
  @state()
  private prompt = '';

  @state()
  private response: any = null;

  @state()
  private loading = false;

  @state()
  private error = '';

  static styles = [
    sharedStyles,
    css`
      :host {
        display: block;
        animation: fadeIn 0.4s ease-out;
      }

      .test-container {
        display: flex;
        flex-direction: column;
        gap: 1.5rem;
      }

      .input-section {
        display: flex;
        flex-direction: column;
        gap: 0.75rem;
      }

      textarea {
        min-height: 120px;
        resize: vertical;
      }

      .actions {
        display: flex;
        justify-content: flex-end;
      }

      button {
        padding: 0.75rem 2rem;
        background-color: var(--primary-color);
        color: white;
        border: none;
        border-radius: var(--border-radius);
        font-weight: 600;
        cursor: pointer;
        transition: all var(--transition-speed);
        display: flex;
        align-items: center;
        gap: 0.5rem;
      }

      button:hover:not(:disabled) {
        background-color: var(--primary-hover);
        transform: translateY(-1px);
        box-shadow: 0 4px 12px rgba(100, 108, 255, 0.3);
      }

      button:active:not(:disabled) {
        transform: translateY(0);
      }

      button:disabled {
        opacity: 0.6;
        cursor: not-allowed;
      }

      .response-section {
        margin-top: 1rem;
        padding: 1.5rem;
        background-color: rgba(0, 0, 0, 0.2);
        border-radius: var(--border-radius);
        border: 1px solid rgba(255, 255, 255, 0.05);
      }

      .response-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 1rem;
        padding-bottom: 0.75rem;
        border-bottom: 1px solid rgba(255, 255, 255, 0.1);
      }

      .response-title {
        font-weight: 600;
        color: var(--primary-color);
      }

      .metadata {
        display: flex;
        gap: 1rem;
        font-size: 0.8rem;
      }

      pre {
        margin: 0;
        white-space: pre-wrap;
        word-break: break-word;
        font-family: 'Fira Code', monospace;
        font-size: 0.9rem;
        line-height: 1.5;
        color: var(--text-secondary);
      }

      .error {
        color: #ff4d4d;
        background-color: rgba(255, 77, 77, 0.1);
        padding: 1rem;
        border-radius: var(--border-radius);
        border: 1px solid rgba(255, 77, 77, 0.2);
        margin-top: 1rem;
      }

      .loader {
        width: 18px;
        height: 18px;
        border: 2px solid #fff;
        border-bottom-color: transparent;
        border-radius: 50%;
        display: inline-block;
        box-sizing: border-box;
        animation: rotation 1s linear infinite;
      }

      @keyframes rotation {
        0% { transform: rotate(0deg); }
        100% { transform: rotate(360deg); }
      }
    `
  ];

  render() {
    return html`
      <div class="test-container">
        <div class="input-section">
          <label for="prompt">Test Prompt</label>
          <textarea
            id="prompt"
            placeholder="Enter a prompt to test routing..."
            .value="${this.prompt}"
            @input="${(e: any) => this.prompt = e.target.value}"
            ?disabled="${this.loading}"
          ></textarea>
        </div>

        <div class="actions">
          <button @click="${this._handleTest}" ?disabled="${this.loading || !this.prompt.trim()}">
            ${this.loading ? html`<span class="loader"></span> Testing...` : 'Run Test'}
          </button>
        </div>

        ${this.error ? html`<div class="error">${this.error}</div>` : ''}

        ${this.response ? html`
          <div class="response-section">
            <div class="response-header">
              <span class="response-title">API Response</span>
              <div class="metadata">
                <span class="badge">Route: ${this.response.route || 'N/A'}</span>
                <span class="badge">LLM: ${this.response.llm || 'N/A'}</span>
              </div>
            </div>
            <pre>${this.response.choices?.[0]?.message?.content || JSON.stringify(this.response, null, 2)}</pre>
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
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'default',
          messages: [
            {
              role: 'user',
              content: this.prompt,
            },
          ],
        }),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.detail || `HTTP error! status: ${res.status}`);
      }

      this.response = await res.json();
    } catch (e: any) {
      this.error = e.message || 'An unexpected error occurred';
    } finally {
      this.loading = false;
    }
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'semantic-router-test-tab': SemanticRouterTestTab;
  }
}
