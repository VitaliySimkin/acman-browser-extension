const ContentManager = {
	extensionId: chrome.runtime.id,

	async init() {
		let AcmanManager = await this.importFile("/script/acman-manager.js");
		let AcmanSandbox = await this.importFile("/content/acman-sandbox.js");
		let AcmanActivityManager = await this.importFile("/script/acman-activity-manager.js");
		let settings = await AcmanManager.getSettings();
		AcmanSandbox.subscribe("getExtensionId", ({callback}) => callback(this.extensionId));
		AcmanSandbox.subscribe("getLocalization", ({callback}) => callback(settings.Localization || "ua"));
		AcmanSandbox.subscribe("startIssue", ({data}) => {debugger;});
		AcmanSandbox.subscribe("pauseIssue", ({data}) => {debugger;});
		
		this.loadScript();
	},

	async importFile(fileUrl) {
		const src = chrome.extension.getURL(fileUrl);
		const contentMain = await import(src);
		return contentMain.default;
	},

	loadScript() {
		let script = document.createElement("script");
		script.type = "module";
		script.src = chrome.extension.getURL("content/acman-inject.js");
		document.head.appendChild(script);
		this.script = script;
	}
}

ContentManager.init();