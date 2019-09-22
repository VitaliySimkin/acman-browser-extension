import {Vue, Vuex} from "./components/acman-vue.js";
import App from "./components/app.js";

new Vue({
	render: h => h(App)
}).$mount("#app");