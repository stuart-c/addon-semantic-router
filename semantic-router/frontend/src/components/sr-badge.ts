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
      padding: 2px 8px;
      border-radius: 4px;
      font-size: 0.7rem;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }

    .enabled {
      background: rgba(46, 213, 115, 0.2);
      color: #2ed573;
    }

    .disabled {
      background: rgba(255, 71, 87, 0.2);
      color: #ff4757;
    }

    .info {
      background: rgba(100, 108, 255, 0.2);
      color: var(--primary-color, #646cff);
    }

    .warning {
      background: rgba(255, 159, 67, 0.2);
      color: #ff9f43;
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
