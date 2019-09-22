import {Vue, Vuex, DefineComponent} from "./acman-vue.js";

const template = /*html*/`<div class="ns-header-menu">
<span v-for="tab in TABS" class="ns-header-menu-item responsive-cnt"
	@click="setSettingValue({code:'ActiveTab', value:tab.code})" :active="tab.code === ActiveTab">
	<span v-if="tab.icon" :class="'icon ' + tab.icon"></span>
	<span class="caption">{{LS[tab.caption]}}</span>
</span>
</div>`;

const style = /*css*/`
.ns-header-menu-item {
	display: inline-block;
	background: #FFF;
	-webkit-appearance: none;
	text-align: center;
	color: #555555;
	box-sizing: border-box;
	outline: 0;
	margin: 0;
	transition: .1s;
	padding: 7px 10px;
	font-size: 13px;
	/* border-radius: 4px; */
	position: relative;
	height: 100%;
	border: none;
}

.ns-header-menu-item .icon {
	width: 16px;
	height: 21px;
	position: absolute;
	background-position: center;
	background-repeat: no-repeat;
}


.ns-header-menu-item .caption {
	margin-left: 24px;
	vertical-align: middle;
	font-family: sans-serif;
	font-size: 12px;
	vertical-align: -webkit-baseline-middle;
}

.ns-header-menu-item:hover,
.ns-header-menu-item:focus {
	border-color: #c6e2ff;
	background-color: #ecf5ff;
}
.ns-header-menu-item:active {
	border-color: #3a8ee6;
	outline: 0;
}
.ns-header-menu-item[active] {
	background-color: #3a8ee60d;
	border-bottom: solid 1px #0c83ff;
}

`;

const component = {
	methods: {
		...Vuex.mapMutations(["setSettingValue"])
	},
	computed: {
		...Vuex.mapState(["TABS", "ActiveTab"]),
		...Vuex.mapGetters(["LS"])
	}
}

export default DefineComponent("ns-header-menu", {template, style, component});