# Contributing to Ceedoku

Thank you for your interest in contributing to Ceedoku!

Ceedoku is a free, lightweight Sudoku game built with HTML, CSS, and JavaScript. Contributions are welcome, whether you're fixing a bug, improving the interface, adding a feature, improving documentation, or suggesting an improvement.

## Issues and suggestions

Use [GitHub Issues](https://github.com/Ceebug/Ceedoku/issues) to report bugs, suggest features, and discuss improvements.

Before opening an issue, check whether it has already been reported. For larger changes, please discuss your plans in an issue before implementing them.

For general user feedback, use the [Ceedoku feedback page](https://ceedoku.github.io/feedback).

## Pull requests

Follow the [style used by Modrinth's code repository](https://docs.modrinth.com/contributing/getting-started#pull-request-titles) (because it's clean, simple, and already works well — no need to reinvent the wheel).

* **Keep PRs focused.** Each PR should address one specific issue or improvement.
* **Use descriptive titles.** Prefer prefixes such as `fix:`, `feat:`, `docs:` (Oh wait we don't have docs), and `refactor:` where appropriate.
* **Explain your changes.** Describe what changed and why.
* **Link related issues.** Use closing keywords such as `Fixes #123` when a PR resolves an issue.
* **Test your changes** and make sure they don't introduce regressions.
* **Include screenshots when useful**, especially for UI changes.

Please avoid combining unrelated changes into one PR.

## Testing

Test the functionality affected by your changes and check for regressions.

Where applicable, make sure that:

* Ceedoku loads correctly without new console errors.
* Puzzle generation and gameplay work correctly.
* Saving, loading, undo, and redo continue to work.
* The timer, menus, and settings work correctly.
* Light and dark modes remain functional.
* UI changes work on desktop and mobile.

If you're adding code that must be loaded at runtime, test it using a local server so the Service Worker and fetch requests behave properly.

## User interface changes

Keep Ceedoku's interface consistent with the existing design.

Consider spacing, sizing, animations, accessibility, and usability across desktop and mobile. Test both light and dark modes when applicable.

Avoid unrelated UI changes as part of another contribution.

## Code style

Follow the existing code style where practical. Avoid unnecessary reformatting, keep changes focused, use descriptive names, and remove temporary debugging code before submitting a pull request.

Or go haywire, I don't give a sh*t how u format your code, if it works, it works.

I can barely be bothered to indent stuff myself, so I won't force you to indent your own code. I merely recommend it because it makes things easier to read and maintain. You'll probably thank yourself for it later.

## Coding with agents

Ceedoku supports development with coding agents, but **purely vibe-coding is not allowed**.

If you use an AI coding agent to make changes, you must understand the code you're adding or modifying. An agent can help write code, investigate problems, or suggest solutions, but you're responsible for understanding what the code does and ensuring it works correctly.

**Do not blindly accept generated code.** Read it, understand it, test it, and make sure it fits the existing project.

The repository supports multiple coding agents. Each supported agent has a guide file that directs it to the shared [`AGENTS.md`](AGENTS.md) instructions. Make sure your agent has access to its appropriate guide file and follows those instructions.

You may be asked to explain a line of code in your pull request. This is to check that you understand your contribution, not to annoy you or imply that using AI is inherently bad.

## Commit messages

Use clear and descriptive commit messages.

For example:

```text
Fix dropdown animation
```

## Keep changes focused

Small, focused changes are easier to review, test, and maintain. Please avoid combining unrelated changes into one pull request.

Thank you for helping improve Ceedoku!
