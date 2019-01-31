G = require('../../../globals');
var _ = require('lodash');
const {getAliId,simplifyUrl,getAdminSeq,getPricesData} = require('./AliFunctions');
const cheerio = require('cheerio')
var needle = require('needle');
const g = require('../../../utils/getters');
var moment = require('moment');
let {updateRowToDB, writeNewRowToDB, createOrUpdateElement} = require("../WriteAndUpdate");
let { getAliexpressAffilateURLAndCost } = require("./EpnApi");
const {createNewId} = require('../CrudHelpers');
var options = {
  compressed        : true, 
  follow_max        : 5,    
  rejectUnauthorized: true  
}



function parseStoreAndUpdate(adminSeq,currentShop, ws) {
	return new Promise((resolve, reject) => {

		needle.get("https://m.ru.aliexpress.com/store/sellerInfo.htm?sellerAdminSeq="+adminSeq,options, function(error, response) {
		  	if (error || !response || !response.body) {
		  		return reject(["Не удалось выйти на парсинг store"])
		  	}


			let m;
			const regex = /sellerServiceEval\":\"(\d+.\d*)\"|shippingServiceEval\":\"(\d+.\d*)\"|proDescEval":"(\d+.\d*)/g;
			while ((m = regex.exec(response.body)) !== null) {
			    if (m.index === regex.lastIndex) {
			        regex.lastIndex++;
			    }
			    m.forEach((match, groupIndex) => {
			        if (groupIndex == 1 && match) currentShop.communication = match
			        if (groupIndex == 2 && match) currentShop.delivery_speed  = match
			        if (groupIndex == 3 && match) currentShop.description_ok = match
			    });
			}
			createOrUpdateElement("store_id", "355", currentShop, ws).then((res) => {
				return resolve(res.element);
			}, errors => {
				return reject(["Не удалось создать магазин продавца при парсинге"])
			});

		});

	});
}





function processProductVariant(drafts,variant,ws) {
	return new Promise((resolve, reject) => {


		var sourceUrl = variant.aliexpress_url;


		needle.get(sourceUrl,options, function(error, response) {
		  	if (error || response.statusCode != 200 || !response.body) return reject(["Не удалось выйти на алиэкспресс при парсинге варианта"])


		  	let adminSeq = getAdminSeq(response.body);



			let $ = cheerio.load(response.body);
			let productName = $("h1.product-name").text();

			variant.label = productName;




			let currentShop = {};
			currentShop.label = $(".shop-name > a").text();
			currentShop.started_from = moment($(".store-time > em").text()).format("YYYY-MM-DD HH:mm");
			currentShop.store_id = $(".store-number").text().replace("Магазин №","");


			parseStoreAndUpdate(adminSeq,currentShop,ws).then(shop => {
				drafts["355"][g.getId(shop)] = shop;
				variant.seller_id = g.getId(shop);
				return getAliexpressAffilateURLAndCost(variant).then(variantWithAffUrl => {
					drafts["351"][g.getId(variant)] = variant;
					return resolve(drafts);
				}, errors => {
					return reject(errors)
				})
			}, errors=> {
				return reject(errors);	
			})

		});

	})
}




function parsePriceDymanics(variant, drafts) {

	let sourceUrl = variant.aliexpress_url;


	return new Promise((resolve, reject) => {
		needle.get("http://www.aliprice.com/?fpsub=1&from=index&keyword="+sourceUrl,options, function(error, response) {
			if (error || response.statusCode != 200 || !response.body) return reject(["Не удалось выйти на прайс"])

			let $ = cheerio.load(response.body);
			let prices = getPricesData(response.body);

			console.log("prices",prices);
			_.each(prices, ({date, price}) => {


				newId = createNewId();
				drafts["352"][newId] = {
					id: newId,
					cost:price,
					product_variant_id: g.getId(variant),
					date: moment.unix(parseInt(date)).format("DD-MM-YYYY HH:mm:ss")
				}
			})
			return resolve(drafts);

		});
	});
}


function addProductVariants($,newProductId , sourceUrl, drafts,ws) {
	console.log("===ADDING PRODUCT VARIANTS");
	return new Promise((resolve, reject) => {
		
		/*1) Смотрим есть ли в вариантах текущий товар (из шапки)*/

		let variants = drafts["351"];

		let currentProductAliId = getAliId(sourceUrl);
		let variantIDs = _.map(variants, (v) => {
			v.aliexpress_product_id = getAliId(v.aliexpress_url);
			v.aliexpress_url = simplifyUrl(v.aliexpress_url);
			return v.aliexpress_product_id;
		});

		if (!variantIDs.includes(currentProductAliId)) {
			var tempId = createNewId();


			variants[tempId] = {
				id:tempId,
				aliexpress_url: simplifyUrl(sourceUrl),
				aliexpress_product_id: getAliId(sourceUrl),
				epn_url: "",
				product_id: newProductId,

			}
		}


		let variantPromises = _.map(variants, (variant) => {
			return processProductVariant(drafts,variant,ws);
		})

		Promise.all(variantPromises).then(results => {
			console.log("variant parses dynamics")
			let dymanicsPromises = _.map(variants, v => {
				return parsePriceDymanics(v, drafts);
			})

			Promise.all(dymanicsPromises).then(results => {
				return resolve(drafts);
			}, errors => {
				return reject(errors);
			})

		}, errors => {
			return reject(errors);
		})


	})
}

module.exports = {
	addProductVariants:addProductVariants
}