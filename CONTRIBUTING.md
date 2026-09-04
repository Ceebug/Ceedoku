# Contributing to Ceedoku

Thank you for your interest in contributing to Ceedoku!

Contributions are welcome, whether you're fixing a bug, improving the interface, adding a feature, or making another improvement to the project.

## Before contributing

Before starting work, check the existing issues and pull requests to see whether the problem or feature has already been reported or worked on.

For larger changes, opening an issue first is recommended so the change can be discussed before you spend time implementing it.

## Reporting bugs

If you find a bug, please report it through the repository's issue tracker.

A useful bug report should include:

- What happened.
- What you expected to happen.
- The steps needed to reproduce the problem.
- The browser or platform where the problem occurred, if relevant.
- Screenshots or other useful information when applicable.

Please search existing issues before creating a new one to avoid duplicate reports.

## Fixing bugs

Bug fixes are welcome.

When submitting a bug fix:

- Clearly describe the problem being fixed.
- Explain what caused the problem when known.
- Keep the change focused on the bug.
- Test the fix before submitting it.
- Make sure the fix does not introduce regressions.

## Adding features

New features are welcome, but larger features should generally be discussed before implementation.

When adding a feature:

- Keep it consistent with Ceedoku's existing design.
- Keep the implementation as simple as reasonably possible.
- Avoid unnecessary dependencies.
- Make sure existing functionality continues to work.
- Test the feature thoroughly.

## User interface changes

Ceedoku's interface should remain consistent across the project.

When making UI changes:

- Keep existing spacing, sizing, and styling conventions in mind.
- Test the change on desktop and mobile.
- Test both light and dark modes when applicable.
- Make sure buttons and other interactive elements remain usable.
- Avoid making unrelated UI changes as part of another change.

## Testing

Before submitting a change, test the parts of Ceedoku affected by your changes.

Where applicable, make sure that:

- Ceedoku loads correctly.
- A puzzle can be generated and played.
- Numbers can be entered and erased correctly.
- Undo and redo continue to work.
- Saving and loading continue to work.
- The timer behaves correctly.
- Menus and settings continue to work.
- Light and dark modes continue to work.
- No new errors appear in the browser console.

If your change affects a specific feature, test that feature in particular rather than relying only on the application loading successfully.

## Pull requests

When submitting a pull request:

1. Give the pull request a clear title.
2. Describe what you changed.
3. Explain why the change was made.
4. Mention any relevant issues.
5. Include screenshots when they are useful, especially for UI changes.
6. Test your changes before submitting the pull request.

Please keep pull requests focused. Avoid combining unrelated changes into the same pull request unless they are directly related.

## Code style

Follow the existing code style when contributing.

In particular:

- Avoid unnecessarily reformatting existing code.
- Keep indentation consistent with the surrounding code.
- Keep changes limited to what is necessary.
- Use clear and descriptive names.
- Remove temporary debugging code before submitting a pull request.

If a file already follows a particular formatting style, follow that style instead of reformatting the entire file.

## Commit messages

Use clear and descriptive commit messages.

For example:

```text
Fix dropdown animation
