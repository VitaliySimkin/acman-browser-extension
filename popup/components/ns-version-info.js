import {Vue, Vuex, DefineComponent} from "./acman-vue.js";

const template = /*html*/`<div class="ns-container">
<span class="version-number">v0.0.1</span>
<span class="version-date">2019-09-22</span>
<span class="version-description"></span>
<div>
	<span class="version-features-title"></span>
</div>
</div>`;

const style = /*css*/`span.version-number {
    font-family: "Jura-Medium";
    font-size: 25px;
    font-weight: bold;
    display: inline-block;
    color: #555555;
    height: 100%;
}
.version-date {
    margin-left: 10px;
    font-family: monospace;
    font-size: 14px;
}`;

const component = {
	props: [],
	data() {return {};},
	methods: {},
	computed: {}
}

export default DefineComponent("ns-version-info", {template, style, component});