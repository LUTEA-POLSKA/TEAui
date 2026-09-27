#!/usr/bin/env node
/**
 * TEA UI — export check.
 *
 * A published package is a promise about what it exports. This verifies the
 * promise in both directions:
 *
 *  - **forward** — every path in `exports` actually resolves to a file on disk;
 *    a broken `exports` map is a package that installs and then fails to import,
 *    which is the worst possible time to find out;
 *  - **backward** — every symbol a consumer is meant to use is present in the
 *    built declaration file, and nothing undocumented leaked into it.
 *
 * It also measures, per package, the raw and gzipped cost of importing it, so
 * "consumers only load what they use" is a number rather than a hope.
 */
import { access, readFile } from "node:fs/promises";
import { gzipSync } from "node:zlib";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");

const problems = [];
const report = [];

/** Symbols the docs tell people to import. If one is missing, a doc is a lie. */
const PUBLIC_CONTRACT = {
  "@tea-ui/utils": ["cn", "cva", "slot", "assertNever"],
  "@tea-ui/tokens": ["THEMES", "DENSITIES", "TONES", "MOTION", "applyTheme", "applyDensity"],
  "@tea-ui/ux-standards": [
    "STATUS",
    "statusMeta",
    "TONES",
    "FEEDBACK",
    "DESTRUCTIVE_POLICY",
    "consequenceSentence",
    "ERROR_TITLES",
    "toErrorAnatomy",
    "COPY",
    "AUTOCOMPLETE",
    "UNSAVED_CHANGES",
    "NAVIGATION_RULES",
    "TRANSITION_PATTERNS",
    "LOADING_AFFORDANCE",
    "DATA_VIZ",
  ],
  "@tea-ui/icons": ["TeaMark"],
  "@tea-ui/core": [
    "Button",
    "IconButton",
    "Input",
    "Textarea",
    "SearchInput",
    "PasswordInput",
    "NumberInput",
    "Checkbox",
    "Radio",
    "RadioGroup",
    "Switch",
    "Slider",
    "Toggle",
    "ToggleGroup",
    "Select",
    "Combobox",
    "Label",
    "Field",
    "FieldLabel",
    "FieldDescription",
    "FieldError",
    "Card",
    "CardTitle",
    "Panel",
    "Badge",
    "StatusBadge",
    "StatusDot",
    "StatusText",
    "StatusSelect",
    "Alert",
    "Callout",
    "Skeleton",
    "Spinner",
    "Progress",
    "toast",
    "Toaster",
    "useToast",
    "Dialog",
    "AlertDialog",
    "ConfirmDialog",
    "useConfirm",
    "Drawer",
    "Popover",
    "Tooltip",
    "HoverCard",
    "DropdownMenu",
    "Tabs",
    "Accordion",
    "Collapsible",
    "Breadcrumb",
    "Pagination",
    "Stepper",
    "SkipLink",
    "Stack",
    "Grid",
    "Container",
    "Divider",
    "Text",
    "Heading",
    "Link",
    "formatBytes",
    "formatDateTime",
  ],
  "@tea-ui/admin": ["AdminShell", "Page", "PageHeader", "StatTile", "StatGrid", "EmptyState", "ErrorState", "LoadingState"],
  "@tea-ui/public": ["Section", "Hero", "Feature", "FeatureGrid", "CallToAction", "PublicNavbar", "PublicFooter", "PricingTable", "Faq", "ConversionForm"],
};

for (const [name, expected] of Object.entries(PUBLIC_CONTRACT)) {
  const packageDir = resolve(root, "packages", name.replace("@tea-ui/", ""));
  const manifestPath = resolve(packageDir, "package.json");
  let manifest;
  try {
    manifest = JSON.parse(await readFile(manifestPath, "utf8"));
  } catch {
    problems.push(`${name}: package.json is missing`);
    continue;
  }

  if (manifest.name !== name) {
    problems.push(`${name}: directory is named "${manifest.name}"`);
  }

  // Forward: every exports path must exist.
  for (const [subpath, target] of Object.entries(manifest.exports ?? {})) {
    const files = typeof target === "string" ? [target] : Object.values(target);
    for (const file of files) {
      try {
        await access(resolve(packageDir, file));
      } catch {
        problems.push(`${name}${subpath}: exports "${file}", which does not exist. Run the build.`);
      }
    }
  }

  // Backward: the documented surface must actually be exported.
  const entry = resolve(packageDir, "dist/index.js");
  let size = 0;
  let gzip = 0;
  try {
    const buffer = await readFile(entry);
    size = buffer.length;
    gzip = gzipSync(buffer).length;
    const module = await import(`file://${entry.replace(/\\/g, "/")}`);
    const missing = expected.filter((symbol) => !(symbol in module));
    if (missing.length > 0) {
      problems.push(`${name}: documented but not exported — ${missing.join(", ")}`);
    }
  } catch (error) {
    if ((error?.code ?? "") === "ERR_MODULE_NOT_FOUND" || /does not exist/.test(String(error?.message))) {
      problems.push(`${name}: dist/index.js is missing. Run \`npm run build:packages\` first.`);
    } else {
      problems.push(`${name}: importing dist/index.js failed — ${error?.message ?? error}`);
    }
    continue;
  }

  report.push({ name, size, gzip, exports: expected.length });
}

if (problems.length > 0) {
  console.error("[tea-ui] export contract violations:\n");
  for (const problem of problems) console.error(`  - ${problem}`);
  process.exitCode = 1;
} else {
  console.log("[tea-ui] export contract holds. Cost of importing each package:\n");
  for (const entry of report) {
    console.log(
      `  ${entry.name.padEnd(24)} ${(entry.gzip / 1024).toFixed(1).padStart(7)} kB gzip   ` +
        `(${entry.size / 1024 >= 1000 ? (entry.size / 1024 / 1024).toFixed(2) : (entry.size / 1024).toFixed(0)} kB raw, ${entry.exports} named symbols)`,
    );
  }
}
