import AcmanSandbox from "./acman-sandbox.js";

const HTMLUtils = {
	createElement(tag, attributes = {}, props = {}) {
		attributes = attributes == null ? {} : attributes;
		let el = document.createElement(tag);
		for (const key in attributes) {
			el.setAttribute(key, attributes[key]);
		}
		for (const key in props) {
			el[key] = props[key];
		}
		return el;
	}
}

const Localization = {
	ua: {
		ButtonCaption: {
			assigne: "Взяти в роботу",
			start: "Почати",
			pause: "Пауза",
			complete: "Завершити"
		}
	},
	en: {
		ButtonCaption: {
			assigne: "Assigne to me",
			start: "Start",
			pause: "Pause",
			complete: "Сomplete"
		}
	},
	ru: {
		ButtonCaption: {
			assigne: "Взять в работу",
			start: "Начать",
			pause: "Пауза",
			complete: "Завершить"
		}
	}
}

const AcmanJiraApi = {
	async getTransitions(issueKey) {
		return await this.send("GET", `/rest/api/2/issue/${issueKey}/transitions`);
	},

	async postTransition(issueKey, transitionId) {
		let url = `/rest/api/2/issue/${issueKey}/transitions?expand=transitions.fields`;
		return await this.send("POST", url, {transition: {id: transitionId}});
	},

	async assigne(issueKey, userName) {
		return await this.send("PUT", `/rest/api/2/issue/${issueKey}/assignee`, {name: userName});
	},

	async getIssue(issueKey) {
		return await this.send("GET", `/rest/api/2/issue/${issueKey}`);
	},

	async send(method, url, data) {
		return new Promise(resolve => {
			var xhr = new XMLHttpRequest();
			xhr.open(method, url, false);
			xhr.setRequestHeader('Content-Type', 'application/json');
			xhr.setRequestHeader("Authorization", "Basic Vi5TaW1raW46IXAwTWUjbjY5");
			xhr.onreadystatechange = function() {
				if (this.readyState != 4) return;
				resolve(this.response && JSON.parse(this.response));
			}
			xhr.send(data ? JSON.stringify(data) : null);
		})
	}
}

window.AcmanJiraApi = AcmanJiraApi;


const ButtonTags = {
	assigne: "assigne",
	start: "start",
	pause: "pause",
	complete: "complete"
}


