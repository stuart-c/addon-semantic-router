import { LitElement, html, css } from 'lit';
import { customElement, property } from 'lit/decorators.js';

@customElement('sr-empty-state')
export class SREmptyState extends LitElement {
  @property({ type: String }) title = '';
  @property({ type: String }) description = '';

  static styles = css`
    :host {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      height: 100%;
      color: var(--text-secondary);
      text-align: center;
      padding: 3rem;
      animation: fadeIn 0.4s ease-out;
    }

    .icon-wrapper {
      margin-bottom: 2rem;
      color: var(--text-tertiary);
      background-color: var(--surface-color);
      padding: 2rem;
      border-radius: 50%;
      border: 1px solid var(--border-color);
      box-shadow: var(--shadow-sm);
    }

    h2 {
      margin: 0 0 0.75rem 0;
      font-size: 1.5rem;
      font-weight: 700;
      letter-spacing: -0.02em;
      color: var(--text-color);
    }

    p {
      margin: 0 0 2rem 0;
      font-size: 1rem;
      max-width: 360px;
      line-height: 1.6;
      color: var(--text-secondary);
    }

    .actions {
      display: flex;
      gap: 1rem;
    }

    @keyframes fadeIn {
      from { opacity: 0; transform: translateY(10px); }
      to { opacity: 1; transform: translateY(0); }
    }
  `;

  render() {
    return html`
      <div class="icon-wrapper">
        <slot name="icon">
          <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
            <circle cx="12" cy="12" r="10"></circle>
            <line x1="12" y1="8" x2="12" y2="12"></line>
            <line x1="12" y1="16" x2="12.01" y2="16"></line>
          </svg>
        </slot>
      </div>
      <h2>${this.title}</h2>
      <p>${this.description}</p>
      <div class="actions">
        <slot name="actions"></slot>
      </div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'sr-empty-state': SREmptyState;
  }
}
