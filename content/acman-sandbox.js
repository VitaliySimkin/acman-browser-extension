/**
 * @typedef {Object} AcManMsgListener
 * @property {string} message
 */

const AcmanSandbox = {
	/** Время ожидания ответа на сообщение */
	msgTimeout: 200,

	/** Код для фильтрации сообщений расширения */
	AcmanMsgCode: "AcMan-Extension",

	/** Listeners
	 * @type {AcManMsgListener[]}
	 */
	_listeners: [],

	init() {
		window.addEventListener("message", this.handleMessage.bind(this));
	},

	/** Сгенерировать уникальний идентификатор */
	generateId() {
		return ([1e7]+-1e3+-4e3+-8e3+-1e11).replace(/[018]/g,
			c=>(c^crypto.getRandomValues(new Uint8Array(1))[0]&15 >> c/4).toString(16));
	},

	/** Опубликовать сообщение
	 * @param {string} message сообщение
	 * @param {any} data данние для передачи
	 */
	publish(message, data = null) {
		let scope = this;
		let handled = false;
		return new Promise((resolve) => {
			let messageId = scope.generateId();
			let handler = response => {
				if (!handled) {
					handled = false;
					scope.removeListener(messageId, handler);
					resolve((response || {}).data);
				}
			}
			scope.subscribe(messageId, handler, {single: true});
			setTimeout(handler, scope.msgTimeout);
			scope.postMessage({message, messageId, data});
		})
	},

	/** post message
	 * @private
	 * @param {Object} config конфиг
	 */
	postMessage({message, messageId = "", data = null}) {
		let msg = JSON.stringify({AcmanMsgCode: this.AcmanMsgCode, message, messageId, data});
		window.postMessage(msg, "*");
	},

	/** Подписатся на сообщение */
	subscribe(message, handler) {
		this._listeners.push({message, handler})
	},

	tryParse(json) {
		try {
			return JSON.parse(json);
		} catch (err) {
			return Object.create(null);
		}
	},

	handleMessage(event) {
		let data = this.tryParse(event.data);
		if (data.AcmanMsgCode !== this.AcmanMsgCode) {
			return;
		}
		let isCurrentListener = l => l.message === data.message;
		let callHandler = l => l.handler({
			data: data.data,
			message: data.messageId,
			callback(response) {
				AcmanSandbox.publish(data.messageId, response)
			}
		});
		this._listeners.filter(isCurrentListener).forEach(callHandler);
	},

	removeListener(messageId, handler) {
		let isCurrentListener = l => l.message === messageId && l.handler === handler;
		let listenerIndex = this._listeners.findIndex(isCurrentListener);
		if (listenerIndex >= 0) {
			this._listeners.slice(listenerIndex, 1);
		}
	}
};

AcmanSandbox.init();

export default AcmanSandbox;
