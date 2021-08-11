const readline = require('readline');
const { promisify } = require('util');
const ConcordClient = require('..').Client;
require('colors');

// Create input interface for text
const input = readline.createInterface({
	input: process.stdin,
	output: process.stdout
});

// Promisify the question method
input.question[promisify.custom] = (question) => {
	return new Promise((resolve) => {
		input.question(question, resolve);
	});
};

const question = promisify(input.question);

// Init a new client
const client = new ConcordClient();

// Setup basic client events

client.onTwoFactorAuthenticationRequired(async () => {
	const mfacode = await question('2FA Code: ');
	client.mfa(mfacode);
});

client.onMessageCreate(message => {
	console.log(message);
});

// Setup WebSocket events
// When Discord sends a DISPATCH event it will be emitted with the "d" prefix and the event name in lowercase
client.onReady(() => {
	// Do stuff with the guild and channel info
	const guilds = client.getGuilds();

	console.log(guilds[0].getIconUrl());

	/*
	client.sendMessage('343011339918245892', {
		content: 'test message from concord'
	});
	*/
	
	/*
	for (const guild of guilds) {
		console.log(`${guild.getName()}`.green);

		const channels = guild.getChannels();

		for (let i = 0; i < channels.length; i++) {
			const channel = channels[i];

			if (i < channels.length - 1) {
				console.log(`├─${channel.getName()}`.cyan);
			} else {
				console.log(`└─${channel.getName()}`.cyan);
			}

		}
	}
	*/
});

// Login
async function main() {
	const email = await question('Email address: ');
	const password = await question('Password: ');

	client.login(email, password);
}

main();