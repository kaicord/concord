class WebSocketMessage {
	constructor(data) {
		data = typeof data === 'string' ? JSON.parse(data) : data;

		this.op_code = data.op;
		this.event_name = data.t;
		this.sequence = data.s;
		this.payload = data.d;
	}

	getOpCode() {
		return this.op_code;
	}

	getEventName() {
		return this.event_name;
	}

	getSequence() {
		return this.sequence;
	}

	getPayload() {
		return this.payload;
	}
}

module.exports = WebSocketMessage;