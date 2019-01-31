var _ = require('lodash');

function getAliId(urlString) {
	const regex = /(\d+)\.html/g;

	var output = "";
	while ((m = regex.exec(urlString)) !== null) {
	    // This is necessary to avoid infinite loops with zero-width matches
	    if (m.index === regex.lastIndex) {
	        regex.lastIndex++;
	    }
	    
	    // The result can be accessed through the `m`-variable.
	    m.forEach((match, groupIndex) => {
	        //console.log(`Found match, group ${groupIndex}: ${match}`);
	        if (groupIndex == 1) output = match;
	    });
	}
	return output;
}

function simplifyUrl(urlString) {
	let id = getAliId(urlString);
	return `https://ru.aliexpress.com/item//${id}.html`;
}

function getAdminSeq(body) {
	const regex = /adminSeq="(\d+)";/g;

	//window.runParams.adminSeq="221670474"

	var output = "";
	while ((m = regex.exec(body)) !== null) {
	    // This is necessary to avoid infinite loops with zero-width matches
	    if (m.index === regex.lastIndex) {
	        regex.lastIndex++;
	    }
	    
	    // The result can be accessed through the `m`-variable.
	    m.forEach((match, groupIndex) => {
	        //console.log(`Found match, group ${groupIndex}: ${match}`);
	        if (groupIndex == 1) output = match;
	    });
	}
	return output;
}


/*function getPricesData(str) {
	const regex = /myData.push\(\[(\d+), (\d+\.\d+)]\);/g;
	let m;

	let output = [];
	while ((m = regex.exec(str)) !== null) {
	    // This is necessary to avoid infinite loops with zero-width matches
	    if (m.index === regex.lastIndex) {
	        regex.lastIndex++;
	    }
	    
	    // The result can be accessed through the `m`-variable.
	    let priceObj = {
	    	date: "",
	    	price: "",
	    }
	    m.forEach((match, groupIndex) => {
	    	if (groupIndex == 1) {
	    		priceObj.date = match;
	    	}
	    	if (groupIndex == 2) {
	    		priceObj.price = match;
	    	}
	    });
        output.push(priceObj);
	}
	return output;
}*/
function getPricesData(str) {
	const regex1 = /myData.push\(parseFloat\((\d+\.\d+|\d+)\)\);/g;
	const regex2 = /myDate.push\(new Date\( parseFloat\((\d+)\)/g;
	let m;

	let output = [];

	let prices = [];
	let dates = [];

	while ((m = regex1.exec(str)) !== null) {
	    if (m.index === regex1.lastIndex) {
	        regex1.lastIndex++;
	    }
	    m.forEach((match, groupIndex) => {
	    	if (groupIndex == 1) {
	    		prices.push(match);
	    	}
	    });
	}
	while ((m = regex2.exec(str)) !== null) {
	    if (m.index === regex2.lastIndex) {
	        regex2.lastIndex++;
	    }
	    m.forEach((match, groupIndex) => {
	    	if (groupIndex == 1) {
	    		dates.push(match);
	    	}
	    });
	}

	_.each(prices, (price, index) => {
		let date = dates[index];
		let priceObj = {
	    	date: date,
	    	price: price,
	    }
	    output.push(priceObj);
	})

	return output;
}
module.exports = {
	getAliId:getAliId,
	simplifyUrl:simplifyUrl,
	getAdminSeq:getAdminSeq,
	getPricesData:getPricesData
};