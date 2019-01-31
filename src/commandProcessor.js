const CONST = require('./constants/commands');
const _ = require("lodash");
const {prepJson} = require('./utils');
STORAGE = require('./storage');

const db = require('./driver/DatabaseDriver');
G = require('./globals');
module.exports = function (req, ws, wss) {
	req = JSON.parse(req);
	let {command} = req;
	console.log(command)




	switch (command) {
		case CONST.CMDS.LOGIN:
			return db.login(req, (req, user) => {
				
				ws.user = user
				ws.send(prepJson(req))
			})
			break;
		default: 
			if (!ws.user) {
				req.command = "loginFailure";
				req.status = "Err";
				req.message = "Ошибка доступа. Не найдена сессия.";
				ws.send(prepJson(req));
			} else {
				switch (command) {
					case CONST.CMDS.LOAD_WIDGET:
						return db.widgetDataRequest(req,ws, (req) => {
							ws.send(prepJson(req));
						})
					  	break;
					case CONST.CMDS.UPDATE_DATA:

						return db.createUpdate(req,ws, (req) => {
							ws.send(prepJson(req));
						})
					  	break;
					case CONST.CMDS.AUTO_POST:
						console.log("AUTOPOST@!")
						return db.autoPost(req,ws, (req) => {
							ws.send(prepJson(req));
						})

					default:
					  console.log('HAVE NO IDEA WHAT IS THE COMMAND');
				}
			}
			break;




	}
}