# Plugin Sync

Install a plugin once, get it in every vault.

Obsidian keeps plugins per vault, so with several vaults you end up downloading and updating the same plugins over and over. This plugin copies the plugins from one vault into the others, in one click.

> **Desktop only.** Syncing means writing into folders outside the current vault, which needs Node's filesystem access — not available on mobile. For the same reason this plugin is not, and cannot be, in the official community plugin store; install it with BRAT or by hand.

## Features

- **No paths to type.** Your vaults are discovered from Obsidian's own vault list, so you just pick them from a dropdown.
- **You choose the source vault** in the settings; every other vault can be a target. Sync is one-directional, source → targets.
- **Preview before anything is written.** A dialog lists exactly what will be added, updated, or deleted, per vault, with version numbers.
- **The enabled-plugin list is merged, not overwritten.** Plugins a target vault enables on its own stay enabled; a plugin you have turned *off* in the source vault is copied but not switched on.
- **Per-vault settings are left alone.** `data.json` holds each vault's own configuration for a plugin — WebDAV credentials, sync state — so it is excluded by default. There is an opt-in toggle if you really want it copied.
- **Changes are detected by content hash**, not just the manifest version, so a hot-reloaded or hand-patched plugin is still recognised as different.
- **Atomic writes.** Files land via a temporary name and a rename, so a target vault never sees a half-written `main.js`.
- **Vaults Obsidian currently has open are skipped**, with a note saying why — Obsidian rewrites its own config when it closes and would undo the sync.
- Optional **mirror deletions**: plugins removed from the source vault get removed from the targets too (off by default).
- UI follows Obsidian's display language (which defaults to your system language): English, 简体中文, 繁體中文, 日本語, 한국어.

## Usage

1. Open **Settings → Plugin Sync**, pick the **source vault**, and tick the **target vaults**.
2. Run **Sync plugins to other vaults** from the command palette, or click the ribbon icon.
3. Review the preview, hit **Sync**.
4. **Restart Obsidian in the target vaults** — a running Obsidian does not notice plugins that appeared on disk underneath it.

## Installation

### Via BRAT

Install [BRAT](https://github.com/TfTHacker/obsidian42-brat), run `BRAT: Add a beta plugin`, and enter `muzi-xiaoren/ObsidianSync`.

### Manual

1. Download `main.js`, `manifest.json`, and `styles.css` from the [latest release](https://github.com/muzi-xiaoren/ObsidianSync/releases).
2. Copy them into `<your-vault>/.obsidian/plugins/plugin-sync/`.
3. Restart Obsidian, then enable **Plugin Sync** in *Settings → Community plugins*.

Install it in whichever vault you want to sync **from**. It can copy itself to the others like any other plugin.

### Build from source

```bash
git clone https://github.com/muzi-xiaoren/ObsidianSync.git
cd ObsidianSync
npm install
npm run build   # produces main.js
```

## Caveats

- Target vaults need an Obsidian restart before the new plugins load.
- A vault that Obsidian currently has open is skipped. Close it and sync again.
- Sync is one-directional. If you install a plugin in a target vault, it stays there; it is not pulled back into the source vault (and is not deleted unless you turn on mirror deletions).

## 中文说明

Obsidian 的插件是按库（vault）各存一份的，库多了就得把同一个插件反复下载、反复更新。这个插件把一个库里的插件一键复制到其他库。

> **仅桌面端。** 同步要往当前库以外的目录写文件，依赖 Node 的文件系统能力，手机端没有。也正因为要写库外文件，它不可能上官方插件商店，请用 BRAT 或手动安装。

- **不用手填路径**：直接从 Obsidian 自己的库列表里读出你所有的库，下拉框选择即可。
- **源库在设置里自己选**，其余库勾选为目标库；同步是单向的，源库 → 目标库。
- **写之前先给你看**：弹窗按库列出将新增 / 更新 / 删除哪些插件，带版本号，确认后才动手。
- **启用列表是合并而不是覆盖**：目标库自己启用的插件不会被关掉；在源库里被你**停用**的插件，会拷过去但不会被自动启用。
- **不动各库自己的设置**：`data.json` 存的是这个库自己的插件配置（比如坚果云账号、同步状态），默认排除。想拷可以单独开开关。
- **按文件内容哈希判断差异**，不只看 manifest 版本号，所以手改过或热重载过的插件也能识别出来。
- **原子写入**：先写临时文件再 rename，目标库不会拿到半个 `main.js`。
- **Obsidian 正打开着的库会被跳过**并给出提示 —— 它关闭时会重写自己的配置，会把同步结果覆盖掉。
- 可选**同步删除**：源库里删掉的插件也从目标库删掉（默认关闭）。
- 界面文字跟随 Obsidian 的显示语言（Obsidian 本身默认跟随系统语言），已内置英语、简体中文、繁体中文、日语、韩语。

同步完成后，**目标库需要重启 Obsidian** 新插件才会加载。

## License

[Apache-2.0](LICENSE)
