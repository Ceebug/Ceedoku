<h1>
  <img src="https://ceedoku.github.io/home/title.png" alt="Ceedoku" aria-label="Ceedoku" width="600px">
</h1>


A free, lightweight Sudoku game designed to provide a simple and powerful Sudoku experience without unnecessary distractions.

It runs directly in your web browser and can also be installed as an app for offline use.

## What is Ceedoku?

Ceedoku is a Sudoku game built with the goal of keeping Sudoku simple.

There are no advertisements interrupting gameplay, and the game provides a range of features while remaining lightweight enough to run on a wide range of devices.

Whether you want to play a quick Sudoku puzzle or work through one of the harder difficulty levels, Ceedoku is designed to stay out of the way and let you play.

## Features

### Difficulties

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

Ceedoku can be played in several ways, and they are all listed below.

> [!NOTE]
> **No installation is required.**
> Ceedoku can be played directly from the [website](https://ceedoku.github.io). You can also download the latest version from the [GitHub Releases Page](https://github.com/ceebug/ceedoku/releases/latest) if you want a local copy of the game.
>
> The website version works without installing Ceedoku as an application.

If you would like to install Ceedoku, there are two options:

### Install from a browser

Supported browsers can install Ceedoku as a **Progressive Web App (PWA)**. This allows Ceedoku to appear and behave more like a normal application on your device while still using the website version.
For instructions on installing Ceedoku from your browser, see the **[installation guide](https://ceedoku.github.io/install#pwa)**.
The installation guide also explains which browsers and devices support this method.

### Install as a desktop application

Ceedoku also has a **native desktop application** for Linux, macOS and Windows 10+.
Installers are available for multiple operating systems and CPU architectures. The installation guide explains how to determine which platform and architecture your device uses and which installer you should choose.
You can find the available installers on the **[Ceedoku Desktop Installer page](https://ceedoku.github.io/downloadinstaller/)**.

For detailed instructions on installing the desktop application, see the **[installation guide](https://ceedoku.github.io/install#native)**.

#### Benefits of the desktop application

The desktop application provides some additional integration with your operating system, including:

* The [**Ceedoku Save Format**](https://ceedoku.github.io/csfspec) **(`.csf`)** file extension is given a dedicated icon, making save files easy to identify.
* Files using the [**Ceedoku Save Format**](https://ceedoku.github.io/csfspec) **(`.csf`)** extension are identified as **"Ceedoku Save File"** by the operating system.
* [**Ceedoku Save Format**](https://ceedoku.github.io/csfspec) **(`.csf`)** files can be opened directly in Ceedoku by double-clicking them, automatically importing the save.

> [!IMPORTANT]
> **Your operating system may warn you that the application could be unsafe or malicious.**
>
> This can happen because the application is currently **not code-signed**. An unsigned application can trigger security warnings even when the application itself is not malicious.
>
> Code-signing certificates can also be pretty expensive, and maybe - just maybe - some people don't want to spend upwards of $500 *per **year*** on one.

### Which should I use?

**Just want to play?**
Use the [Ceedoku website](https://ceedoku.github.io). Nothing needs to be installed.

**Want Ceedoku to appear as an app?**
Use the [browser/PWA installation method](https://ceedoku.github.io/install#pwa).

**Want a full desktop application with `.csf` file integration?**
Use the [desktop application](https://ceedoku.github.io/downloadinstaller/) and follow the [installation guide](https://ceedoku.github.io/install#native).

---

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
- **JavaScript:** 65.29%<br>
- **CSS:** 27.48%<br>
- **HTML:** 7.23%
<!-- LANGUAGES_END -->

## Contributing

If you'd like to contribute to Ceedoku, please read the contributing guidelines before submitting a change.

See [**CONTRIBUTING.md**](CONTRIBUTING.md) for information about contributing to the project.

Development notes:

* This is a static web project — there is no build step by default. Edit the HTML/CSS/JS files and reload the browser to see changes.
* Service Worker caching can serve stale files while developing. To avoid this:
  * Open DevTools → Application → Service Workers and unregister the service worker, or
  * Use a private/incognito window, or
  * Use DevTools → Application → Clear storage and then hard reload (Ctrl/Cmd+Shift+R).
* The game loads local dependency files such as `fsj.js` and `jsf.js` from the repo root. Ensure those files are present when testing locally.


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
