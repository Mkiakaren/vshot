#!/usr/bin/env node

import fs from "fs";
import path from "path";
import { execSync } from "child_process";

const rawArgs = process.argv.slice(2);
const validTypes = ["ma", "mi", "p"];
const typeIndex = rawArgs.findIndex((arg) => validTypes.includes(arg));

if (typeIndex === -1) {
  console.error('Usage: vshot ma|mi|p "some message"');
  process.exit(1);
}

const typeArg = rawArgs[typeIndex];
const message = rawArgs
  .slice(typeIndex + 1)
  .join(" ")
  .trim();

if (!message) {
  console.error('Please provide a commit message, e.g. vshot p "some fix"');
  process.exit(1);
}

const pkgPath = path.join(process.cwd(), "package.json");

let pkg;
try {
  pkg = JSON.parse(fs.readFileSync(pkgPath, "utf8"));
} catch {
  console.error("Could not read package.json in current directory.");
  process.exit(1);
}

if (!pkg.version) {
  console.error("package.json has no version field.");
  process.exit(1);
}

const parts = pkg.version.split(".").map((n) => parseInt(n, 10));
if (parts.length !== 3 || parts.some(isNaN)) {
  console.error(`Invalid semver format: "${pkg.version}"`);
  process.exit(1);
}

let [major, minor, patch] = parts;
const prevVersion = pkg.version;

switch (typeArg) {
  case "ma":
    major += 1;
    minor = 0;
    patch = 0;
    break;
  case "mi":
    minor += 1;
    patch = 0;
    break;
  case "p":
    patch += 1;
    break;
}

const newVersion = `${major}.${minor}.${patch}`;

const now = new Date();
const buildNumber =
  [
    String(now.getUTCFullYear()).slice(2),
    String(now.getUTCMonth() + 1).padStart(2, "0"),
    String(now.getUTCDate()).padStart(2, "0"),
  ].join("") +
  "." +
  [
    String(now.getUTCHours()).padStart(2, "0"),
    String(now.getUTCMinutes()).padStart(2, "0"),
  ].join("");

const buildEpoch = String(Math.floor(now.getTime() / 1000));

let gitHash = "no-git";
let gitCommitEpoch = "0";

try {
  gitHash = execSync("git rev-parse --short=7 HEAD", {
    encoding: "utf8",
    stdio: "pipe",
  }).trim();
  gitCommitEpoch = execSync("git show -s --format=%ct HEAD", {
    encoding: "utf8",
    stdio: "pipe",
  }).trim();
} catch {
  console.warn("[bv] Warning: Git not available, using fallback values.");
}

pkg.version = newVersion;
pkg.buildInfo = { buildNumber, buildEpoch, gitHash, gitCommitEpoch };

fs.writeFileSync(pkgPath, JSON.stringify(pkg, null, 2) + "\n", "utf8");

console.log(`[bv] ${prevVersion} → ${newVersion}`);
console.log(`[bv] Build: [${buildNumber}] Hash: [${gitHash}]`);

try {
  let hasStagedChanges = false;
  try {
    execSync("git diff --cached --quiet", { stdio: "pipe" });
  } catch {
    hasStagedChanges = true;
  }

  execSync("git add package.json", { stdio: "inherit" });

  if (hasStagedChanges) {
    console.log("[bv] Staged changes detected → committing only staged files.");
  } else {
    console.log("[bv] No staged changes → staging everything.");
    execSync("git add .", { stdio: "inherit" });
  }

  const commitMsg = `${newVersion}: ${message}`;
  execSync(`git commit -m ${JSON.stringify(commitMsg)}`, { stdio: "inherit" });
  console.log(`[bv] Committed: "${commitMsg}"`);
} catch (err) {
  console.error("[bv] Git commit failed:", err.message || err);
  process.exit(1);
}
