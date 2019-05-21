const {createDatabaseQuery} = require('../src/driver/DatabaseSelectors/SelectorUtils');
fs = require('fs');

const importer = require('node-mysql-importer')
 
const {mysqlconnection} = require('../config');

function reset_db() {
	return new Promise((resolve, reject) => {
		createDatabaseQuery("drop database IF EXISTS " + mysqlconnection.database).then(res => {
			console.log("DB DROPPED")
			createDatabaseQuery("create database IF NOT EXISTS " + mysqlconnection.database).then(res => {
				console.log("DB CREATED");
					importer.config(mysqlconnection)
					importer.importSQL('./db/minimal_test_db.sql').then( () => {
					    resolve();
					}).catch( err => {
					    reject();
					})

			}, rej => reject())
		}, rej => reject())
	})
}

module.exports = reset_db;