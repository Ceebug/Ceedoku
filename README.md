<h1>
  <img src="https://ceedoku.github.io/home/title.png" alt="Ceedoku" aria-label="Ceedoku" width="600px">
</h1>


**Ceedoku** is a free, lightweight Sudoku game designed to provide a simple and powerful Sudoku experience without unnecessary distractions.

Ceedoku runs directly in your web browser and can also be installed as an app for offline use.

## What is Ceedoku?

Ceedoku is a Sudoku game built with the goal of keeping Sudoku simple.

There are no advertisements interrupting gameplay, and the game provides a range of features while remaining lightweight enough to run on a wide range of devices.

Whether you want to play a quick Sudoku puzzle or work through one of the harder difficulty levels, Ceedoku is designed to stay out of the way and let you play.

## Features

### Sudoku

Ceedoku includes eight difficulty levels:

* **Easy**
* **Medium**
* **Hard**
* **Expert**
* **Master**
* **Extreme**
* **Impossible**
* **Godlike**

Each difficulty provides a different challenge, with Godlike being the most restrictive difficulty.

### Tools

Ceedoku includes several tools to help with solving puzzles:

* Pencil mode
* Erase mode
* Undo
* Redo
* Hints

These tools can be enabled or disabled through the settings.

### Saving

Ceedoku can save your current game so you can leave and return to it later.

The save system stores things such as:

* The puzzle
* The solution
* Entered numbers
* Pencil notes
* Selected cell
* Difficulty
* Timer
* Mistakes
* Undo and redo history
* Game state

Ceedoku also has its own save-file format, [**Ceedoku Save Format**](https://ceedoku.github.io/csfspec) **(`.csf`)**, which can be used to export and import saves.

### Appearance

Ceedoku supports both:

* Dark mode
* Light mode

The interface is designed to adapt to different screen sizes, including desktop and mobile devices.

### Other features

Ceedoku also includes:

* Keyboard controls
* Arrow-key cell navigation
* Arrow-key wraparound
* Animations
* Sound effects
* Haptics
* Hint cooldowns
* Offline support
* Responsive layouts

## No Ads

Ceedoku does not include advertisements.

The goal is to keep the game focused on Sudoku instead of filling the interface with advertisements or other distractions.

## Play Ceedoku

You can play Ceedoku directly in your browser:

**https://ceedoku.github.io**

No installation is required to play the web version.

## Installing Ceedoku

Ceedoku can be installed in several ways.

### Install from a browser

Supported browsers can install the website as an application, allowing Ceedoku to appear like a normal app on your device.

### Desktop application

Ceedoku also has a desktop version packaged as an executable application.

See the installation and download pages on the Ceedoku website for more information.

## Offline Support

Once installed, Ceedoku can be used without an internet connection.

The application keeps the required files locally so that the game can continue working when the device is offline.

## Ceedoku Save Format

Ceedoku uses its own save format:

```text
.csf
```

**Ceedoku Save Format** is designed specifically for Ceedoku save data.

The format includes validation data so that invalid or damaged save files can be detected.

More information about the format can be found in the CSF specification:

**https://ceedoku.github.io/csfspec/**

## How Ceedoku Works

Ceedoku is primarily a web application.

The game interface is built using standard web technologies:

* HTML
* CSS
* JavaScript

Puzzle generation is handled by JavaScript, with puzzle generation capable of being moved into a Web Worker so that generating difficult puzzles does not unnecessarily block the interface.

The game also uses browser storage for things such as saved games and best times.

## Project Structure

The repository contains the source code used to build and run Ceedoku.

Some of the important parts of the project include:

* The main game interface
* Sudoku generation and solving logic
* Save and load functionality
* Settings
* Keyboard controls
* Animations
* Audio and haptic features
* Service-worker/offline functionality
* CSF save-file support

## Languages

This repository is primarily a static web app. The main languages used are:

<!-- LANGUAGES_START -->
- JavaScript - 65.67%
- CSS - 27.20%
- HTML - 7.13%
<!-- LANGUAGES_END -->

## Getting started (run locally)

These instructions will get a local copy of the project running for development and testing.

Prerequisites:

* A modern web browser (Chrome, Firefox, Safari, Edge)
* Git (to clone the repository)
* Optional: Python 3 or Node.js if you want a simple local static server

Clone the repository:

```bash
git clone https://github.com/Ceebug/Ceedoku.git
cd Ceedoku
```

Open in a browser (quick, no server):

* Double-click `index.html` or open it from your browser's File > Open menu.

Recommended (runs a local static server so Service Worker and fetches behave properly):

* With Python 3:

```bash
python3 -m http.server 8000
# then open http://localhost:8000 in your browser
```

* With Node (http-server):

```bash
npx http-server -p 8000
# then open http://localhost:8000
```

Development notes:

* This is a static web project — there is no build step by default. Edit the HTML/CSS/JS files and reload the browser to see changes.
* Service Worker caching can serve stale files while developing. To avoid this:
  * Open DevTools → Application → Service Workers and unregister the service worker, or
  * Use a private/incognito window, or
  * Use DevTools → Application → Clear storage and then hard reload (Ctrl/Cmd+Shift+R).
* The game loads local dependency files such as `fsj.js` and `jsf.js` from the repo root. Ensure those files are present when testing locally.

Contributing:

If you'd like to contribute:

* Fork the repo, create a branch, make changes, and open a pull request.
* Keep changes small and focused. If you're changing UI behavior, explain the motivation in the PR description.
* If adding new code that must be loaded at runtime, test the change with the local server so the Service Worker won't interfere.

## Development

Ceedoku is developed primarily using HTML, CSS, and JavaScript.

To work on Ceedoku, clone the repository and open the project in your preferred development environment.

Because Ceedoku is a web application, most development can be tested directly in a modern web browser.
## Website

The official Ceedoku website homepage is:

**https://ceedoku.github.io/home**

The website contains information about the game, installation instructions, downloads, the changelog, and other project information.

> [!NOTE]
> `https://ceedoku.github.io` is the direct link to play Ceedoku.
It does **not** open the website homepage.


## Changelog

Changes between Ceedoku versions are documented in the changelog:

**https://ceedoku.github.io/changelog**

## Current Version

The current version is displayed on the Ceedoku website and in the project's release information.

For the latest release, see the GitHub releases page:

**https://github.com/ceebug/ceedoku/releases**

## Project Status

Ceedoku is actively developed and may continue to receive new features, improvements, and bug fixes.

The project is still evolving, so some parts of the application may change between releases.

---

**Ceedoku — Sudoku, without the nonsense.**
