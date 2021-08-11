const Channel = require('./channel');

class Guild {
	constructor(data) {
		this._id = data.id;
		this._name = data.name;
		this._icon = data.icon;
		this._name = data.name;
		if (data.unavailable) {
			this._channels = [];
		} else {
			this._channels = data.channels.map(data => new Channel(data, this));
		}
	}

	getID() {
		return this._id;
	}

	getName() {
		return this._name;
	}

	getIcon() {
		return this._icon;
	}

	getChannels() {
		return this._channels;
	}

	getChannel(id) {
		return this._channels.find(_channel => _channel.getID() === id);
	}

	getIconUrl(format='png') {
		return `https://cdn.discordapp.com/icons/${this.getID()}/${this.getIcon()}.${format}`;
	}
}

module.exports = Guild;