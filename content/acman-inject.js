import AcmanSandbox from "./acman-sandbox.js";

const AcmanInjectManager = {
	extensionId: null,
	async init() {
		this.extensionId = await AcmanSandbox.publish("getExtensionId");
		if (!this.isJira()) {
			return;
		}
		this.appendJs("/content/acman-jira-inject.js");
		this.appendCss("/content/acman-jira-inject.css");
	},

	isJira() {
		return Boolean(window.JIRA);
	},

	appendElement(tag, attr) {
		let el = document.createElement(tag);
		for (const key in attr) {
			el.setAttribute(key, attr[key]);
		}
		document.head.appendChild(el);
	},

	appendJs(url) {
		this.appendElement("script", {
			type: "module",
			src: this.getURL(url)
		})
	},

	appendCss(url) {
		this.appendElement("link", {
			rel: "stylesheet",
			type: "text/css",
			href: this.getURL(url)
		})
	},

	getURL(url) {
		return `chrome-extension://${this.extensionId}${url}`;
	}

};

AcmanInjectManager.init();

export default AcmanInjectManager;
