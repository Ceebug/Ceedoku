const fs = require("fs");
const path = require("path");

const repo = process.env.GITHUB_REPOSITORY;
const token = process.env.GITHUB_TOKEN;

const root = process.cwd();
const readmePath = path.join(root, "README.md");

const extensions = {
    ".js": "JavaScript",
    ".css": "CSS",
    ".html": "HTML"
};

const ignored = new Set([
    ".git",
    "node_modules",
    ".github"
]);

let counts = {
    JavaScript: 0,
    CSS: 0,
    HTML: 0
};

function scanDirectory(dir) {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
        if (ignored.has(entry.name)) {
            continue;
        }

        const fullPath = path.join(dir, entry.name);

        if (entry.isDirectory()) {
            scanDirectory(fullPath);
            continue;
        }

        const extension = path.extname(entry.name).toLowerCase();
        const language = extensions[extension];

        if (!language) {
            continue;
        }

        const content = fs.readFileSync(fullPath, "utf8");
        const lines = content.split(/\r?\n/).length;

        counts[language] += lines;
    }
}

scanDirectory(root);

const total = counts.JavaScript + counts.CSS + counts.HTML;

if (total === 0) {
    throw new Error("No JavaScript, CSS, or HTML files were found.");
}

const percentages = {
    JavaScript: ((counts.JavaScript / total) * 100).toFixed(2),
    CSS: ((counts.CSS / total) * 100).toFixed(2),
    HTML: ((counts.HTML / total) * 100).toFixed(2)
};

const readme = fs.readFileSync(readmePath, "utf8");

const startMarker = "<!-- LANGUAGES_START -->";
const endMarker = "<!-- LANGUAGES_END -->";

const start = readme.indexOf(startMarker);
const end = readme.indexOf(endMarker);

if (start === -1 || end === -1 || end < start) {
    throw new Error("LANGUAGES_START or LANGUAGES_END marker not found.");
}

const languages = `- JavaScript - ${percentages.JavaScript}%
- CSS - ${percentages.CSS}%
- HTML - ${percentages.HTML}%`;

const updatedReadme =
    readme.slice(0, start + startMarker.length) +
    "\n" +
    languages +
    "\n" +
    readme.slice(end);

fs.writeFileSync(readmePath, updatedReadme);

console.log("Language breakdown updated:");
console.log(languages);
