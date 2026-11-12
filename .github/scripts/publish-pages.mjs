
import fs from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";
import { DefaultArtifactClient } from "@actions/artifact";

const source = process.env.SOURCE_DIR;
const output = path.join(
  process.env.RUNNER_TEMP,
  "ceedoku-pages-output"
);

const repository = process.env.GITHUB_REPOSITORY;
const sha = process.env.GITHUB_SHA;
const token = process.env.GITHUB_TOKEN;

// Files that aren't part of the published website.
const excluded = [
  /^\.github\//,
  /^\.gitignore$/,
  /^\.gitattributes$/,
  /^README(?:\..*)?$/i,
  /^LICENSE(?:-|$)/i,
  /^eslint\.config\./,
  /^server\.js$/,
  /^package(?:-lock)?\.json$/,
  /(^|\/)(?:node_modules|tests?|scripts|\.vscode|\.idea)\//
];

function shouldInclude(file) {
  return !excluded.some(pattern => pattern.test(file));
}

async function main() {
  if (!source || !repository || !sha || !token) {
    throw new Error("Missing required GitHub Actions environment variables.");
  }

  fs.rmSync(output, { recursive: true, force: true });
  fs.mkdirSync(output, { recursive: true });

  // Only copy tracked files from the fetched commit.
  const tracked = execFileSync(
    "git",
    ["ls-files", "-z"],
    { cwd: source }
  )
    .toString()
    .split("\0")
    .filter(Boolean);

  const files = [];

  for (const relative of tracked) {
    if (!shouldInclude(relative)) continue;

    const from = path.join(source, relative);
    const to = path.join(output, relative);

    if (!fs.existsSync(from) || !fs.statSync(from).isFile()) {
      continue;
    }

    fs.mkdirSync(path.dirname(to), { recursive: true });
    fs.copyFileSync(from, to);

    files.push(to);
  }

  if (files.length === 0) {
    throw new Error("No website files were selected for publishing.");
  }

  console.log(`Prepared ${files.length} website files.`);

  // Upload the static website as a GitHub Actions artifact.
  const client = new DefaultArtifactClient();

  const artifact = await client.uploadArtifact(
    "github-pages",
    files,
    output,
    { retentionDays: 1 }
  );

  console.log(
    `Uploaded artifact ${artifact.id} (${artifact.size} bytes).`
  );

  // Request a short-lived GitHub Actions OIDC token.
  const oidcUrl = new URL(
    process.env.ACTIONS_ID_TOKEN_REQUEST_URL
  );

  oidcUrl.searchParams.set("audience", "github-pages");

  const oidcResponse = await fetch(oidcUrl, {
    headers: {
      Authorization:
        `Bearer ${process.env.ACTIONS_ID_TOKEN_REQUEST_TOKEN}`
    }
  });

  if (!oidcResponse.ok) {
    throw new Error(
      `OIDC request failed: ${oidcResponse.status} ` +
      await oidcResponse.text()
    );
  }

  const { value: oidcToken } = await oidcResponse.json();

  // Submit the artifact to GitHub Pages.
  const deploymentResponse = await fetch(
    `https://api.github.com/repos/${repository}/pages/deployments`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: "application/vnd.github+json",
        "X-GitHub-Api-Version": "2022-11-28",
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        artifact_id: artifact.id,
        pages_build_version: sha,
        oidc_token: oidcToken
      })
    }
  );

  const result = await deploymentResponse.json();

  if (!deploymentResponse.ok) {
    throw new Error(
      `Pages deployment failed (${deploymentResponse.status}): ` +
      JSON.stringify(result)
    );
  }

  console.log("GitHub Pages accepted the deployment.");
  console.log(`Commit: ${sha}`);
}

main().catch(error => {
  console.error("Publishing failed:", error);
  process.exitCode = 1;
});
