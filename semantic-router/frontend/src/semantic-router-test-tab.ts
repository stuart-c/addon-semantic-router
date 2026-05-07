import { LitElement, html, css } from 'lit';
import { customElement, state } from 'lit/decorators.js';
import { sharedStyles } from './shared-styles';
import './components/sr-button';
import './components/sr-badge';
import './components/sr-form-group';

@customElement('semantic-router-test-tab')
export class SemanticRouterTestTab extends LitElement {
  @state()
  private prompt = '';

  @state()
  private response: any = null;

  @state()
  private resolution: any = null;

  @state()
  private loading = false;

  @state()
  private error = '';

  @state()
  private stream = false;

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
      gap: 2rem;
      max-width: 800px;
      margin: 0 auto;
      padding: 1rem;
    }

    textarea {
      min-height: 160px;
      resize: vertical;
    }

    .actions {
      display: flex;
      justify-content: flex-end;
    }

    .response-section {
      margin-top: 1rem;
      padding: 2rem;
      background-color: var(--surface-color);
      border-radius: var(--border-radius);
      border: 1px solid var(--border-color);
      box-shadow: var(--shadow-md);
      animation: slideUp 0.4s cubic-bezier(0.16, 1, 0.3, 1);
    }

    .response-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 1.5rem;
      padding-bottom: 1rem;
      border-bottom: 1px solid var(--border-color);
    }

    .response-title {
      font-weight: 700;
      font-size: 0.875rem;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      color: var(--primary-color);
    }

    .metadata {
      display: flex;
      gap: 0.75rem;
    }

    pre {
      margin: 0;
      white-space: pre-wrap;
      word-break: break-word;
      font-family: 'JetBrains Mono', monospace;
      font-size: 0.9375rem;
      line-height: 1.6;
      color: var(--text-color);
      background-color: var(--bg-color);
      padding: 1.25rem;
      border-radius: var(--border-radius-sm);
      border: 1px solid var(--border-color);
    }

    .error {
      color: hsl(0, 84%, 60%);
      background-color: hsla(0, 84%, 60%, 0.1);
      padding: 1rem 1.25rem;
      border-radius: var(--border-radius-sm);
      border: 1px solid hsla(0, 84%, 60%, 0.2);
      margin-top: 1rem;
      font-size: 0.875rem;
      font-weight: 500;
      animation: shake 0.4s cubic-bezier(.36,.07,.19,.97) both;
    }

    .loader {
      width: 16px;
      height: 16px;
      border: 2px solid currentColor;
      border-bottom-color: transparent;
      border-radius: 50%;
      display: inline-block;
      animation: rotation 0.8s linear infinite;
    }

    @keyframes rotation {
      0% { transform: rotate(0deg); }
      100% { transform: rotate(360deg); }
    }

    @keyframes shake {
      10%, 90% { transform: translate3d(-1px, 0, 0); }
      20%, 80% { transform: translate3d(2px, 0, 0); }
      30%, 50%, 70% { transform: translate3d(-4px, 0, 0); }
      40%, 60% { transform: translate3d(4px, 0, 0); }
    }
    `
  ];

  render() {
    return html`
      <div class="test-container">
        <sr-form-group label="Test Prompt" description="Enter a query to see which route it matches and get the LLM response.">
          <textarea
            id="prompt"
            placeholder="Enter a prompt to test routing..."
            .value="${this.prompt}"
            @input="${(e: any) => this.prompt = e.target.value}"
            ?disabled="${this.loading}"
          ></textarea>
          <div style="margin-top: 0.5rem; display: flex; align-items: center; gap: 0.5rem;">
            <input 
              type="checkbox" 
              id="stream-toggle" 
              .checked="${this.stream}" 
              @change="${(e: any) => this.stream = e.target.checked}"
              ?disabled="${this.loading}"
            >
            <label for="stream-toggle" style="font-size: 0.875rem; color: var(--text-muted-color);">Stream response</label>
          </div>
        </sr-form-group>

        <div class="actions" style="gap: 1rem;">
          <sr-button variant="secondary" @click="${this._handleResolve}" ?disabled="${this.loading || !this.prompt.trim()}">
            ${this.loading ? html`<span class="loader"></span> Analyzing...` : 'Analyze Route'}
          </sr-button>
          <sr-button @click="${this._handleTest}" ?disabled="${this.loading || !this.prompt.trim()}">
            ${this.loading ? html`<span class="loader"></span> Testing...` : 'Run Full Test'}
          </sr-button>
        </div>

        ${this.error ? html`<div class="error">${this.error}</div>` : ''}

        ${this.resolution ? html`
          <div class="response-section">
            <div class="response-header">
              <span class="response-title">Semantic Resolution</span>
              <div class="metadata">
                <sr-badge variant="${this.resolution.name ? 'success' : 'warning'}">
                  Match: ${this.resolution.name || 'None'}
                </sr-badge>
                <sr-badge variant="info">
                  Score: ${this.resolution.score?.toFixed(4) || '0.0000'}
                </sr-badge>
              </div>
            </div>
            <p>The prompt was resolved using the current Semantic Router configuration. A match score represents the cosine similarity between the prompt and the route's utterances.</p>
          </div>
        ` : ''}

        ${this.response ? html`
          <div class="response-section">
            <div class="response-header">
              <span class="response-title">Full API Response</span>
              <div class="metadata">
                <sr-badge variant="info">Route: ${this.response.route || 'N/A'}</sr-badge>
                <sr-badge variant="info">LLM: ${this.response.llm || 'N/A'}</sr-badge>
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
    this.resolution = null;

    try {
      const res = await fetch('/query', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          stream: this.stream,
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
      if (this.stream) {
        const reader = res.body?.getReader();
        if (!reader) throw new Error('Response body is null');

        const decoder = new TextDecoder();
        this.response = { choices: [{ message: { role: 'assistant', content: '' } }] };

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          const chunk = decoder.decode(value, { stream: true });
          const lines = chunk.split('\n');

          for (const line of lines) {
            if (line.startsWith('data: ')) {
              const dataStr = line.slice(6).trim();
              if (dataStr === '[DONE]') continue;

              try {
                const data = JSON.parse(dataStr);
                if (data.error) {
                  throw new Error(data.error.message || 'Stream error');
                }
                
                // Update metadata if available in chunk
                if (data.route && !this.response.route) {
                  this.response = { ...this.response, route: data.route, llm: data.llm };
                }

                const content = data.choices?.[0]?.delta?.content || '';
                if (content) {
                  this.response.choices[0].message.content += content;
                  this.requestUpdate(); // Force Lit to re-render
                }
              } catch (e) {
                console.error('Error parsing stream chunk', e);
              }
            }
          }
        }
      } else {
        this.response = await res.json();
      }
    } catch (e: any) {
      this.error = e.message || 'An unexpected error occurred';
    } finally {
      this.loading = false;
    }
  }

  private async _handleResolve() {
    if (!this.prompt.trim()) return;

    this.loading = true;
    this.error = '';
    this.response = null;
    this.resolution = null;

    try {
      const res = await fetch('/api/test/resolve', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          prompt: this.prompt,
        }),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.detail || `HTTP error! status: ${res.status}`);
      }

      this.resolution = await res.json();
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
