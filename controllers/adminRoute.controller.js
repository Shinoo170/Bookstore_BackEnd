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
                    Key: "test/Product/" + Date.now() + "-" + imageData.originalname,
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
  
const getListImage = async (req, res) => {
    const s3 = new AWS.S3({
      accessKeyId: process.env.AWS_ACCESS_KEY_ID,
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    });
    var params = {
      Bucket: process.env.AWS_BUCKET_NAME,
      Delimiter: "/",
      Prefix: "test/Product/",
    };
    const list = [];
    s3.listObjects(params, function (err, data) {
      data.Contents.forEach((obj, index) => {
        list.push({
          fileName: obj.Key.replace("test/Product/", ""),
          path: BASE_URL + obj.Key,
        });
      });
      list.shift();
      res.send(list);
    });
};

const download = async (req, res) => {
    const s3 = new AWS.S3({
      accessKeyId: process.env.AWS_ACCESS_KEY_ID,
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    });
    var params = {
      Bucket: process.env.AWS_BUCKET_NAME,
      Key: "test/Product/" + req.params.fileName,
    };
  //   res.attachment("Product/" + req.params.fileName);
  //   var fileStream = s3.getObject(params).createReadStream();
  //   fileStream.pipe(res);
  //   fileStream.on("error", () =>
  //     res.status(400).send({ message: "file not found!" })
  //   );
  //   fileStream.on("end", () => res.end());
  
    res.attachment("test/Product/" + req.params.fileName);
    s3.getObject(params)
        .createReadStream()
        .on('error', (err) => { res.status(400).send('file not found! 1') })
        .pipe(res)
        .on('data', (data) => { res.write(data) })
        .on('end', () => {res.end()} )
}