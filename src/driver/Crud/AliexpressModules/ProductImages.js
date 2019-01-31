G = require('../../../globals');
var _ = require('lodash');
let {updateRowToDB, writeNewRowToDB, createOrUpdateElement} = require("../WriteAndUpdate");
var moment = require('moment');
var CryptoJS = require("crypto-js");
const Datauri = require('datauri');
const path = require('path');
var needle = require('needle');
const {putFile,uploadspath} = require('../../FileDriver');
const g = require('../../../utils/getters');
const MI = require('../../../constants/MI')
const {createNewId} = require('../CrudHelpers');
function getImage(imageUrl,ws) {
	return new Promise((resolve, reject) => {
		var formated_date = moment().format("YYYY-MM-DD").toString();
		var filePath =  (formated_date.split("-").join("/")) +"/"+ CryptoJS.MD5(imageUrl).toString() +".jpg";

		var {name} = path.parse(filePath);

		needle.get(imageUrl, { decode_response: false }, function(err, resp, body) {
		  // you can dump any response to a file, not only binaries.

		  	if (err) return reject("image Download error");
		  	putFile(body, filePath, function() {
		  		


			  	let imageElement = {
			  		file: filePath,
			  		label: name,
			  		size: body.byteLength,
			  		type: "jpeg",
			  		file_loaded: 100
			  	}

			  	return resolve(writeNewRowToDB(MI.FILES, imageElement,ws));
		  	})
		});
	})
}


function addProductImages(newProductId,drafts, $,ws) {
	console.log("===ADDING PRODUCT IMAGES");
	return new Promise((resolve, reject) => {
		
		let imagesToLoad = [];
		$(".img-thumb-item > img").each((test,item) => {
			var href = $(item).prop('src');
			var fullHref = href.replace("_50x50.jpg", "");
			imagesToLoad.push(fullHref);
		});

		let imagePromises = [];
		_.each(imagesToLoad, (imageUrl) => {
			imagePromises.push(getImage(imageUrl,ws));
		})

		return Promise.all(imagePromises).then((results) => {
			


			_.each(results, (res) =>{

				drafts["300"][g.getId(res.element)] = res.element;

				if (res.type =="ROW_INSERTED") {


					let currentNewId = createNewId();
					let galleryObject = {
						file_id	: g.getId(res.element),
						is_main	: 0,
						product_id:newProductId,
						id: currentNewId
					}

					drafts["350"][currentNewId] = galleryObject;
				}
			})
			return resolve(drafts);

		}, errors => {
			return reject(["Ошибка при загрузке картинок"])
		})
	});
}

module.exports = {
	addProductImages:addProductImages
}