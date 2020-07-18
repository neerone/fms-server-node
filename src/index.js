const WebSocket = require('ws');

const commandProcessor = require('./commandProcessor');
console.log("Server starting...");
const CONST = require('./constants/commands');

STORAGE = require('./storage');
const _ = require("lodash");
const {prepJson} = require('./utils');
var CryptoJS = require("crypto-js");

const {getMetaData} = require('./driver/DatabaseDriver');

console.log("Geting metadata...");
getMetaData((meta) => {
	STORAGE = meta;
	console.log("Starting the server..");
	const wss = new WebSocket.Server({ port: 4000 });
	console.log("Listening on port 4000");




	wss.on('connection', function connection(ws) {
		ws.on('message', function incoming(request) {
			commandProcessor(request, ws, wss);
		});
		ws.on('error', (error) => {
			console.error(error)
		});
		let newToken = CryptoJS.MD5(_.uniqueId('token_')).toString();
		let handshake = {command: CONST.CMDS.HANDSHAKE, token:newToken};
		ws.token = newToken;
		ws.send(prepJson(handshake))
	});





});
