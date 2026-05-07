import { LitElement, html, css } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import '@awesome.me/webawesome/dist/components/button/button.js';

@customElement('sr-button')
export class SRButton extends LitElement {
  @property({ type: String }) variant: 'primary' | 'secondary' | 'ghost' | 'danger' = 'primary';
  @property({ type: Boolean }) disabled = false;
  @property({ type: Boolean }) iconOnly = false;
  @property({ type: String }) type: 'button' | 'submit' = 'button';

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
    let waVariant: any = 'default';
    if (this.variant === 'primary') waVariant = 'primary';
    if (this.variant === 'danger') waVariant = 'danger';
    
    // Ghost variant mapping
    const isGhost = this.variant === 'ghost';

    return html`
      <wa-button 
        type="${this.type}"
        variant="${waVariant}"
        ?outline="${this.variant === 'secondary'}"
        ?ghost="${isGhost}"
        ?disabled="${this.disabled}"
        ?circle="${this.iconOnly}"
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
