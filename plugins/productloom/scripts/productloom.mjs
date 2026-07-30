#!/usr/bin/env node

import fs from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const CONFIG_DIRECTORY = ".productloom";
const CONFIG_FILE = "workspace.json";
const SCRIPT_PATH = fileURLToPath(import.meta.url);
const TEMPLATE_DIRECTORY = fileURLToPath(new URL("../assets/templates/", import.meta.url));
const PROFILE_DIRECTORY = fileURLToPath(new URL("../assets/profiles/", import.meta.url));
const DOCUMENT_TYPES = new Set([
  "brief",
  "meeting",
  "reference",
  "feedback",
  "spec",
  "flow",
  "plan",
  "components",
  "tokens",
  "figma"
]);
const EXTERNAL_REFERENCE = /^(?:https?:\/\/|figma:|drive:|notion:)/i;

function toPosix(value) {
  return value.split(path.sep).join("/");
}

function today() {
  return new Date().toISOString().slice(0, 10);
}

function titleCase(value) {
  return String(value)
    .split(/[-_.\s]+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function slugify(value) {
  return String(value)
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .replace(/-{2,}/g, "-");
}

function assertSegment(value, label) {
  if (!/^[a-z0-9][a-z0-9._-]*$/i.test(String(value))) {
    throw new Error(`${label} must contain only letters, numbers, dots, underscores, and hyphens.`);
  }
  return String(value);
}

function parseArguments(argv) {
  const positional = [];
  const options = {};

  for (let index = 0; index < argv.length; index += 1) {
    const token = argv[index];
    if (!token.startsWith("--")) {
      positional.push(token);
      continue;
    }

    const [rawKey, inlineValue] = token.slice(2).split(/=(.*)/s, 2);
    if (inlineValue !== undefined) {
      options[rawKey] = inlineValue;
      continue;
    }

    const next = argv[index + 1];
    if (next !== undefined && !next.startsWith("--")) {
      options[rawKey] = next;
      index += 1;
    } else {
      options[rawKey] = true;
    }
  }

  return { positional, options };
}

function commaList(value, fallback = []) {
  if (value === undefined || value === null || value === "") return [...fallback];
  if (Array.isArray(value)) return value.map(String);
  return String(value)
    .split(",")
    .map((entry) => entry.trim())
    .filter(Boolean);
}

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

function writeJson(filePath, value) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, `${JSON.stringify(value, null, 2)}\n`, "utf8");
}

function copy(value) {
  return JSON.parse(JSON.stringify(value));
}

function loadProfile(name) {
  const normalized = name === "cws" ? "cws-compat" : name;
  const profilePath = path.join(PROFILE_DIRECTORY, `${normalized}.json`);
  if (!fs.existsSync(profilePath)) {
    throw new Error(`Unknown profile "${name}". Available profiles: default, cws-compat.`);
  }
  return readJson(profilePath);
}

function mergeObjects(base, override) {
  if (Array.isArray(override)) return [...override];
  if (!override || typeof override !== "object") return override;

  const result = { ...(base && typeof base === "object" ? base : {}) };
  for (const [key, value] of Object.entries(override)) {
    result[key] =
      value && typeof value === "object" && !Array.isArray(value)
        ? mergeObjects(result[key], value)
        : copy(value);
  }
  return result;
}

function workspaceConfig(profileName, values = {}) {
  const profile = loadProfile(profileName);
  const namespace = slugify(values.namespace || values.name || "my-product") || "my-product";
  const config = mergeObjects(profile, {
    name: values.name || titleCase(namespace),
    namespace,
    locales: values.locales || profile.locales,
    products: values.products || profile.products
  });
  config.profile = profileName === "cws" ? "cws-compat" : profileName;
  return config;
}

function configPath(root) {
  return path.join(root, CONFIG_DIRECTORY, CONFIG_FILE);
}

function findWorkspace(startPath = process.cwd()) {
  let current = path.resolve(startPath);
  if (fs.existsSync(current) && fs.statSync(current).isFile()) current = path.dirname(current);

  while (true) {
    const candidate = configPath(current);
    if (fs.existsSync(candidate)) return { root: current, configPath: candidate };
    const parent = path.dirname(current);
    if (parent === current) break;
    current = parent;
  }
  return null;
}

