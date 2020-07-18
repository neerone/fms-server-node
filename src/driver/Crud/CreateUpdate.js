var _ = require('lodash');

STORAGE = require('../../storage');
const MI = require('../../constants/MI')
const WT = require('../../constants/widgetTypes');
const RT = require('../../constants/relationTypes');
const CMD = require('../../constants/commands');
var {c, knex} = require('../Connection');
const g = require('../../utils/getters');
const {normalizeResults,normalizeDates,createDatabaseQuery} = require('../DatabaseSelectors/SelectorUtils')
const getAllRelatedData = require('../DatabaseSelectors/AllRelatedDataSelector');
var CryptoJS = require("crypto-js");

var processAliexpressProductInsert =  require('./AliexpressProductInsert');
var processAliexpressAttributeGroupInsert =  require('./AliexpressAttributeGroupInsert');
let {updateRowToDB, writeNewRowToDB} = require("./WriteAndUpdate");

const {createErrorReject} = require('./CrudHelpers');


function isValidAlphanumeric(val){
	if (!val) return false;
	if (/[^a-zA-Z0-9\/]/.test( val[0] )) return false;
    if( /[^a-zA-Z0-9\_\/]/.test( val ) ) {
        return false;
    }
    return true;     
}


function getDeepRelatedModels(modelId) {
	var scannedModels = [];
	function scanDeepRelatedModels(mid) {
		var relatedModels = _.map(_.filter(g.getMetaModelsRelations(),(r) => {return r.model_id == mid}), (rel) => rel.relation_model_id+"");
		if (relatedModels.length == 0) return [];
		return _.reduce(relatedModels, (acc, rmid) => {
			if (scannedModels.indexOf(rmid) !== -1) return acc;
			scannedModels.push(rmid);
			return _.concat(acc, scanDeepRelatedModels(rmid), [rmid, modelId]);
		}, [])
	}
	return _.uniq(scanDeepRelatedModels(modelId));
}







function createNewModelTable(modelId) {
	return new Promise((resolve, reject) => {
		let query = `CREATE TABLE t_${modelId} 
					(id INT NOT NULL AUTO_INCREMENT, 
					created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, 
					deleted_at TIMESTAMP NULL DEFAULT NULL, 
					updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP, 
					PRIMARY KEY (id)
					) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_unicode_ci`;
		createDatabaseQuery(query).then(res => {
			if (res) {
				return resolve(true);
			} else {
				return reject(["Не получилось создать таблицу модели"]);
			}
		}, errors => {
			return reject(["Не получилось создать таблицу модели"]);
		})

	});
}

function replaceIdInTheStorage(storage, oldId, newId) {
	let newStorage = {};

	_.each(storage, (collection, modelId) => {
		var key = (modelId == oldId) ? newId : modelId;
		var newCollection = {};
		_.each(collection, (element, elementId) => {
			let newElementKey = (elementId == oldId) ? newId : elementId;
			let elementBody = {};

			_.each(Object.keys(element), k => {

				let v = element[k];
				let newV = (v == oldId) ? newId : v;
				let newK = (k == oldId) ? newId : k;

				elementBody[newK] = newV;
			})
			newCollection[newElementKey] = elementBody;

		})
		newStorage[key] = newCollection;
	});

	return newStorage;
}

function makeChangedItems(modelId, oldId, element, changedData) {
	if (!changedData[modelId]) changedData[modelId] = {};
	changedData[modelId][oldId] = element;
	return changedData
}

function createNewModels(drafts, changedData,ws) {
	return new Promise((resolve, reject) => {
		if (drafts[MI.META_MODELS]) {
			let newModels = _.map(_.filter(drafts[MI.META_MODELS], (v,k) => k.includes("new")), (m) => m)
			let promises = _.map(newModels, (newModel) => writeNewRowToDB(MI.META_MODELS, newModel,ws));
			Promise.all(promises).then((updatedArray) => {
				let createTablePromises = [];
				_.each(updatedArray, ({oldId, element, changedModelId}) => {
					let newId = g.getId(element);
					drafts = (replaceIdInTheStorage(drafts, oldId, newId));
					createTablePromises.push(createNewModelTable(newId));
					changedData = makeChangedItems(changedModelId, oldId, element, changedData)
				})
				Promise.all(createTablePromises).then((tableCreationResultsArray) => {
					if (_.every(tableCreationResultsArray, (r) => r)) {
						return resolve({type: "MODELS_CREATED", drafts, changedData});
					}
				}, errors => {
					return reject(errors)
				});

			}).catch((error) => {
				console.error(error)
			})

		} else {
			return resolve({type: "MODELS_CREATED", drafts, changedData});
		}
		
	})
}

