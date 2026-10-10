import { createHash } from "crypto";
import { existsSync, readdirSync, readFileSync, statSync } from "fs";
import { join } from "path";

/**
 * The files that make up a plugin's *code*. `data.json` is deliberately not
 * here: it holds that vault's own settings for the plugin (WebDAV credentials,
 * per-vault sync state, …) and copying it between vaults would clobber them.
 */
export const CODE_FILES = ["main.js", "manifest.json", "styles.css"] as const;

/** Optional per-vault settings file, synced only when the user opts in. */
export const DATA_FILE = "data.json";

export interface InstalledPlugin {
	/** Folder name under the config folder's plugins/, which is also the plugin id. */
	id: string;
	/** Name from manifest.json, for display. Falls back to the id. */
	name: string;
	/** Version from manifest.json, or null when unreadable. */
	version: string | null;
	/** sha256 of each present code file, keyed by file name. */
	hashes: Record<string, string>;
	/** Whether the folder has a data.json. */
	hasData: boolean;
}

/**
 * Name of the config folder inside a vault. Users can rename it, so main.ts
 * sets it from Vault#configDir on load; other vaults are assumed to use the
 * same name as the one this plugin runs in.
 */
let configDirName = "";

export function setConfigDirName(name: string): void {
	configDirName = name;
}

export function configDir(vaultPath: string): string {
	return join(vaultPath, configDirName);
}

export function pluginsDir(vaultPath: string): string {
	return join(configDir(vaultPath), "plugins");
}

export function communityPluginsFile(vaultPath: string): string {
	return join(configDir(vaultPath), "community-plugins.json");
}

/**
 * Every plugin installed in a vault. A folder without a manifest.json is not
 * a plugin (it could be a leftover or an editor's scratch dir) and is skipped.
 */
export function scanPlugins(vaultPath: string): InstalledPlugin[] {
	const dir = pluginsDir(vaultPath);
	if (!existsSync(dir)) return [];

	const result: InstalledPlugin[] = [];
	for (const entry of readdirSync(dir, { withFileTypes: true })) {
		if (!entry.isDirectory()) continue;
		const folder = join(dir, entry.name);
		const manifestPath = join(folder, "manifest.json");
		if (!existsSync(manifestPath)) continue;

		let name = entry.name;
		let version: string | null = null;
		try {
			const manifest = JSON.parse(readFileSync(manifestPath, "utf8")) as {
				name?: string;
				version?: string;
			};
			if (typeof manifest.name === "string") name = manifest.name;
			if (typeof manifest.version === "string") version = manifest.version;
		} catch {
			// A malformed manifest still leaves the folder syncable by hash.
		}

		const hashes: Record<string, string> = {};
		for (const file of CODE_FILES) {
			const path = join(folder, file);
			if (existsSync(path) && statSync(path).isFile()) {
				hashes[file] = sha256(readFileSync(path));
			}
		}

		result.push({
			id: entry.name,
			name,
			version,
			hashes,
			hasData: existsSync(join(folder, DATA_FILE)),
		});
	}

	return result.sort((a, b) => a.id.localeCompare(b.id));
}

/** The list of enabled community plugins, or [] when absent/malformed. */
export function readEnabledPlugins(vaultPath: string): string[] {
	const file = communityPluginsFile(vaultPath);
	if (!existsSync(file)) return [];
	try {
		const parsed = JSON.parse(readFileSync(file, "utf8"));
		return Array.isArray(parsed) ? parsed.filter((x): x is string => typeof x === "string") : [];
	} catch {
		return [];
	}
}

function sha256(buf: Buffer): string {
	return createHash("sha256").update(buf).digest("hex");
}
