//Use this line only in local
require('dotenv').config({ path: './ENV/.env' });

const express = require('express');

const AWS = require('aws-sdk');
if (process.env.CURRENT_ENVIRONMENT == 'LOCAL') {
    var credentials = new AWS.SharedIniFileCredentials({ profile: 'aws_personal_admin' });
    AWS.config.credentials = credentials;
}

// console.log(AWS.config.credentials);

const bodyParser = require('body-parser');
const createError = require('http-errors');

const app = express();
const PORT = process.env.PORT || 3000;

// app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

app.use('/supermoon', require('./routes/supermoon'));

app.use((req, res, next) => {
    res.status(404).json(createError.NotFound());
});

app.use((err, req, res, next) => {
    res.status(500).json(createError.InternalServerError())
});

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
})