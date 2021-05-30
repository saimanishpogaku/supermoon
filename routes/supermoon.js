const router = require('express')();
const multer = require('multer');
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });
const AWS = require('aws-sdk');
const csvToJson = require('csvtojson');
const fs = require('fs');
const db = require('../config/db.config');

const storageUploads = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'uploads')
    },
    filename: function (req, file, cb) {
        cb(null, file.fieldname + '-' + Date.now())
    }
});
const upload2 = multer({ storage: storageUploads });

router.post('/upload', upload.single('transactions'), async (req, res, next) => {
    let response = {
        code: 1,
        message: "Something went wrong!try again later"
    }
    try {
        if (!req.file.originalname) {
            throw new Error('Middleware error occured!');
        }
        if (!req.file.buffer) {
            throw new Error('Middleware error occured with buffer!');
        }
        let supportedFileTypes = ['csv', 'xlsx'];
        let fileType = req.file.originalname.split(".");
        fileType = fileType[fileType.length - 1];

        if (supportedFileTypes.indexOf(fileType) == -1) {
            throw new Error('Unsupported file formats!');
        }

        let S3 = new AWS.S3();

        const params = {
            Bucket: 'funbucketjuniors/inputfiles',
            Key: req.file.originalname,
            Body: req.file.buffer
        }

        // Uploading files to the bucket
        let uploadS3 = new Promise((resolve, reject) => {
            S3.upload(params, (err, data) => {
                if (err) {
                    reject(err);
                }
                resolve(data);
            });
        });
        // console.log(uploadS3); return;
        let data = await uploadS3;//.then((data) => data).catch((err) => err);
        console.log(data);
        response['code'] = 200;
        response['message'] = 'File uploaded successfully.';
        response['location'] = data.Location;
    } catch (error) {
        response['code'] = 500;
        response['messsage'] = error.message;
    }

    res.status(response['code']).json(response);
});

router.post('/createRecords', upload2.single('records'), async (req, res, next) => {
    let response = {
        code: 500,
        message: "Something went wrong!try again later"
    }
    try {
        console.log(req.file);
        if (!req.file.originalname) {
            throw new Error('Middleware error occured!');
        }
        if (!req.file.path) {
            throw new Error('Middleware error occured with path!');
        }
        let currentFilepath = req.file.path;
        let supportedFileTypes = ['csv', 'xlsx'];
        let fileType = req.file.originalname.split(".");
        fileType = fileType[fileType.length - 1];

        if (supportedFileTypes.indexOf(fileType) == -1) {
            throw new Error('Unsupported file formats!');
        }

        const AllData = async (currentFilepath) => {
            let recipients = [];
            try {
                recipients = await csvToJson({
                    trim: true
                }).fromFile(currentFilepath);
            } catch (err) {
                console.log(err.message);
            }
            return recipients;
        }

        let csvData = await AllData(currentFilepath);

        fs.unlink(currentFilepath, function (err) {
            if (err) throw new Error(err);
            console.log(`${currentFilepath} File deleted!`);
        });

        let DbMapper = {
            user_id: 'USER_ID',
            order_id: 'ORDER_ID',
            ZOHO: 'ZOHO_ID',
            Pack: 'PRICE',
            Date: 'CREATED_AT'
        }
        let preparedData = [];
        let singleObj = null;
        csvData.forEach((item, index, arr) => {
            singleObj = {};
            for (k in item) {
                singleObj[DbMapper[k]] = typeof item[k] != 'undefined' ? item[k] : '';
            }
            preparedData.push(singleObj);
        });

        let sql_statement = 'INSERT INTO employees';
        preparedData.forEach((item, index, arr) => {
            if (index == 0) {
                sql_statement += `(USER_ID,ORDER_ID,ZOHO_ID,PRICE,CREATED_AT) 
                VALUES ('${item['USER_ID']}','${item['ORDER_ID']}','${item['ZOHO_ID']}','${item['PRICE']}','${item['CREATED_AT']}'
                ),`;
            } else {
                sql_statement += `('${item['USER_ID']}','${item['ORDER_ID']}','${item['ZOHO_ID']}','${item['PRICE']}','${item['CREATED_AT']}'
                ),`
            }
        });
        sql_statement = sql_statement.slice(0, -1);

        console.log(sql_statement);
        let data = await new Promise((resolve, reject) => {
            db.query(sql_statement, (err, result) => {
                if (err) reject(err);
                else resolve(result);
            })
        });

        response['code'] = 200;
        response['message'] = 'File uploaded successfully.';
        response['data'] = data;
    } catch (error) {
        response['code'] = 500;
        response['messsage'] = error.message ? error.message : 'SWW....';
    }

    res.status(response['code']).json(response);
});

module.exports = router;