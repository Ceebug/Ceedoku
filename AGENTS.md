Hello, agents! Welcome to the **Ceedoku** repository.

If you're working on this repository, you're working on Ceedoku: a free, lightweight Sudoku game built to provide a simple and powerful Sudoku experience without unnecessary distractions.

## What is Ceedoku?

Ceedoku is primarily a web application built with **HTML, CSS, and JavaScript**. It runs directly in a web browser and can also be installed as an app for offline use.

The project is intentionally lightweight. It does not use a large framework or complicated build system unless one is explicitly added to the repository. Most of the application is made up of the source files in this repository, so changes to existing HTML, CSS, and JavaScript can directly affect the game.

Ceedoku includes eight difficulty levels:

- Easy
- Medium
- Hard
- Expert
- Master
- Extreme
- Impossible
- Godlike

The game includes features such as:

- Puzzle generation and solving.
- Saving and loading games.
- Undo and redo.
- Pencil mode.
- Erase mode.
- Hints and hint cooldowns.
- Timers and best times.
- Keyboard controls and arrow-key navigation.
- Animations.
- Sound effects.
- Haptics.
- Light and dark modes.
- Responsive desktop and mobile layouts.
- Offline support.
- The Ceedoku Save Format (`.csf`).

## The project

Ceedoku is more than just the Sudoku board. The repository contains the code that makes the game work, along with the files used by the Ceedoku website and supporting systems.

Some important parts include:

- The main Sudoku game interface.
- Sudoku puzzle generation and solving logic.
- Save and load functionality.
- Settings and menus.
- Keyboard navigation.
- UI animations and interactions.
- Audio and haptic features.
- Service-worker and offline functionality.
- CSF save-file support.
- Website pages such as the home, download, install, changelog, and CSF specification pages.
- GitHub Actions and other project tooling.

## How the code is organized

The main application is a static web project. HTML provides the structure, CSS controls the appearance and responsive layouts, and JavaScript provides the game logic and interactions.

The repository may also contain supporting JavaScript files, workers, website assets, configuration, and project automation. Before changing something, look at how the existing code works rather than assuming a conventional framework structure.

## Important project principles

Ceedoku has existing behavior, styling, and conventions for a reason. When making changes:

- Preserve existing behavior unless the task requires changing it.
- Make the smallest reasonable change needed.
- Keep changes focused on the task.
- Do not add unnecessary dependencies.
- Do not perform unrelated refactoring.
- Do not reformat unrelated code.
- Follow the existing style of the file being edited.
- Preserve existing indentation and formatting.
- Do not replace working implementations with a different approach without a reason.
- Consider desktop and mobile behavior when changing the UI.
- Consider light and dark modes when changing appearance.

## Code changes

Existing code may be deliberately structured or formatted in a particular way. Do not rewrite large sections simply because you prefer a different style.

When modifying code, preserve the indentation and formatting already used by the surrounding code unless reformatting is specifically requested.

If a change can be made by modifying a few lines, prefer that over rewriting the entire function or component.

## UI changes

Ceedoku is designed to be simple and unobtrusive.

When changing the interface:

- Keep the existing visual language consistent.
- Avoid unnecessary UI elements.
- Keep controls usable on desktop and mobile.
- Make sure interactive states still work correctly.
- Do not accidentally break existing animations.
- Check both light and dark modes when relevant.
- Avoid changing unrelated UI elements.

## Testing

For changes that affect the game, test the affected functionality in a modern browser.

Where applicable, verify that:

- Ceedoku loads correctly.
- A puzzle can be generated and played.
- Numbers can be entered and erased correctly.
- Undo and redo work correctly.
- Saving and loading work correctly.
- The timer behaves correctly.
- Settings and menus work correctly.
- Light and dark modes continue to work.
- Desktop and mobile layouts remain usable.
- No new browser-console errors are introduced.

## Automatically updated files

Some repository content may be generated or updated automatically by GitHub Actions or other project tooling.

Do not manually overwrite automatically generated content when the source or automation is what should be changed instead.

## Contributions

Contribution guidelines are in [`CONTRIBUTING.md`](CONTRIBUTING.md).

If you are making changes intended to be contributed to the project, follow those guidelines.

## Important

This file is the shared set of instructions for agents working on Ceedoku.

Agent-specific files such as `CLAUDE.md`, `.cursor/rules/agents.mdc`, and `.github/copilot-instructions.md` direct agents here so that Claude, Cursor, GitHub Copilot, and other supported agents can use the same project information and instructions.
