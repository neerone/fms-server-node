var db = require('node-mysql');
var DB = db.DB;
var BaseRow = db.Row;
var BaseTable = db.Table;

var _ = require('lodash');

var {getSchema} = require('./DatabaseSelectors/SchemaSelector');
var {widgetDataRequest} = require('./DatabaseSelectors/WidgetDataSelector');
var {createUpdate,updateRowToDB,writeNewRowToDB, autoPost} = require('./Crud/CreateUpdate');
var {createDatabaseQuery,normalizeResults} = require('./DatabaseSelectors/SelectorUtils');
var {c, knex} = require('./Connection');
const MI = require('../constants/MI');

function login(req, cb) {

	//let loginQuery = `SELECT id, access_level_id FROM t_333 where login="${req.data.login}" AND password="${req.data.password}"`;

	let loginQuery = knex(`t_${MI.USERS}`).where('login', req.data.login).where('password', req.data.password).toString();


	console.log(loginQuery);
	req.data = null;
	createDatabaseQuery(loginQuery)
	.then(
		results=>{
			if (results.length>0) {
				req.status = "Ok";
				req.message = "Успешно";
				user = results[0];
				getSchema(user).then(schema=>{
					req.command = "loginSuccess";
					req.data = schema;
					cb(req, user);
				});
			} else {
				req.command = "loginFailure";
				req.status = "Err";
				req.message = "Ошибка доступа";
				cb(req, null);
			}
		},
		error=> {
			req.command = "loginFailure";
			delete req.data;
		  	req.message = "Ошибка базы данных";
		  	req.status = "Err";
		  	req.data = error;
			cb(req, null);
			throw "Ошибка";
		}
	)

}



function getMetaData(cb) {


	var result = {};
	return createDatabaseQuery("SELECT * FROM t_2")
		.then(d=> {
			result["2"] = d;
			return createDatabaseQuery("SELECT * FROM t_5");
		})
		.then(d=> {
			result["5"] = d;	
			//Связи
			return createDatabaseQuery("SELECT * FROM t_7");
		})
		.then(d=> {
			result["7"] = d;	
			//Атрибуты
			return createDatabaseQuery("SELECT * FROM t_3");
		})
		.then(d=> {
			result["3"] = d;
			//Опции
			return createDatabaseQuery("SELECT * FROM t_6");
		})
		.then(d=> {
			result["6"] = d;
			//Грузим стейты
			return createDatabaseQuery("SELECT * FROM t_31");
		})
		.then(d=> {
			result["31"] = d;
			//Опции
			return createDatabaseQuery("SELECT * FROM t_343");
		})
		.then(d=> {
			result["343"] = d;
			//Опции
			return createDatabaseQuery("SELECT * FROM t_344");
		})
		.then(d=> {
			result["344"] = d;
			//Опции
			return createDatabaseQuery("SELECT * FROM t_345");
		})
		.then(d=> {
			result["345"] = d;
			//Опции
			return createDatabaseQuery("SELECT * FROM t_348");
		})
		.then(d=> {
			result["348"] = d;
			//Опции
			return createDatabaseQuery("SELECT * FROM t_347");
		})

		.then(d=> {
			result["347"] = d;
			cb( normalizeResults(result) );
		});
}

exports = module.exports = {
	login:login,
	widgetDataRequest: widgetDataRequest,
	getMetaData: getMetaData,
	createUpdate: createUpdate,
	updateRowToDB: updateRowToDB,
	writeNewRowToDB:writeNewRowToDB,
	autoPost:autoPost,
};