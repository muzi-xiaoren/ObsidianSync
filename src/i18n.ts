import { moment } from "obsidian";

/**
 * Localised UI strings.
 *
 * The language follows Obsidian's own display language (which itself defaults
 * to the system language) via `moment.locale()`, with `navigator.language` as
 * a backstop, unless the user picked a language in the settings. Unknown
 * languages fall back to English. Adding a language means adding one
 * dictionary below plus its tag in LOCALES and LANGUAGE_CHOICES.
 */
export interface Strings {
	commandSync: string;
	ribbonTooltip: string;

	sourceVaultName: string;
	sourceVaultDesc: string;
	targetsName: string;
	targetsDesc: string;
	noOtherVaults: string;
	syncNowName: string;
	syncNowDesc: string;
	syncNowButton: string;
	scopeHeading: string;
	scopeDesc: string;
	noPluginsInSource: string;
	optionsHeading: string;
	languageName: string;
	languageDesc: string;
	languageAuto: string;
	syncDataName: string;
	syncDataDesc: string;
	mirrorDeletesName: string;
	mirrorDeletesDesc: string;
	skipConfirmName: string;
	skipConfirmDesc: string;

	registryError: string;
	sourceMissing: string;
	noTargetsSelected: string;
	nothingToDo: string;

	modalTitle: string;
	modalIntro: string;
	openVaultWarning: string;
	restartHint: string;
	confirm: string;
	cancel: string;
	kindCreate: string;
	kindUpdate: string;
	kindRemove: string;
	upToDate: string;
	openLabel: string;

	syncing: string;
	/** Result line for one vault. */
	vaultResult: (name: string, created: number, updated: number, removed: number) => string;
	failures: string;
}

const en: Strings = {
	commandSync: "Sync plugins to other vaults",
	ribbonTooltip: "Sync plugins to other vaults",

	sourceVaultName: "Source vault",
	sourceVaultDesc:
		"The vault whose installed plugins are copied to the others. Defaults to this vault.",
	targetsName: "Target vaults",
	targetsDesc:
		"Vaults that receive the source vault's plugins. Obsidian rewrites its config when it closes, so a vault it currently has open is skipped.",
	noOtherVaults: "No other vaults found in Obsidian's vault list.",
	syncNowName: "Sync now",
	syncNowDesc:
		"Copy the source vault's plugins to the selected vaults. Also available from the ribbon icon and the command palette.",
	syncNowButton: "Sync now",
	scopeHeading: "What to sync",
	scopeDesc: "Turn a plugin off to leave it out of the sync. The list comes from the source vault.",
	noPluginsInSource: "The source vault has no plugins installed.",
	optionsHeading: "Options",
	languageName: "Language",
	languageDesc:
		"Language of this plugin's interface. The command name and ribbon tooltip change after the plugin is reloaded.",
	languageAuto: "Follow Obsidian",
	syncDataName: "Also sync plugin settings (data.json)",
	syncDataDesc:
		"Off by default: data.json holds each vault's own settings for a plugin, such as credentials and sync state, and copying it overwrites them.",
	mirrorDeletesName: "Mirror deletions",
	mirrorDeletesDesc:
		"Also delete plugins from the target vaults when the source vault no longer has them.",
	skipConfirmName: "Skip the confirmation dialog",
	skipConfirmDesc: "Apply changes immediately instead of showing what would change first.",

	registryError: "Could not read Obsidian's vault list",
	sourceMissing: "The source vault no longer exists. Pick another one in the settings.",
	noTargetsSelected: "No target vaults selected. Pick some in the plugin settings.",
	nothingToDo: "Every target vault already has these plugins.",

	modalTitle: "Sync plugins",
	modalIntro: "These changes will be made:",
	openVaultWarning:
		"Skipped, because Obsidian has this vault open. Close it and sync again.",
	restartHint: "Restart Obsidian in the target vaults for the new plugins to load.",
	confirm: "Sync",
	cancel: "Cancel",
	kindCreate: "add",
	kindUpdate: "update",
	kindRemove: "delete",
	upToDate: "Already up to date",
	openLabel: "open",

	syncing: "Syncing plugins…",
	vaultResult: (name, created, updated, removed) =>
		`${name}: ${created} added, ${updated} updated, ${removed} deleted`,
	failures: "Some items failed",
};