function generateTypeAndDefaultOfAColumn(attr) {
	let type = "";
	let field_name = attr.field_name;
	let length = 11;
	let def ="";
	switch (attr.data_type) {
		case "double":
			type = "DOUBLE";
			def = (attr.default_value) ? ` DEFAULT ${attr.default_value}` : "";
		break;
		case "int":
		case "integer":
			type = `INT(${length})`;
			def = (attr.default_value) ? ` DEFAULT ${attr.default_value}` : "";
		break;
		case "text":
			type = `longtext`;
			def = (attr.default_value) ? ` DEFAULT '${attr.default_value}' COLLATE utf8_unicode_ci` : "";
		break;
		case "boolean":
		case "bool":
			type = 	"tinyint(1)";
			def = (attr.default_value) ? ` DEFAULT ${attr.default_value}` : "";
		break;
		case "string":
		case "varchar":
			length = (attr.length) ? attr.length : 255;
			type = `VARCHAR(${length})`;
			def = (attr.default_value) ? ` DEFAULT '${attr.default_value}' COLLATE utf8_unicode_ci` : "";
		break;
		case "date":
		case "datetime":
		case "time":
			type = "timestamp";
			def = (attr.default_value) ? ` DEFAULT ${attr.default_value}` : "";
		break;
		default: 
			type = "text";
			def = (attr.default_value) ? ` DEFAULT '${attr.default_value}'` : "";
	}
	return field_name +" " + type;
}

function getAttrKnexType(attr) {
	switch (attr.data_type) {
		case "double":
			return "decimal"
		break;
		case "int":
		case "integer":
			return "integer"
		break;
		case "text":
			return "text"
		break;
		case "boolean":
		case "bool":
			return "boolean"
		break;
		case "string":
		case "varchar":
			return "string";
		break;
		case "date":
		case "datetime":
		case "time":
			return "dateTime";
		break;
		default: 
			return "text"
	}
}


function createNewModelColumn(attr) {
	return new Promise((resolve, reject) => {
		if (["created_at", "updated_at", "deleted_at", "id"].includes(attr.field_name)) {
			return resolve(true)
		} else {
			let modelId = attr.model_id;

			if (!attr.field_name && attr.field_name.trim() == "") {
				return reject([`Поле ${attr.label} должно содержать Поле`]);
				return;
			}

			let query = knex.schema.table('t_'+modelId, function (table) {
			  table[getAttrKnexType(attr)](attr.field_name);
			}).toString();

			//let query = `ALTER TABLE t_${modelId} ADD ${generateTypeAndDefaultOfAColumn(attr)}`;
			console.log(query);
			createDatabaseQuery(query).then(res => {
				if (res) {
					return resolve(true);
				} else {
					return reject(["Не получилось создать колонку модели"]);
				}
			}, errors => {return reject(errors)})
		}
	});
}

function updateModelColumn(newAttr, oldAttr) {
	return new Promise((resolve, reject) => {

		let modelId = oldAttr.model_id;
		let oldAttrFieldName = oldAttr.field_name;

		if (oldAttrFieldName == 'id') {
			return resolve(true);
			return;
		}

		let query = `ALTER TABLE t_${modelId} CHANGE ${oldAttrFieldName} ${generateTypeAndDefaultOfAColumn(newAttr)}`;

		//console.log(query);

		createDatabaseQuery(query).then(res => {
			if (res) {
				return resolve(true);
			} else {
				return reject(["Не получилось обновить колонку модели"]);
			}
		})

	});
}


