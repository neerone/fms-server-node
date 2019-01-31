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
var moment = require('moment');
const {putFile} = require('../FileDriver');
var CryptoJS = require("crypto-js");
var parseDataUrl = require('parse-data-url');
var validDataUrl = require('valid-data-url');

function oldLinksBringBackToNewElement(oldElement, newElement) {
	var outputElement = _.clone(newElement);
	var fieldsWithLinks = _.each(oldElement, (val,key) => {
		if (val && key && key!="id"&& key!="file" && (val+"").includes("new")) {
			outputElement[key] = val;
		}
	});

	return outputElement;
} 


function prepareDates(rawelement) {
	let object = _.clone(rawelement);
	_.each(Object.keys(object), field => {
		if (moment(object[field],["DD-MM-YYYY HH:mm:ss", "YYYY-MM-DD HH:mm:ss"], true).isValid()) {
			object[field] =  moment(object[field],["DD-MM-YYYY HH:mm:ss", "YYYY-MM-DD HH:mm:ss"]).format("YYYY-MM-DD HH:mm:ss");
		}
		if (object[field] == "Invalid date") {
			delete object[field];
		}
	}) 

	return object
}


function journalize(obj_type, obj_id,action_type, ws) {
	return new Promise((resolve, reject) => {
		if (ws && ws.user) {
			let query = knex(`t_${MI.JOURNAL}`).insert({obj_type, obj_id, action_type,user_id:g.getId(ws.user)}).toString();
			createDatabaseQuery(query).then(res=>{
				return resolve();
			}, err => {reject(err)});
		} else {
			return resolve();
		}
	});
}


function checkUniqueField(modelId, attr, value,elementId) {
	return new Promise((resolve, reject) => {
		let query = knex(`t_${modelId}`).where(attr.field_name, value).toString();
		createDatabaseQuery(query).then(res=>{
			if (res[0] && g.getId(res[0]) != elementId) {
				return resolve(`Поле ${attr.label} должно быть уникальным, но оно уже используется в элементе №${g.getId(res[0])} модели ${modelId}`);
			}
			return resolve();
		}, error => {
			return resolve("Не удалось выполнить проверку на уникальность: ${error.message}");
		});
	});
}

function getElementForValidation(modelId, elementId, element) {
	return new Promise((resolve, reject) => {
		console.log("TRYING TO REACH ELEMENT ID:", elementId)
		if (!(elementId+"").includes("new") && elementId) {
			let query = knex(`t_${modelId}`).where("id", elementId).toString();
			createDatabaseQuery(query).then(res=>{
				if (res[0]) {
					return resolve(_.merge(res[0], element));
				}
				return reject(["Не удалось получить элемент для проверки "+elementId+" из модели "+modelId]);
			}, error => {
				return reject(["Не удалось получить элемент для проверки "+elementId+" из модели "+modelId]);
			});
		} else {
			resolve(element);
		}
	});
}

function validateElementBeforeWrite(modelId, elementId, element) {
	return new Promise((resolve, reject) => {

		getElementForValidation(modelId, elementId, element).then(fullelement => {

			let requiredAttrs = _.filter(STORAGE[MI.META_MODELS_ATTRIBUTES], attr => attr.model_id == modelId && attr.required);
			let uniqueAttrs = _.filter(STORAGE[MI.META_MODELS_ATTRIBUTES], attr => attr.model_id == modelId && attr.unique_attr);


			if (requiredAttrs.length == 0 && uniqueAttrs == 0) {
				return resolve([]);
			}

			let errors = [];

			_.each(requiredAttrs, attr => {
				if (!fullelement[attr.field_name]) {
					console.log(modelId, attr.field_name,fullelement);
					errors.push(`Поле ${attr.label} обязательно к заполнению`);
				}
			});

			let uniqueCheckPromises = _.map(uniqueAttrs, attr => {
				return checkUniqueField(modelId, attr, fullelement[attr.field_name],elementId);
			});

			Promise.all(uniqueCheckPromises).then(errorsArray => {
				_.each(errorsArray, e => {
					if (e) errors.push(e);
				});
				return resolve(errors);
			}, () => {
				return reject(["Не удалось выполнить валидацию объекта. Модель: ${modelId}, Объект ${elementId}."]);
			});

		}, err => {reject(err)})


	});
}


