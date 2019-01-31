var _ = require('lodash');
var {normalizeResults,normalizeDates,createDatabaseQuery} = require('./SelectorUtils')

function getSchema (user) {
	var result = {};
	return createDatabaseQuery("SELECT * FROM t_2")
		.then(
			result => result,
			error => {console.log(error)}
		)
		.then(d=> {
			result["2"] = d;
			return createDatabaseQuery("SELECT * FROM t_5 WHERE parent_widget_id = 0");
		})
		.then(d=> {
			result["5"] = d;
			return createDatabaseQuery("SELECT * FROM t_343");
		})
		.then(d=> {
			result["343"] = d;
			return createDatabaseQuery("SELECT * FROM t_7");
		})
		.then(d=> {
			result["7"] = d;
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
			return createDatabaseQuery("SELECT * FROM t_3");
		})
		.then(d=> {
			result["3"] = d;
			return createDatabaseQuery("SELECT * FROM t_347");
		})
		.then(d=> {
			result["347"] = d;
			return createDatabaseQuery("SELECT * FROM t_334")

		})
		.then(d=> {
			result["334"] = _.map(d, item => {item.active = "false"; item.loaded = "false"; return item;} );			
			return normalizeResults(result);
		});
}






exports = module.exports = {
	getSchema: getSchema
};