# Ceedoku — Agent Instructions

## What is Ceedoku?

Ceedoku is a free, lightweight Sudoku game designed to provide a simple and powerful Sudoku experience without unnecessary distractions.

It is primarily a static web application built with **HTML, CSS, and JavaScript**. It runs directly in a web browser and can also be installed as an app for offline use.

Ceedoku has eight difficulty levels:

- Easy
- Medium
- Hard
- Expert
- Master
- Extreme
- Impossible
- Godlike

The project includes features such as saving and loading games, undo and redo, pencil mode, erase mode, hints, timers, keyboard controls, animations, sound effects, haptics, dark and light modes, responsive layouts, offline support, and the Ceedoku Save Format (`.csf`).

## Project structure

The repository contains the source code for the Ceedoku web application and supporting files.

Important parts of the project include:

- The main Sudoku game interface.
- Sudoku puzzle generation and solving logic.
- Save and load functionality.
- Settings and UI controls.
- Keyboard navigation.
- Animations.
- Audio and haptic features.
- Service-worker/offline functionality.
- CSF save-file support.
- Website pages and project documentation.

## Main technologies

Ceedoku is primarily written using:

- HTML
- CSS
- JavaScript

Do not assume a framework or build system is being used unless the repository explicitly contains one.

## Development principles

- Preserve the existing design and behavior unless the change specifically requires modifying them.
- Keep changes focused on the task.
- Avoid unnecessary dependencies.
- Avoid unrelated refactoring or reformatting.
- Follow the existing code style of the file being edited.
- Preserve existing indentation and formatting.
- Test changes that affect functionality before considering the work complete.
- When changing UI behavior, consider both desktop and mobile layouts.
- When changing appearance, consider both light and dark modes where applicable.

## Code changes

Make the smallest reasonable change needed to solve the task.

Do not rewrite large sections of code simply to make them look different. Existing code may intentionally be structured or formatted in a particular way.

When returning or modifying code, preserve the indentation and formatting already used by the surrounding code unless the task explicitly asks for reformatting.

## UI changes

Ceedoku is intended to remain lightweight and straightforward.

When modifying the UI:

- Keep the existing visual language consistent.
- Do not introduce unnecessary UI elements.
- Make interactive controls usable on both desktop and mobile.
- Check that changes do not interfere with existing animations or interactions.
- Avoid changing unrelated controls or layouts.

## Testing

For changes affecting the game, test the affected functionality in a modern browser.

Where applicable, verify that:

- Ceedoku loads correctly.
- A puzzle can be generated and played.
- Numbers can be entered and erased correctly.
- Undo and redo work correctly.
- Saving and loading work correctly.
- The timer behaves correctly.
- Settings and menus work correctly.
- Light and dark modes continue to work.
- No new browser-console errors are introduced.

For UI changes, test relevant desktop and mobile layouts.

## Automatically updated files

Some repository content may be generated or updated automatically by tooling or GitHub Actions.

Do not manually overwrite automatically generated content unless the task specifically requires changing the source or generation process.

## Contributions

Contribution guidelines are documented in [`CONTRIBUTING.md`](CONTRIBUTING.md).

Follow those guidelines when making changes intended for contribution to the project.

## Important

`AGENTS.md` is the shared instruction file for coding agents working on Ceedoku.

Agent-specific instruction files such as `CLAUDE.md`, `.cursor/rules/agents.mdc`, and `.github/copilot-instructions.md` point to this file so that the same project instructions can be used across different agents.
