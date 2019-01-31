/*var _ = require("lodash");
var JSFtp = require("jsftp");

var ftp = new JSFtp({
  host: "localhost",
  user: "admin",
  pass: "admin" 
});


ftp.keepAlive(1000);

function recursiveMakeDirs(pathArray, callback, index) {
	var currentPath = pathArray.slice(0, index);
	var currentPathString = currentPath.join("/");
	if ((currentPath.length+1) == index) {
		callback();
		return;
	}
	ftp.raw("mkd", "/"+currentPathString, function(err, data) {
	    recursiveMakeDirs(pathArray, callback, index+1);
	});
}


function putFile(data,filePath , callback) {
	var dirsArrayPath = _.clone(filePath.split("/"));
	dirsArrayPath.pop();
	recursiveMakeDirs(dirsArrayPath, function() {
		ftp.put(data, filePath, callback);
	}, 1);
}*/
const {uploadspath} = require('../../../configs/server-js-config/config');

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