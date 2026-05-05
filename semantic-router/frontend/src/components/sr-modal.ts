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
      background: rgba(0, 0, 0, 0.75);
      backdrop-filter: blur(8px);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 1000;
      opacity: 0;
      pointer-events: none;
      transition: opacity 0.3s ease;
    }

    .modal-overlay.open {
      opacity: 1;
      pointer-events: auto;
    }

    .modal {
      background: #2a2a2a;
      border: 1px solid rgba(255, 255, 255, 0.1);
      border-radius: 16px;
      width: 100%;
      max-width: 500px;
      padding: 2rem;
      box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);
      transform: translateY(20px);
      transition: transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
    }

    .modal-overlay.open .modal {
      transform: translateY(0);
    }

    .modal-header {
      margin-bottom: 1.5rem;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    .modal-header h2 {
      margin: 0;
      font-size: 1.5rem;
      font-weight: 600;
      background: linear-gradient(45deg, var(--primary-color, #646cff), #acb1ff);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
    }

    .modal-actions {
      display: flex;
      justify-content: flex-end;
      gap: 1rem;
      margin-top: 2rem;
    }

    .close-btn {
      background: transparent;
      border: none;
      color: var(--text-secondary, #a0a0a0);
      cursor: pointer;
      padding: 0.5rem;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: background 0.2s;
    }

    .close-btn:hover {
      background: rgba(255, 255, 255, 0.05);
      color: white;
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
