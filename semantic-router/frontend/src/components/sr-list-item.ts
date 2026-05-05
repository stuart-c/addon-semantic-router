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
      margin-bottom: 0.375rem;
    }

    .item {
      padding: 1rem 1.25rem;
      border-radius: var(--border-radius-sm);
      cursor: pointer;
      transition: var(--transition-speed);
      display: flex;
      justify-content: space-between;
      align-items: center;
      border: 1px solid transparent;
      background-color: transparent;
      user-select: none;
    }

    .item:hover {
      background-color: var(--surface-color);
      border-color: var(--border-color);
    }

    .item.selected {
      background-color: hsla(var(--primary-h), var(--primary-s), var(--primary-l), 0.1);
      border-color: hsla(var(--primary-h), var(--primary-s), var(--primary-l), 0.3);
      color: var(--primary-color);
    }

    .content {
      display: flex;
      flex-direction: column;
      gap: 0.25rem;
      overflow: hidden;
    }

    .title {
      font-weight: 600;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
      font-size: 0.9375rem;
      color: var(--text-color);
    }

    .subtitle {
      font-size: 0.8125rem;
      color: var(--text-secondary);
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .item.selected .subtitle {
      color: hsla(var(--primary-h), var(--primary-s), var(--primary-l), 0.7);
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
