import Vue from "../vue.js";
import Vuex from "../vuex.js";

function DefineComponent(componentName, {template, style, component}) {
	component.template = template;
	let el = document.createElement("style");
	el.innerHTML = style;
	document.head.appendChild(el);
	return Vue.component(componentName, component);
}

export {Vue, Vuex, DefineComponent}