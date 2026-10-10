import { copyFileSync, existsSync, mkdirSync, renameSync, rmSync, unlinkSync, writeFileSync } from "fs";
import { join } from "path";
import { communityPluginsFile, configDir, pluginsDir, readEnabledPlugins } from "./plugin-scan";
import { changeCount, type VaultPlan } from "./plan";

export interface ApplyResult {
	vaultName: string;
	created: number;
	updated: number;
	removed: number;
	/** One message per failure; an empty array means the vault synced cleanly. */
	errors: string[];
}

/**
 * Carry out one vault's plan.
 *
 * Files are written to a temporary name and renamed into place, so a plugin is
 * never left with a half-written main.js — a truncated main.js would make the
 * target vault fail to load that plugin.
 */
export function applyPlan(sourceVault: string, plan: VaultPlan): ApplyResult {
	const result: ApplyResult = { vaultName: plan.vaultName, created: 0, updated: 0, removed: 0, errors: [] };
	if (changeCount(plan) === 0) return result;

	const sourceRoot = pluginsDir(sourceVault);
	const targetRoot = pluginsDir(plan.vaultPath);

	for (const action of plan.actions) {
		if (action.kind === "same") continue;
		try {
			if (action.kind === "remove") {
				rmSync(join(targetRoot, action.id), { recursive: true, force: true });
				result.removed += 1;
				continue;
			}

			const targetFolder = join(targetRoot, action.id);
			mkdirSync(targetFolder, { recursive: true });
			for (const file of action.files) {
				copyAtomic(join(sourceRoot, action.id, file), join(targetFolder, file));
			}
			if (action.kind === "create") result.created += 1;
			else result.updated += 1;
		} catch (error) {
			result.errors.push(`${action.id}: ${describe(error)}`);
		}
	}

	try {
		updateEnabledList(plan);
	} catch (error) {
		result.errors.push(`community-plugins.json: ${describe(error)}`);
	}

	return result;
}

/**
 * Merge the enabled-plugin list instead of replacing it. The target vault may
 * enable plugins the source does not have, and overwriting the file would
 * silently switch those off.
 */
function updateEnabledList(plan: VaultPlan): void {
	if (plan.enable.length === 0 && plan.disable.length === 0) return;

	// Re-read rather than trusting the scan: Obsidian rewrites this file
	// whenever a plugin is toggled, so it may have changed since planning.
	const current = readEnabledPlugins(plan.vaultPath);
	const disable = new Set(plan.disable);
	const merged = current.filter((id) => !disable.has(id));
	for (const id of plan.enable) {
		if (!merged.includes(id)) merged.push(id);
	}

	const file = communityPluginsFile(plan.vaultPath);
	mkdirSync(configDir(plan.vaultPath), { recursive: true });
	writeAtomic(file, JSON.stringify(merged, null, 2) + "\n");
}

function copyAtomic(from: string, to: string): void {
	const tmp = `${to}.plugin-sync-tmp`;
	copyFileSync(from, tmp);
	replace(tmp, to);
}

function writeAtomic(to: string, contents: string): void {
	const tmp = `${to}.plugin-sync-tmp`;
	writeFileSync(tmp, contents, "utf8");
	replace(tmp, to);
}

function replace(tmp: string, to: string): void {
	try {
		renameSync(tmp, to);
	} catch (error) {
		// Windows refuses to rename over an existing file on some filesystems.
		if (existsSync(to)) {
			unlinkSync(to);
			renameSync(tmp, to);
		} else {
			rmSync(tmp, { force: true });
			throw error;
		}
	}
}

function describe(error: unknown): string {
	return error instanceof Error ? error.message : String(error);
}
