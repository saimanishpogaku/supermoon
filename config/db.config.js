'use strict';

const mysql = require('mysql');
//local mysql db connection
const dbConn = mysql.createConnection({
    host: process.env.DATABASE_HOST_NAME,
    user: process.env.DATABASE_USERNAME,
    password: process.env.DATABASE_PASSWORD,
    database: process.env.DATABASE_NAME
});
dbConn.connect(function (err) {
    if (err) throw err;
    console.log("Database Connected!");
});

console.log(process.env.DATABASE_HOST_NAME);
module.exports = dbConn;