const AcmanJiraUtils = {
	currentUserName: GH.UserData.getUserName(),
	localization: null,
	LS: Localization.ua,

	async init() {
		this.localization = await AcmanSandbox.publish("getLocalization") || "ua";
		this.LS = Localization[this.localization];
		this.overrideMethods();
	},

	overrideMethods() {
		this.overrideRenderPlanListIssue();
		this.override2();
		
	},
	override2() {
		let baseMethod = GH.tpl.rapid.swimlane.renderIssue;
		GH.tpl.rapid.swimlane.renderIssue = function(opt_data, opt_ignored) {
			let result = baseMethod(...arguments);
			return AcmanJiraUtils.modifyPlanListIssueHTML(result, opt_data, ".ghx-issue-content .ghx-key");
		}
	},
	
	overrideRenderPlanListIssue() {
		let baseMethod = GH.tpl.planissuelist.renderIssue;
		GH.tpl.planissuelist.renderIssue = function(opt_data, opt_ignored) {
			let result = baseMethod(...arguments);
			return AcmanJiraUtils.modifyPlanListIssueHTML(result, opt_data, ".js-issue .ghx-issue-content > .ghx-end");
		}
	},

	getButtonsTag({issue}) {
		if (issue.assignee && issue.assignee !== this.currentUserName) {
			return null;
		}
		let assigned = Boolean(issue.assignee);
		switch (+(issue.status.statusCategory || {}).id) {
			case 2: return assigned ? [ButtonTags.start] : [ButtonTags.assigne];
			case 4: return [ButtonTags.pause, ButtonTags.complete];
			default: return null;
		}
	},

	createIssueItemButton(tag, issueKey) {
		return HTMLUtils.createElement("button", {
			onclick: "AcmanJiraUtils.onClick(...arguments)",
			"issue-key": issueKey,
			tag
		}, {
			className: "aui-button acman-btn",
			innerText: AcmanJiraUtils.LS.ButtonCaption[tag]
		});
	},

	getIssueItemButtons({issue}) {
		let tags = this.getButtonsTag({issue}) || [];
		return tags.map(tag => this.createIssueItemButton(tag, issue.key));
	},

	modifyPlanListIssueHTML(html, data, cntSelector) {
		let el = HTMLUtils.createElement("div", null, {innerHTML: html});
		let cnt = el.querySelector(cntSelector);
		let btns = this.getIssueItemButtons(data);
		btns.forEach(btn => cnt.insertBefore(btn, cnt.firstChild));
		return el.innerHTML;
	},

	getIssueDataByKey(issueKey) {
		let backlog = GH.BacklogModel.backlogModel2.issueList.data.issueByKey[issueKey];
		if (backlog) return backlog;
		GH.BacklogModel.sprintModels.forEach(sprintModel => {
			let issue = sprintModel.issueList.data.issueByKey[issueKey];
			if (issue) return issue;
		});
	},

	async getIssueTransitons(issueKey) {
		let transitions = await AcmanJiraApi.getTransitions(issueKey);
		transitions = transitions.transitions.map(item =>
			({id: item.id, category: item.to.statusCategory.key}));
		return transitions;
	},
	async assigneIssue(issueKey) {
		let issue = await AcmanJiraApi.getIssue(issueKey);
		await AcmanJiraApi.assigne(issueKey, this.currentUserName);
		AJS.$(GH).trigger("issueUpdated", {issueId: issue.id});
	},
	async startIssue(issueKey) {
		let issue = await AcmanJiraApi.getIssue(issueKey);
		let transitions = await this.getIssueTransitons(issueKey);
		let transitionId = (transitions.find(item => item.category === "indeterminate") || {}).id;
		await AcmanJiraApi.postTransition(issueKey, transitionId);
		AcmanSandbox.publish("startIssue", {issueKey});
		AJS.$(GH).trigger("issueUpdated", {issueId: issue.id});
		GH.WorkController.checkForUpdates(true);
	},
	async pauseIssue(issueKey) {
		let issue = await AcmanJiraApi.getIssue(issueKey);
		let transitions = await this.getIssueTransitons(issueKey);
		let transitionId = (transitions.find(item => item.category === "new") || {}).id;
		await AcmanJiraApi.postTransition(issueKey, transitionId);
		AcmanSandbox.publish("pauseIssue", {issueKey});
		AJS.$(GH).trigger("issueUpdated", {issueId: issue.id})
		GH.WorkController.checkForUpdates(true);
	},
	completeIssue(issueKey) {
		console.log(`${issueKey} completeIssue`);
	},

	createAssingEl(issueId, target) {
		let a = document.querySelector("#jira #page #content .js-issueaction-container-dot #assign-to-me");
		let el = a.cloneNode();
		el.href = el.href.replace("{0}", issueId);
		el.display = "none";
		target.appendChild(el);
		el.click();
		AJS.$(GH).trigger("issueUpdated", {
			issueId: b.viewData.id
		});
	},

	/**
	 * 
	 * @param {MouseEvent} event 
	 */
	onClick(event) {
		event.stopPropagation()
		event.preventDefault();
		let issueKey = event.target.getAttribute("issue-key");
		let tag = event.target.getAttribute("tag");
		switch (tag) {
			case ButtonTags.assigne: this.assigneIssue(issueKey, event.target); break;
			case ButtonTags.start: this.startIssue(issueKey, event.target); break;
			case ButtonTags.pause: this.pauseIssue(issueKey, event.target); break;
			case ButtonTags.complete: this.completeIssue(issueKey,  event.target); break;
		}
	}
}

AcmanJiraUtils.init();
window.AcmanJiraUtils = AcmanJiraUtils;