# Semantic Router Frontend

This is the Lit-based frontend for the Semantic Router Home Assistant Addon. It provides a modern, responsive interface for managing logs, routes, and LLM configurations.

## Technology Stack

- **Framework**: [Lit](https://lit.dev/) (Web Components)
- **Build Tool**: [Vite](https://vitejs.dev/)
- **Language**: [TypeScript](https://www.typescriptlang.org/)
- **Testing**: [Vitest](https://vitest.dev/)
- **Styling**: Vanilla CSS with Design Tokens

## Project Structure

- `src/`: Source code
  - `main.ts`: Entry point
  - `semantic-router-app.ts`: Main application component
  - `index.css`: Global styles and design tokens
- `index.html`: Main HTML entry point
- `vite.config.ts`: Vite configuration
- `tsconfig.json`: TypeScript configuration

## Development

### Prerequisites

- Node.js (Latest LTS recommended)
- npm

### Setup

```bash
bash scripts/make_venv.sh
```

### Local Development Server

```bash
# Activate venv for nodeenv
source .venv/bin/activate
cd semantic-router/frontend
npm run dev
```

### Running Tests

```bash
bash scripts/run_tests.sh
```

### Building for Production

```bash
bash scripts/make_frontend.sh
```

The build output will be in the `dist/` directory, which is served by the FastAPI backend.

## Design Principles

- **Premium Aesthetics**: Uses a curated color palette and smooth transitions.
- **Responsiveness**: Designed to work across different screen sizes.
- **Component-Driven**: Built using reusable Web Components.
