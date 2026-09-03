import type { InstalledPlugin } from "./plugin-scan";

export type ActionKind = "create" | "update" | "same" | "remove";

export interface PluginAction {
	kind: ActionKind;
	id: string;
	/** Display name, taken from the source vault when it has the plugin. */
	name: string;
	/** Version in the source vault, when known. */
	sourceVersion: string | null;
	/** Version already in the target vault, when it has the plugin. */
	targetVersion: string | null;
	/** Code files that differ and therefore need copying. */
	files: string[];
}

export interface VaultPlan {
	vaultId: string;
	vaultName: string;
	vaultPath: string;
	/** Obsidian currently has this vault open, so writing to it is unsafe. */
	open: boolean;
	actions: PluginAction[];
	/** Plugin ids to add to the target's enabled list (union, never a replace). */
	enable: string[];
	/** Plugin ids to drop from the enabled list, only when mirroring deletes. */
	disable: string[];
}

export interface PlanOptions {
	/** Plugin ids to consider. When empty, every plugin in the source. */
	include: string[];
	/** Plugin ids to skip, applied after `include`. */
	exclude: string[];
	/** Also copy data.json, overwriting the target's own plugin settings. */
	syncData: boolean;
	/** Delete plugins from the target that the source no longer has. */
	mirrorDeletes: boolean;
}

export interface TargetInput {
	vaultId: string;
	vaultName: string;
	vaultPath: string;
	open: boolean;
	plugins: InstalledPlugin[];
	enabled: string[];
}

/** True when the action changes something on disk. */
export function isChange(action: PluginAction): boolean {
	return action.kind !== "same";
}

/** Number of plugins a plan would actually touch. */
export function changeCount(plan: VaultPlan): number {
	return plan.actions.filter(isChange).length;
}

/**
 * Work out, per target vault, what would have to change for it to carry the
 * source vault's plugins. Pure: it takes scan results and returns a plan, so
 * the whole diff can be exercised without touching a real vault.
 */
export function buildPlan(
	source: { plugins: InstalledPlugin[]; enabled: string[] },
	targets: TargetInput[],
	options: PlanOptions
): VaultPlan[] {
	const selected = selectPlugins(source.plugins, options);
	const sourceById = new Map(selected.map((p) => [p.id, p]));
	const sourceEnabled = new Set(source.enabled);

	return targets.map((target) => {
		const targetById = new Map(target.plugins.map((p) => [p.id, p]));
		const actions: PluginAction[] = [];
		const enable: string[] = [];
		const disable: string[] = [];
		const targetEnabled = new Set(target.enabled);

		for (const plugin of selected) {
			const existing = targetById.get(plugin.id);
			const files = existing ? differingFiles(plugin, existing, options) : filesOf(plugin, options);

			const kind: ActionKind = !existing ? "create" : files.length > 0 ? "update" : "same";
			actions.push({
				kind,
				id: plugin.id,
				name: plugin.name,
				sourceVersion: plugin.version,
				targetVersion: existing?.version ?? null,
				files,
			});

			// Enabling follows the source: a plugin the user turned off there
			// should not spring to life elsewhere. The target's own choices are
			// never removed, so extra plugins it enables stay enabled.
			if (sourceEnabled.has(plugin.id) && !targetEnabled.has(plugin.id)) {
				enable.push(plugin.id);
			}
		}

		if (options.mirrorDeletes) {
			for (const plugin of target.plugins) {
				if (sourceById.has(plugin.id)) continue;
				// Only mirror deletes for plugins the filters would have covered,
				// so an excluded plugin is never removed behind the user's back.
				if (!passesFilters(plugin.id, options)) continue;
				actions.push({
					kind: "remove",
					id: plugin.id,
					name: plugin.name,
					sourceVersion: null,
					targetVersion: plugin.version,
					files: [],
				});
				if (targetEnabled.has(plugin.id)) disable.push(plugin.id);
			}
		}

		actions.sort((a, b) => a.id.localeCompare(b.id));
		return {
			vaultId: target.vaultId,
			vaultName: target.vaultName,
			vaultPath: target.vaultPath,
			open: target.open,
			actions,
			enable,
			disable,
		};
	});
}

function passesFilters(id: string, options: PlanOptions): boolean {
	if (options.exclude.includes(id)) return false;
	if (options.include.length > 0 && !options.include.includes(id)) return false;
	return true;
}

function selectPlugins(plugins: InstalledPlugin[], options: PlanOptions): InstalledPlugin[] {
	return plugins.filter((p) => passesFilters(p.id, options));
}

/** Every file this plugin would contribute, for a fresh install. */
function filesOf(plugin: InstalledPlugin, options: PlanOptions): string[] {
	const files = Object.keys(plugin.hashes).sort();
	if (options.syncData && plugin.hasData) files.push("data.json");
	return files;
}

/**
 * Files whose contents differ. Comparison is by hash rather than version, so a
 * hot-reloaded or hand-patched plugin is still detected as changed even when
 * its manifest version stayed the same.
 */
function differingFiles(
	source: InstalledPlugin,
	target: InstalledPlugin,
	options: PlanOptions
): string[] {
	const files = Object.keys(source.hashes)
		.filter((file) => source.hashes[file] !== target.hashes[file])
		.sort();
	// data.json is compared by presence only: its hash is expected to differ
	// (it is per-vault state), so hashing it would mean copying on every run.
	if (options.syncData && source.hasData) files.push("data.json");
	return files;
}
