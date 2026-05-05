import { LitElement, html, css } from 'lit';
import { customElement, property } from 'lit/decorators.js';

@customElement('sr-modal')
export class SRModal extends LitElement {
  @property({ type: Boolean }) open = false;
  @property({ type: String }) title = '';

  static styles = css`
    .modal-overlay {
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background-color: rgba(0, 0, 0, 0.85);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 1000;
      opacity: 0;
      pointer-events: none;
      transition: opacity var(--transition-speed);
    }

    .modal-overlay.open {
      opacity: 1;
      pointer-events: auto;
    }

    .modal {
      background-color: var(--surface-elevated);
      border: 1px solid var(--border-color);
      border-radius: var(--border-radius);
      width: 100%;
      max-width: 500px;
      padding: 2.5rem;
      box-shadow: var(--shadow-lg);
      transform: translateY(24px);
      transition: transform 0.4s cubic-bezier(0.16, 1, 0.3, 1), opacity 0.4s ease;
      opacity: 0;
    }

    .modal-overlay.open .modal {
      transform: translateY(0);
      opacity: 1;
    }

    .modal-header {
      margin-bottom: 2rem;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    .modal-header h2 {
      margin: 0;
      font-size: 1.5rem;
      font-weight: 700;
      letter-spacing: -0.02em;
      background: linear-gradient(135deg, var(--text-color) 0%, var(--text-secondary) 100%);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
    }

    .modal-actions {
      display: flex;
      justify-content: flex-end;
      gap: 1rem;
      margin-top: 2.5rem;
    }

    .close-btn {
      background: transparent;
      border: none;
      color: var(--text-secondary);
      cursor: pointer;
      padding: 0.5rem;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: var(--transition-fast);
    }

    .close-btn:hover {
      background-color: var(--border-color);
      color: var(--text-color);
    }
  `;

  private _handleClose() {
    this.dispatchEvent(new CustomEvent('close', { bubbles: true, composed: true }));
  }

  render() {
    return html`
      <div class="modal-overlay ${this.open ? 'open' : ''}" @click="${this._handleClose}">
        <div class="modal" @click="${(e: Event) => e.stopPropagation()}">
          <div class="modal-header">
            <h2>${this.title}</h2>
            <button class="close-btn" @click="${this._handleClose}">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <line x1="18" y1="6" x2="6" y2="18"></line>
                <line x1="6" y1="6" x2="18" y2="18"></line>
              </svg>
            </button>
          </div>
          <div class="modal-body">
            <slot></slot>
          </div>
          <div class="modal-actions">
            <slot name="actions"></slot>
          </div>
        </div>
      </div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'sr-modal': SRModal;
  }
}
