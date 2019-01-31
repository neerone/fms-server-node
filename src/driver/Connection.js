var mysql      = require('mysql');



const {mysqlconnection} = require('../../../configs/server-js-config/config');

var conn = mysql.createConnection(mysqlconnection);

var knex = require('knex')({
  client: 'mysql',
  connection: mysqlconnection
});

conn.connect();


module.exports = {c: conn, knex}