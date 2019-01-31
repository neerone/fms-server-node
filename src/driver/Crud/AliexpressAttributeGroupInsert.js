var _ = require('lodash');

STORAGE = require('../../storage');
G = require('../../globals');
const MI = require('../../constants/MI')
const WT = require('../../constants/widgetTypes');
const RT = require('../../constants/relationTypes');
const CMD = require('../../constants/commands');

const {createNewId} = require('./CrudHelpers');

var {c, knex} = require('../Connection');
const g = require('../../utils/getters');
const {normalizeResults,normalizeDates,createDatabaseQuery} = require('../DatabaseSelectors/SelectorUtils')
const getAllRelatedData = require('../DatabaseSelectors/AllRelatedDataSelector');
var moment = require('moment');
let { getAliexpressCategoryOffers,getAliexpressCategoryList } = require("./AliexpressModules/EpnApi");
let { getAttributeType } = require("./AliexpressModules/AttributeValueValidator");
var CryptoJS = require("crypto-js");

var needle = require('needle');
const cheerio = require('cheerio')
var fs = require('fs');
let {getFromDatabase} = require("./WriteAndUpdate");

var Promise = require("bluebird");

var options = {
  compressed        : true, 
  follow_max        : 5,    
  rejectUnauthorized: true  
}




function processProductAttributes(productId,ws ) {
	return new Promise((resolve, reject) => {
		needle.get(`https://ru.aliexpress.com/item//${productId}.html`, options, (error, response) => {
		  	if (error || !response || response.statusCode != 200  || !response.body) {
		  		return reject("Не удалось выйти на товар али");
		  	}

			console.log("PROD HREF PROC", productId)


  			let $ = cheerio.load(response.body);
			let attributes = $(".property-item");
			finalAttrs = [];
			_.each(attributes, attr => {
				let attributeTitle = $(attr).find(".propery-title").text().replace(":","");
				let attributeVal = $(attr).find(".propery-des").text();


				finalAttrs.push({
					title:attributeTitle, 
					type:getAttributeType(attributeVal)
				});
			})

			return resolve(finalAttrs);

		});

	}); 
}

function generateNewAtributeGroupRow(drafts, attributeId, elementId, count) {
	let newGroupRowId = createNewId();
	drafts["369"][newGroupRowId] = {id:newGroupRowId,attribute_group_id: elementId, attribute_id:attributeId, count:count};
	return drafts;
}


function generateNewFakeAttributeAndGroupRow(drafts, textAlias, type, count, elementId) {
	let newAttributeId = createNewId();
	let newFakeAttribute = {id:newAttributeId, label: textAlias, attribute_type: type};

	drafts["357"][newAttributeId] = newFakeAttribute;

	let newAttributeAliasId = createNewId();
	let newFakeAttributeAlias = {id:newAttributeAliasId, attribute_id: newFakeAttribute.id, label: textAlias};

	drafts["362"][newAttributeAliasId] = newFakeAttributeAlias;

	drafts = generateNewAtributeGroupRow(drafts, newFakeAttribute.id, elementId, count);


	return drafts;
}

function findAttributeInDBOrMakeDraft(textAlias, type, count, drafts, elementId) {
	return new Promise((resolve, reject) => {

		let query = knex(`t_362`).where("label",'like',`%${textAlias}%`).toString();
		console.log(query);
		createDatabaseQuery(query).then(res=> {
			if (res && res[0]) {
				//Мы нашли алиас похоже атрибута
				let foundAlias = res[0];
				getFromDatabase('357',foundAlias.attribute_id).then(res => {
					if (res && res[0]) {
						let foundAttribute = res[0];
						let attributeId = g.getId(foundAttribute);

						console.log("attributeId!!!!!!!!!", foundAttribute)
						drafts["357"][attributeId] = foundAttribute;
						drafts = generateNewAtributeGroupRow(drafts, attributeId, elementId, count);
						return resolve(drafts);

					} else {
						drafts = generateNewFakeAttributeAndGroupRow(drafts, textAlias, type, count, elementId)
						return resolve(drafts);
					}

				});	


			} else {
				//Такого атрибута нет пока, фигачим новый в драфт
				drafts = generateNewFakeAttributeAndGroupRow(drafts, textAlias, type, count, elementId)
				return resolve(drafts);
			}
		});

	});
}

