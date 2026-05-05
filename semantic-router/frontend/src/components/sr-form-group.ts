import { LitElement, html, css } from 'lit';
import { customElement, property } from 'lit/decorators.js';

@customElement('sr-form-group')
export class SRFormGroup extends LitElement {
  @property({ type: String }) label = '';
  @property({ type: String }) description = '';

  static styles = css`
    :host {
      display: block;
      margin-bottom: 1.5rem;
    }

    .label-wrapper {
      display: flex;
      flex-direction: column;
      gap: 0.25rem;
      margin-bottom: 0.5rem;
    }

    label {
      display: block;
      font-size: 0.875rem;
      font-weight: 500;
      color: var(--text-secondary, #a0a0a0);
    }

    .description {
      font-size: 0.75rem;
      color: rgba(160, 160, 160, 0.6);
    }
  `;

  render() {
    return html`
      <div class="label-wrapper">
        <label>${this.label}</label>
        ${this.description ? html`<span class="description">${this.description}</span>` : ''}
      </div>
      <slot></slot>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'sr-form-group': SRFormGroup;
  }
}
