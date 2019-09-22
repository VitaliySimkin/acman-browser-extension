import AcmanStorage from "./acman-storage.js";

/**
 * @typedef AcmanEventListener
 * @property {string} event event code
 * @property {Function} callback event callback
 * @property {object} scope callback scope
 */

/*
 * @class
 */
const AcmanManager = {
	/** Хранилище
	 * @type {AcmanStorage}
	 */
	storage: AcmanStorage,

	/** user settings is initied */
	initied: false,

	/** Префікс для зберігання налаштувань */
	settingStoragePrefix: "settings/",

	async getSettings() {
		let settingsCode = ["Localization", "ActiveTab", "ColorTheme"]
			.map(code => `${this.settingStoragePrefix}${code}`);
		let settingsValue = await AcmanStorage.get(settingsCode);
		let values = Object.create(null);
		for (let code in settingsValue) {
			values[code.replace(this.settingStoragePrefix, "")] = settingsValue[code];
		}
		return values;
	},

	/** Зберегти налаштування
	 * @param {string} code код налаштування
	 * @param {string} value значення
	 */
	async setSettingValue(code, value) {
		await AcmanStorage.set({[`${this.settingStoragePrefix}${code}`]: value});
	},

	/** Зачекати ініціалізації даних */
	waitInit() {
		let scope = this;
		return new Promise((resolve) => {
			if (scope.initied) {
				return resolve(true);
			}
			scope.on("setting-initied", function() {
				resolve(true);
			});
		});
	},

	/** Init manager */
	async init() {
	},

	// #region events
	/** event listeners
	 * @type {AcmanEventListener[]}
	 */
	_listeners: [],

	/** Fire event
	 * @param {string} event event code
	 * @param {any[]} params event params
	 */
	fireEvent(event, params = []) {
		if (!Array.isArray(params)) {
			params = [params];
		}
		let isEventListener = listen => listen.event === event;
		let callListener = listen => listen.callback.apply(listen.scope, params);
		this._listeners.filter(isEventListener).forEach(callListener);
	},

	/** add event listener
	 * @param {string} event event code
	 * @param {Function} callback handler
	 * @param {object} scope handler scope
	 */
	on(event, callback, scope) {
		this._listeners.push({event, callback, scope});
	},

	/** remove event listener
	 * @param {string} event event code
	 * @param {Function} callback handler
	 */
	un(event, callback) {
		let isListener = listen => listen.event === event && listen.callback === callback;
		let remove = (item, index) => this._listeners.splice(index, 1);
		this._listeners.filter(isListener).forEach(remove);
	},
	// #endregion
};

AcmanManager.init();
window.AcmanManager = AcmanManager;

export default AcmanManager;
