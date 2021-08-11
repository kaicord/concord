class Message {
	constructor(data) {
		this.TYPE_DEFAULT = 0;
		this.TYPE_GUILD_MEMBER_JOIN = 7;

		this._type = data.type;
		this._id = data.id;
		this._guild_id = data.guild_id;
		this._channel_id = data.channel_id;
		this._author = data.author;
		this._content = data.content;
		this._compontents = data.compontents;
	}

	getType() {
		return this._type;
	}

	getID() {
		return this._id;
	}

	getGuildID() {
		return this._guild_id;
	}

	getChannelID() {
		return this._channel_id;
	}

	getAuthor() {
		return this._author;
	}

	getContent() {
		return this._content;
	}

	getComponents() {
		return this._compontents;
	}
}

module.exports = Message;