function loadWorkspace(startPath = process.cwd()) {
  const found = findWorkspace(startPath);
  if (!found) {
    throw new Error(
      `No ${CONFIG_DIRECTORY}/${CONFIG_FILE} found. Run "productloom init" first.`
    );
  }
  const config = readJson(found.configPath);
  return { ...found, config };
}

function fillPattern(pattern, values) {
  return String(pattern).replace(/\{([a-zA-Z][a-zA-Z0-9]*)\}/g, (_, key) => {
    if (values[key] === undefined) throw new Error(`Missing path value: ${key}`);
    return String(values[key]);
  });
}

function pathContext(config, values = {}) {
  return {
    root: config.documents.root,
    namespace: config.namespace,
    locale: values.locale || config.locales[0],
    product: values.product || config.products[0],
    screen: values.screen || "general",
    layer: values.layer || "raw",
    docType: values.docType || "brief"
  };
}

function resolveDocumentPath(config, layer, values = {}) {
  const pattern = config.documents.paths[layer];
  if (!pattern) throw new Error(`No path pattern configured for layer "${layer}".`);
  return fillPattern(pattern, pathContext(config, { ...values, layer }));
}

function resolveDocumentId(config, values) {
  return fillPattern(config.documents.idPattern, pathContext(config, values)).toLowerCase();
}

function renderTemplate(templateName, values) {
  const templatePath = path.join(TEMPLATE_DIRECTORY, `${templateName}.md`);
  let content = fs.readFileSync(templatePath, "utf8");
  for (const [key, value] of Object.entries(values)) {
    content = content.replaceAll(`{{${key}}}`, String(value));
  }
  return content;
}

function writeFileSafely(filePath, content, force = false) {
  if (fs.existsSync(filePath) && !force) return false;
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, content, "utf8");
  return true;
}

function createWorkspaceDirectories(root, config) {
  for (const locale of config.locales) {
    const rawRoot = path.join(
      root,
      resolveDocumentPath(config, "raw", { locale, product: config.products[0], screen: "general" })
    );
    for (const category of ["briefs", "meetings", "references", "feedback"]) {
      fs.mkdirSync(path.join(rawRoot, category), { recursive: true });
    }

    for (const product of config.products) {
      const specRoot = path.dirname(
        path.join(root, resolveDocumentPath(config, "spec", { locale, product, screen: "_" }))
      );
      const designRoot = path.dirname(
        path.join(root, resolveDocumentPath(config, "design", { locale, product, screen: "_" }))
      );
      fs.mkdirSync(specRoot, { recursive: true });
      fs.mkdirSync(designRoot, { recursive: true });
    }
  }
}

function initCommand(parsed) {
  const target = path.resolve(parsed.positional[1] || parsed.options.root || process.cwd());
  const profileName = String(parsed.options.profile || "default");
  const existing = configPath(target);
  if (fs.existsSync(existing) && !parsed.options.force) {
    throw new Error(`${toPosix(path.relative(process.cwd(), existing))} already exists. Use --force to replace it.`);
  }

  const directoryName = path.basename(target);
  const localeOption = parsed.options.locales || parsed.options.locale;
  const productOption = parsed.options.products || parsed.options.product;
  const config = workspaceConfig(profileName, {
    name: parsed.options.name || titleCase(directoryName),
    namespace: parsed.options.namespace || slugify(directoryName),
    locales: localeOption ? commaList(localeOption) : undefined,
    products: productOption ? commaList(productOption) : undefined
  });

  if (config.locales.length === 0) config.locales = ["en"];
  if (config.products.length === 0) config.products = ["app"];

  writeJson(existing, config);
  createWorkspaceDirectories(target, config);

  console.log(`Initialized ProductLoom in ${target}`);
  console.log(`Config: ${toPosix(path.relative(target, existing))}`);
  console.log(
    `Next: productloom new screen --root "${target}" --product ${config.products[0]} --screen home`
  );
  return 0;
}