function writeNewRowToDB(modelId, rawelement,ws) {
	return new Promise((resolve, reject) => {

		let element = _.clone(rawelement);
		let oldElement = _.clone(rawelement);
		let oldElementId = g.getId(oldElement);

		delete element.id;

		var keys = Object.keys(element);
		var values = _.map(keys, key => {
			return element[key+""];
		})

		
		function createInsertionQuery(query, resolve, reject) {
			createDatabaseQuery(query).then(res => {
				
				if (res.insertId && res.affectedRows == 1) {
					let query = knex(`t_${modelId}`).where('id', res.insertId).toString();

					createDatabaseQuery(query).then(res=>{
						if (res[0]) {
							let newElement = res[0];
							let newElementId = g.getId(newElement)
							journalize(modelId, newElementId,1, ws).then(() => {
								return resolve({type: "ROW_INSERTED",changedModelId:modelId,	element: normalizeDates(oldLinksBringBackToNewElement(oldElement, newElement)), oldId: oldElementId});
							}, err => {reject(err)})
						}

					}, err => {reject(err)})

				}
			}, err => {reject(err)})
		}

		if (rawelement.id == 429) {
			console.log("WE FOUNT THIS2!",rawelement);
		}

		validateElementBeforeWrite(modelId, rawelement.id, element).then(errors => {

			if (errors.length>0) {
				return reject(errors);
			} else {
				let query = knex(`t_${modelId}`).insert(prepareDates(element)).toString();
				console.log(query)
				if (modelId == MI.FILES) {
					console.log("MI FILES")

					let parsed = parseDataUrl(element.file);

					if (parsed) {


						if (parsed.mediaType.includes('image')) {

							var ext = parsed.mediaType.split("/")[1];

							var formated_date = moment().format("YYYY-MM-DD").toString();
							var filePath =  (formated_date.split("-").join("/")) +"/"+ CryptoJS.MD5(element.label+element.size).toString() +"."+ext;

							putFile(new Buffer(parsed.data, 'base64'), filePath, function() {
								element.file_loaded = "100";
								element.file = filePath;
								query = knex(`t_${modelId}`).insert(element).toString();
								createInsertionQuery(query, resolve, reject);
							})
						} else {
							return reject("Неверный тип файла");
						}


					} else if (element.file.includes(".jpg")) {
						createInsertionQuery(query, resolve, reject);

					} else {

						return reject("Неверный тип файла");

					}

				} else {	
					createInsertionQuery(query, resolve, reject);
				}
			}
		}, error => {
			reject(error);
		})




	});
}

function updateRowToDB(modelId, rawelement,ws) {
	return new Promise((resolve, reject) => {
		let element = normalizeDates(_.clone(rawelement));
		let oldElement = _.clone(rawelement);
		let id = g.getId(element);
		delete element.id;

		let query = knex(`t_${modelId}`).where('id', id).update(prepareDates(element)).toString();

		validateElementBeforeWrite(modelId, rawelement.id, element).then(errors => {

			if (errors.length>0) {
				return reject(errors);
			} else { 
				createDatabaseQuery(query).then(res => {

					if (res.affectedRows >= 1) {
						let query = knex(`t_${modelId}`).where('id', id).toString();
						createDatabaseQuery(query).then(res=>{
							if (res[0]) {
								let newElement = res[0];
								let newElementId = g.getId(newElement);
								//journalize(modelId, newElementId,2, ws).then(() => {
								return resolve({type: "ROW_UPDATED" ,changedModelId:modelId,element: normalizeDates(oldLinksBringBackToNewElement(oldElement, newElement))});
								//})


							}
						}, err => {reject(err)});
					}
				}, err => {reject(err)})
			}

		}, err => {reject(err)});
	});
}


function createOrUpdateElement(uniqueField, modelId, element, ws) {
	//Ищем в базе нужный uniqueField,
	//если есть результат - апдейтим, если нет - создаем
	let tableName = `t_${modelId}`;
	let query = knex(tableName).where(uniqueField,element[uniqueField]).toString();

	return createDatabaseQuery(query).then(res=> {
		if(res && res.length>0) {
			let newElement = _.merge(res[0], element);
			return updateRowToDB(modelId, newElement,ws)
		} else {
			return writeNewRowToDB(modelId, element,ws)
		}
	}, err => {reject(err)});

}

function getFromDatabase(modelId, value, field) {
	let tableName = `t_${modelId}`;
	if (!field) field = "id";
	let query = knex(tableName).where(field,value).toString();

	return createDatabaseQuery(query).then(res=> {
		return res;
	}, err => {reject(err)});

}

module.exports = {
	updateRowToDB:updateRowToDB, 
	writeNewRowToDB:writeNewRowToDB,
	createOrUpdateElement:createOrUpdateElement,
	getFromDatabase:getFromDatabase
};