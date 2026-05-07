## [0.1.1] - 2026-05-07

## Changes
* No changes


## [0.1.0] - 2026-05-07

## Changes
- Modernize frontend with Web Awesome components @stuart-c-ai (#78)
- feat: migrate frontend to web awesome and stabilize unit tests @stuart-c-ai (#77)
- Standardize Frontend Button Styles @stuart-c-ai (#75)
- feat: conditionally install Node.js in make_venv.sh @stuart-c-ai (#74)
- fix: remove hardcoded 'default' model from frontend test tab @stuart-c-ai (#68)
- fix: resolve layout issue and improve draggable bar robustness @stuart-c-ai (#66)
- fix: draggable bar on log tab and implement auto-height default @stuart-c-ai (#65)
- fix: ensure model parameter is correctly set and support {model} in URL @stuart-c-ai (#64)
- fix: override LLM model in request payload if configured @stuart-c-ai (#62)
- feat: mount local data directory in docker for persistence @stuart-c-ai (#59)
- refactor: remove header column and make tabs full-width @stuart-c-ai (#58)
- feat: remove frontend modals and implement inline flows @stuart-c-ai (#57)
- fix: resolve LLM background color and theme consistency @stuart-c-ai (#56)
- feat: remove black background from frontend @stuart-c-ai (#55)
- feat: premium design system and frontend UI enhancements @stuart-c-ai (#54)
- test: audit and improve frontend unit test coverage @stuart-c-ai (#53)
- feat: include tsc type checking in run_tests.sh @stuart-c-ai (#52)
- Refactor: introduce shared UI components @stuart-c-ai (#51)
- refactor: centralize frontend CSS styles @stuart-c-ai (#50)
- Revert "feat: frontend UI/UX overhaul and LLM management" @stuart-c (#49)
- feat: implement LLM management tab in frontend @stuart-c-ai (#47)
- feat: implement route and utterance management UI @stuart-c-ai (#44)
- fix: update log fetch path to match backend API and ensure ingress compatibility @stuart-c-ai (#45)
- feat: add test tab to frontend for real-time routing validation @stuart-c-ai (#43)
- feat: add config tab to frontend @stuart-c-ai (#42)
- feat: implement enhanced grid view and split interface for logs @stuart-c-ai (#41)
- fix: frontend static path and config in Docker @stuart-c-ai (#29)
- feat: update run_docker to show logs and stop on exit @stuart-c-ai (#30)
- fix: Fix script permissions @stuart-c (#28)
- feat: extend config and data model API @stuart-c (#6)
- chore: optimise Docker and restrict architectures @stuart-c (#5)
- fix(ci): update labeler config to v5+ schema @stuart-c-ai (#24)
- Fix backend black linting @stuart-c-ai (#21)
- fix: update actions/labeler to v6.0.1 @stuart-c-ai (#23)
- feat: configure as Home Assistant addon @stuart-c (#4)
- fix: set explicit commitish in release-drafter config @stuart-c-ai (#20)
- ci: add GitHub Actions workflows @stuart-c (#3)
- feat: initial backend structure and data models @stuart-c (#2)

## 🛠 Maintenance

- feat: add streamed reply support @stuart-c-ai (#76)
- feat: achieve 100% backend test coverage @stuart-c-ai (#73)
- fix: Use similarity_score instead of score in RouteChoice @stuart-c-ai (#72)
- feat: Add prompt testing & semantic resolution @stuart-c-ai (#71)
- feat: add semantic intent tests @stuart-c-ai (#70)
- fix: resolve 401 error when fetching LLM models @stuart-c-ai (#69)
- feat: exclude default model parameter from LLM calls @stuart-c-ai (#67)
- feat: Add model fetching and dropdown to frontend @stuart-c-ai (#63)
- docs: enforce venv usage and gh PR creation in AGENTS.md @stuart-c-ai (#61)
- fix: propagate LLM HTTP errors natively to prevent 500 server errors @stuart-c-ai (#60)
- feat: frontend UI/UX overhaul and LLM management @stuart-c-ai (#48)
- feat: implement data integrity for LLMs and Routes @stuart-c-ai (#46)
- fix: stabilize frontend route tests and restore index.html @stuart-c-ai (#40)
- feat: implement Lit-based frontend with tabs @stuart-c-ai (#39)
- feat: pin python dependency versions to latest stable @stuart-c-ai (#38)
- fix: update Semantic Router API to v0.1.12 @stuart-c-ai (#37)
- feat: switch to FastEmbed encoder and prune heavy dependencies @stuart-c-ai (#35)
- test: achieve 100% logic coverage for backend @stuart-c-ai (#34)
- feat: implement database logging for query requests @stuart-c-ai (#33)
- feat: implement semantic routing and fallback mechanism @stuart-c-ai (#31)
- feat: periodic log cleanup and database vacuum @stuart-c-ai (#32)
- docs: add READMEs, AGENTS.md, and development guidelines @stuart-c (#11)
- test: achieve 100% unit test coverage @stuart-c (#10)
- refactor: implement generic CRUD pattern @stuart-c (#9)
- ci: fix build and test triggers for all branches @stuart-c-ai (#27)
- feat: implement OpenAI-compatible /query endpoint @stuart-c (#8)
- feat: add frontend serving @stuart-c (#7)
- build(deps): bump release-drafter/release-drafter from 6.1.0 to 7.2.1 @[dependabot[bot]](https://github.com/apps/dependabot) (#19)
- Fix: Use correct ARM runners for aarch64 builds @stuart-c-ai (#26)
- Fix failing unit tests and refactor routes @stuart-c-ai (#25)


# Changelog

All notable changes to this project will be documented in this file.

