var _ = require('lodash');
var moment = require('moment');
var {c, knex} = require('../Connection');

function createDatabaseQuery(q) {
	return new Promise((resolve, reject) => {
		c.query(q, function (error, results) {
			if (!error) {
				return resolve(results);
			} else {
				return reject(error);
			}
		});


	});
}



function normalizeDates(object) {
	_.each(Object.keys(object), field => {
		if (moment(object[field],["DD-MM-YYYY HH:mm:ss", "YYYY-MM-DD HH:mm:ss"], true).isValid()) {
			object[field] =  moment(object[field],["DD-MM-YYYY HH:mm:ss", "YYYY-MM-DD HH:mm:ss"]).format("DD-MM-YYYY HH:mm:ss");
		}
		if (object[field] == "Invalid date") {
			delete object[field];
		}
	}) 
	

/*	_.each(["updated_at","created_at","deleted_at","date","datetime", "time", "started_from"], function(datekey) {
		if (object[datekey] && object[datekey] != "Invalid date") {
			object[datekey] =  moment(object[datekey],["DD-MM-YYYY HH:mm:ss", "YYYY-MM-DD HH:mm:ss"]).format("DD-MM-YYYY HH:mm:ss");
		} else {
			delete object[datekey];
		}
	})*/

	return object
}


function normalizeResults(results) {
	var res = {};
	_.map(results, function(modelElementArray, modelId) {
		var obj = {};
		_.forEach(modelElementArray, function(elementObject, elementId) {
			elementObject = normalizeDates(elementObject);
			obj[elementObject.id] = elementObject;
		});
		res[modelId] = obj;
	})
	return res;
}




exports = module.exports = {
	normalizeResults: normalizeResults, 
	normalizeDates: normalizeDates,
	createDatabaseQuery: createDatabaseQuery,
};