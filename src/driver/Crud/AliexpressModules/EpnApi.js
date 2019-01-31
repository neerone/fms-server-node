var needle = require('needle');
var options = {
  compressed        : true, 
  follow_max        : 5,    
  rejectUnauthorized: true  
}
const EPN_API_URL = 'http://api.epn.bz/json';
const EPN_CLIENT_API_VERSION = 2;
	
var user_api_key = "cb33d87a1fa739787ae4b96ffd4dc6ad";
var user_hash = "ov2hh5hfd6km1s9992aebecct22bc1ew";

function createInfoRequest(id) {
	return {
		user_api_key: user_api_key,
		user_hash: user_hash,
		api_version: EPN_CLIENT_API_VERSION,
		requests : {
			'offer_info_ru' : {
				action: "offer_info",
				'id': id,
				'lang': 'ru',
				'currency': 'RUR',
			}
		}
	}
}


function getAliexpressAffilateURLAndCost(variant) {
	var aliid = variant.aliexpress_product_id;

	return new Promise((resolve, reject) => {
		try {

			needle.post(EPN_API_URL, (createInfoRequest(aliid)), { json: true }, function(err, resp, body) {
			  // you can dump any response to a file, not only binaries.

			  	if (err) return reject(["EPN Error: Affilate Download error"]);
		  		console.log(body.results.offer_info_ru);
			  	if (body.results.offer_info_ru && body.results.offer_info_ru.offer && body.results.offer_info_ru.offer.url) {
			  		variant.epn_url = body.results.offer_info_ru.offer.url;
			  		variant.cost = body.results.offer_info_ru.offer.sale_price;
			  		return resolve(variant);
			  	} else {
			  		return reject(["Ошибка EPN: Попробуйте выбрать другой вариант товара. Вариант с ID : " + aliid + " не нейден в базе EPN"]);
			  	}

			  		
			});

		} catch (err) {
			return reject(err)
		  // обработка ошибки

		}
	})
}


function createCategoryRequest(query) {
	return {
		user_api_key: user_api_key,
		user_hash: user_hash,
		api_version: EPN_CLIENT_API_VERSION,
		requests : {
			'category_goods' : {
				action: "search",
				query:  query,
				lang: "ru",
				limit:30
			}
		}
	}
}


function getAliexpressCategoryOffers(query) {
	return new Promise((resolve, reject) => {
		needle.post(EPN_API_URL, (createCategoryRequest(query)), { json: true }, function(err, resp, body) {
		  // you can dump any response to a file, not only binaries.

		  	if (err) return reject("Download error");
		  	if (body.results.category_goods) {
		  		return resolve(body.results.category_goods);
		  	}
		});
	})
}

function createCategoryListRequest() {
	return {
		user_api_key: user_api_key,
		user_hash: user_hash,
		api_version: EPN_CLIENT_API_VERSION,
		requests : {
			'list_categories_ru' : {
				action: "list_categories",
				lang:  "en",
				limit: 100
			}
		}
	}
}

function getAliexpressCategoryList() {
	return new Promise((resolve, reject) => {
		needle.post(EPN_API_URL, (createCategoryListRequest()), { json: true }, function(err, resp, body) {
		  // you can dump any response to a file, not only binaries.

		  	if (err) return reject(["EPN Error: Category Download error"]);
		  	if (body.results.list_categories_ru) {
		  		return resolve(body.results.list_categories_ru);
		  	} else {
		  		return reject(["EPN Error: не получается достать результат в categories list"]);
		  	}
		});
	})
}

module.exports = {
	getAliexpressAffilateURLAndCost:getAliexpressAffilateURLAndCost,
	getAliexpressCategoryOffers:getAliexpressCategoryOffers,
	getAliexpressCategoryList: getAliexpressCategoryList
}