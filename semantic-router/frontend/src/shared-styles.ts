import { css } from 'lit';

export const sharedStyles = css`
  /* Layout */
  :host {
    display: flex;
    height: 100%;
    width: 100%;
    overflow: hidden;
    color: var(--text-color);
  }

  .sidebar {
    width: 300px;
    border-right: 1px solid rgba(255, 255, 255, 0.1);
    display: flex;
    flex-direction: column;
    background: rgba(255, 255, 255, 0.02);
  }

  .sidebar-header {
    padding: 1.5rem;
    border-bottom: 1px solid rgba(255, 255, 255, 0.05);
    display: flex;
    justify-content: space-between;
    align-items: center;
  }

  .sidebar-header h2 {
    margin: 0;
    font-size: 1rem;
    text-transform: uppercase;
    letter-spacing: 0.1em;
    color: var(--text-secondary);
  }

  .main-content {
    flex: 1;
    overflow-y: auto;
    display: flex;
    flex-direction: column;
    background: #1e1e1e;
  }

  .empty-state {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    height: 100%;
    color: var(--text-secondary);
    opacity: 0.7;
    text-align: center;
  }

  .detail-header {
    padding: 1.5rem 2rem;
    border-bottom: 1px solid rgba(255, 255, 255, 0.05);
    background: rgba(255, 255, 255, 0.02);
    display: flex;
    justify-content: space-between;
    align-items: center;
  }

  .detail-body {
    padding: 2rem;
    max-width: 800px;
  }

  .section {
    margin-bottom: 2.5rem;
  }

  .section h3 {
    font-size: 1.1rem;
    margin-bottom: 1rem;
    color: var(--text-color);
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }

  /* Typography */
  h2 {
    margin-top: 0;
    margin-bottom: 1.5rem;
    font-size: 1.5rem;
    font-weight: 600;
    background: linear-gradient(45deg, var(--primary-color, #646cff), #acb1ff);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
  }

  /* Buttons */
  .btn {
    padding: 0.5rem 1rem;
    border-radius: 4px;
    border: none;
    cursor: pointer;
    font-weight: 500;
    transition: all 0.2s;
    display: inline-flex;
    align-items: center;
    gap: 0.5rem;
    font-size: 0.875rem;
    font-family: inherit;
  }

  .btn-primary {
    background: linear-gradient(135deg, var(--primary-color), var(--primary-hover));
    background-color: var(--primary-color);
    color: white;
    box-shadow: 0 4px 15px -5px rgba(100, 108, 255, 0.4);
  }

  .btn-primary:hover:not(:disabled) {
    background: var(--primary-hover);
    transform: translateY(-1px);
    box-shadow: 0 6px 20px -5px rgba(100, 108, 255, 0.5);
  }

  .btn-primary:active:not(:disabled) {
    transform: translateY(0);
  }

  .btn-primary:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }

  .btn-ghost {
    background: transparent;
    color: var(--text-secondary);
  }

  .btn-ghost:hover {
    background: rgba(255, 255, 255, 0.05);
    color: white;
  }

  .btn-danger {
    background: rgba(255, 71, 87, 0.1);
    color: #ff4757;
  }

  .btn-danger:hover {
    background: #ff4757;
    color: white;
  }

  .btn-icon {
    padding: 0.4rem;
    border-radius: 4px;
  }

  /* Forms */
  .form-group {
    margin-bottom: 1.5rem;
  }

  label {
    display: block;
    margin-bottom: 0.5rem;
    font-size: 0.875rem;
    font-weight: 500;
    color: var(--text-secondary);
  }

  input[type="text"], 
  input[type="number"], 
  input[type="password"],
  select,
  textarea {
    width: 100%;
    padding: 0.75rem;
    background: rgba(0, 0, 0, 0.2);
    border: 1px solid rgba(255, 255, 255, 0.1);
    border-radius: 4px;
    color: white;
    font-size: 0.9rem;
    transition: all 0.2s;
    font-family: inherit;
    box-sizing: border-box;
  }

  input:focus, select:focus, textarea:focus {
    outline: none;
    border-color: var(--primary-color);
    background-color: rgba(0, 0, 0, 0.3);
    box-shadow: 0 0 0 2px rgba(100, 108, 255, 0.2);
  }

  select option {
    background-color: var(--surface-color);
    color: var(--text-color);
  }

  /* Modals */
  .modal-overlay {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0, 0, 0, 0.7);
    backdrop-filter: blur(4px);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 1000;
  }

  .modal {
    background: var(--surface-color);
    border: 1px solid rgba(255, 255, 255, 0.1);
    border-radius: 12px;
    width: 450px;
    padding: 2rem;
    box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.5);
  }

  .modal h2 {
    margin-top: 0;
    margin-bottom: 1.5rem;
  }

  .modal-actions {
    display: flex;
    justify-content: flex-end;
    gap: 1rem;
    margin-top: 2rem;
  }

  /* Badges */
  .badge {
    padding: 2px 6px;
    border-radius: 4px;
    font-size: 0.7rem;
    font-weight: 600;
    text-transform: uppercase;
  }

  .badge-enabled {
    background: rgba(46, 213, 115, 0.2);
    color: #2ed573;
  }

  .badge-disabled {
    background: rgba(255, 71, 87, 0.2);
    color: #ff4757;
  }

  /* Animations */
  @keyframes fadeIn {
    from { opacity: 0; transform: translateY(10px); }
    to { opacity: 1; transform: translateY(0); }
  }

  .fade-in {
    animation: fadeIn 0.4s ease-out;
  }
`;
