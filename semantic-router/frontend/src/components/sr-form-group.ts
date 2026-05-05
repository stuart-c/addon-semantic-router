import { LitElement, html, css } from 'lit';
import { customElement, property } from 'lit/decorators.js';

@customElement('sr-form-group')
export class SRFormGroup extends LitElement {
  @property({ type: String }) label = '';
  @property({ type: String }) description = '';

  static styles = css`
    :host {
      display: block;
      margin-bottom: 1.75rem;
    }

    .label-wrapper {
      display: flex;
      flex-direction: column;
      gap: 0.375rem;
      margin-bottom: 0.75rem;
    }

    label {
      display: block;
      font-size: 0.8125rem;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      color: var(--text-secondary);
    }

    .description {
      font-size: 0.8125rem;
      color: var(--text-tertiary);
      line-height: 1.4;
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
