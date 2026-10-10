import { FileSystemAdapter, Notice, Plugin } from "obsidian";
import { existsSync } from "fs";
import { applyPlan, type ApplyResult } from "./apply";
import { setLanguage, t } from "./i18n";
import { buildPlan, changeCount, type TargetInput, type VaultPlan } from "./plan";
import { readEnabledPlugins, scanPlugins, setConfigDirName } from "./plugin-scan";
import { PreviewModal } from "./preview-modal";
import { DEFAULT_SETTINGS, SyncSettingTab, type SyncSettings } from "./settings";
import { readVaultRegistry, type VaultEntry } from "./vault-registry";

export default class PluginSyncPlugin extends Plugin {
	settings: SyncSettings = { ...DEFAULT_SETTINGS };

	async onload(): Promise<void> {
		setConfigDirName(this.app.vault.configDir);
		await this.loadSettings();

		this.addSettingTab(new SyncSettingTab(this.app, this));
		this.addCommand({
			id: "sync-plugins-to-other-vaults",
			name: t().commandSync,
			callback: () => this.runSync(),
		});
		this.addRibbonIcon("copy-plus", t().ribbonTooltip, () => this.runSync());

		// Wait for the layout so startup work does not slow down opening the vault.
		this.app.workspace.onLayoutReady(() => {
			if (this.settings.syncOnStartup) this.runSync(true);
		});
	}

	/** Absolute path of the vault this plugin instance is running in. */
	currentVaultPath(): string {
		const adapter = this.app.vault.adapter;
		// Only the desktop adapter is backed by a real folder on disk.
		return adapter instanceof FileSystemAdapter ? adapter.getBasePath() : "";
	}

	async loadSettings(): Promise<void> {
		const saved = (await this.loadData()) as Partial<SyncSettings> | null;
		this.settings = { ...DEFAULT_SETTINGS, ...saved };
		setLanguage(this.settings.language);
	}

	async saveSettings(): Promise<void> {
		await this.saveData(this.settings);
	}

	/**
	 * Plan a sync and, after the user confirms, apply it. On startup there is
	 * nobody to confirm, so changes are applied straight away and the run stays
	 * silent unless something was actually written.
	 */
	runSync(onStartup = false): void {
		const s = t();

		let vaults: VaultEntry[];
		try {
			vaults = readVaultRegistry();
		} catch (error) {
			new Notice(`${s.registryError}: ${error instanceof Error ? error.message : String(error)}`);
			return;
		}

		const sourcePath = this.settings.sourceVaultPath ?? this.currentVaultPath();
		if (!sourcePath || !existsSync(sourcePath)) {
			new Notice(s.sourceMissing);
			return;
		}

		const selected = vaults.filter(
			(v) => v.path !== sourcePath && this.settings.targetVaultPaths.includes(v.path)
		);
		if (selected.length === 0) {
			if (!onStartup) new Notice(s.noTargetsSelected);
			return;
		}

		const source = { plugins: scanPlugins(sourcePath), enabled: readEnabledPlugins(sourcePath) };
		const targets: TargetInput[] = selected.map((vault) => ({
			vaultId: vault.id,
			vaultName: vault.name,
			vaultPath: vault.path,
			// The vault this plugin runs in is open by definition, even though
			// Obsidian's registry only flags the window that has focus.
			open: vault.open || vault.path === this.currentVaultPath(),
			plugins: scanPlugins(vault.path),
			enabled: readEnabledPlugins(vault.path),
		}));

		const plan = (force: boolean): VaultPlan[] =>
			buildPlan(source, targets, {
				include: [],
				exclude: this.settings.exclude,
				syncData: this.settings.syncData,
				mirrorDeletes: this.settings.mirrorDeletes,
				force,
			});
		const actionable = (plans: VaultPlan[]): VaultPlan[] =>
			plans.filter((p) => !p.open && changeCount(p) > 0);

		const plans = plan(false);
		const changes = actionable(plans);
		if (onStartup) {
			if (changes.length > 0) this.apply(sourcePath, changes, s.startupSynced);
			return;
		}
		if (changes.length > 0 && this.settings.skipConfirm) {
			this.apply(sourcePath, changes);
			return;
		}
		// Shown even when nothing changed, so every vault's state is visible
		// and a forced overwrite is still one click away.
		new PreviewModal(
			this.app,
			plans,
			() => this.apply(sourcePath, changes),
			() => this.apply(sourcePath, actionable(plan(true)))
		).open();
	}

	private apply(sourcePath: string, plans: VaultPlan[], title?: string): void {
		const s = t();
		if (!title) new Notice(s.syncing);

		const results: ApplyResult[] = plans.map((plan) => applyPlan(sourcePath, plan));
		const lines = results.map((r) => s.vaultResult(r.vaultName, r.created, r.updated, r.removed));
		if (title) lines.unshift(title);
		const errors = results.flatMap((r) => r.errors.map((e) => `${r.vaultName} — ${e}`));

		if (errors.length > 0) {
			lines.push(`${s.failures}:`, ...errors);
			console.error("[vault-plugin-sync]", errors);
		} else {
			lines.push(s.restartHint);
		}
		// Errors deserve a longer read, so the notice sticks around.
		new Notice(lines.join("\n"), errors.length > 0 ? 0 : 10000);
	}
}
