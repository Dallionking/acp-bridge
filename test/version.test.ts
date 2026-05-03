import assert from "node:assert/strict";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import { resolveAcpBridgeVersion } from "../src/version.js";

test("resolveAcpBridgeVersion prefers npm_package_version from env when package name is acp-bridge", () => {
  const version = resolveAcpBridgeVersion({
    env: {
      npm_package_name: "acp-bridge",
      npm_package_version: "9.9.9-ci",
    },
    packageJsonPath: "/definitely/missing/package.json",
  });
  assert.equal(version, "9.9.9-ci");
});

test("resolveAcpBridgeVersion ignores npm_package_version from non-acp-bridge package env", async () => {
  const tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), "acp-bridge-version-test-"));
  try {
    const packagePath = path.join(tmpDir, "package.json");
    await fs.writeFile(
      packagePath,
      `${JSON.stringify({ name: "acp-bridge", version: "1.2.3" }, null, 2)}\n`,
      "utf8",
    );
    const version = resolveAcpBridgeVersion({
      env: {
        npm_package_name: "some-other-package",
        npm_package_version: "2026.2.25",
      },
      packageJsonPath: packagePath,
    });
    assert.equal(version, "1.2.3");
  } finally {
    await fs.rm(tmpDir, { recursive: true, force: true });
  }
});

test("resolveAcpBridgeVersion reads version from package.json when env is unset", async () => {
  const tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), "acp-bridge-version-test-"));
  try {
    const packagePath = path.join(tmpDir, "package.json");
    await fs.writeFile(
      packagePath,
      `${JSON.stringify({ name: "acp-bridge", version: "1.2.3" }, null, 2)}\n`,
      "utf8",
    );
    const version = resolveAcpBridgeVersion({
      env: {},
      packageJsonPath: packagePath,
    });
    assert.equal(version, "1.2.3");
  } finally {
    await fs.rm(tmpDir, { recursive: true, force: true });
  }
});

test("resolveAcpBridgeVersion falls back to unknown when version cannot be resolved", () => {
  const version = resolveAcpBridgeVersion({
    env: {},
    packageJsonPath: "/definitely/missing/package.json",
  });
  assert.equal(version, "0.0.0-unknown");
});

test("resolveAcpBridgeVersion ignores blank env versions and blank package versions", async () => {
  const tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), "acp-bridge-version-test-"));
  try {
    const packagePath = path.join(tmpDir, "package.json");
    await fs.writeFile(
      packagePath,
      `${JSON.stringify({ name: "acp-bridge", version: "   " }, null, 2)}\n`,
      "utf8",
    );
    const version = resolveAcpBridgeVersion({
      env: {
        npm_package_name: "acp-bridge",
        npm_package_version: "   ",
      },
      packageJsonPath: packagePath,
    });
    assert.equal(version, "0.0.0-unknown");
  } finally {
    await fs.rm(tmpDir, { recursive: true, force: true });
  }
});

test("getAcpBridgeVersion caches the first resolved version", async () => {
  const versionModuleUrl = new URL(`../src/version.js?cachebust=${Date.now()}`, import.meta.url);
  const previousName = process.env.npm_package_name;
  const previousVersion = process.env.npm_package_version;

  process.env.npm_package_name = "acp-bridge";
  process.env.npm_package_version = "7.8.9";

  try {
    const freshModule = (await import(versionModuleUrl.href)) as typeof import("../src/version.js");
    assert.equal(freshModule.getAcpBridgeVersion(), "7.8.9");

    process.env.npm_package_version = "9.9.9";
    assert.equal(freshModule.getAcpBridgeVersion(), "7.8.9");
  } finally {
    if (previousName === undefined) {
      delete process.env.npm_package_name;
    } else {
      process.env.npm_package_name = previousName;
    }
    if (previousVersion === undefined) {
      delete process.env.npm_package_version;
    } else {
      process.env.npm_package_version = previousVersion;
    }
  }
});
