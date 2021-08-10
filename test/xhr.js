const XMLHttpRequest = require('xmlhttprequest').XMLHttpRequest;


async function main() {
	const response = await test();
	console.log(response);
}

function test() {
	return new Promise(resolve => {
		const xhr = new XMLHttpRequest();
		xhr.addEventListener('load', function () {
			console.log(xhr.status);
			resolve(xhr.responseText);
		});
		xhr.open('get', 'https://discordapp.com/api/v6/gateway');
		xhr.setRequestHeader('Content-Type', 'application/json;charset=UTF-8');
		xhr.send();
	});
}

main();