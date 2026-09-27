// @vitest-environment node
import { describe, expect, it } from "vitest";
import { normalize } from "../scripts/fix-esm-extensions.mjs";

/**
 * The published output is rewritten after the build, and this decides whether the
 * rewrite finds anything at all. An earlier version dropped empty path segments,
 * which ate the leading `/` — so on Linux every lookup missed, every specifier
 * stayed extensionless, and the package failed on `import` in CI while passing on
 * every Windows machine. Windows has no leading separator to lose, so local runs
 * could never have caught it.
 *
 * Both path shapes are therefore pinned here, not just the one this machine
 * happens to produce.
 */
describe("normalize", () => {
  const linux = "/home/runner/work/TEAui/TEAui/packages/core/dist";
  const windows = "E:/Lukas/CODING/TEAui/packages/core/dist";

  it.each([
    ["posix", linux],
    ["win32", windows],
  ])("keeps the path absolute on %s", (_platform, base) => {
    const result = normalize(base, "./layout");

    expect(result).toBe(`${base}/layout`);
    expect(result.startsWith("/") || /^[A-Z]:\//.test(result)).toBe(true);
  });

  it.each([
    ["posix", linux],
    ["win32", windows],
  ])("resolves a directory import on %s", (_platform, base) => {
    expect(normalize(base, "./feedback")).toBe(`${base}/feedback`);
  });

  it.each([
    ["posix", linux],
    ["win32", windows],
  ])("resolves a parent import on %s", (_platform, base) => {
    expect(normalize(`${base}/feedback`, "../internal")).toBe(`${base}/internal`);
  });

  it("accepts backslashes from a Windows path", () => {
    expect(normalize("E:\\Lukas\\CODING\\TEAui\\packages\\core\\dist", "./layout")).toBe(
      `${windows}/layout`,
    );
  });

  it("normalises a relative base the same way Node does", () => {
    expect(normalize("packages/core/dist", "./layout")).toBe("packages/core/dist/layout");
  });
});
