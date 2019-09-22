import Vue from "../vue.js";
import Vuex from "../vuex.js";
import AcmanManager from "../../script/acman-manager.js";
import Localization from "../localization.js";
import AcmanActivityManager from "../../script/acman-activity-manager.js";

Vue.use(Vuex);

const AcmanStore = new Vuex.Store({
	state: {
		/** Версія розширення */
		VERSION: "0.0.1",

		/** Посилання на проект в GitHub */
		GitHubURL: "https://github.com/VitaliySimkin/acman-browser-extension",

		/** Локалізації */
		LOCALIZATIONS: Localization,

		/** Вкладки */
		TABS: [
			{code: "versions", caption: "VersionsTabCaption", icon: "ns-icon-versions-tab"},
			{code: "settings", caption: "SettingsTabCaption", icon: "ns-icon-settings-tab"},
			{code: "activities", caption: "ActivitiesTabCaption", icon: "ns-icon-activities-tab"},
		],

		/** Доступні теми */
		COLOR_THEMES: [
			{code: "dark", caption: "DarkColorThemeCaption"},
			{code: "light", caption: "LightColorThemeCaption"}
		],

		/** Можливості */
		FEATURES: {},

		/** Локалізація */
		Localization: "ua",

		/** Активна вкладка */
		ActiveTab: "tasks",

		/** Активна тема */
		ColorTheme: "light",
		activities: [],
		activitiesFilter: {}
	},
	getters: {
		/** Отримати локалізований рядок
		 * @param {object} state state
		 */
		LS(state) {
			return state.LOCALIZATIONS[state.Localization];
		},
		filteredActivities(state) {
			let statusses = [];
			for (const key in state.activitiesFilter) {
				if (state.activitiesFilter[key]) statusses.push(AcmanActivityManager.AcvitivyStatus[key]);
			}
			return state.activities.filter(item => statusses.includes(item.status));
		}
	},
	mutations: {
		/** Иницализировать значения
		 * @param {object} state state
		 * @param {object} values values
		 */
		initValues(state, values) {
			for (const key in values) {
				let value = values[key];
				if (value && state[key] !== value) {
					state[key] = value;
				}
			}
		},
		/** Встановити значення налаштування
		 * @param {object} state state
		 * @param {object} config значення
		 * @param {string} config.code код налаштування
		 * @param {string} config.value значення
		 */
		setSettingValue(state, {code, value}) {
			state[code] = value;
			AcmanManager.setSettingValue(code, value);
		},
		setActivities(state, activities) {
			Vue.set(state, "activities", activities);
		},
		setActivitiesFilter(state, filters) {
			Vue.set(state, "activitiesFilter", filters);
		}
	}
});

export default AcmanStore;