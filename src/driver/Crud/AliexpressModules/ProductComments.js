G = require('../../../globals');
var _ = require('lodash');
const {getAliId,simplifyUrl,getAdminSeq,getPricesData} = require('./AliFunctions');
const cheerio = require('cheerio')
var needle = require('needle');
const g = require('../../../utils/getters');
var moment = require('moment');
let {updateRowToDB, writeNewRowToDB, createOrUpdateElement} = require("../WriteAndUpdate");
const {createNewId} = require('../CrudHelpers');
var request = require('request');


var options = {
  compressed        : true, 
  follow_max        : 5,    
  rejectUnauthorized: true,
  headers: {
  	cookies: {
  		intl_locale: "ru_RU",
  		x_locale: "ru",
  		site: "rus",
  		region: "RU",
  	}
  }
}

function addProductComments(newProductId, drafts, commentsUrl,cookies) {
	console.log("===ADDING PRODUCT COMMENTS");
	return new Promise((resolve, reject) => {


		var j = request.jar();
		var url = "https:"+commentsUrl+"&onlyFromMyCountry=true";
		_.each(cookies, (val, key)=> {
			j.setCookie(request.cookie(`${key}=${val}`), url);
		})
		
		request({url: url, jar: j}, function (error, response, body) {



		  	if (error || response.statusCode != 200 || !body) return reject(["Не удалось выйти на алиэкспресс комментарии"])
		  	//console.log(response)
		  	let $ = cheerio.load(body);
		  	let reviews = $(".fb-main");


		  	_.each(reviews, rev => {
		  		let text = $(rev).find(".buyer-feedback > span").text();
		  		let date = $(rev).find(".buyer-review > .r-time").text();
		  		let stars = parseInt($(rev).find(".star-view > span").prop("style").width) / 20;

		  		if (data = "Invalid date") console.log($(rev).find(".r-time").text())

				if (text.trim() != "") {
					newId = createNewId();
					drafts['356'][newId] = {
						date: moment(date).format("YYYY-MM-DD HH:mm"),
						stars,
						text,
						id: newId,
						product_id: newProductId,
					}
				}

		  	})

		  	return resolve(drafts);

		});


	})
}

module.exports = {
	addProductComments:addProductComments
}