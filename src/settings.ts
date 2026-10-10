import { App, PluginSettingTab, type Setting, type SettingDefinitionItem } from "obsidian";
import type PluginSyncPlugin from "./main";
import { LANGUAGE_CHOICES, setLanguage, t } from "./i18n";
import { listPlugins, type PluginInfo } from "./plugin-scan";
import { readVaultRegistry, type VaultEntry } from "./vault-registry";

export interface SyncSettings {
	/** Absolute path of the vault to copy from; null means the current vault. */
	sourceVaultPath: string | null;
	/** Absolute paths of the vaults to copy to. */
	targetVaultPaths: string[];
	/** Plugin ids never to sync. */
	exclude: string[];
	syncData: boolean;
	mirrorDeletes: boolean;
	skipConfirm: boolean;
	/** Sync without a preview each time this vault opens. */
	syncOnStartup: boolean;
	/** A LANGUAGE_CHOICES code, or "auto" to follow Obsidian. */
	language: string;
}

export const DEFAULT_SETTINGS: SyncSettings = {
	sourceVaultPath: null,
	targetVaultPaths: [],
	exclude: [],
	syncData: false,
	mirrorDeletes: false,
	skipConfirm: false,
	syncOnStartup: false,
	language: "auto",
};

export class SyncSettingTab extends PluginSettingTab {
	constructor(app: App, private plugin: PluginSyncPlugin) {
		super(app, plugin);
	}

	// Called on every update and once at registration for search indexing,
	// so it reads manifests only and never hashes plugin files.
	getSettingDefinitions(): SettingDefinitionItem[] {
		const s = t();

		let vaults: VaultEntry[];
		try {
			vaults = readVaultRegistry();
		} catch (error) {
			return [
				{
					name: s.registryError,
					desc: error instanceof Error ? error.message : String(error),
				},
			];
		}

		const currentPath = this.plugin.currentVaultPath();
		const sourcePath = this.plugin.settings.sourceVaultPath ?? currentPath;
		const targets = vaults.filter((v) => v.path !== sourcePath);

		let sourcePlugins: PluginInfo[] = [];
		try {
			sourcePlugins = listPlugins(sourcePath);
		} catch {
			// An unreadable source is reported when syncing; the list just stays empty.
		}

		return [
			{
				type: "group",
				items: [
					{
						name: s.sourceVaultName,
						desc: s.sourceVaultDesc,
						render: (setting) => this.renderSource(setting, vaults, sourcePath, currentPath),
					},
					{
						name: s.syncNowName,
						desc: s.syncNowDesc,
						render: (setting) => {
							setting.addButton((button) =>
								button
									.setButtonText(s.syncNowButton)
									.setCta()
									.onClick(() => this.plugin.runSync())
							);
						},
					},
				],
			},
			{
				type: "group",
				items: [
					{ name: s.targetsName, desc: s.targetsDesc },
					...(targets.length === 0
						? [{ name: s.noOtherVaults, searchable: false }]
						: targets.map((vault) => ({
								name: labelFor(vault, currentPath),
								desc: vault.path,
								searchable: false,
								render: (setting: Setting) => this.renderTarget(setting, vault),
							}))),
				],
			},
			{
				type: "group",
				items: [
					{ name: s.scopeHeading, desc: s.scopeDesc },
					...(sourcePlugins.length === 0
						? [{ name: s.noPluginsInSource, searchable: false }]
						: sourcePlugins.map((plugin) => ({
								name: plugin.name,
								desc: plugin.version ? `${plugin.id} · ${plugin.version}` : plugin.id,
								searchable: false,
								render: (setting: Setting) => this.renderPluginToggle(setting, plugin),
							}))),
				],
			},
			{
				type: "group",
				heading: s.optionsHeading,
				items: [
					{
						name: s.languageName,
						desc: s.languageDesc,
						control: {
							type: "dropdown",
							key: "language",
							options: { auto: s.languageAuto, ...Object.fromEntries(LANGUAGE_CHOICES) },
						},
					},
					{
						name: s.syncOnStartupName,
						desc: s.syncOnStartupDesc,
						control: { type: "toggle", key: "syncOnStartup" },
					},
					{
						name: s.syncDataName,
						desc: s.syncDataDesc,
						control: { type: "toggle", key: "syncData" },
					},
					{
						name: s.mirrorDeletesName,
						desc: s.mirrorDeletesDesc,
						control: { type: "toggle", key: "mirrorDeletes" },
					},
					{
						name: s.skipConfirmName,
						desc: s.skipConfirmDesc,
						control: { type: "toggle", key: "skipConfirm" },
					},
				],
			},
		];
	}

	async setControlValue(key: string, value: unknown): Promise<void> {
		await super.setControlValue(key, value);
		// Every label on the page is translated, so a new language means a rebuild.
		if (key === "language" && typeof value === "string") {
			setLanguage(value);
			this.update();
		}
	}

	private renderSource(
		setting: Setting,
		vaults: VaultEntry[],
		sourcePath: string,
		currentPath: string
	): void {
		setting.addDropdown((dropdown) => {
			for (const vault of vaults) {
				dropdown.addOption(vault.path, labelFor(vault, currentPath));
			}
			// A source that is no longer registered would leave the dropdown
			// showing someone else's vault, so keep it listed until changed.
			if (!vaults.some((v) => v.path === sourcePath)) {
				dropdown.addOption(sourcePath, sourcePath);
			}
			dropdown.setValue(sourcePath).onChange(async (value) => {
				this.plugin.settings.sourceVaultPath = value;
				// The source can no longer be one of its own targets.
				this.plugin.settings.targetVaultPaths =
					this.plugin.settings.targetVaultPaths.filter((p) => p !== value);
				await this.plugin.saveSettings();
				// Targets and the plugin list both depend on the source.
				this.update();
			});
		});
	}

	private renderTarget(setting: Setting, vault: VaultEntry): void {
		setting.addToggle((toggle) =>
			toggle
				.setValue(this.plugin.settings.targetVaultPaths.includes(vault.path))
				.onChange(async (value) => {
					const paths = new Set(this.plugin.settings.targetVaultPaths);
					if (value) paths.add(vault.path);
					else paths.delete(vault.path);
					this.plugin.settings.targetVaultPaths = [...paths];
					await this.plugin.saveSettings();
				})
		);
	}

	private renderPluginToggle(setting: Setting, plugin: PluginInfo): void {
		setting.addToggle((toggle) =>
			toggle
				.setValue(!this.plugin.settings.exclude.includes(plugin.id))
				.onChange(async (value) => {
					const exclude = new Set(this.plugin.settings.exclude);
					if (value) exclude.delete(plugin.id);
					else exclude.add(plugin.id);
					this.plugin.settings.exclude = [...exclude];
					await this.plugin.saveSettings();
				})
		);
	}
}

function labelFor(vault: VaultEntry, currentPath: string): string {
	const marks: string[] = [];
	if (vault.path === currentPath) marks.push("•");
	if (vault.open) marks.push(t().openLabel);
	return marks.length > 0 ? `${vault.name} (${marks.join(", ")})` : vault.name;
}
