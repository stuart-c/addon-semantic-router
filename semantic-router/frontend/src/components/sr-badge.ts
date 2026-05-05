import { LitElement, html, css } from 'lit';
import { customElement, property } from 'lit/decorators.js';

@customElement('sr-badge')
export class SRBadge extends LitElement {
  @property({ type: String }) variant: 'enabled' | 'disabled' | 'info' | 'warning' = 'info';

  static styles = css`
    :host {
      display: inline-block;
    }

    .badge {
      padding: 0.25rem 0.625rem;
      border-radius: 20px;
      font-size: 0.75rem;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.02em;
    }

    .enabled {
      background-color: hsla(145, 63%, 42%, 0.15);
      color: hsl(145, 63%, 62%);
    }

    .disabled {
      background-color: hsla(0, 84%, 60%, 0.15);
      color: hsl(0, 84%, 60%);
    }

    .info {
      background-color: hsla(var(--primary-h), var(--primary-s), var(--primary-l), 0.15);
      color: var(--primary-color);
    }

    .warning {
      background-color: hsla(35, 100%, 50%, 0.15);
      color: hsl(35, 100%, 65%);
    }
  `;

  render() {
    return html`
      <div class="badge ${this.variant}">
        <slot></slot>
      </div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'sr-badge': SRBadge;
  }
}
