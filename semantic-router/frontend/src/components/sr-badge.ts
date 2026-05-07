import { LitElement, html, css } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import '@awesome.me/webawesome/dist/components/badge/badge.js';

@customElement('sr-badge')
export class SRBadge extends LitElement {
  @property({ type: String }) variant: 'enabled' | 'disabled' | 'info' | 'warning' = 'info';

  static styles = css`
    :host {
      display: inline-block;
    }
  `;

  render() {
    let waVariant: 'success' | 'danger' | 'primary' | 'warning' | 'neutral' = 'neutral';
    if (this.variant === 'enabled') waVariant = 'success';
    if (this.variant === 'disabled') waVariant = 'danger';
    if (this.variant === 'info') waVariant = 'primary';
    if (this.variant === 'warning') waVariant = 'warning';

    return html`
      <wa-badge variant="${waVariant}" pill>
        <slot></slot>
      </wa-badge>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'sr-badge': SRBadge;
  }
}