const zhCN: Strings = {
	commandSync: "同步插件到其他库",
	ribbonTooltip: "同步插件到其他库",

	sourceVaultName: "源库",
	sourceVaultDesc: "以哪个库已安装的插件为准，复制到其他库。默认是当前库。",
	targetsName: "目标库",
	targetsDesc:
		"接收源库插件的库。Obsidian 关闭时会重写自己的配置文件，所以它当前打开着的库会被跳过。",
	noOtherVaults: "在 Obsidian 的库列表里没有找到其他库。",
	syncNowName: "立即同步",
	syncNowDesc:
		"把源库的插件复制到勾选的目标库。也可以点左侧栏图标，或在命令面板里运行。",
	syncNowButton: "开始同步",
	scopeHeading: "同步范围",
	scopeDesc: "关掉的插件不参与同步。列表来自源库。",
	noPluginsInSource: "源库里没有安装插件。",
	optionsHeading: "选项",
	languageName: "界面语言",
	languageDesc:
		"本插件的界面语言。命令名和侧栏图标提示在重新加载插件后生效。",
	languageAuto: "跟随 Obsidian",
	syncDataName: "同时同步插件设置（data.json）",
	syncDataDesc:
		"默认关闭：data.json 存的是各个库自己的插件设置，比如账号密码和同步状态，复制过去会把它们覆盖掉。",
	mirrorDeletesName: "同步删除",
	mirrorDeletesDesc: "源库里已经删掉的插件，也从目标库删除。",
	skipConfirmName: "跳过确认对话框",
	skipConfirmDesc: "不先展示将要发生的改动，直接执行。",

	registryError: "无法读取 Obsidian 的库列表",
	sourceMissing: "源库已不存在，请在设置里重新选择。",
	noTargetsSelected: "没有选择目标库，请先在插件设置里勾选。",
	nothingToDo: "所有目标库都已经有这些插件了。",

	modalTitle: "同步插件",
	modalIntro: "将进行以下改动：",
	openVaultWarning: "已跳过：Obsidian 正打开着这个库。关掉它之后再同步。",
	restartHint: "目标库需要重启 Obsidian，新插件才会被加载。",
	confirm: "同步",
	cancel: "取消",
	kindCreate: "新增",
	kindUpdate: "更新",
	kindRemove: "删除",
	upToDate: "已是最新",
	openLabel: "正打开",

	syncing: "正在同步插件……",
	vaultResult: (name, created, updated, removed) =>
		`${name}：新增 ${created}，更新 ${updated}，删除 ${removed}`,
	failures: "部分项目失败",
};

const zhTW: Strings = {
	commandSync: "同步外掛到其他儲存庫",
	ribbonTooltip: "同步外掛到其他儲存庫",

	sourceVaultName: "來源庫",
	sourceVaultDesc: "以哪個庫已安裝的外掛為準，複製到其他庫。預設是目前的庫。",
	targetsName: "目標庫",
	targetsDesc:
		"接收來源庫外掛的庫。Obsidian 關閉時會重寫自己的設定檔，因此它目前開著的庫會被略過。",
	noOtherVaults: "在 Obsidian 的庫清單中找不到其他庫。",
	syncNowName: "立即同步",
	syncNowDesc:
		"把來源庫的外掛複製到勾選的目標庫。也可以點左側欄圖示，或在命令面板中執行。",
	syncNowButton: "開始同步",
	scopeHeading: "同步範圍",
	scopeDesc: "關閉的外掛不參與同步。清單來自來源庫。",
	noPluginsInSource: "來源庫中沒有安裝外掛。",
	optionsHeading: "選項",
	languageName: "介面語言",
	languageDesc:
		"本外掛的介面語言。命令名稱與側欄圖示提示在重新載入外掛後生效。",
	languageAuto: "跟隨 Obsidian",
	syncDataName: "同時同步外掛設定（data.json）",
	syncDataDesc:
		"預設關閉：data.json 存的是各個庫自己的外掛設定，例如帳號密碼與同步狀態，複製過去會將其覆蓋。",
	mirrorDeletesName: "同步刪除",
	mirrorDeletesDesc: "來源庫已刪除的外掛，也從目標庫刪除。",
	skipConfirmName: "略過確認對話框",
	skipConfirmDesc: "不先顯示將發生的變更，直接執行。",

	registryError: "無法讀取 Obsidian 的庫清單",
	sourceMissing: "來源庫已不存在，請在設定中重新選擇。",
	noTargetsSelected: "尚未選擇目標庫，請先在外掛設定中勾選。",
	nothingToDo: "所有目標庫都已經有這些外掛了。",

	modalTitle: "同步外掛",
	modalIntro: "將進行以下變更：",
	openVaultWarning: "已略過：Obsidian 正開著這個庫。關閉後再同步。",
	restartHint: "目標庫需要重新啟動 Obsidian，新外掛才會載入。",
	confirm: "同步",
	cancel: "取消",
	kindCreate: "新增",
	kindUpdate: "更新",
	kindRemove: "刪除",
	upToDate: "已是最新",
	openLabel: "正開啟",

	syncing: "正在同步外掛……",
	vaultResult: (name, created, updated, removed) =>
		`${name}：新增 ${created}，更新 ${updated}，刪除 ${removed}`,
	failures: "部分項目失敗",
};

