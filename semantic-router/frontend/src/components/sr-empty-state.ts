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
      color: var(--text-secondary, #a0a0a0);
      text-align: center;
      padding: 2rem;
    }

    .icon-wrapper {
      margin-bottom: 1.5rem;
      opacity: 0.4;
      color: var(--primary-color, #646cff);
    }

    h2 {
      margin: 0 0 0.5rem 0;
      font-size: 1.25rem;
      font-weight: 600;
      color: var(--text-color, #ffffff);
    }

    p {
      margin: 0 0 1.5rem 0;
      font-size: 0.9375rem;
      max-width: 300px;
      line-height: 1.5;
    }

    .actions {
      display: flex;
      gap: 1rem;
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
