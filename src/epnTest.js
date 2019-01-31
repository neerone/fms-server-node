var needle = require('needle');
const cheerio = require('cheerio')

const EPN_API_URL = 'http://api.epn.bz/json';
const EPN_CLIENT_API_VERSION = 2;
	
var user_api_key = "cb33d87a1fa739787ae4b96ffd4dc6ad";
var user_hash = "oqvy8qj1a4o206tzyg0mak24wnfls7l7";
var options = {
  compressed        : true, 
  follow_max        : 5,    
  rejectUnauthorized: true  
}

needle.get("https://m.ru.aliexpress.com/store/sellerInfo.htm?sellerAdminSeq=228348834",options, function(error, response) {
  	if (error || response.statusCode != 200 || !response.body) return reject("Не удалось выйти на парсинг store")


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

});