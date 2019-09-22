import {Vue, Vuex, DefineComponent} from "./acman-vue.js";

const template = /*html*/`<div class="ns-container ns-activity">
{{activity.caption}}
</div>`;

const style = /*css*/`
.ns-activity {
    font-size: 16px;
}
`;

const component = {
	props: ["activity"],
	data() {return {};},
	methods: {},
	computed: {
		...Vuex.mapGetters(["LS"])
	}
}

export default DefineComponent("ns-activity", {template, style, component});