import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { spawnSync } from "node:child_process";
import test from "node:test";
import { fileURLToPath } from "node:url";

const repositoryRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const cli = path.join(repositoryRoot, "bin", "productloom.mjs");

function run(args, cwd = repositoryRoot) {
  return spawnSync(process.execPath, [cli, ...args], {
    cwd,
    encoding: "utf8"
  });
}

function temporaryDirectory() {
  return fs.mkdtempSync(path.join(os.tmpdir(), "productloom-"));
}

test("prints the package version", () => {
  const result = run(["--version"]);
  assert.equal(result.status, 0, result.stderr);
  assert.equal(result.stdout.trim(), "0.1.0");
});

test("initializes a usable workspace and generates a screen", () => {
  const directory = temporaryDirectory();
  try {
    const initialized = run(["init", directory, "--name", "Sample Product"]);
    assert.equal(initialized.status, 0, initialized.stderr);
    assert.ok(fs.existsSync(path.join(directory, ".productloom", "workspace.json")));

    const generated = run([
      "new",
      "screen",
      "--root",
      directory,
      "--product",
      "app",
      "--screen",
      "home"
    ]);
    assert.equal(generated.status, 0, generated.stderr);
    assert.ok(fs.existsSync(path.join(directory, "product", "en", "spec", "app", "home", "spec.md")));
    assert.ok(fs.existsSync(path.join(directory, "product", "en", "design", "app", "home", "plan.md")));

    const validated = run(["validate", directory, "--mode", "strict"]);
    assert.equal(validated.status, 0, validated.stdout + validated.stderr);
    assert.match(validated.stdout, /ProductLoom Validate: PASS/);
  } finally {
    fs.rmSync(directory, { recursive: true, force: true });
  }
});

test("strict validation fails when a spec and flow pair is incomplete", () => {
  const directory = temporaryDirectory();
  try {
    assert.equal(run(["init", directory]).status, 0);
    assert.equal(
      run(["new", "screen", "--root", directory, "--product", "app", "--screen", "checkout"]).status,
      0
    );
    fs.rmSync(path.join(directory, "product", "en", "spec", "app", "checkout", "flow.md"));

    const result = run(["validate", directory, "--mode", "strict"]);
    assert.equal(result.status, 1, result.stdout + result.stderr);
    assert.match(result.stdout, /SPEC003/);
  } finally {
    fs.rmSync(directory, { recursive: true, force: true });
  }
});

test("PLW migration is dry-run by default and non-destructive when applied", () => {
  const directory = temporaryDirectory();
  try {
    const dryRun = run(["migrate", directory, "--from", "plw"]);
    assert.equal(dryRun.status, 0, dryRun.stderr);
    assert.match(dryRun.stdout, /DRY RUN/);
    assert.equal(fs.existsSync(path.join(directory, ".productloom", "workspace.json")), false);

    const applied = run(["migrate", directory, "--from", "plw", "--apply"]);
    assert.equal(applied.status, 0, applied.stderr);
    const config = JSON.parse(
      fs.readFileSync(path.join(directory, ".productloom", "workspace.json"), "utf8")
    );
    assert.deepEqual(config.locales, ["KR"]);
    assert.deepEqual(config.products, ["admin", "client"]);
    assert.equal(config.documents.root, "KR");
    assert.equal(config.profile, "plw-compat");
  } finally {
    fs.rmSync(directory, { recursive: true, force: true });
  }
});

test("bundled example passes strict validation", () => {
  const result = run(["validate", path.join(repositoryRoot, "examples", "minimal"), "--mode", "strict"]);
  assert.equal(result.status, 0, result.stdout + result.stderr);
  assert.match(result.stdout, /ProductLoom Validate: PASS/);
});
