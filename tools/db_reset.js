const {createDatabaseQuery} = require('../src/driver/DatabaseSelectors/SelectorUtils');
fs = require('fs');

const importer = require('node-mysql-importer')
 
function reset_db() {
	return new Promise((resolve, reject) => {
		createDatabaseQuery("drop database IF EXISTS simma").then(res => {
			console.log("DB DROPPED")
			createDatabaseQuery("create database IF NOT EXISTS simma").then(res => {
				console.log("DB CREATED");
					importer.config({
					    'host': 'localhost',
					    'user': 'root',
					    'password': '',
					    'database': 'simma'
					})
					importer.importSQL('../db/minimal_test_db.sql').then( () => {
					    resolve();
					}).catch( err => {
					    reject();
					})

			}, rej => reject())
		}, rej => reject())
	})
}

module.exports = reset_db;