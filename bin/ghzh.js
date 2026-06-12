#!/usr/bin/env node
import { spawnSync } from "node:child_process";
import { existsSync, mkdirSync, rmSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const command = process.argv[2] || "help";

const extensionFiles = [
  "manifest.json",
  "assets/icons",
  "popup.html",
  "options.html",
  "src",
  "styles",
  "README.md",
  "LICENSE"
];

if (command === "pack") {
  pack();
} else if (command === "install") {
  install();
} else {
  help();
}

function help() {
  console.log(`GitHub 中文语义助手

Usage:
  ghzh pack      Build dist/github-zh-semantic-assistant.zip
  ghzh install   Open Chrome extensions page and print the load path

Chrome blocks silent extension installs outside Chrome Web Store or enterprise policy.
Use install to open the correct page, then choose Load unpacked and select:
${root}
`);
}

function pack() {
  const dist = resolve(root, "dist");
  const zipPath = resolve(dist, "github-zh-semantic-assistant.zip");
  mkdirSync(dist, { recursive: true });
  if (existsSync(zipPath)) rmSync(zipPath);

  const result = spawnSync("zip", ["-qr", zipPath, ...extensionFiles], {
    cwd: root,
    stdio: "inherit"
  });

  if (result.status !== 0) {
    console.error("zip command failed. Install zip or package the listed files manually.");
    process.exit(result.status || 1);
  }

  console.log(`Packed: ${zipPath}`);
}

function install() {
  const chromeUrl = "chrome://extensions";
  const opener = process.platform === "darwin" ? "open" : process.platform === "win32" ? "start" : "xdg-open";
  const args = process.platform === "win32" ? [chromeUrl] : ["-a", "Google Chrome", chromeUrl];
  const fallbackArgs = process.platform === "win32" ? [chromeUrl] : [chromeUrl];
  const result = spawnSync(opener, args, { stdio: "ignore", shell: process.platform === "win32" });
  if (result.status !== 0) spawnSync(opener, fallbackArgs, { stdio: "ignore", shell: process.platform === "win32" });

  console.log(`Chrome extensions page opened.

Turn on Developer mode, choose Load unpacked, then select:
${root}

Shortcuts after loading:
  Alt+Shift+G  Toggle extension
  Alt+Shift+T  Translate current GitHub page
`);
}
