import { LitElement, html, css } from 'lit';
import { customElement, property } from 'lit/decorators.js';

@customElement('sr-list-item')
export class SRListItem extends LitElement {
  @property({ type: Boolean }) selected = false;
  @property({ type: String }) title = '';
  @property({ type: String }) subtitle = '';

  static styles = css`
    :host {
      display: block;
      margin-bottom: 0.25rem;
    }

    .item {
      padding: 0.75rem 1rem;
      border-radius: 8px;
      cursor: pointer;
      transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
      display: flex;
      justify-content: space-between;
      align-items: center;
      border: 1px solid transparent;
      background: transparent;
    }

    .item:hover {
      background: rgba(255, 255, 255, 0.05);
    }

    .item.selected {
      background: rgba(100, 108, 255, 0.1);
      border-color: rgba(100, 108, 255, 0.3);
      color: var(--primary-color, #646cff);
    }

    .content {
      display: flex;
      flex-direction: column;
      gap: 0.125rem;
      overflow: hidden;
    }

    .title {
      font-weight: 500;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
      font-size: 0.9375rem;
    }

    .subtitle {
      font-size: 0.75rem;
      color: var(--text-secondary, #a0a0a0);
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }
  `;

  render() {
    return html`
      <div class="item ${this.selected ? 'selected' : ''}">
        <div class="content">
          <div class="title">${this.title}</div>
          ${this.subtitle ? html`<div class="subtitle">${this.subtitle}</div>` : ''}
        </div>
        <slot name="suffix"></slot>
      </div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'sr-list-item': SRListItem;
  }
}
