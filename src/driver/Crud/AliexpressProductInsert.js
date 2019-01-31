var _ = require('lodash');


var knex = require('knex')({
  client: 'mysql',
  connection: {
    host : '127.0.0.1',
    user : 'root',
    password : '',
    database : 'direct_parser'
  }
});


STORAGE = require('../../storage');
G = require('../../globals');
const MI = require('../../constants/MI')
const WT = require('../../constants/widgetTypes');
const RT = require('../../constants/relationTypes');
const CMD = require('../../constants/commands');
var {c, knex} = require('../Connection');
const g = require('../../utils/getters');
const {normalizeResults,normalizeDates,createDatabaseQuery} = require('../DatabaseSelectors/SelectorUtils')
const getAllRelatedData = require('../DatabaseSelectors/AllRelatedDataSelector');
var moment = require('moment');

var CryptoJS = require("crypto-js");

var needle = require('needle');
const cheerio = require('cheerio')
var fs = require('fs');
let {updateRowToDB, writeNewRowToDB, createOrUpdateElement} = require("./WriteAndUpdate");



/*ALIEXPRESS MODULES*/
const {addProductImages} = require("./AliexpressModules/ProductImages");
const {addProductVariants} = require("./AliexpressModules/ProductVariants");
const {addProductComments} = require("./AliexpressModules/ProductComments");
const {addProductAttributes} = require("./AliexpressModules/ProductAttributes");

const {createErrorReject} = require('./CrudHelpers');


var options = {
  compressed        : true, 
  follow_max        : 5,    
  rejectUnauthorized: true  
}

function processAliexpressProductInsert(req,ws, cb) {
	return new Promise((resolve, reject) => {

		c.beginTransaction(function(err) {

			console.log("BEGIN TRANSACTION (processAliexpressProductInsert)!");

			var requests = req.data;
			let {modelId, elementId, drafts} = requests[0];

			if (!drafts['349']) drafts['349'] = {};

			if (!drafts['300']) drafts['300'] = {};
			if (!drafts['350']) drafts['350'] = {};
			if (!drafts['351']) drafts['351'] = {};
			if (!drafts['352']) drafts['352'] = {};
			if (!drafts['355']) drafts['355'] = {};
			if (!drafts['356']) drafts['356'] = {};

			if (!drafts['357']) drafts['357'] = {};
			if (!drafts['360']) drafts['360'] = {};
			if (!drafts['359']) drafts['359'] = {};


			if (!drafts['359']) drafts['359'] = {};

			if (!drafts['362']) drafts['362'] = {};






			var newProduct = drafts[modelId][elementId];

			var newProductId = g.getId(newProduct);



			var sourceUrl = newProduct.create_by_source_url;


			if (!sourceUrl || !sourceUrl.includes("http")) {

				req.command = CMD.CMDS.LOAD_WIDGET_FAILURE;
				req.errors =["Отсутствиует ссылка, на основе которой будем парсить"];
				c.rollback(() => {
					cb(req);
				});
				return;

			}



			needle.get(sourceUrl,options, function(error, response) {

			  	if (error || !response || response.statusCode != 200  || !response.body) {
			  		
					req.command = CMD.CMDS.LOAD_WIDGET_FAILURE;
					req.errors =  ["Не удалось выйти на алиэкспресс"];
					c.rollback(() => {
						cb(req);
					});
					return reject("Не удалось выйти на алиэкспресс");
			  	}


				let $ = cheerio.load(response.body);



				newProduct.autofilled = "1";
				if (newProduct.label.trim() == "") {
					let productName = $("h1.product-name").text();
					newProduct.label = productName;
				}

				newProduct.autofilled = "1";




				let allProceses = [
					addProductImages(newProductId,drafts, $,ws),
					addProductVariants($,newProductId, sourceUrl, drafts,ws),
					addProductComments(newProductId, drafts, $("#feedback > iframe").prop("thesrc"),response.cookies),
				];

				

				Promise.all(allProceses).then(allDrafts => {

					let newDrafts = _.reduce(allDrafts, function(acc, currentDrafts) {
						return _.merge(acc, currentDrafts);
					}, {});


					req.command = CMD.CMDS.LOAD_WIDGET_SUCCESS;
					req.data = {
						storage : newDrafts,
						widgetStates: {}
					};
					console.log(allDrafts)
					c.commit(() => {
						cb(req);
					})
				}, errors => {
					console.log(req)
					createErrorReject(CMD.CMDS.LOAD_WIDGET_FAILURE, c, "Не удалось запарсить товар", errors, req, cb)
				})



			});



		});





	}) 

}


module.exports = processAliexpressProductInsert;