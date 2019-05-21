const {uploadspath} = require('../../config');

var mkdirp = require('mkdirp');
var fs = require('fs');
var getDirName = require('path').dirname;


function putFile(contents,path , callback) {
	var fullpath = (uploadspath+path);
	var dirname = getDirName(fullpath);
	mkdirp(dirname, function (err) {
	    if (err) console.error(err)
	    fs.writeFile(fullpath, contents, callback);
	});
}


module.exports = {putFile:putFile, uploadspath:uploadspath};