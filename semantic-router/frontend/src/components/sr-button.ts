import { LitElement, html, css } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import '@awesome.me/webawesome/dist/components/button/button.js';

@customElement('sr-button')
export class SRButton extends LitElement {
  @property({ type: String }) variant: 'primary' | 'secondary' | 'ghost' | 'danger' = 'primary';
  @property({ type: Boolean }) disabled = false;
  @property({ type: Boolean }) iconOnly = false;
  @property({ type: String }) type: 'button' | 'submit' = 'button';
  @property({ type: Boolean }) loading = false;

  static styles = css`
    :host {
      display: inline-block;
    }

    wa-button {
      width: 100%;
    }

    wa-button[icon-only] {
      width: auto;
    }
  `;

  render() {
    let waVariant: 'primary' | 'danger' | 'default' = 'default';
    if (this.variant === 'primary') waVariant = 'primary';
    if (this.variant === 'danger') waVariant = 'danger';
    
    return html`
      <wa-button 
        type="${this.type}"
        variant="${waVariant}"
        ?outline="${this.variant === 'secondary'}"
        ?ghost="${this.variant === 'ghost'}"
        ?disabled="${this.disabled}"
        ?circle="${this.iconOnly}"
        ?loading="${this.loading}"
      >
        <slot></slot>
      </wa-button>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'sr-button': SRButton;
  }
}
