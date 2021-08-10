const { XMLHttpRequest } = require('xmlhttprequest');
const { format } = require('util');
const WebSocketClient = require('./wsclient');
const Guild = require('./guild');
const Message = require('./message');

const URL_BASE = 'https://discordapp.com/api/v8';
const URL_LOGIN = 'auth/login';
const URL_2FA = 'auth/mfa/totp';
const URL_GUILD = 'guilds/%s';
const URL_GUILD_MEMBERS = `${URL_GUILD}/members`;
const URL_CHANNEL = 'channels/%s';
const URL_CHANNEL_MESSAGES = `${URL_CHANNEL}/messages`;

class ConcordClient {
	constructor() {
		this._http2FAEventHandler;
		this._httpLoggedInEventHandler;
		this._websocketReadyEventHandler;
		this._websocketMessageCreateEventHandler;

		this._guilds = [];
		this._friends = [];

		this._authorizationToken;

		this._httpClient = {
			request: async function(verb, endpoint, data, options) {
				return new Promise(resolve => {
					const xhr = new XMLHttpRequest({ mozSystem: true });
					xhr.addEventListener('load', function () {
						const response = {
							status: xhr.status,
							body: xhr.responseText,
							json: JSON.parse(xhr.responseText)
						};
						resolve(response);
					});
					xhr.open(verb, `${URL_BASE}/${endpoint}`);
					xhr.setRequestHeader('Content-Type', 'application/json;charset=UTF-8');

					if (options.headers) {
						for (const key in options.headers) {
							if (Object.hasOwnProperty.call(options.headers, key)) {
								xhr.setRequestHeader(key, options.headers[key]);
							}
						}
					}

					xhr.send(data);
				});
			},
			get: async function (endpoint, options) {
				return this.request('get', endpoint, null, options);
			},
			post: async function(endpoint, data, options) {
				return this.request('post', endpoint, data, options);
			}
		};

		this.spam = 0;

		this._websocketClient = new WebSocketClient();

		this.getWebSocketClient().on('connected', () => {
			this.getWebSocketClient().identify(this.getAuthorizationToken());
		});

		// Setup internal handlers for Discord dispatch events
		this.getWebSocketClient().on('d-ready', data => {
			const { guilds } = data;

			this._guilds = guilds.map(data => new Guild(data));

			if (this._websocketReadyEventHandler) {
				this._websocketReadyEventHandler(data);
			}
		});

		this.getWebSocketClient().on('d-message_create', data => {
			if (this._websocketMessageCreateEventHandler) {
				this._websocketMessageCreateEventHandler(new Message(data));
			}
		});
	}

	getHTTPClient() {
		return this._httpClient;
	}

	getWebSocketClient() {
		return this._websocketClient;
	}

	getAuthorizationToken() {
		return this._authorizationToken;
	}

	getGuilds() {
		return this._guilds;
	}

	async getRequest(endpoint) {
		const response = await this.getHTTPClient().get(endpoint, {
			headers: {
				authorization: this._authorizationToken
			}
		});

		if (response.status != 200) {
			console.log('Failed after ' + this.spam + ' requests');
			console.log(response.headers);
			console.log(response.body);
			process.exit(0);
		}

		this.spam++;

		return response.json;
	}

	async postRequest(endpoint, data) {
		const headers = {};

		if (this._authorizationToken) {
			headers.authorization = this._authorizationToken;
		}
		
		const response = await this.getHTTPClient().post(endpoint, data, { headers });

		if (response.status != 200) {
			console.log(endpoint);
			console.log('Failed after ' + this.spam + ' requests');
			console.log(response.headers);
			console.log(response.data);
			process.exit(0);
		}

		this.spam++;

		return response.json;
	}

	onTwoFactorAuthenticationRequired(handler) {
		this._http2FAEventHandler = handler;
	}

	onLoggedIn(handler) {
		this._httpLoggedInEventHandler = handler;
	}

	onReady(handler) {
		this._websocketReadyEventHandler = handler;
	}

	onMessageCreate(handler) {
		this._websocketMessageCreateEventHandler = handler;
	}

	ghostLogin(token) {
		this._authorizationToken = token;

		if (this._httpLoggedInEventHandler) {
			this._httpLoggedInEventHandler();
		}

		this.getWebSocketClient().connect();
	}

	getUserSettings() {
		return this._userSettings;
	}

	async login(email, password) {
		const responseData = await this.postRequest(URL_LOGIN, JSON.stringify({ email, password }));

		if (responseData.mfa) {
			this.ticket = responseData.ticket;

			if (this._http2FAEventHandler) {
				this._http2FAEventHandler();
			}
		} else {
			this._authorizationToken = responseData.token;

			if (this._httpLoggedInEventHandler) {
				this._httpLoggedInEventHandler();
			}

			this.getWebSocketClient().connect();
		}
	}

	async mfa(code) {
		const responseData = await this.postRequest(URL_2FA, JSON.stringify({ code, ticket: this.ticket }));

		this._authorizationToken = responseData.token;
		this._userSettings = await this.getRequest('users/@me/settings');

		if (this._httpLoggedInEventHandler) {
			this._httpLoggedInEventHandler();
		}

		this.getWebSocketClient().connect();
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