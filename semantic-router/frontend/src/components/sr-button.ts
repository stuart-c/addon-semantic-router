import { LitElement, html, css } from 'lit';
import { customElement, property } from 'lit/decorators.js';

@customElement('sr-button')
export class SRButton extends LitElement {
  @property({ type: String }) variant: 'primary' | 'ghost' | 'danger' = 'primary';
  @property({ type: Boolean }) disabled = false;
  @property({ type: Boolean }) iconOnly = false;
  @property({ type: String }) type: 'button' | 'submit' = 'button';

  static styles = css`
    :host {
      display: inline-block;
    }

    button {
      padding: 0.5rem 1rem;
      border-radius: 4px;
      border: none;
      cursor: pointer;
      font-weight: 500;
      transition: all 0.2s;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      gap: 0.5rem;
      font-size: 0.875rem;
      font-family: inherit;
      width: 100%;
    }

    button.icon-only {
      padding: 0.4rem;
      width: auto;
    }

    /* Primary Variant */
    button.primary {
      background: linear-gradient(135deg, var(--primary-color), var(--primary-hover));
      background-color: var(--primary-color);
      color: white;
      box-shadow: 0 4px 15px -5px rgba(100, 108, 255, 0.4);
    }

    button.primary:hover:not(:disabled) {
      background: var(--primary-hover);
      transform: translateY(-1px);
      box-shadow: 0 6px 20px -5px rgba(100, 108, 255, 0.5);
    }

    /* Ghost Variant */
    button.ghost {
      background: transparent;
      color: var(--text-secondary);
    }

    button.ghost:hover:not(:disabled) {
      background: rgba(255, 255, 255, 0.05);
      color: white;
    }

    /* Danger Variant */
    button.danger {
      background: rgba(255, 71, 87, 0.1);
      color: #ff4757;
    }

    button.danger:hover:not(:disabled) {
      background: #ff4757;
      color: white;
    }

    button:active:not(:disabled) {
      transform: translateY(0);
    }

    button:disabled {
      opacity: 0.6;
      cursor: not-allowed;
      box-shadow: none;
      transform: none;
    }
  `;

  render() {
    return html`
      <button 
        type="${this.type}"
        class="${this.variant} ${this.iconOnly ? 'icon-only' : ''}" 
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