function screenTemplateValues(workspace, values) {
  const { config, root } = workspace;
  const locale = assertSegment(values.locale || config.locales[0], "locale");
  const product = assertSegment(values.product || config.products[0], "product");
  const screen = assertSegment(values.screen, "screen");
  const title = values.title || titleCase(screen);
  const date = today();
  const status = values.status || config.documents.defaultStatus;
  const owners = commaList(values.owners, []).map((owner) => JSON.stringify(owner)).join(", ");
  const specDirectory = resolveDocumentPath(config, "spec", { locale, product, screen });
  const designDirectory = resolveDocumentPath(config, "design", { locale, product, screen });
  const specPath = toPosix(path.join(specDirectory, "spec.md"));
  const flowPath = toPosix(path.join(specDirectory, "flow.md"));

  return {
    root,
    locale,
    product,
    screen,
    title,
    date,
    status,
    owners: `[${owners}]`,
    specDirectory,
    designDirectory,
    specPath,
    flowPath
  };
}

function createScreen(workspace, options) {
  if (!options.screen) throw new Error("--screen is required.");
  const values = screenTemplateValues(workspace, options);
  const definitions = [
    { layer: "spec", type: "spec", file: "spec.md", refs: [] },
    { layer: "spec", type: "flow", file: "flow.md", refs: [values.specPath] },
    {
      layer: "design",
      type: "plan",
      file: "plan.md",
      refs: [values.specPath, values.flowPath]
    },
    {
      layer: "design",
      type: "components",
      file: "components.md",
      refs: [values.specPath, values.flowPath]
    },
    {
      layer: "design",
      type: "tokens",
      file: "tokens.md",
      refs: [values.specPath, values.flowPath]
    }
  ];

  const created = [];
  const skipped = [];
  for (const definition of definitions) {
    const directory =
      definition.layer === "spec" ? values.specDirectory : values.designDirectory;
    const relativePath = toPosix(path.join(directory, definition.file));
    const absolutePath = path.join(workspace.root, relativePath);
    const id = resolveDocumentId(workspace.config, {
      locale: values.locale,
      product: values.product,
      screen: values.screen,
      layer: definition.layer,
      docType: definition.type
    });
    const content = renderTemplate(definition.type, {
      ID: id,
      TITLE: values.title,
      DOC_TYPE: definition.type,
      PRODUCT: values.product,
      LOCALE_KEY: workspace.config.documents.localeField,
      LOCALE: values.locale,
      STATUS: values.status,
      OWNERS: values.owners,
      DATE: values.date,
      SOURCE_REFS: JSON.stringify(definition.refs)
    });
    (writeFileSafely(absolutePath, content, Boolean(options.force)) ? created : skipped).push(
      relativePath
    );
  }

  console.log(`Screen: ${values.product}/${values.screen}`);
  for (const file of created) console.log(`CREATE ${file}`);
  for (const file of skipped) console.log(`SKIP   ${file}`);
  return 0;
}

function createRawDocument(workspace, type, options) {
  const categoryByType = {
    brief: "briefs",
    meeting: "meetings",
    reference: "references",
    feedback: "feedback"
  };
  const category = categoryByType[type];
  if (!category) throw new Error(`Unsupported raw document type "${type}".`);

  const locale = assertSegment(options.locale || workspace.config.locales[0], "locale");
  const product = assertSegment(options.product || workspace.config.products[0], "product");
  const screen = assertSegment(options.screen || "general", "screen");
  const slug = assertSegment(slugify(options.slug || options.title || type), "slug");
  const title = options.title || titleCase(slug);
  const rawRoot = resolveDocumentPath(workspace.config, "raw", { locale, product, screen });
  const fileName = type === "meeting" ? `${today()}-${slug}.md` : `${slug}.md`;
  const relativePath = toPosix(path.join(rawRoot, category, fileName));
  const absolutePath = path.join(workspace.root, relativePath);
  const id = resolveDocumentId(workspace.config, {
    locale,
    product,
    screen,
    layer: "raw",
    docType: type
  });
  const owners = commaList(options.owners, []).map((owner) => JSON.stringify(owner)).join(", ");
  const content = renderTemplate(type, {
    ID: id,
    TITLE: title,
    DOC_TYPE: type,
    PRODUCT: product,
    LOCALE_KEY: workspace.config.documents.localeField,
    LOCALE: locale,
    STATUS: options.status || workspace.config.documents.defaultStatus,
    OWNERS: `[${owners}]`,
    DATE: today(),
    SOURCE_REFS: "[]"
  });

  if (!writeFileSafely(absolutePath, content, Boolean(options.force))) {
    throw new Error(`${relativePath} already exists. Use --force to replace it.`);
  }
  console.log(`CREATE ${relativePath}`);
  return 0;
}