function updateColumns(drafts, changedData,ws) {

	return new Promise((resolve, reject) => {
		if (drafts[MI.META_MODELS_ATTRIBUTES]) {


			let promises = _.map(drafts[MI.META_MODELS_ATTRIBUTES], (newCol, newColId) => {


				if (newColId.includes("new")) {
					if (!isValidAlphanumeric(newCol.field_name)) return reject(["Неверно задана колонка " + newCol.label]);
					return writeNewRowToDB(MI.META_MODELS_ATTRIBUTES, newCol,ws)
				} else {
					let colToUpdate = _.merge(_.clone(g.getMetaModelsAttributes(newCol.id)),newCol);
					return updateRowToDB(MI.META_MODELS_ATTRIBUTES, colToUpdate, ws);
				}
			});

			Promise.all(promises).then((updatedArray) => {

				let createTableColumnsPromises = [];
				_.each(updatedArray, (res) => {
					let type = res.type;
					if (type == "ROW_INSERTED") {
						let {oldId, element, changedModelId} = res;
						let newId = g.getId(element);
						drafts = (replaceIdInTheStorage(drafts, oldId, newId));
						changedData = makeChangedItems(changedModelId, oldId, element, changedData)
						let currentAttr = drafts[MI.META_MODELS_ATTRIBUTES][newId];

						createTableColumnsPromises.push(createNewModelColumn(currentAttr));

					} else if (type == "ROW_UPDATED") {
						let {element, changedModelId} = res;
						let newId = g.getId(element);
						let oldAttr = _.clone(STORAGE[MI.META_MODELS_ATTRIBUTES][newId]);
						changedData = makeChangedItems(changedModelId, newId, element, changedData)
						let currentAttr = element;
						STORAGE[MI.META_MODELS_ATTRIBUTES][newId] = currentAttr;
						createTableColumnsPromises.push(updateModelColumn(currentAttr, oldAttr));
					}


				})
				Promise.all(createTableColumnsPromises).then((columnCreationResultsArray) => {
					if (_.every(columnCreationResultsArray, (r) => r)) {
						return resolve({type: "COLUMNS_UPDATED", drafts, changedData});
					}
				}, errors => {return reject(errors)});

			})


		} else {
			return resolve({type: "COLUMNS_UPDATED", drafts, changedData});
		}
		
	})


}



function processRequest({modelId, elementId, drafts},ws) {
	return new Promise((resolve, reject) => {

		let allowedModelsToChange = getDeepRelatedModels(modelId);
		//Сначала проверяем наличие новых моделей
		createNewModels(drafts, {},ws).then(res => {
			//Добавляем в них колонки, если есть
			return updateColumns(res.drafts, res.changedData,ws);

		}).then(res => {
			let newDrafts = res.drafts;
			let changedData = res.changedData;

			let lastPromises = [];

			_.each(newDrafts, (draftElementCollection, draftModelId) => {
				_.each(draftElementCollection, (draftElement, draftElementId) => {

					

					draftModelId+="";
					draftElementId+="";

					let isDraftElementNew = draftElementId.includes("new");

					if (allowedModelsToChange.indexOf(draftModelId) == -1) {
						console.error(`Извините, модель черновика ${draftModelId} не находится в списке разрешенных к изменению`);
					} else {
						if (isDraftElementNew) {
							lastPromises.push(writeNewRowToDB(draftModelId, draftElement,ws));

						} else {
							lastPromises.push(updateRowToDB(draftModelId, draftElement,ws));
						}
					}
				});
			})

			_.each(newDrafts, (v,k) => {
				let merge = _.find(MI, (modelid, modelkey) => ((modelid+"" == k+"") && modelkey.includes("META_")));
				if (merge) {
					//Не удаляем, просто заменяем ID на новый
					//let draftsToMerge = _.filter(newDrafts[k], (elem, elemKey ) => !elemKey.includes("new"));

					STORAGE[k] = _.merge(STORAGE[k], newDrafts[k]);
				}
			});

			let req = {};
			Promise.all(lastPromises).then(results => {

				_.map(results, function(updateResult) {
					let oldId, element,changedModelId;


					element = updateResult.element;

					oldId = updateResult.oldId;
					changedModelId = updateResult.changedModelId;
					let newId = g.getId(element);

					switch (updateResult.type) {
						case "ROW_INSERTED":

							STORAGE = replaceIdInTheStorage(STORAGE, oldId, newId);
							var objToMerge = {
								[changedModelId] : {
									[updateResult.oldId]: element
								}
							}
							changedData = _.merge(changedData, objToMerge);
						break;
						case "ROW_UPDATED":
							//console.log("ROW UPDATED",newId,element)
							var objToMerge = {
								[changedModelId] : {
									[newId]: element
								}
							}
							changedData = _.merge(changedData, objToMerge);
						break;
					} 
				})
				req.command = "updateDataSuccess";
				req.status = "Ok";
				req.message = "Изменения приняты";
				req.changedData = changedData;

				return resolve(req)
			}, errors => {
				return reject(errors);
			})

		}, errors => {
			return reject(errors)
		});


	})
}

