G = require('../../../globals');
var _ = require('lodash');
const {getAliId,simplifyUrl,getAdminSeq,getPricesData} = require('./AliFunctions');
const cheerio = require('cheerio')
var needle = require('needle');
const g = require('../../../utils/getters');
var moment = require('moment');
let {updateRowToDB, writeNewRowToDB, createOrUpdateElement,getFromDatabase} = require("../WriteAndUpdate");
var {c, knex} = require('../../Connection');
const {createNewId} = require('../CrudHelpers');

const {normalizeResults,normalizeDates,createDatabaseQuery} = require('../../DatabaseSelectors/SelectorUtils')
STORAGE = require('../../../storage');
/*function getDefaultAttributeAction(attrId, newProductId, originalName, value, drafts) {
	return new Promise((resolve, reject) => {
		getFromDatabase('357', attrId).then((element) => {
			drafts['357'][attrId] = element;

			let query = knex(`t_360`).where("original_value",value).where("attribute_id",attrId).toString();
			console.log(query);
			return createDatabaseQuery(query).then(res=> {
				let valueElement = {};
				if(res && res.length>0) {
					valueElement = res[0];
				} else {
					newValueId = createNewId();
					valueElement = {
						id: newValueId,
						original_value: value,
						attribute_id: attrId,
						label: value,
					};
				}
				drafts['360'][g.getId(valueElement)] = valueElement;
				newId = createNewId();
				
				drafts['359'][newId] = {
					product_id: newProductId,
					attribute_id: attrId,
					attribute_value_id:g.getId(valueElement),
					original_name:originalName,
				};
				return resolve(drafts);

			});


			


		});
	});
}

const parseDescriptions = {
	"цвет|color": function(newProductId, originalName, value, drafts) {
		return getDefaultAttributeAction("1", newProductId, originalName, value, drafts);
	},
	"вес": function(newProductId, originalName, value, drafts) {
		return getDefaultAttributeAction("5", newProductId, originalName, value, drafts);
	},
	"power": function(newProductId, originalName, value, drafts) {
		return getDefaultAttributeAction("6", newProductId, originalName, value, drafts);
	},
	"voltage": function(newProductId, originalName, value, drafts) {
		return getDefaultAttributeAction("7", newProductId, originalName, value, drafts);
	},
}



function generateAttribute(newProductId, title, value, drafts) {
	return new Promise((resolve, reject) => {

		let promises = [];
		_.each(parseDescriptions, (decodeFunction, titleVariants) => {

			_.each(titleVariants.split("|"), titleCase => {
				if (title.toLowerCase().includes(titleCase)) {
					promises.push(decodeFunction(newProductId, title, value, drafts));
					
				}
			})

		})

		Promise.all(promises).then(resultDrafts => {
			//console.log(_.merge(resultDrafts));

			return resolve(_.reduce(resultDrafts, function(acc, currentDrafts) {
			  return _.merge(acc, currentDrafts);
			}, {}));

		})

	});
}*/

function addAllAliasesToAttribute(attributeId, drafts) {
	return new Promise((resolve, reject) => {
		let currentGlobalPromise = getFromDatabase('362', attributeId, "attribute_id").then(aliases => {
			_.each(aliases,alias =>{
				drafts['362'][g.getId(alias)] = alias;
			})
			return resolve(drafts);
		});

	});
}

function convertAttributeValue(attribute_type, value) {
	switch (attribute_type) {
		case 2: 
			if (value) {
				return parseFloat(value.replace(",","."));
			}
			return value;
			break;
		case 3: 
			if (value.includes("Не") || value == "Нету" || value == "Нет" || value == "No" || value == "Не имеется") {
				return "Нет";
			}
			return "Да";
			break;
		default: 
			return value;
			break;
	} 
} 

function addAttributeValues(newProductId, attribute, attributeVal, attrId, foundAlias, drafts) {
		let value = convertAttributeValue(attribute.attribute_type, attributeVal);
		let query = knex(`t_360`)
			.where("attribute_id",attrId)
			.where("original_value",'like',`%${attributeVal}%`)
			.orWhere("label",'like',`%${attributeVal}%`)
			.toString();
		return createDatabaseQuery(query).then(res=> {



			let valueElement = {};
			if(res && res.length>0) {
				valueElement = res[0];
			} else {

				newValueId = createNewId();
				valueElement = {
					id: newValueId,
					original_value: value,
					attribute_id: attrId,
					label: value,
				};
			}
			drafts['360'][g.getId(valueElement)] = valueElement;

			newId =  createNewId();
			
			drafts['359'][newId] = {
				id: newId,
				product_id: newProductId,
				attribute_id: attrId,
				attribute_value_id:g.getId(valueElement),
			};

			drafts["362"][g.getId(foundAlias)] = foundAlias;



			drafts["357"][g.getId(attribute)] = attribute;


			return addAllAliasesToAttribute(attrId, drafts);
			
		});

}

function generateAttribute(newProductId,attributeTitle, attributeVal, drafts) {
	return new Promise((resolve, reject) => {

		let query = knex(`t_362`).where("label",'like',`%${attributeTitle}%`).toString();
		console.log(query);
		return createDatabaseQuery(query).then(res=> {
			let globalPromises = [];
			_.each(res, foundAlias => {


				let currentGlobalPromise = getFromDatabase('357',foundAlias.attribute_id).then(attributes => {

					let attribute = attributes[0];
					let attrId = foundAlias.attribute_id;
					let canBeMultiple = attribute.can_be_multiple;


					if (canBeMultiple) {
						let values = attributeVal.split(",");
						let multiplePromises = [];
						_.each(values, val => {
							val = val.trim();
							multiplePromises.push(addAttributeValues(newProductId, attribute, val, attrId, foundAlias, drafts));
						})
						return Promise.all(multiplePromises).then(draftsArray => {
							return (_.reduce(draftsArray, function(acc, currentDrafts) {
							  return _.merge(acc, currentDrafts);
							}, {}));
						})
					} else {
						return addAttributeValues(newProductId, attribute, attributeVal, attrId, foundAlias, drafts)
					}
				})


				globalPromises.push(currentGlobalPromise);
			})


			return Promise.all(globalPromises).then(draftsArray => {
				return resolve(_.reduce(draftsArray, function(acc, currentDrafts) {
				  return _.merge(acc, currentDrafts);
				}, drafts));
			})


		});

	});
}


function addProductAttributes($,newProductId, drafts) {
	return new Promise((resolve, reject) => {

		//Парсим атрибуты ключ-значение
		//Создаем фейковые элементы для каждого атрибута
		//Заносим их в сторадж
		//КЛЮЧ заносим внутрь комбобокса как фильтр

		let attributes = $(".property-item");

		let attributeProcessPromises = [];


		_.each(attributes, attr => {
			let attributeTitle = $(attr).find(".propery-title").text().replace(":","");
			let attributeVal = $(attr).find(".propery-des").text();
			attributeProcessPromises.push(generateAttribute(newProductId,attributeTitle, attributeVal, drafts));
		})


		Promise.all(attributeProcessPromises).then(resultDrafts => {


			return resolve(_.reduce(resultDrafts, function(acc, currentDrafts) {


			  return _.merge(acc, currentDrafts);
			}, {}));
		})

	})
}
module.exports = {
	addProductAttributes:addProductAttributes
}