const ja: Strings = {
	commandSync: "他の保管庫にプラグインを同期",
	ribbonTooltip: "他の保管庫にプラグインを同期",

	sourceVaultName: "同期元の保管庫",
	sourceVaultDesc:
		"インストール済みプラグインの基準となる保管庫です。既定では現在の保管庫。",
	targetsName: "同期先の保管庫",
	targetsDesc:
		"同期元のプラグインを受け取る保管庫。Obsidian は終了時に自身の設定を書き戻すため、現在開いている保管庫はスキップされます。",
	noOtherVaults: "Obsidian の保管庫一覧に他の保管庫がありません。",
	syncNowName: "今すぐ同期",
	syncNowDesc:
		"同期元の保管庫のプラグインを、選択した同期先にコピーします。リボンのアイコンやコマンドパレットからも実行できます。",
	syncNowButton: "同期を開始",
	scopeHeading: "同期する対象",
	scopeDesc: "オフにしたプラグインは同期されません。一覧は同期元の保管庫から取得しています。",
	noPluginsInSource: "同期元の保管庫にプラグインがありません。",
	optionsHeading: "オプション",
	languageName: "表示言語",
	languageDesc:
		"このプラグインの表示言語。コマンド名とリボンのツールチップはプラグインの再読み込み後に反映されます。",
	languageAuto: "Obsidian に合わせる",
	syncDataName: "プラグイン設定（data.json）も同期",
	syncDataDesc:
		"既定でオフ：data.json には保管庫ごとの設定（認証情報や同期状態など）が入っており、コピーすると上書きされます。",
	mirrorDeletesName: "削除も反映",
	mirrorDeletesDesc: "同期元から削除されたプラグインを同期先からも削除します。",
	skipConfirmName: "確認ダイアログを省略",
	skipConfirmDesc: "変更内容を表示せずにそのまま実行します。",

	registryError: "Obsidian の保管庫一覧を読み込めませんでした",
	sourceMissing: "同期元の保管庫が見つかりません。設定で選び直してください。",
	noTargetsSelected: "同期先が選択されていません。設定で選んでください。",
	nothingToDo: "同期先の保管庫はすべて最新です。",

	modalTitle: "プラグインを同期",
	modalIntro: "次の変更を行います:",
	openVaultWarning: "スキップしました: この保管庫は Obsidian が開いています。閉じてから再実行してください。",
	restartHint: "新しいプラグインを読み込むには、同期先で Obsidian を再起動してください。",
	confirm: "同期",
	cancel: "キャンセル",
	kindCreate: "追加",
	kindUpdate: "更新",
	kindRemove: "削除",
	upToDate: "最新です",
	openLabel: "使用中",

	syncing: "プラグインを同期しています…",
	vaultResult: (name, created, updated, removed) =>
		`${name}: 追加 ${created}、更新 ${updated}、削除 ${removed}`,
	failures: "一部の項目が失敗しました",
};

