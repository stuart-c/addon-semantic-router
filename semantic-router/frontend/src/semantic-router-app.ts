import { LitElement, html, css } from 'lit';
import { customElement, state } from 'lit/decorators.js';
import './log-viewer';
import './components/config-view';
import './semantic-router-test-tab';
import './route-manager';
import './llm-manager';
import '@awesome.me/webawesome/dist/components/tab-group/tab-group.js';
import '@awesome.me/webawesome/dist/components/tab/tab.js';
import '@awesome.me/webawesome/dist/components/tab-panel/tab-panel.js';
import { sharedStyles } from './shared-styles';

@customElement('semantic-router-app')
export class SemanticRouterApp extends LitElement {
  @state()
  private activeTab = 'logs';

  static styles = [
    sharedStyles,
    css`
      :host {
        flex-direction: column;
      }

      wa-tab-group {
        --track-color: transparent;
        height: 100%;
        display: flex;
        flex-direction: column;
      }

      wa-tab-group::part(base) {
        display: flex;
        flex-direction: column;
        height: 100%;
      }

      wa-tab-group::part(nav) {
        padding: 0 2.5rem;
        background-color: var(--surface-color);
        border-bottom: 1px solid var(--border-color);
        box-shadow: var(--shadow-sm);
      }

      wa-tab-group::part(body) {
        flex: 1;
        display: flex;
        flex-direction: column;
        padding: 2.5rem;
        background-color: var(--bg-color);
        overflow: hidden;
      }

      wa-tab-panel {
        height: 100%;
        display: flex;
        flex-direction: column;
      }

      wa-tab-panel::part(base) {
        padding: 0;
        height: 100%;
        display: flex;
        flex-direction: column;
      }

      .content-area {
        background-color: var(--surface-color);
        border-radius: var(--border-radius);
        min-height: 500px;
        flex: 1;
        border: 1px solid var(--border-color);
        box-shadow: var(--shadow-md);
        animation: slideUp 0.4s cubic-bezier(0.16, 1, 0.3, 1);
        overflow: hidden;
        display: flex;
        flex-direction: column;
      }
    `
  ];

  render() {
    return html`
      <wa-tab-group 
        @wa-tab-show="${(e: CustomEvent) => this.activeTab = e.detail.name}"
      >
        <wa-tab slot="nav" panel="logs" ?active="${this.activeTab === 'logs'}">Logs</wa-tab>
        <wa-tab slot="nav" panel="routes" ?active="${this.activeTab === 'routes'}">Routes</wa-tab>
        <wa-tab slot="nav" panel="llms" ?active="${this.activeTab === 'llms'}">LLMs</wa-tab>
        <wa-tab slot="nav" panel="config" ?active="${this.activeTab === 'config'}">Config</wa-tab>
        <wa-tab slot="nav" panel="test" ?active="${this.activeTab === 'test'}">Test</wa-tab>

        <wa-tab-panel name="logs">
          <div class="content-area">
            <log-viewer></log-viewer>
          </div>
        </wa-tab-panel>
        <wa-tab-panel name="routes">
          <div class="content-area">
            <route-manager></route-manager>
          </div>
        </wa-tab-panel>
        <wa-tab-panel name="llms">
          <div class="content-area">
            <llm-manager></llm-manager>
          </div>
        </wa-tab-panel>
        <wa-tab-panel name="config">
          <div class="content-area">
            <config-view></config-view>
          </div>
        </wa-tab-panel>
        <wa-tab-panel name="test">
          <div class="content-area">
            <semantic-router-test-tab></semantic-router-test-tab>
          </div>
        </wa-tab-panel>
      </wa-tab-group>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'semantic-router-app': SemanticRouterApp;
  }
}
