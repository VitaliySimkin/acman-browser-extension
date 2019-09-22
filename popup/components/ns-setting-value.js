import {Vue, Vuex, DefineComponent} from "./acman-vue.js";

const template = /*html*/`<span class="responsive" :active="value === currentValue"
@click="onClick()"><slot></slot></span>`;

const style = /*css*/``;

const component = {
	props: ["settingName", "value"],
	data() {return {};},
	methods: {
		...Vuex.mapMutations(["setSettingValue"]),
		onClick() {
			this.setSettingValue({code: this.settingName, value: this.value});
		}
	},
	computed: {
		currentValue() {
			return this.$store.state[this.settingName];
		}
	}
}

export default DefineComponent("ns-setting-value", {template, style, component});