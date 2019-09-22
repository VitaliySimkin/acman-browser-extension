import {Vue, Vuex, DefineComponent} from "./acman-vue.js";
import "./ns-setting-value.js";

const template = /*html*/`<div class="ns-container setting-container">
<div class="settings-caption">{{caption}}</div>
<div class="settings-variables">
	<slot></slot>
</div>
</div>`;

const style = /*css*/`.setting-container {
	display: flex;
	justify-content: space-between;
	align-items: center;
}

.settings-caption {
	width: calc(25% - 5px);
	display: inline-block;
	font-family: Georgia;
	font-size: 16px;
}

.settings-variables {
	width: calc(75% - 5px);
	display: inline-flex;
	flex-direction: row;
	justify-content: space-evenly;
}

.settings-variables span {
	font-family: "Jura-Regular";
	font-size: 15px;
}

.settings-variables span[active] {
	font-weight: bold;
}`;

const component = {
	props: ["caption"],
	data() {return {};}
}

export default DefineComponent("ns-setting", {template, style, component});