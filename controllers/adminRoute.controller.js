const mongoUtil = require('../config/database')
const AWS = require("aws-sdk");

const BASE_URL = process.env.AWS_URL
  
exports.addProduct = async (req, res) => {
    try {
        var db = mongoUtil.getDb()
        const imgURL = await uploadImage(req.files)
        const { seriesId, title, bookNum, description, price, amount, status, category } = req.body
        const URL = title.replaceAll(" ","-") + '-เล่ม-' + bookNum + '-' + category
        await db.collection('products').insertOne({
            url : URL,
            seriesId,
            bookNum,
            description,
            price,
            amount,
            status,
            score: undefined,
            img : imgURL,
        });
        res.status(201).send({
            message: "Add product success"
        });
    } catch (err) {
        res.status(400).send({ message: "error", error: err.message })
    }
}

exports.addSeries = async (req, res) => {
    try {
        var db = mongoUtil.getDb()
        const imgURL = await uploadImage(req.files)
        const { title, author, illustrator, publisher, genres } = req.body
        const description = req.body.description === 'undefined'? undefined : req.body.description
        const keyword = req.body.keyword === 'undefined'? undefined : req.body.keyword
        mongoUtil.getNextSequence(db, 'seriesid', async function(err, result){
            await db.collection('series').insertOne({
                seriesId: result,
                title,
                author,
                illustrator,
                publisher,
                description,
                genres,
                keyword,
                img : imgURL[0],
            })
        })
        res.status(201).send({
            message: "Add series success"
        })
    } catch (err) {
        res.status(400).send({ 
            message: "Cannot add Series", error: err.message 
        })
    }
}

function uploadImage(files) {
    return new Promise(async (resolve, reject) => {
        try{
            const s3 = new AWS.S3({
                accessKeyId: process.env.AWS_ACCESS_KEY_ID,
                secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
            })
            var imgURL = []
            const promise = files.map(async (imageData) => {
                const uploadedImage = await s3.upload({
                    Bucket: process.env.AWS_BUCKET_NAME,
                    Key: "Product/" + Date.now() + "-" + imageData.originalname,
                    Body: imageData.buffer,
                }).promise()
                imgURL.push(uploadedImage.Location)
            })
            await Promise.all(promise)
            resolve(imgURL)
        }catch(err){
            reject(err)
        }
    })
}