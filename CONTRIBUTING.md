# Contributing to Ceedoku

Thank you for your interest in contributing to Ceedoku!

Ceedoku is a free, lightweight Sudoku game built with HTML, CSS, and JavaScript. Contributions are welcome, whether you're fixing a bug, improving the interface, adding a feature, improving documentation, or suggesting an improvement.

## Before contributing

Before making a change, take a look at the existing project and make sure your idea has not already been addressed.

For larger changes, it is a good idea to discuss the change before spending time implementing it. This helps avoid duplicated work and makes it easier to keep Ceedoku consistent.

## Suggesting feedback tracker changes

Ceedoku uses an Excel spreadsheet as its feedback and issue tracker.

[**Feedback.xlsx**](https://1drv.ms/x/c/10f0be968e146f73/IQCxdQPegBeQSK21LxGKedcQAQfv8S2WEUHFpoPMgrXyyE4?e=TosiAU) contains the actual feedback tracker. You will not be able to edit the actual bug tracker unless you are a trusted member of the community.
This is done *intentionally* to prevent people from accidentally or deliberately destroying the main feedback spreadsheet.

If you notice something in the feedback tracker that should be added or changed, use the separate [**Feedback Edits**](https://1drv.ms/x/c/10f0be968e146f73/IQBdw3vTloR6QLvpzGCLsxfuAUZRFD-vqCw0vIyp3Tfl9Mk?e=4PNHaJ) spreadsheet.

In **Feedback Edits**, provide:

* The row number of the feedback entry you are referring to.
* What should be added or changed.
* Any useful explanation or context.

You can edit the Feedback Edits spreadsheet directly. Suggestions will be reviewed before changes are made to the main feedback tracker.

## Reporting bugs

If you find a bug in Ceedoku, report it through the [**Ceedoku feedback page**](https://ceedoku.github.io/feedback).

A useful bug report should include:

* A useful title.
* A useful description that clearly explains what the bug is and how to reproduce it.

The feedback form will collect the other required information, including:

* Device.
* Operating system.
* Type of bug.
* Other required information.

You can also add screenshots or other images when they are useful. The form will prompt you to add them, but they are optional.

If the bug relates to an existing entry in the feedback tracker, mention the existing entry in your report so it can be updated appropriately.

## Fixing bugs

Bug fixes are welcome.

When submitting a bug fix:

* Clearly describe the problem being fixed.
* Explain what caused the problem when known.
* Keep the change focused on the bug.
* Test the fix before submitting it.
* Make sure the fix does not introduce regressions.

## Adding features

New features are welcome, but larger features should generally be discussed before implementation.

When adding a feature:

* Keep it consistent with Ceedoku's existing design.
* Keep the implementation as simple as reasonably possible.
* Avoid unnecessary dependencies.
* Make sure existing functionality continues to work.
* Test the feature thoroughly.

## User interface changes

Ceedoku's interface should remain consistent across the project.

When making UI changes:

* Keep existing spacing, sizing, and styling conventions in mind.
* Test the change on desktop and mobile.
* Test both light and dark modes when applicable.
* Make sure buttons and other interactive elements remain usable.
* Avoid making unrelated UI changes as part of another change.

## Testing

Before submitting a change, test the parts of Ceedoku affected by your changes.

Where applicable, make sure that:

* Ceedoku loads correctly.
* A puzzle can be generated and played.
* Numbers can be entered and erased correctly.
* Undo and redo continue to work.
* Saving and loading continue to work.
* The timer behaves correctly.
* Menus and settings continue to work.
* Light and dark modes continue to work.
* No new errors appear in the browser console.

If your change affects a specific feature, test that feature in particular rather than relying only on the application loading successfully.

## Pull requests

When submitting a pull request:

1. Give the pull request a clear title.
2. Describe what you changed.
3. Explain why the change was made.
4. Mention any relevant feedback tracker entry when applicable.
5. Include screenshots when they are useful, especially for UI changes.
6. Test your changes before submitting the pull request.

Please keep pull requests focused. Avoid combining unrelated changes into the same pull request unless they are directly related.

## Code style

Follow the existing code style when contributing.

In particular:

* Avoid unnecessarily reformatting existing code.
* Keep indentation consistent with the surrounding code.
* Keep changes limited to what is necessary.
* Use clear and descriptive names.
* Remove temporary debugging code before submitting a pull request.

If a file already follows a particular formatting style, follow that style instead of reformatting the entire file.

Or go haywire, I don't give a sh*t how u format your code, if it works, it works. 
I can barely be bothered to indent stuff myself so I won't force you to indent your own code; I merely advise that you do to make things easier for yourself and others in the future, you will probably thank yourself for it.

## Commit messages

Use clear and descriptive commit messages.

For example:

```text
Fix dropdown animation
```

## Keep changes focused

Please avoid making unrelated changes while working on a contribution. Small, focused changes are easier to review, test, and maintain.

Thank you for helping improve Ceedoku!
