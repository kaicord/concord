class Channel {
	constructor(data, parent) {
		this.TYPE_GUILD_TEXT = 0;
		this.TYPE_DM = 1;
		this.TYPE_GROUP_DM = 3;
		this.TYPE_GUILD_CATEGORY = 4;

		this._parent_guild = parent;
		this._id = data.id;
		this._type = data.type;
		this._position = data.position;
		this._name = data.name;
		this._last_message_id = data.last_message_id;
		this._parent_id = data.parent_id;
	}

	/**
	 * Returns the Guild the channel belongs to
	 * @returns {Guild} parent guild object
	*/
	getParentGuild() {
		return this._parent_guild;
	}

	/**
	 * Returns the channels ID
	 * @returns {snowflake} the id of this channel
	*/
	getID() {
		return this._id;
	}

	/**
	 * Returns the type of channel
	 * @returns {number} the type of channel
	*/
	getType() {
		return this._type;
	}

	/**
	 * Returns sorting position of the channel
	 * @returns {number} sorting position of the channel
	*/
	getPosition() {
		return this._position;
	}

	/**
	 * Returns the name of the channel (1-100 characters)
	 * @returns {string} the name of the channel (1-100 characters)
	*/
	getName() {
		return this._name;
	}

	/**
	 * Returns the id of the last message sent in this channel (may not point to an existing or valid message)
	 * @returns {snowflake} the id of the last message sent in this channel
	*/
	getLastMessageID() {
		return this._last_message_id;
	}

	/**
	 * Returns for guild channels: id of the parent category for a channel (each parent category can contain up to 50 channels), for threads: id of the text channel this thread was created
	 * @returns {snowflake} the parent ID snowflake
	*/
	getParentID() {
		return this._parent_id;
	}
}

module.exports = Channel;