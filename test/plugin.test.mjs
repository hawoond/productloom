import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const repositoryRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const pluginRoot = path.join(repositoryRoot, "plugins", "productloom");

test("plugin manifest and marketplace entry agree", () => {
  const plugin = JSON.parse(
    fs.readFileSync(path.join(pluginRoot, ".codex-plugin", "plugin.json"), "utf8")
  );
  const marketplace = JSON.parse(
    fs.readFileSync(path.join(repositoryRoot, ".agents", "plugins", "marketplace.json"), "utf8")
  );

  assert.equal(plugin.name, "productloom");
  assert.match(plugin.version, /^\d+\.\d+\.\d+$/);
  assert.equal(plugin.author.name, "hawoond");
  assert.equal(plugin.interface.displayName, "ProductLoom");
  assert.equal(marketplace.name, "productloom");
  assert.equal(marketplace.plugins[0].name, plugin.name);
  assert.equal(marketplace.plugins[0].source.path, "./plugins/productloom");
});

test("all bundled skills are complete and named consistently", () => {
  const skillsRoot = path.join(pluginRoot, "skills");
  const skills = fs.readdirSync(skillsRoot, { withFileTypes: true }).filter((entry) => entry.isDirectory());
  assert.equal(skills.length, 7);

  for (const skill of skills) {
    const skillFile = path.join(skillsRoot, skill.name, "SKILL.md");
    const metadataFile = path.join(skillsRoot, skill.name, "agents", "openai.yaml");
    const content = fs.readFileSync(skillFile, "utf8");
    assert.ok(fs.existsSync(metadataFile), `${skill.name} is missing agents/openai.yaml`);
    assert.match(content, new RegExp(`name: ${skill.name}`));
    assert.doesNotMatch(content, /\[TODO:|TODO\b/);
  }
});
