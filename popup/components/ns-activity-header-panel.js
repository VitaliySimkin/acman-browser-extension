import {Vue, Vuex, DefineComponent} from "./acman-vue.js";

Vue.component("ns-status-filter", {
	props: ["value", "caption", "icon"],
	data() {return {enabled: false};},
	methods: {
		onClick() {
			this.enabled = !this.enabled;
			this.$emit('change', this.enabled);
		}
	},
	mounted() {
		this.enabled = this.value;
	},
	computed: {},
	template: `<span class="status-filter-item responsive-cnt" :active="value" @click="onClick">
	<span :class="'icon ' + icon"></span>
	<span class="caption">{{caption}}</span>
</span>`
});


const template = /*html*/`<div class="ns-container ns-activities-panel">
	<ns-status-filter :value="isNew" @change="changeFilter('isNew')"
		icon="ns-icon-status-new" :caption="LS.NewCaption"></ns-status-filter>
	<ns-status-filter :value="isInProgress" @change="changeFilter('isInProgress')"
		icon="ns-icon-status-inprogress" :caption="LS.InProgressCaption"></ns-status-filter>
	<ns-status-filter :value="isInPause" @change="changeFilter('isInPause')"
		icon="ns-icon-status-inpause" :caption="LS.InPauseCaption"></ns-status-filter>
	<ns-status-filter :value="isDone" @change="changeFilter('isDone')"
		icon="ns-icon-status-done" :caption="LS.DoneCaption"></ns-status-filter>

</div>`;

const style = /*css*/`
.status-filter-item {
	display: inline-block;
    background: #FFF;
    -webkit-appearance: none;
    text-align: center;
    color: #555555;
    box-sizing: border-box;
    outline: 0;
    margin: 0;
    transition: .1s;
    padding: 3px 10px 6px;
    font-size: 13px;
    /* border-radius: 4px; */
    position: relative;
    height: 100%;
    border: solid 1px #eee;
    border-radius: 5px;
}
.status-filter-item .caption {
    margin-left: 24px;
    vertical-align: middle;
    font-family: sans-serif;
    font-size: 12px;
    vertical-align: -webkit-baseline-middle;
}
.status-filter-item .icon {
    width: 16px;
    height: 21px;
    position: absolute;
    background-position: center;
    background-repeat: no-repeat;
}
.ns-activities-panel {
	border-bottom: solid 2px #0c83ff;
}
.status-filter-item[active="true"] {
	background-color: #f2faff;
}
`;

const component = {
	props: [],
	data() {return {
		isNew: true,
		isInProgress: true,
		isInPause: true,
		isDone: true,
	};},
	methods: {
		changeFilter(filter) {
			this[filter] = !this[filter];
			this.saveFilter();
		},
		saveFilter() {
			this.setActivitiesFilter({
				New: this.isNew,
				InProgress: this.isInProgress,
				InPause: this.isInPause,
				Done: this.isDone,
			});
		},
		...Vuex.mapMutations(["setActivitiesFilter"])
	},
	computed: {
		...Vuex.mapGetters(["LS"])
	},
	mounted() {
		this.saveFilter();
	}
}

export default DefineComponent("ns-activity-header-panel", {template, style, component});