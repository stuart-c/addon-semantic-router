import { LitElement, html, css } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import { sharedStyles } from '../shared-styles';

@customElement('sr-button')
export class SRButton extends LitElement {
  @property({ type: String }) variant: 'primary' | 'secondary' | 'ghost' | 'danger' = 'primary';
  @property({ type: Boolean }) disabled = false;
  @property({ type: Boolean }) iconOnly = false;
  @property({ type: String }) type: 'button' | 'submit' = 'button';

  static styles = [
    sharedStyles,
    css`
    :host {
      display: inline-block;
    }

    .btn {
      width: 100%;
    }

    .btn.icon-only {
      padding: 0.625rem;
      width: auto;
    }
  `];

  render() {
    return html`
      <button 
        type="${this.type}"
        class="btn btn-${this.variant} ${this.iconOnly ? 'icon-only' : ''}" 
        ?disabled="${this.disabled}"
      >
        <slot></slot>
      </button>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'sr-button': SRButton;
  }
}
