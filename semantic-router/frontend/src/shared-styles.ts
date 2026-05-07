import { css } from 'lit';

export const sharedStyles = css`
  :host {
    display: flex;
    height: 100%;
    width: 100%;
    overflow: hidden;
    color: var(--wa-color-neutral-900);
    background-color: var(--wa-color-neutral-50);
  }

  /* Layout */
  .sidebar {
    width: 320px;
    background-color: var(--wa-color-neutral-0);
    border-right: 1px solid var(--wa-color-neutral-200);
    display: flex;
    flex-direction: column;
    z-index: 10;
  }

  .sidebar-header {
    padding: 1.5rem 2rem;
    border-bottom: 1px solid var(--wa-color-neutral-200);
    background-color: var(--wa-color-neutral-50);
  }

  .sidebar-header h2 {
    margin: 0;
    font-size: var(--wa-font-size-xs);
    font-weight: var(--wa-font-weight-semibold);
    text-transform: uppercase;
    letter-spacing: 0.05em;
    color: var(--wa-color-neutral-500);
  }

  .main-content {
    flex: 1;
    overflow-y: auto;
    display: flex;
    flex-direction: column;
    background-color: var(--wa-color-neutral-50);
    position: relative;
  }

  .empty-state {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    height: 100%;
    padding: var(--wa-spacing-3xl);
    text-align: center;
    color: var(--wa-color-neutral-500);
    animation: fadeIn var(--wa-transition-medium) ease-out;
  }

  .detail-header {
    padding: 1.5rem 2.5rem;
    border-bottom: 1px solid var(--wa-color-neutral-200);
    background-color: var(--wa-color-neutral-0);
    display: flex;
    justify-content: space-between;
    align-items: center;
    position: sticky;
    top: 0;
    z-index: 5;
  }

  .detail-body {
    padding: 2.5rem;
    max-width: 900px;
    margin: 0 auto;
    width: 100%;
  }

  .section {
    margin-bottom: var(--wa-spacing-2xl);
    background-color: var(--wa-color-neutral-0);
    padding: var(--wa-spacing-xl);
    border-radius: var(--wa-border-radius-medium);
    border: 1px solid var(--wa-color-neutral-200);
    box-shadow: var(--wa-shadow-small);
  }

  .section h3 {
    font-size: var(--wa-font-size-medium);
    font-weight: var(--wa-font-weight-semibold);
    margin-bottom: var(--wa-spacing-large);
    color: var(--wa-color-neutral-900);
    display: flex;
    align-items: center;
    gap: var(--wa-spacing-small);
  }

  /* Typography */
  h2 {
    margin-top: 0;
    margin-bottom: var(--wa-spacing-large);
    font-size: var(--wa-font-size-2xl);
    font-weight: var(--wa-font-weight-bold);
    letter-spacing: var(--wa-letter-spacing-tight);
    color: var(--wa-color-neutral-900);
  }

  /* Forms & Inputs - Most are handled by wa-components, but some layout helpers remain */
  .form-group {
    margin-bottom: var(--wa-spacing-large);
  }

  /* Animations */
  @keyframes fadeIn {
    from { opacity: 0; }
    to { opacity: 1; }
  }

  @keyframes slideUp {
    from { opacity: 0; transform: translateY(20px); }
    to { opacity: 1; transform: translateY(0); }
  }

  .fade-in {
    animation: fadeIn var(--wa-transition-medium) ease-out;
  }
`;
