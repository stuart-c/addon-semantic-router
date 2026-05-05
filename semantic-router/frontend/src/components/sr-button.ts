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
      padding: 0.625rem 1.25rem;
      border-radius: var(--border-radius-sm);
      border: 1px solid transparent;
      cursor: pointer;
      font-weight: 600;
      font-size: 0.875rem;
      font-family: inherit;
      transition: var(--transition-speed);
      display: inline-flex;
      align-items: center;
      justify-content: center;
      gap: 0.625rem;
      user-select: none;
      width: 100%;
    }

    button.icon-only {
      padding: 0.625rem;
      width: auto;
    }

    /* Primary Variant */
    button.primary {
      background-color: var(--primary-color);
      color: var(--bg-color);
      border-color: var(--primary-color);
    }

    button.primary:hover:not(:disabled) {
      background-color: var(--primary-hover);
      border-color: var(--primary-hover);
      transform: translateY(-1px);
      box-shadow: 0 4px 12px hsla(var(--primary-h), var(--primary-s), var(--primary-l), 0.3);
    }

    button.primary:active:not(:disabled) {
      transform: translateY(0);
      background-color: var(--primary-active);
    }

    /* Ghost Variant */
    button.ghost {
      background: transparent;
      color: var(--text-secondary);
      border-color: var(--border-color);
    }

    button.ghost:hover:not(:disabled) {
      background-color: var(--border-color);
      color: var(--text-color);
      border-color: var(--text-tertiary);
    }

    /* Danger Variant */
    button.danger {
      background-color: hsla(0, 84%, 60%, 0.1);
      color: hsl(0, 84%, 60%);
      border-color: hsla(0, 84%, 60%, 0.2);
    }

    button.danger:hover:not(:disabled) {
      background-color: hsl(0, 84%, 60%);
      color: white;
      border-color: hsl(0, 84%, 60%);
    }

    button:disabled {
      opacity: 0.5;
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
