import { App, PluginSettingTab, Setting } from "obsidian";
import type PluginSyncPlugin from "./main";
import { LANGUAGE_CHOICES, setLanguage, t } from "./i18n";
import { scanPlugins, type InstalledPlugin } from "./plugin-scan";
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
	language: "auto",
};

export class SyncSettingTab extends PluginSettingTab {
	constructor(app: App, private plugin: PluginSyncPlugin) {
		super(app, plugin);
	}

	display(): void {
		const { containerEl } = this;
		const s = t();
		containerEl.empty();

		let vaults: VaultEntry[];
		try {
			vaults = readVaultRegistry();
		} catch (error) {
			containerEl.createEl("p", {
				cls: "plugin-sync-error",
				text: `${s.registryError}: ${error instanceof Error ? error.message : String(error)}`,
			});
			return;
		}

		const currentPath = this.plugin.currentVaultPath();
		const sourcePath = this.plugin.settings.sourceVaultPath ?? currentPath;

		new Setting(containerEl)
			.setName(s.sourceVaultName)
			.setDesc(s.sourceVaultDesc)
			.addDropdown((dropdown) => {
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
					this.display();
				});
			});

		const targets = vaults.filter((v) => v.path !== sourcePath);
		const targetSetting = new Setting(containerEl).setName(s.targetsName).setDesc(s.targetsDesc);
		targetSetting.settingEl.addClass("plugin-sync-targets");

		if (targets.length === 0) {
			containerEl.createEl("p", { cls: "plugin-sync-note", text: s.noOtherVaults });
		}
		for (const vault of targets) {
			new Setting(containerEl)
				.setName(labelFor(vault, currentPath))
				.setDesc(vault.path)
				.addToggle((toggle) =>
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

		new Setting(containerEl)
			.setName(s.syncNowName)
			.setDesc(s.syncNowDesc)
			.addButton((button) =>
				button
					.setButtonText(s.syncNowButton)
					.setCta()
					.onClick(() => this.plugin.runSync())
			);

		new Setting(containerEl).setName(s.scopeHeading).setHeading();
		containerEl.createEl("p", { cls: "plugin-sync-note", text: s.scopeDesc });

		let sourcePlugins: InstalledPlugin[] = [];
		try {
			sourcePlugins = scanPlugins(sourcePath);
		} catch {
			// An unreadable source is reported when syncing; the list just stays empty.
		}
		if (sourcePlugins.length === 0) {
			containerEl.createEl("p", { cls: "plugin-sync-note", text: s.noPluginsInSource });
		}
		for (const plugin of sourcePlugins) {
			const version = plugin.version ? ` · ${plugin.version}` : "";
			new Setting(containerEl)
				.setName(plugin.name)
				.setDesc(`${plugin.id}${version}`)
				.addToggle((toggle) =>
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

		new Setting(containerEl).setName(s.optionsHeading).setHeading();

		new Setting(containerEl)
			.setName(s.languageName)
			.setDesc(s.languageDesc)
			.addDropdown((dropdown) => {
				dropdown.addOption("auto", s.languageAuto);
				for (const [code, label] of LANGUAGE_CHOICES) dropdown.addOption(code, label);
				dropdown.setValue(this.plugin.settings.language).onChange(async (value) => {
					this.plugin.settings.language = value;
					setLanguage(value);
					await this.plugin.saveSettings();
					this.display();
				});
			});

		new Setting(containerEl)
			.setName(s.syncDataName)
			.setDesc(s.syncDataDesc)
			.addToggle((toggle) =>
				toggle.setValue(this.plugin.settings.syncData).onChange(async (value) => {
					this.plugin.settings.syncData = value;
					await this.plugin.saveSettings();
				})
			);

		new Setting(containerEl)
			.setName(s.mirrorDeletesName)
			.setDesc(s.mirrorDeletesDesc)
			.addToggle((toggle) =>
				toggle.setValue(this.plugin.settings.mirrorDeletes).onChange(async (value) => {
					this.plugin.settings.mirrorDeletes = value;
					await this.plugin.saveSettings();
				})
			);

		new Setting(containerEl)
			.setName(s.skipConfirmName)
			.setDesc(s.skipConfirmDesc)
			.addToggle((toggle) =>
				toggle.setValue(this.plugin.settings.skipConfirm).onChange(async (value) => {
					this.plugin.settings.skipConfirm = value;
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