function newCommand(parsed) {
  const type = parsed.positional[1];
  if (!type) throw new Error("Document type is required. Use screen, brief, meeting, reference, or feedback.");
  const target = parsed.options.root || parsed.positional[2] || process.cwd();
  const workspace = loadWorkspace(target);
  if (type === "screen") return createScreen(workspace, parsed.options);
  return createRawDocument(workspace, type, parsed.options);
}

function parseScalar(value) {
  const trimmed = value.trim();
  if (trimmed === "") return "";
  if (trimmed === "true") return true;
  if (trimmed === "false") return false;
  if (trimmed === "null") return null;
  if (/^-?\d+(?:\.\d+)?$/.test(trimmed)) return Number(trimmed);
  if (trimmed.startsWith("[") && trimmed.endsWith("]")) {
    try {
      return JSON.parse(trimmed.replace(/'/g, "\""));
    } catch {
      return trimmed
        .slice(1, -1)
        .split(",")
        .map((item) => item.trim().replace(/^['"]|['"]$/g, ""))
        .filter(Boolean);
    }
  }
  return trimmed.replace(/^['"]|['"]$/g, "");
}

function parseFrontmatter(text) {
  const normalized = text.replace(/\r\n/g, "\n");
  if (!normalized.startsWith("---\n")) return { data: null, body: normalized, error: "missing" };
  const end = normalized.indexOf("\n---", 4);
  if (end === -1) return { data: null, body: normalized, error: "unterminated" };

  const data = {};
  let listKey = null;
  const lines = normalized.slice(4, end).split("\n");
  for (const line of lines) {
    const listMatch = line.match(/^\s*-\s+(.+)$/);
    if (listMatch && listKey) {
      if (!Array.isArray(data[listKey])) data[listKey] = [];
      data[listKey].push(parseScalar(listMatch[1]));
      continue;
    }

    const match = line.match(/^([A-Za-z_][A-Za-z0-9_-]*):\s*(.*)$/);
    if (!match) {
      listKey = null;
      continue;
    }
    const [, key, rawValue] = match;
    data[key] = parseScalar(rawValue);
    listKey = rawValue.trim() === "" ? key : null;
  }

  return { data, body: normalized.slice(end + 4).replace(/^\n/, ""), error: null };
}

function walkMarkdown(directory) {
  if (!fs.existsSync(directory)) return [];
  const results = [];
  const stack = [directory];
  while (stack.length > 0) {
    const current = stack.pop();
    for (const entry of fs.readdirSync(current, { withFileTypes: true })) {
      if (entry.name === ".git" || entry.name === "node_modules") continue;
      const fullPath = path.join(current, entry.name);
      if (entry.isDirectory()) stack.push(fullPath);
      else if (entry.isFile() && entry.name.endsWith(".md")) results.push(fullPath);
    }
  }
  return results.sort();
}

function inferLayer(relativePath) {
  const segments = toPosix(relativePath).split("/");
  for (const layer of ["raw", "spec", "design"]) {
    if (segments.includes(layer)) return layer;
  }
  return null;
}

function diagnostic(ruleId, severity, filePath, message, suggestedAction = "") {
  return { ruleId, severity, path: filePath, message, suggestedAction };
}

function workspaceDirectories(config) {
  const directories = new Set([config.documents.root]);
  for (const locale of config.locales) {
    directories.add(resolveDocumentPath(config, "raw", { locale, screen: "_", product: config.products[0] }));
    for (const product of config.products) {
      directories.add(
        path.dirname(resolveDocumentPath(config, "spec", { locale, product, screen: "_" }))
      );
      directories.add(
        path.dirname(resolveDocumentPath(config, "design", { locale, product, screen: "_" }))
      );
    }
  }
  return [...directories];
}

function resolveReference(root, documentPath, reference) {
  const withoutAnchor = String(reference).split("#", 1)[0];
  if (!withoutAnchor || EXTERNAL_REFERENCE.test(withoutAnchor)) return null;
  const fromRoot = path.resolve(root, withoutAnchor);
  if (fs.existsSync(fromRoot)) return fromRoot;
  return path.resolve(path.dirname(documentPath), withoutAnchor);
}

function inspectWorkspace(workspace, options = {}) {
  const { root, config } = workspace;
  const mode = options.mode || config.validation.mode || "strict";
  const gate = options.gate || "all";
  const diagnostics = [];

  if (config.schemaVersion !== 1) {
    diagnostics.push(
      diagnostic("CFG001", "error", `${CONFIG_DIRECTORY}/${CONFIG_FILE}`, "schemaVersion must be 1.")
    );
  }
  if (!Array.isArray(config.locales) || config.locales.length === 0) {
    diagnostics.push(diagnostic("CFG002", "error", `${CONFIG_DIRECTORY}/${CONFIG_FILE}`, "At least one locale is required."));
  }
  if (!Array.isArray(config.products) || config.products.length === 0) {
    diagnostics.push(diagnostic("CFG003", "error", `${CONFIG_DIRECTORY}/${CONFIG_FILE}`, "At least one product is required."));
  }

  for (const directory of workspaceDirectories(config)) {
    if (!fs.existsSync(path.join(root, directory))) {
      diagnostics.push(
        diagnostic("PATH001", "error", toPosix(directory), "Required workspace directory is missing.")
      );
    }
  }

  const registry = config.validation.sourceRegistry;
  if (registry?.required) {
    const registryPath = path.join(root, registry.path);
    if (!fs.existsSync(registryPath)) {
      diagnostics.push(
        diagnostic("REG001", "error", registry.path, "Required source registry is missing.")
      );
    } else {
      try {
        const registryData = readJson(registryPath);
        const imported = Array.isArray(registryData.files)
          ? registryData.files.filter((file) => file?.imported)
          : [];
        if (imported.length === 0) {
          diagnostics.push(
            diagnostic("REG002", "error", registry.path, "Source registry has no imported files.")
          );
        }
        for (const file of imported) {
          if (file?.path && !fs.existsSync(path.join(root, file.path))) {
            diagnostics.push(
              diagnostic("REG003", "error", file.path, "Imported registry path does not exist.")
            );
          }
        }
      } catch (error) {
        diagnostics.push(
          diagnostic("REG004", "error", registry.path, `Source registry is invalid JSON: ${error.message}`)
        );
      }
    }
  }

  const docsRoot = path.join(root, config.documents.root);
  const markdownFiles = walkMarkdown(docsRoot);
  const records = [];
  const ids = new Map();
  const localeField = config.documents.localeField || "locale";
  const requiredKeys =
    mode === "compat"
      ? ["id", "title", "doc_type", "product", localeField, "status"]
      : ["id", "title", "doc_type", "product", localeField, "status", "version"];

  for (const filePath of markdownFiles) {
    const relativePath = toPosix(path.relative(root, filePath));
    if (path.basename(filePath).toLowerCase() === "readme.md") continue;
    const parsed = parseFrontmatter(fs.readFileSync(filePath, "utf8"));
    if (parsed.error) {
      diagnostics.push(
        diagnostic(
          "DOC001",
          mode === "compat" ? "warning" : "error",
          relativePath,
          parsed.error === "missing" ? "YAML frontmatter is missing." : "YAML frontmatter is not terminated."
        )
      );
      continue;
    }

    const data = parsed.data;
    const layer = inferLayer(relativePath);
    records.push({ filePath, relativePath, data, body: parsed.body, layer });
    for (const key of requiredKeys) {
      if (data[key] === undefined || data[key] === "") {
        diagnostics.push(
          diagnostic(
            "DOC002",
            mode === "compat" ? "warning" : "error",
            relativePath,
            `Frontmatter field "${key}" is required.`
          )
        );
      }
    }

    if (data.id) {
      if (ids.has(data.id) && mode === "strict") {
        diagnostics.push(
          diagnostic("DOC003", "error", relativePath, `Duplicate document id "${data.id}".`)
        );
      } else if (!ids.has(data.id)) {
        ids.set(data.id, relativePath);
      }
    }

    if (mode === "strict") {
      if (data.doc_type && !DOCUMENT_TYPES.has(String(data.doc_type))) {
        diagnostics.push(
          diagnostic("DOC004", "error", relativePath, `Unsupported doc_type "${data.doc_type}".`)
        );
      }
      if (data.product && !config.products.includes(String(data.product))) {
        diagnostics.push(
          diagnostic("DOC005", "error", relativePath, `Unknown product "${data.product}".`)
        );
      }
      if (data[localeField] && !config.locales.includes(String(data[localeField]))) {
        diagnostics.push(
          diagnostic("DOC006", "error", relativePath, `Unknown ${localeField} "${data[localeField]}".`)
        );
      }
      if (data.status && !config.documents.statuses.includes(String(data.status))) {
        diagnostics.push(
          diagnostic("DOC007", "error", relativePath, `Unsupported status "${data.status}".`)
        );
      }
      if (data.version && !/^\d+\.\d+\.\d+(?:-[0-9A-Za-z.-]+)?$/.test(String(data.version))) {
        diagnostics.push(
          diagnostic("DOC008", "error", relativePath, `Invalid semantic version "${data.version}".`)
        );
      }

      const sourceRefs = Array.isArray(data.source_refs)
        ? data.source_refs
        : data.source_refs
          ? [data.source_refs]
          : [];
      for (const reference of sourceRefs) {
        const resolved = resolveReference(root, filePath, reference);
        if (resolved && !fs.existsSync(resolved)) {
          diagnostics.push(
            diagnostic("REF001", "error", relativePath, `source_refs target does not exist: ${reference}`)
          );
        }
      }

      if (/^##\s+Open Questions\b/im.test(parsed.body)) {
        const section = parsed.body
          .split(/^##\s+Open Questions\b/im)[1]
          ?.split(/^##\s+/m)[0]
          ?.trim();
        if (section && !/^(?:none|n\/a|없음|해당 없음)[.!]?$/i.test(section)) {
          diagnostics.push(
            diagnostic("SPEC008", "warning", relativePath, "Open Questions are still present.")
          );
        }
      }
    }
  }

  if (mode === "strict") {
    const screenPairs = new Map();
    for (const record of records.filter((item) => item.layer === "spec")) {
      const directory = path.dirname(record.relativePath);
      if (!screenPairs.has(directory)) screenPairs.set(directory, new Set());
      screenPairs.get(directory).add(path.basename(record.relativePath));
    }
    for (const [directory, files] of screenPairs) {
      if (files.has("spec.md") !== files.has("flow.md")) {
        diagnostics.push(
          diagnostic("SPEC003", "error", directory, "spec.md and flow.md must exist as a pair.")
        );
      }
    }

    const approvedSpecs = records.filter(
      (record) => record.data.doc_type === "spec" && record.data.status === "approved"
    );
    const requiredDesignDocs = config.validation.requiredDesignDocs || ["plan", "components", "tokens"];
    for (const spec of approvedSpecs) {
      const product = String(spec.data.product);
      const locale = String(spec.data[localeField]);
      const screen = path.basename(path.dirname(spec.relativePath));
      const designDirectory = path.join(
        root,
        resolveDocumentPath(config, "design", { locale, product, screen })
      );
      for (const docType of requiredDesignDocs) {
        const designPath = path.join(designDirectory, `${docType}.md`);
        if (!fs.existsSync(designPath)) {
          diagnostics.push(
            diagnostic(
              "READY001",
              gate === "implementation-readiness" ? "error" : "warning",
              toPosix(path.relative(root, designPath)),
              `Approved spec requires ${docType}.md before implementation.`
            )
          );
        }
      }
    }
  }

  const counts = diagnostics.reduce(
    (result, item) => {
      result[item.severity] += 1;
      return result;
    },
    { error: 0, warning: 0, info: 0 }
  );
  const status = counts.error > 0 ? "FAIL" : counts.warning > 0 ? "WARN" : "PASS";
  return {
    status,
    mode,
    gate,
    root,
    documents: records.length,
    counts,
    diagnostics,
    records
  };
}

function printInspection(result, format = "text") {
  if (format === "json") {
    const { records, ...jsonResult } = result;
    console.log(JSON.stringify(jsonResult, null, 2));
    return;
  }

  console.log(`ProductLoom Validate: ${result.status}`);
  console.log(`Mode: ${result.mode}`);
  console.log(`Gate: ${result.gate}`);
  console.log(`Documents: ${result.documents}`);
  console.log(
    `Errors: ${result.counts.error}  Warnings: ${result.counts.warning}  Info: ${result.counts.info}`
  );
  for (const item of result.diagnostics) {
    const label = item.severity === "error" ? "FAIL" : item.severity === "warning" ? "WARN" : "INFO";
    console.log(`[${label}] ${item.ruleId} ${item.path}: ${item.message}`);
  }
}

function validateCommand(parsed, strictOverride = false) {
  const target = parsed.options.root || parsed.positional[1] || process.cwd();
  const workspace = loadWorkspace(target);
  const result = inspectWorkspace(workspace, {
    mode: strictOverride ? "strict" : parsed.options.mode,
    gate: parsed.options.gate
  });
  printInspection(result, parsed.options.format || "text");
  const failOnWarn = Boolean(parsed.options["fail-on-warn"]);
  return result.counts.error > 0 || (failOnWarn && result.counts.warning > 0) ? 1 : 0;
}

function statusCommand(parsed) {
  const target = parsed.options.root || parsed.positional[1] || process.cwd();
  const workspace = loadWorkspace(target);
  const result = inspectWorkspace(workspace, { mode: parsed.options.mode || "strict" });
  const localeField = workspace.config.documents.localeField || "locale";
  const summary = {};

  for (const record of result.records) {
    const product = String(record.data.product || "unassigned");
    const layer = record.layer || "other";
    const status = String(record.data.status || "unknown");
    summary[product] ??= {};
    summary[product][layer] ??= {};
    summary[product][layer][status] = (summary[product][layer][status] || 0) + 1;
  }

  if ((parsed.options.format || "text") === "json") {
    console.log(
      JSON.stringify(
        {
          workspace: workspace.config.name,
          namespace: workspace.config.namespace,
          locales: workspace.config.locales,
          products: workspace.config.products,
          localeField,
          validation: result.status,
          summary
        },
        null,
        2
      )
    );
  } else {
    console.log(`${workspace.config.name} (${workspace.config.namespace})`);
    console.log(`Validation: ${result.status}`);
    for (const [product, layers] of Object.entries(summary)) {
      console.log(`\n${product}`);
      for (const [layer, statuses] of Object.entries(layers)) {
        const details = Object.entries(statuses)
          .map(([status, count]) => `${status}=${count}`)
          .join(", ");
        console.log(`  ${layer}: ${details}`);
      }
    }
  }
  return result.counts.error > 0 ? 1 : 0;
}

function commandAvailable(command, args = ["--version"]) {
  try {
    execFileSync(command, args, { stdio: "ignore" });
    return true;
  } catch {
    return false;
  }
}

function doctorCommand(parsed) {
  const target = parsed.options.root || parsed.positional[1] || process.cwd();
  const checks = [];
  const nodeMajor = Number(process.versions.node.split(".")[0]);
  checks.push({
    name: "Node.js 20+",
    pass: nodeMajor >= 20,
    detail: process.versions.node
  });
  checks.push({
    name: "Git",
    pass: commandAvailable("git"),
    detail: commandAvailable("git") ? "available" : "not found"
  });
  checks.push({
    name: "GitHub CLI",
    pass: commandAvailable("gh"),
    optional: true,
    detail: commandAvailable("gh") ? "available" : "not found"
  });
  const workspace = findWorkspace(target);
  checks.push({
    name: "Workspace config",
    pass: Boolean(workspace),
    detail: workspace ? toPosix(workspace.configPath) : "not found"
  });
  if (workspace) {
    try {
      readJson(workspace.configPath);
      checks.push({ name: "Workspace JSON", pass: true, detail: "valid" });
    } catch (error) {
      checks.push({ name: "Workspace JSON", pass: false, detail: error.message });
    }
  }

  for (const check of checks) {
    const label = check.pass ? "PASS" : check.optional ? "WARN" : "FAIL";
    console.log(`[${label}] ${check.name}: ${check.detail}`);
  }
  return checks.some((check) => !check.pass && !check.optional) ? 1 : 0;
}

function migrateCommand(parsed) {
  const source = String(parsed.options.from || "");
  if (source !== "cws") throw new Error('Only "--from cws" is supported.');
  const target = path.resolve(parsed.options.root || parsed.positional[1] || process.cwd());
  const output = configPath(target);
  const config = workspaceConfig("cws-compat", {
    name: parsed.options.name || titleCase(path.basename(target)),
    namespace: parsed.options.namespace || slugify(path.basename(target))
  });
  const apply = Boolean(parsed.options.apply);

  if (!apply) {
    console.log(`DRY RUN ${toPosix(output)}`);
    console.log("No documents will be moved or renamed.");
    console.log('Apply with: productloom migrate --from cws --apply');
    return 0;
  }
  if (fs.existsSync(output) && !parsed.options.force) {
    throw new Error(`${output} already exists. Use --force to replace it.`);
  }
  writeJson(output, config);
  console.log(`CREATE ${toPosix(output)}`);
  console.log("Existing documents were not moved or renamed.");
  return 0;
}

function printHelp() {
  console.log(`ProductLoom

Usage:
  productloom init [path] [--profile default|cws-compat]
  productloom new screen --product <name> --screen <name> [--title <title>]
  productloom new brief|meeting|reference|feedback [--title <title>] [--slug <slug>]
  productloom validate [path] [--mode compat|strict] [--gate <gate>] [--format text|json]
  productloom audit [path] [--format text|json]
  productloom status [path] [--format text|json]
  productloom doctor [path]
  productloom migrate [path] --from cws [--apply]

Common options:
  --root <path>       Workspace root
  --locale <name>     Locale to use
  --product <name>    Product area to use
  --force             Replace an existing generated file
  --fail-on-warn      Return a non-zero exit code for warnings

Examples:
  productloom init
  productloom new screen --product app --screen checkout
  productloom validate --mode strict
`);
}

export async function runCli(argv = process.argv.slice(2)) {
  try {
    const parsed = parseArguments(argv);
    const command = parsed.positional[0] || (parsed.options.version ? "version" : "help");
    if (command === "help" || command === "--help" || command === "-h") {
      printHelp();
      return 0;
    }
    if (command === "version" || command === "--version" || command === "-v") {
      console.log("0.1.0");
      return 0;
    }
    if (command === "init") return initCommand(parsed);
    if (command === "new") return newCommand(parsed);
    if (command === "validate") return validateCommand(parsed, false);
    if (command === "audit") return validateCommand(parsed, true);
    if (command === "status") return statusCommand(parsed);
    if (command === "doctor") return doctorCommand(parsed);
    if (command === "migrate") return migrateCommand(parsed);
    throw new Error(`Unknown command "${command}". Run "productloom help".`);
  } catch (error) {
    console.error(`ProductLoom: ${error.message}`);
    return 2;
  }
}

if (process.argv[1] && path.resolve(process.argv[1]) === path.resolve(SCRIPT_PATH)) {
  process.exitCode = await runCli(process.argv.slice(2));
}