function groupAttributes(itemAttributesList, drafts, elementId,ws) {

	return new Promise((resolve, reject) => {

		let groupedAttributes = _.reduce(itemAttributesList, (acc, itemAttributes) => {

			_.each(itemAttributes, ({title, type}) => {
				let foundItem = _.find(acc, {title: title});
				if (foundItem) {
					foundItem.count++;
				} else {
					acc.push({title, type, count: 1})
				}
			});
			return acc;


		}, []);

		let commonAttributes = _.filter(groupedAttributes, ({count}) => count>10)

		let pr = [];
		_.each(commonAttributes, attr => {
			pr.push(findAttributeInDBOrMakeDraft(attr.title, attr.type, attr.count, drafts, elementId))
		})


/*		Promise.all(pr).then(resultDrafts => {
			console.log(resultDrafts)
			return resolve(resultDrafts);
		})*/

		Promise.all(pr).then(resultDrafts => {


			return resolve(_.reduce(resultDrafts, function(acc, currentDrafts) {
				return _.merge(acc, currentDrafts);
			}, {}));
		})

/*		

		let query = knex(`t_362`).where("label",'like',`%${attributeTitle}%`).toString();
		console.log(query);
		return createDatabaseQuery(query).then(res=> {
			let globalPromises = [];
			_.each(res, foundAlias => {


				let currentGlobalPromise = getFromDatabase('357',foundAlias.attribute_id).then(attributes => {

					let attribute = attributes[0];
					let attrId = foundAlias.attribute_id;
	
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


		});*/



	})
}

function processPage(query, drafts, elementId,ws ) {
	//return new Promise((resolve, reject) => {
		return getAliexpressCategoryOffers(query).then(({offers}) => {

			let processProduct = [];
		  	_.each(offers, offer => {
		  		let productId = offer.product_id;
		  		processProduct.push(() => processProductAttributes(productId,ws));

		  	})


			return Promise.mapSeries(processProduct, item => {
				return Promise.delay(150).then(item);
			}).then(processedProductAttributes => {
				return groupAttributes(processedProductAttributes, drafts, elementId,ws);
			});


		})


/*		needle.get(pageHref,options, function(error, response) {
			console.log("LOADED PAGE", pageNumber);


		  	if (error || !response || response.statusCode != 200  || !response.body) {
		  		return reject("Не удалось выйти на алиэкспресс");
		  	}
		  	console.log(response.body)

			let $ = cheerio.load(response.body);


			let processProduct = [];
		  	_.each($("a.product"), productAnchor => {
		  		let productHref = $(productAnchor).prop("href");
		  				console.log("PROD HREF PROC",productHref)
		  		processProduct.push(processProductAttributes(productHref, drafts));

		  	})


			Promise.all(processProduct).then(processedProductAttributes => {
				console.log(processedProductAttributes);

			}).then(newDrafts => {


				if ($(".ui-pagination-active").next()[0]) {
					nextPageHref = $(".ui-pagination-active").next().prop("href");
					processPage(nextPageHref, drafts, nextPageNumber)
				} else {
					return resolve(drafts);
				}

			})
			

		});*/

		
	//});
}



function processAliexpressAttributeGroupInsert(req, ws, cb) {
	return new Promise((resolve, reject) => {

		c.beginTransaction(function(err) {
			console.log("BEGIN TRANSACTION (processAliexpressAttributeGroupInsert)!");
			var requests = req.data;
			let {modelId, elementId, drafts} = requests[0];

			if (!drafts['369']) drafts['369'] = {};
			if (!drafts['357']) drafts['357'] = {};
			if (!drafts['362']) drafts['362'] = {};



			var newGroup = drafts[modelId][elementId];

			var newGroupId = g.getId(newGroup);

			if (!newGroup.query || newGroup.query.trim() == "") {
				req.command = CMD.CMDS.LOAD_WIDGET_FAILURE;
				req.data = {
					errors: ["Не задана строка поиска"],
					widgetStates: {}
				};
				cb(req);
				return;
			}

			processPage(newGroup.query, drafts, elementId,ws).then(newdrafts => {
				req.command = CMD.CMDS.LOAD_WIDGET_SUCCESS;
				req.data = {
					storage : newdrafts,
					widgetStates: {}
				};
				c.commit(() => {
					cb(req);
				})
			}, errors => {
				req.command = CMD.CMDS.LOAD_WIDGET_FAILURE;
				req.data = {
					errors : errors, 
					widgetStates: {}
				};
				c.rollback(() => {
					cb(req);
				})
			})

		});








	}) 

}


module.exports = processAliexpressAttributeGroupInsert;