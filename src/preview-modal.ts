import { App, Modal, Setting } from "obsidian";
import { t } from "./i18n";
import { changeCount, isChange, type PluginAction, type VaultPlan } from "./plan";

/**
 * Shows exactly what would be written before anything is written. Since this
 * plugin edits files inside *other* vaults, an unreviewed run is the one thing
 * a user cannot easily undo.
 */
export class PreviewModal extends Modal {
	constructor(
		app: App,
		private plans: VaultPlan[],
		private onConfirm: () => void,
		private onForce: () => void
	) {
		super(app);
	}

	onOpen(): void {
		const s = t();
		const { contentEl } = this;
		contentEl.empty();
		contentEl.addClass("plugin-sync-preview");

		const writable = this.plans.filter((p) => !p.open);
		const hasChanges = writable.some((p) => changeCount(p) > 0);

		contentEl.createEl("h2", { text: s.modalTitle });
		contentEl.createEl("p", { text: hasChanges ? s.modalIntro : s.nothingToDo });

		for (const plan of this.plans) {
			const section = contentEl.createDiv({ cls: "plugin-sync-vault" });
			section.createEl("h3", { text: plan.vaultName });

			if (plan.open) {
				section.createDiv({ cls: "plugin-sync-warning", text: s.openVaultWarning });
				continue;
			}
			if (changeCount(plan) === 0) {
				section.createDiv({ cls: "plugin-sync-note", text: s.upToDate });
				continue;
			}

			const list = section.createEl("ul", { cls: "plugin-sync-list" });
			for (const action of plan.actions) {
				if (!isChange(action)) continue;
				const item = list.createEl("li", { cls: `plugin-sync-${action.kind}` });
				item.createSpan({ cls: "plugin-sync-kind", text: kindLabel(action) });
				item.createSpan({ cls: "plugin-sync-name", text: action.name });
				const detail = versionDetail(action);
				if (detail) item.createSpan({ cls: "plugin-sync-version", text: detail });
			}
		}

		if (hasChanges) {
			contentEl.createDiv({ cls: "plugin-sync-note", text: s.restartHint });
		}

		// Hash comparison already catches edited files; this is an escape hatch
		// for when the user wants a fresh copy anyway.
		if (writable.length > 0) {
			new Setting(contentEl)
				.setName(s.forceName)
				.setDesc(s.forceDesc)
				.addButton((button) =>
					button
						.setButtonText(s.forceButton)
						.setWarning()
						.onClick(() => {
							this.close();
							this.onForce();
						})
				);
		}

		const footer = new Setting(contentEl);
		if (hasChanges) {
			footer.addButton((button) =>
				button
					.setButtonText(s.confirm)
					.setCta()
					.onClick(() => {
						this.close();
						this.onConfirm();
					})
			);
		}
		footer.addButton((button) =>
			button.setButtonText(hasChanges ? s.cancel : s.close).onClick(() => this.close())
		);
	}

	onClose(): void {
		this.contentEl.empty();
	}
}

function kindLabel(action: PluginAction): string {
	const s = t();
	if (action.kind === "create") return s.kindCreate;
	if (action.kind === "remove") return s.kindRemove;
	return s.kindUpdate;
}

/** "1.0.0 → 1.1.0" for an update, a bare version otherwise. */
function versionDetail(action: PluginAction): string {
	if (action.kind === "remove") return action.targetVersion ?? "";
	if (action.kind === "create") return action.sourceVersion ?? "";
	if (action.sourceVersion && action.targetVersion && action.sourceVersion !== action.targetVersion) {
		return `${action.targetVersion} → ${action.sourceVersion}`;
	}
	// Same code, different settings: say so, or the row looks like a no-op.
	if (action.files.length === 1 && action.files[0] === "data.json") {
		return [action.sourceVersion, t().settingsOnly].filter(Boolean).join(" · ");
	}
	return action.sourceVersion ?? "";
}
