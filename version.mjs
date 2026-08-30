#!/usr/bin/env node

import fs from "fs";
import path from "path";
import { execSync } from "child_process";
import { createInterface } from "readline";

const C = {
  reset: "\x1b[0m",
  bold: "\x1b[1m",
  dim: "\x1b[2m",
  green: "\x1b[32m",
  blue: "\x1b[34m",
  yellow: "\x1b[33m",
  red: "\x1b[31m",
  cyan: "\x1b[36m",
  gray: "\x1b[90m",
};

const c = (k, t) => `${C[k] ?? ""}${t}${C.reset}`;
const b = (t) => `${C.bold}${t}${C.reset}`;
const dim = (t) => `${C.dim}${t}${C.reset}`;
const ok = (m) => console.log(`   ${c("green", "✓")} ${m}`);
const warn = (m) => console.log(`   ${c("yellow", "⚠")} ${m}`);
const info = (l, v) => console.log(`   ${c("gray", l + ":")} ${v}`);
const fail = (m) => {
  console.error(`\n${c("red", b("✗"))} ${m}\n`);
  process.exit(1);
};
const HR = () => c("blue", b("━".repeat(52)));

const selfPkg = JSON.parse(
  fs.readFileSync(new URL("./package.json", import.meta.url), "utf8"),
);

const TYPE_MAP = { p: "patch", mi: "minor", ma: "major" };
const VALID_TYPES = Object.keys(TYPE_MAP);
const rawArgs = process.argv.slice(2);

function showHelp() {
  const hr = HR();
  console.log(`
${hr}
${c("blue", b("  🚀  vshot " + selfPkg.version))}  ${dim("— semver, supercharged")}
${hr}

${b("Usage:")}   vshot <type> "<message>" [flags]

${b("Types:")}
  ${c("cyan", "p")}    Patch  1.2.3 → ${b("1.2.4")}   ${dim("bug fixes")}
  ${c("cyan", "mi")}   Minor  1.2.3 → ${b("1.3.0")}   ${dim("new features")}
  ${c("cyan", "ma")}   Major  1.2.3 → ${b("2.0.0")}   ${dim("breaking changes")}

${b("Flags:")}
  ${c("cyan", "--tag")}          Annotated git tag ${dim("vX.Y.Z")}
  ${c("cyan", "--push")}         Push commit + tag to origin
  ${c("cyan", "--no-commit")}    Skip all git operations
  ${c("cyan", "--changelog")}    Prepend entry to CHANGELOG.md
  ${c("cyan", "--dry-run")}      Preview without writing
  ${c("cyan", "-v, --version")}  vshot version
  ${c("cyan", "-h, --help")}     This screen

${b("Examples:")}
  ${dim('vshot p  "fix auth null pointer"')}
  ${dim('vshot mi "add dark mode" --tag --push')}
  ${dim('vshot ma "rewrite core" --tag --push --changelog')}
  ${dim('vshot p  "test change" --dry-run')}
`);
}

if (!rawArgs.length || rawArgs.includes("-h") || rawArgs.includes("--help")) {
  showHelp();
  process.exit(0);
}

if (rawArgs.includes("-v") || rawArgs.includes("--version")) {
  console.log(selfPkg.version);
  process.exit(0);
}

const flags = {
  tag: rawArgs.includes("--tag"),
  push: rawArgs.includes("--push"),
  noCommit: rawArgs.includes("--no-commit"),
  changelog: rawArgs.includes("--changelog"),
  dryRun: rawArgs.includes("--dry-run"),
};

const positional = rawArgs.filter((a) => !a.startsWith("-"));

function ask(question) {
  const rl = createInterface({ input: process.stdin, output: process.stdout });
  return new Promise((resolve) =>
    rl.question(question, (a) => {
      rl.close();
      resolve(a.trim());
    }),
  );
}

function run(cmd) {
  return execSync(cmd, { encoding: "utf8", stdio: "pipe" }).trim();
}

function bumpVersion(version, type) {
  const parts = version.split(".").map((n) => parseInt(n, 10));
  if (parts.length !== 3 || parts.some(Number.isNaN))
    fail(`Invalid semver: "${version}"`);
  let [major, minor, patch] = parts;
  if (type === "ma") {
    major++;
    minor = 0;
    patch = 0;
  } else if (type === "mi") {
    minor++;
    patch = 0;
  } else {
    patch++;
  }
  return `${major}.${minor}.${patch}`;
}

function makeBuildInfo(now) {
  const yr = String(now.getUTCFullYear()).slice(2);
  const mo = String(now.getUTCMonth() + 1).padStart(2, "0");
  const dy = String(now.getUTCDate()).padStart(2, "0");
  const hr = String(now.getUTCHours()).padStart(2, "0");
  const mn = String(now.getUTCMinutes()).padStart(2, "0");
  return {
    buildNumber: `${yr}${mo}${dy}.${hr}${mn}`,
    buildEpoch: String(Math.floor(now.getTime() / 1000)),
  };
}