const ko: Strings = {
	commandSync: "다른 보관함에 플러그인 동기화",
	ribbonTooltip: "다른 보관함에 플러그인 동기화",

	sourceVaultName: "원본 보관함",
	sourceVaultDesc: "설치된 플러그인의 기준이 되는 보관함입니다. 기본값은 현재 보관함.",
	targetsName: "대상 보관함",
	targetsDesc:
		"원본의 플러그인을 받을 보관함. Obsidian은 종료 시 자체 설정을 다시 쓰므로, 현재 열려 있는 보관함은 건너뜁니다.",
	noOtherVaults: "Obsidian 보관함 목록에서 다른 보관함을 찾지 못했습니다.",
	syncNowName: "지금 동기화",
	syncNowDesc:
		"원본 보관함의 플러그인을 선택한 대상 보관함에 복사합니다. 리본 아이콘이나 명령 팔레트에서도 실행할 수 있습니다.",
	syncNowButton: "동기화 시작",
	scopeHeading: "동기화 범위",
	scopeDesc: "끈 플러그인은 동기화하지 않습니다. 목록은 원본 보관함에서 가져옵니다.",
	noPluginsInSource: "원본 보관함에 설치된 플러그인이 없습니다.",
	optionsHeading: "옵션",
	languageName: "표시 언어",
	languageDesc:
		"이 플러그인의 표시 언어입니다. 명령 이름과 리본 툴팁은 플러그인을 다시 불러온 뒤 적용됩니다.",
	languageAuto: "Obsidian 설정 따르기",
	syncDataName: "플러그인 설정(data.json)도 동기화",
	syncDataDesc:
		"기본 꺼짐: data.json에는 보관함별 설정(인증 정보, 동기화 상태 등)이 있어 복사하면 덮어써집니다.",
	mirrorDeletesName: "삭제도 반영",
	mirrorDeletesDesc: "원본에서 삭제된 플러그인을 대상 보관함에서도 삭제합니다.",
	skipConfirmName: "확인 창 건너뛰기",
	skipConfirmDesc: "변경 내용을 먼저 보여주지 않고 바로 실행합니다.",

	registryError: "Obsidian 보관함 목록을 읽을 수 없습니다",
	sourceMissing: "원본 보관함이 존재하지 않습니다. 설정에서 다시 선택하세요.",
	noTargetsSelected: "대상 보관함이 선택되지 않았습니다. 설정에서 선택하세요.",
	nothingToDo: "모든 대상 보관함이 이미 최신입니다.",

	modalTitle: "플러그인 동기화",
	modalIntro: "다음 변경이 적용됩니다:",
	openVaultWarning: "건너뜀: Obsidian이 이 보관함을 열어 두었습니다. 닫은 뒤 다시 시도하세요.",
	restartHint: "새 플러그인을 불러오려면 대상 보관함에서 Obsidian을 재시작하세요.",
	confirm: "동기화",
	cancel: "취소",
	kindCreate: "추가",
	kindUpdate: "업데이트",
	kindRemove: "삭제",
	upToDate: "이미 최신",
	openLabel: "열림",

	syncing: "플러그인을 동기화하는 중…",
	vaultResult: (name, created, updated, removed) =>
		`${name}: 추가 ${created}, 업데이트 ${updated}, 삭제 ${removed}`,
	failures: "일부 항목이 실패했습니다",
};

const LOCALES: Record<string, Strings> = {
	en,
	"zh-cn": zhCN,
	"zh-hans": zhCN,
	"zh-tw": zhTW,
	"zh-hk": zhTW,
	"zh-hant": zhTW,
	ja,
	ko,
};

/** Languages offered in the settings, each labelled in its own language. */
export const LANGUAGE_CHOICES: [code: string, label: string][] = [
	["en", "English"],
	["zh-cn", "简体中文"],
	["zh-tw", "繁體中文"],
	["ja", "日本語"],
	["ko", "한국어"],
];

/** Region-less tags that need a specific regional variant. */
const BASE_ALIASES: Record<string, string> = { zh: "zh-cn" };

function resolve(tag: string | undefined): Strings | null {
	if (!tag) return null;
	const normalised = tag.toLowerCase().replace(/_/g, "-");
	const base = normalised.split("-")[0];
	return LOCALES[normalised] ?? LOCALES[BASE_ALIASES[base] ?? base] ?? null;
}

let cachedTag: string | undefined | null = null;
let cachedStrings: Strings = en;
let override: string | null = null;

/** Pin the UI to one language, or pass "auto" to follow Obsidian again. */
export function setLanguage(code: string): void {
	override = code === "auto" ? null : code;
	cachedTag = null;
}

/** Strings for the chosen language, or Obsidian's display language. */
export function t(): Strings {
	const tag = override ?? moment.locale();
	if (tag !== cachedTag) {
		cachedTag = tag;
		cachedStrings = resolve(tag) ?? resolve(navigator?.language) ?? en;
	}
	return cachedStrings;
}
