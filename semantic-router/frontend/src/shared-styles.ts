import { css } from 'lit';

export const sharedStyles = css`
  :host {
    display: flex;
    height: 100%;
    width: 100%;
    overflow: hidden;
    color: var(--text-color);
    background-color: var(--bg-color);
  }

  /* Layout */
  .sidebar {
    width: 320px;
    background-color: var(--surface-color);
    border-right: 1px solid var(--border-color);
    display: flex;
    flex-direction: column;
    z-index: 10;
  }

  .sidebar-header {
    padding: 1.5rem 2rem;
    border-bottom: 1px solid var(--border-color);
    background-color: var(--surface-elevated);
  }

  .sidebar-header h2 {
    margin: 0;
    font-size: 0.875rem;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    color: var(--text-secondary);
  }

  .main-content {
    flex: 1;
    overflow-y: auto;
    display: flex;
    flex-direction: column;
    background-color: var(--bg-color);
    position: relative;
  }

  .empty-state {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    height: 100%;
    padding: 3rem;
    text-align: center;
    color: var(--text-secondary);
    animation: fadeIn 0.4s ease-out;
  }

  .detail-header {
    padding: 1.5rem 2.5rem;
    border-bottom: 1px solid var(--border-color);
    background-color: var(--surface-color);
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
    margin-bottom: 3rem;
    background-color: var(--surface-color);
    padding: 2rem;
    border-radius: var(--border-radius);
    border: 1px solid var(--border-color);
    box-shadow: var(--shadow-sm);
  }

  .section h3 {
    font-size: 1.125rem;
    font-weight: 600;
    margin-bottom: 1.25rem;
    color: var(--text-color);
    display: flex;
    align-items: center;
    gap: 0.75rem;
  }

  /* Typography */
  h2 {
    margin-top: 0;
    margin-bottom: 1.5rem;
    font-size: 1.75rem;
    font-weight: 700;
    letter-spacing: -0.02em;
    background: linear-gradient(135deg, var(--text-color) 0%, var(--text-secondary) 100%);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
  }

  /* Buttons */
  .btn {
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
  }

  .btn-primary {
    background-color: var(--primary-color);
    color: var(--bg-color);
    border-color: var(--primary-color);
  }

  .btn-primary:hover:not(:disabled) {
    background-color: var(--primary-hover);
    border-color: var(--primary-hover);
    transform: translateY(-1px);
    box-shadow: 0 4px 12px hsla(var(--primary-h), var(--primary-s), var(--primary-l), 0.3);
  }

  .btn-primary:active:not(:disabled) {
    transform: translateY(0);
    background-color: var(--primary-active);
  }

  .btn-ghost {
    background: transparent;
    color: var(--text-secondary);
    border-color: var(--border-color);
  }

  .btn-ghost:hover:not(:disabled) {
    background-color: var(--border-color);
    color: var(--text-color);
    border-color: var(--text-tertiary);
  }

  .btn-danger {
    background-color: hsla(0, 84%, 60%, 0.1);
    color: hsl(0, 84%, 60%);
    border-color: hsla(0, 84%, 60%, 0.2);
  }

  .btn-danger:hover:not(:disabled) {
    background-color: hsl(0, 84%, 60%);
    color: white;
    border-color: hsl(0, 84%, 60%);
  }

  .btn:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  /* Forms */
  .form-group {
    margin-bottom: 1.75rem;
  }

  label {
    display: block;
    margin-bottom: 0.625rem;
    font-size: 0.8125rem;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    color: var(--text-secondary);
  }

  input[type="text"], 
  input[type="number"], 
  input[type="password"],
  select,
  textarea {
    width: 100%;
    padding: 0.75rem 1rem;
    background-color: var(--bg-color);
    border: 1px solid var(--border-color);
    border-radius: var(--border-radius-sm);
    color: var(--text-color);
    font-size: 0.9375rem;
    font-family: inherit;
    transition: var(--transition-speed);
    box-sizing: border-box;
  }

  input:focus, select:focus, textarea:focus {
    outline: none;
    border-color: var(--primary-color);
    box-shadow: 0 0 0 3px hsla(var(--primary-h), var(--primary-s), var(--primary-l), 0.15);
  }

  /* Modals */
  .modal-overlay {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background-color: rgba(0, 0, 0, 0.6);
    backdrop-filter: blur(4px);
    -webkit-backdrop-filter: blur(4px);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 1000;
    animation: fadeIn 0.3s ease-out;
  }

  .modal {
    background-color: var(--surface-elevated);
    border: 1px solid var(--border-color);
    border-radius: var(--border-radius);
    width: 100%;
    max-width: 500px;
    padding: 2.5rem;
    box-shadow: var(--shadow-lg);
    animation: slideUp 0.4s cubic-bezier(0.16, 1, 0.3, 1);
  }

  .modal-actions {
    display: flex;
    justify-content: flex-end;
    gap: 1rem;
    margin-top: 2.5rem;
  }

  /* Badges */
  .badge {
    padding: 0.25rem 0.625rem;
    border-radius: 20px;
    font-size: 0.75rem;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.02em;
  }

  .badge-enabled {
    background-color: hsla(145, 63%, 42%, 0.15);
    color: hsl(145, 63%, 62%);
  }

  .badge-disabled {
    background-color: hsla(0, 84%, 60%, 0.15);
    color: hsl(0, 84%, 60%);
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
    animation: fadeIn 0.4s ease-out;
  }
`;
