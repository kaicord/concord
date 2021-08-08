const EventEmitter = require('events');
const axios = require('axios');
const { format } = require('util');
const WebSocketClient = require('./wsclient');
const Guild = require('./guild');

const URL_BASE = 'https://discordapp.com/api/v6';
const URL_LOGIN = 'auth/login';
const URL_2FA = 'auth/mfa/totp';
const URL_GUILD = 'guilds/%s';
const URL_GUILD_MEMBERS = `${URL_GUILD}/members`;
const URL_CHANNEL = 'channels/%s';
const URL_CHANNEL_MESSAGES = `${URL_CHANNEL}/messages`;

class ConcordClient extends EventEmitter {
	constructor() {
		super();

		this.GUILDS = [];
		this.FRIENDS = [];

		this.TOKEN;

		this.API_CLIENT = axios.create({
			baseURL: URL_BASE,
			//timeout: 1000,
			headers: {
				'Content-Type': 'application/json',
			},
			validateStatus: null
		});

		this.spam = 0;

		this.WS_CLIENT = new WebSocketClient();

		this.webSocket().on('connected', () => {
			this.webSocket().identify(this.TOKEN);
		});

		// Setup internal handlers for Discord dispatch events
		this.webSocket().on('d-ready', data => {
			const { guilds } = data;

			this.GUILDS = guilds.map(data => new Guild(data));
		});
	}

	webSocket() {
		return this.WS_CLIENT;
	}

	async getRequest(endpoint) {
		const response = await this.API_CLIENT.get(endpoint, {
			headers: {
				authorization: this.TOKEN
			}
		});

		if (response.status != 200) {
			console.log('Failed after ' + this.spam + ' requests');
			console.log(response.headers);
			console.log(response.body);
			process.exit(0);
		}

		this.spam++;

		return response.data;
	}

	async postRequest(endpoint, data) {
		const headers = {};

		if (this.TOKEN) {
			headers.authorization = this.TOKEN;
		}
		
		const response = await this.API_CLIENT.post(endpoint, data, { headers });

		if (response.status != 200) {
			console.log(endpoint);
			console.log('Failed after ' + this.spam + ' requests');
			console.log(response.headers);
			console.log(response.data);
			process.exit(0);
		}

		this.spam++;

		return response.data;
	}

	async login(email, password) {
		const responseData = await this.postRequest(URL_LOGIN, JSON.stringify({ email, password }));

		if (responseData.mfa) {
			this.ticket = responseData.ticket;

			this.emit('2fa');
		} else {
			this.TOKEN = responseData.token;

			this.emit('loggedin');
			this.webSocket().connect();
		}
	}

	async mfa(code) {
		const responseData = await this.postRequest(URL_2FA, JSON.stringify({ code, ticket: this.ticket }));

		this.TOKEN = responseData.token;

		this.emit('loggedin');
		this.webSocket().connect();
	}

	async getGuildMembers(guildID, { after = 0, limit = 1 }) {
		if (!guildID) {
			return [];
		}

		const params = new URLSearchParams({ after, limit });
		const querystring = params.toString();
		const membersURL = `${format(URL_GUILD_MEMBERS, guildID)}?${querystring}`;

		const members = await this.getRequest(membersURL);

		return members;
	}

	async getGuildChannelMessages(channelID, { around = [], before = [], after = [], limit = 50 }) {
		if (!channelID) {
			return [];
		}

		const params = new URLSearchParams({ around, before, after, limit });
		const querystring = params.toString();
		const messagesURL = `${format(URL_CHANNEL_MESSAGES, channelID)}?${querystring}`;

		const messages = await this.getRequest(messagesURL);

		return messages;
	}

	async sendMessage(channelID, payload) {
		await this.postRequest(format(URL_CHANNEL_MESSAGES, channelID), JSON.stringify(payload));
	}
}

module.exports = ConcordClient;