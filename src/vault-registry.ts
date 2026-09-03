import { homedir, platform } from "os";
import { join } from "path";
import { readFileSync } from "fs";

/** A vault Obsidian knows about, as recorded in its own registry file. */
export interface VaultEntry {
	/** Obsidian's internal vault id (the key in obsidian.json). */
	id: string;
	/** Absolute path to the vault root. */
	path: string;
	/** Folder name, used as the display label. */
	name: string;
	/** Obsidian marks the vault it currently has open. */
	open: boolean;
}

/**
 * Obsidian keeps a registry of every vault you have ever opened, in its
 * per-user config directory. Reading it means the user never has to type a
 * vault path by hand.
 */
export function obsidianConfigDir(): string {
	const home = homedir();
	switch (platform()) {
		case "darwin":
			return join(home, "Library", "Application Support", "obsidian");
		case "win32":
			return join(process.env.APPDATA ?? join(home, "AppData", "Roaming"), "obsidian");
		default:
			return join(process.env.XDG_CONFIG_HOME ?? join(home, ".config"), "obsidian");
	}
}

interface RawRegistry {
	vaults?: Record<string, { path?: string; open?: boolean }>;
}

/** Every registered vault, sorted by name. Throws if the registry is unreadable. */
export function readVaultRegistry(): VaultEntry[] {
	const file = join(obsidianConfigDir(), "obsidian.json");
	const raw = JSON.parse(readFileSync(file, "utf8")) as RawRegistry;
	const vaults = raw.vaults ?? {};

	return Object.entries(vaults)
		.filter(([, v]) => typeof v?.path === "string" && v.path.length > 0)
		.map(([id, v]) => ({
			id,
			path: v.path as string,
			name: basenameOf(v.path as string),
			open: v.open === true,
		}))
		.sort((a, b) => a.name.localeCompare(b.name));
}

/** Last path segment, tolerating a trailing separator. */
function basenameOf(p: string): string {
	const parts = p.split(/[\\/]/).filter((s) => s.length > 0);
	return parts[parts.length - 1] ?? p;
}