function findElementByIdInTheStorage(storage, idToFind) {
	let outputElement = {};
	let outputModelId = "";
	_.each(storage, (changedCollection,changedModelId) => {
		_.each(changedCollection, (changedItem, changedItemId) => {
			if (changedItemId+"" == idToFind+"")
			{
				outputElement = changedItem;
				outputModelId = changedModelId;
			}
		})
	})
	return [outputModelId, outputElement];
}

function fixLinksInResults(results, ws) {
	return new Promise((resolve, reject) => {

		var promises = [];
		_.map(results, (res) => {
			_.each(res.changedData, (changedCollection,changedModelId) => {

				_.each(changedCollection, (changedItem, changedItemId) => {

					_.each(changedItem, (val, key) => {

						if (val && key && ((val+"").includes("new") || (key+"").includes("new"))) {
							//console.warn("Меняем " + key ":"+val+" на настоящее значение.");



							//убираем модели, чекаем элемент с ID = val
							let [outputModelId, outputElement] = findElementByIdInTheStorage(res.changedData, val);

							linkedObjectId = g.getId(outputElement);

							changedItem[key] = linkedObjectId;

							promises.push(updateRowToDB(changedModelId, changedItem, ws));

						}
						
					})
				})
			})
		})

		Promise.all(promises).then(successResult => {
			return resolve(results);
		}, errors => {
			return reject(errors);
		})
	})
}


function fixBelongsToLinks(originalRequest, results) {

	//Если мы сохраняем вещь, принадлежащую объекту который не сохранен, сохраняем связь с этим объектом
	return new Promise((resolve, reject) => {

		_.each(originalRequest, (req, reqIndex) => {
			let drafts = req.drafts;

			let currentResponse = results[reqIndex];

			_.each(drafts, (collection, modelId) => {

				_.each(collection, (element, elementId) => {

					_.each(element, (value, key) => {
						if (value.includes("new")) {

							if (currentResponse.changedData[modelId] && currentResponse.changedData[modelId][elementId]) {

								let responseValue = currentResponse.changedData[modelId][elementId][key];
								if (responseValue == "0" || !responseValue) {
									currentResponse.changedData[modelId][elementId][key]= value;
								}	
							}

						}
					})

				})

			})

		})
		return resolve(results);

	});
}


function autoPost(req,ws, cb) {
	if (req.data[0].modelId == "368") {
		return processAliexpressAttributeGroupInsert(req,ws, cb);
	} else {
		return processAliexpressProductInsert(req,ws, cb);
	}
}

function createUpdate(req,ws, cb) {

	var requests = req.data;
	var originalRequest = _.clone(requests);
	var resultPromises = _.map(requests, (reqdata) => {
		return processRequest(reqdata,ws);
	})

	c.beginTransaction(function(err) {
		if (err) { throw err; }
		Promise.all(resultPromises).then((results) => {
			fixLinksInResults(results, ws).then(fixedResults=>{
				return fixBelongsToLinks(originalRequest, fixedResults)
			})
			.then(fixedResults=>{
				c.commit(function() {
					cb({
						command: CMD.CMDS.UPDATE_DATA_RESPONSE,
						id: req.id,
						token: req.token,
						widgetKey: req.widgetKey,
						results: fixedResults
					})
				});
			})
		}, (errors) => {
			c.rollback(() => {
				createErrorReject(CMD.CMDS.UPDATE_DATA_FAILURE, c, "Не удалось выполнить операцию", errors, req, cb)
			})
		});
	});

}

module.exports = {
	createUpdate:createUpdate, 
	autoPost:autoPost, 
};