function writeChangelog(pkgPath, version, type, message, now) {
  const clPath = path.join(path.dirname(pkgPath), "CHANGELOG.md");
  const date = now.toISOString().slice(0, 10);
  const label = TYPE_MAP[type][0].toUpperCase() + TYPE_MAP[type].slice(1);
  const entry = `## [${version}] - ${date}\n\n### ${label}\n- ${message}\n`;

  if (fs.existsSync(clPath)) {
    const src = fs.readFileSync(clPath, "utf8");
    const idx = src.indexOf("\n## ");
    fs.writeFileSync(
      clPath,
      idx !== -1
        ? src.slice(0, idx + 1) + entry + "\n" + src.slice(idx + 1)
        : src.trimEnd() + "\n\n" + entry,
      "utf8",
    );
  } else {
    fs.writeFileSync(
      clPath,
      `# Changelog\n\nAll notable changes are documented here.\n\n${entry}`,
      "utf8",
    );
  }
}

async function main() {
  const hr = HR();
  console.log(`\n${hr}`);
  console.log(
    `${c("blue", b("  🚀  vshot " + selfPkg.version))}  ${dim("— semver, supercharged")}`,
  );
  console.log(`${hr}\n`);

  let typeArg = positional.find((a) => VALID_TYPES.includes(a));
  let message = positional
    .filter((a) => !VALID_TYPES.includes(a))
    .join(" ")
    .trim();

  if (!typeArg) {
    console.log(dim("  No type given — interactive mode\n"));
    typeArg = await ask(`  ${c("cyan", "Bump type")} ${dim("(ma/mi/p)")} → `);
  }
  if (!VALID_TYPES.includes(typeArg))
    fail(`Unknown type "${typeArg}". Use: ma, mi, p`);

  if (!message) message = await ask(`  ${c("cyan", "Commit message")} → `);
  if (!message) fail("A commit message is required.");
  message = message.replace(/^./, (ch) => ch.toUpperCase());

  let gitHash = "no-git",
    gitCommitEpoch = "0",
    gitBranch = "detached",
    gitDirty = false;
  let gitOk = false;
  try {
    gitHash = run("git rev-parse --short=7 HEAD");
    gitCommitEpoch = run("git show -s --format=%ct HEAD");
    gitBranch = run("git rev-parse --abbrev-ref HEAD");
    gitDirty = run("git status --porcelain").length > 0;
    gitOk = true;
  } catch {
    /* surfaced in pre-flight display */
  }

  if (flags.noCommit && flags.push) warn("--push ignored with --no-commit.");
  if (flags.noCommit && flags.tag) warn("--tag ignored with --no-commit.");
  if (!gitOk && !flags.noCommit)
    warn("Git not available — git operations disabled.");

  const eff = {
    commit: !flags.noCommit && gitOk,
    tag: flags.tag && !flags.noCommit && gitOk,
    push: flags.push && !flags.noCommit && gitOk,
    changelog: flags.changelog,
  };

  if (flags.dryRun)
    console.log(
      `\n  ${c("yellow", b("DRY RUN"))} ${dim("— nothing will be written")}\n`,
    );

  const totalSteps =
    3 +
    (eff.changelog ? 1 : 0) +
    (eff.commit ? 1 : 0) +
    (eff.tag ? 1 : 0) +
    (eff.push ? 1 : 0);

  let stepN = 0;
  const step = (label) => {
    stepN++;
    console.log(
      `\n${c("cyan", b(`[${stepN}/${totalSteps}]`))} ${c("yellow", label)}`,
    );
  };

  step("Pre-flight checks");

  const pkgPath = path.join(process.cwd(), "package.json");
  let pkg;
  try {
    pkg = JSON.parse(fs.readFileSync(pkgPath, "utf8"));
  } catch {
    fail("Could not read package.json in current directory.");
  }
  if (!pkg.version) fail("package.json has no version field.");
  ok(`package.json  ${dim("v" + pkg.version)}`);

  if (gitOk) {
    ok(
      `Git  ${dim(gitBranch + " @ " + gitHash)}${gitDirty ? `  ${c("yellow", "⚠ dirty")}` : ""}`,
    );
  } else {
    warn("Git not found — file-only mode active.");
  }

  if (eff.push) {
    try {
      run("git remote get-url origin");
      ok("Remote origin configured");
    } catch {
      fail('--push requires a remote named "origin".');
    }
  }

  if (pkg.scripts?.preversion) {
    warn("Running preversion hook...");
    if (!flags.dryRun) execSync("npm run preversion", { stdio: "inherit" });
  }

  step("Computing version bump");

  const prevVersion = pkg.version;
  const newVersion = bumpVersion(prevVersion, typeArg);
  const now = new Date();
  const { buildNumber, buildEpoch } = makeBuildInfo(now);

  info(
    "Bump  ",
    `${c("gray", TYPE_MAP[typeArg])}  ${dim(prevVersion)} → ${c("green", b(newVersion))}`,
  );
  info("Build ", dim(buildNumber));
  info("Hash  ", dim(gitHash));

  step("Writing package.json" + (flags.dryRun ? `  ${dim("[dry-run]")}` : ""));

  pkg.version = newVersion;
  pkg.buildInfo = { buildNumber, buildEpoch, gitHash, gitCommitEpoch };

  if (!flags.dryRun)
    fs.writeFileSync(pkgPath, JSON.stringify(pkg, null, 2) + "\n", "utf8");
  ok(`version   ${dim(prevVersion + " →")} ${c("green", b(newVersion))}`);
  ok(`buildInfo ${dim(buildNumber + " · " + gitHash)}`);

  if (eff.changelog) {
    step(
      "Updating CHANGELOG.md" + (flags.dryRun ? `  ${dim("[dry-run]")}` : ""),
    );
    if (!flags.dryRun)
      writeChangelog(pkgPath, newVersion, typeArg, message, now);
    ok(
      `[${newVersion}] entry prepended  ${dim(now.toISOString().slice(0, 10))}`,
    );
  }

  if (eff.commit) {
    step("Committing changes" + (flags.dryRun ? `  ${dim("[dry-run]")}` : ""));
    const commitMsg = `${newVersion}: ${message}`;

    if (flags.dryRun) {
      ok(dim(`Would commit: "${commitMsg}"`));
    } else {
      let preStagedExists = false;
      try {
        execSync("git diff --cached --quiet", { stdio: "pipe" });
      } catch {
        preStagedExists = true;
      }

      execSync("git add package.json", { stdio: "pipe" });
      if (eff.changelog) execSync("git add CHANGELOG.md", { stdio: "pipe" });

      if (!preStagedExists) {
        execSync("git add .", { stdio: "pipe" });
        ok("Staged all changes");
      } else {
        ok("Pre-staged changes detected — staged package.json alongside them");
      }

      execSync(`git commit -m ${JSON.stringify(commitMsg)}`, { stdio: "pipe" });
      ok(`Committed  ${dim('"' + commitMsg + '"')}`);
    }
  }

  if (pkg.scripts?.postversion && eff.commit) {
    warn("Running postversion hook...");
    if (!flags.dryRun) execSync("npm run postversion", { stdio: "inherit" });
  }

  if (eff.tag) {
    step(
      "Creating annotated tag" + (flags.dryRun ? `  ${dim("[dry-run]")}` : ""),
    );
    const tagName = `v${newVersion}`;
    if (flags.dryRun) {
      ok(dim(`Would create annotated tag ${tagName}`));
    } else {
      try {
        execSync(
          `git tag -a ${tagName} -m ${JSON.stringify(newVersion + ": " + message)}`,
          { stdio: "pipe" },
        );
        ok(`Annotated tag  ${c("cyan", tagName)}`);
      } catch {
        warn(`Tag ${tagName} already exists — skipped.`);
      }
    }
  }

  if (eff.push) {
    step("Pushing to origin" + (flags.dryRun ? `  ${dim("[dry-run]")}` : ""));
    if (flags.dryRun) {
      ok(
        dim(
          `Would push ${gitBranch}${eff.tag ? ` + tag v${newVersion}` : ""} → origin`,
        ),
      );
    } else {
      execSync(`git push origin ${gitBranch}`, { stdio: "inherit" });
      ok(`Branch  ${c("cyan", gitBranch)} pushed`);
      if (eff.tag) {
        execSync(`git push origin v${newVersion}`, { stdio: "inherit" });
        ok(`Tag  ${c("cyan", "v" + newVersion)} pushed`);
      }
    }
  }

  const finalLine = flags.dryRun
    ? c("yellow", b(`  ✓  DRY RUN COMPLETE — no changes written  `))
    : c(
        "green",
        b(`  ✓  RELEASED  v${newVersion}  on  ${gitBranch}  [${gitHash}]  `),
      );

  console.log(`\n${hr}`);
  console.log(finalLine);
  console.log(`${hr}\n`);

  if (!flags.dryRun) {
    console.log(
      `  ${dim("build:")}  ${buildNumber}    ${dim("epoch:")}  ${buildEpoch}`,
    );
    if (!eff.push && eff.commit) {
      const hint = `git push origin ${gitBranch}${eff.tag ? ` && git push origin v${newVersion}` : ""}`;
      console.log(`\n  ${c("yellow", "tip:")} ${dim(hint)}`);
    }
    console.log();
  }
}

main().catch((err) => {
  console.error(`\n${c("red", b("✗"))} ${err.message ?? String(err)}\n`);
  process.exit(1);
});
