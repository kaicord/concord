const EventEmitter = require('events');
const WebSocket = require('isomorphic-ws');
const WebSocketMessage = require('./wsmessage');
const opcodes = require('./opcodes');

/*
// No longer used, may be used again, idk
String.prototype.toCamelCase = function() {
	return this.toLowerCase()
		.replace(/\s(.)/g, function($1) { return $1.toUpperCase(); })
		.replace(/\s/g, '')
		.replace(/^(.)/, function($1) { return $1.toLowerCase(); });
};
*/

class WebSocketClient extends EventEmitter {
	constructor() {
		super();

		this.DEFAULT_GATEWAY = 'wss://gateway.discord.gg/';
		this.CONNECTED = false;

		this.SOCKET;
		this.HEARTBEAT_INTERVAL;
		this.HEARTBEAT;

		this.LAST_SEQUENCE;
	}

	connect(gateway=this.DEFAULT_GATEWAY) {
		this.SOCKET = new WebSocket(gateway);
		this.SOCKET.onopen = function open() {
			if (this.SOCKET.readyState === this.SOCKET.OPEN) {
				this.CONNECTED = true;
			}
		}.bind(this);
		this.SOCKET.onmessage = this.handleMessage.bind(this);
	}

	handleMessage({ data }) {
		const message = new WebSocketMessage(data);

		this.LAST_SEQUENCE = message.getSequence();

		switch (message.getOpCode()) {
			case opcodes.DISPATCH:
				const name = message.getEventName();
				const payload = message.getPayload();

				this.emit(`d-${name.toLowerCase()}`, payload);
				break;
			case opcodes.HELLO:
				this.HEARTBEAT_INTERVAL = message.getPayload().heartbeat_interval;
				this.startHeartbeat();
				this.emit('connected');
				break;
			case opcodes.HEARTBEAT_ACK:
				// handle heartbeat ACK. Right now we don't care
				break;
			default:
				console.log('UNKNOWN WS OPCODE', message.getOpCode(), message.getEventName());
				break;
		}
	}

	send(opcode, data) {
		if (this.CONNECTED) {
			this.SOCKET.send(JSON.stringify({
				op: opcode,
				d: data
			}));
		}
	}

	identify(token) {
		this.send(opcodes.IDENTIFY, {
			token,
			properties: {
				$os: 'windows',
				$browser: 'Concord',
				$device: 'Concord'
			}
		});
	}

	startHeartbeat() {
		this.sendHeartbeat();

		this.HEARTBEAT = setInterval((() => {
			this.sendHeartbeat();
		}).bind(this), this.HEARTBEAT_INTERVAL);
	}

	sendHeartbeat() {
		this.send(opcodes.HEARTBEAT, this.LAST_SEQUENCE);
	}
}

module.exports = WebSocketClient;