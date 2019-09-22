import {Vue, Vuex, DefineComponent} from "./acman-vue.js";
import AcmanStore from "../store/acman-store.js";
import "./ns-header-menu.js";
import "./ns-setting.js";
import "./ns-version-info.js";
import "./ns-activity-header-panel.js";
import "./ns-activity.js";
import AcmanManager from "../../script/acman-manager.js";
import AcmanActivityManager from "../../script/acman-activity-manager.js";

const template = /*html*/`<div>
	<div class="popup-header">
		<div class="extension-logo-cnt">
			<span class="extension-logo-icon"></span>
			<span class="extension-logo-version">v{{VERSION}}</span>
			<a class="extension-logo-github" :href="GitHubURL" target="_blank"></a>
		</div>
		<ns-header-menu></ns-header-menu>
	</div>
	<div v-if="ActiveTab === 'versions'" id="settings-tab-container" class="popup-content">
		<ns-version-info></ns-version-info>
	</div>
	<div v-if="ActiveTab === 'settings'" id="settings-tab-container" class="popup-content">
		<ns-setting :caption="LS.LocalizationCaption">
			<ns-setting-value v-for="(local, code) in LOCALIZATIONS"
				setting-name="Localization" :value="code">{{local.Caption}}</ns-setting-value>
		</ns-setting>
		<ns-setting :caption="LS.ColorThemeCaption">
			<ns-setting-value v-for="({code, caption}) in COLOR_THEMES"
				setting-name="ColorTheme" :value="code">{{LS[caption]}}</ns-setting-value>
		</ns-setting>
	</div>
	<div v-if="ActiveTab === 'activities'" id="settings-tab-container" class="popup-content">
		<ns-activity-header-panel></ns-activity-header-panel>
		<ns-activity v-for="activity in filteredActivities" :activity="activity"></ns-activity>
	</div>
</div>`;

const style = /*css*/`
.sdf {
	width: 10px;
}
`;

const component = {
	store: AcmanStore,
	data() {
		return {};
	},
	methods: {
		/** Завантажити налаштування */
		async initSettingsValue() {
			let settingValues = await AcmanManager.getSettings();
			this.$store.commit("initValues", settingValues);
		},
		async initActivityList() {
			let acivities = await AcmanActivityManager.getActivities();
			this.$store.commit("setActivities", acivities);
		},
		...Vuex.mapMutations(["setSettingValue"])
	},
	computed: {
		...Vuex.mapState(Object.keys(AcmanStore.state)),
		...Vuex.mapGetters(["LS", "filteredActivities"])
	},
	mounted() {
		this.initSettingsValue();
		this.initActivityList();
		this.$store.watch((state) => state.ColorTheme, (newValue) => {
			document.body.className = newValue;
		});
	}
}

export default DefineComponent("acman-app", {template, style, component});

