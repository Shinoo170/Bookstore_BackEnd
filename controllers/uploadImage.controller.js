const upload = require("../middleware/uploadImage");

const MongoClient = require("mongodb").MongoClient;
const GridFSBucket = require("mongodb").GridFSBucket;

const url = process.env.MONGODB_URI + process.env.DB_NAME

const baseUrl = process.env.BASE_URL_IMG

const mongoClient = new MongoClient(url);
const mongoUtil = require('../config/database')

const uploadFiles = async (req, res) => {
  try {
    await upload(req, res);
    console.log(req.file);

    if (req.file == undefined) {
      return res.status(404).send({
        message: "You must select a file.",
      });
    }

    return res.status(201).send({
      message: "File has been uploaded.",
    });
  } catch (error) {
    console.log(error);

    return res.send({
      message: "Error when trying upload image: ${error}",
    });
  }
};

const getListFiles = async (req, res) => {
  try {
    const database = mongoUtil.getDb();
    const images = database.collection('photos.files');

    const cursor = await images.find({});

    if ((await cursor.countDocuments()) === 0) {
      return res.status(500).send({
        message: "No files found!",
      });
    }

    let fileInfos = [];
    await cursor.forEach((doc) => {
      fileInfos.push({
        name: doc.filename,
        url: baseUrl + doc.filename,
      });
    });

    return res.status(200).send(fileInfos);
  } catch (error) {
    return res.status(500).send({
      message: error.message,
    });
  }
};

const download = async (req, res) => {
  try {
    const database = mongoUtil.getDb();
    const bucket = new GridFSBucket(database, {
      bucketName: 'photos',
    });

    let downloadStream = bucket.openDownloadStreamByName(req.params.name);

    downloadStream.on("data", function (data) {
      return res.status(200).write(data);
    });

    downloadStream.on("error", function (err) {
      return res.status(404).send({ message: "Cannot download the Image!" });
    });

    downloadStream.on("end", () => {
      return res.end();
    });
  } catch (error) {
    return res.status(500).send({
      message: error.message,
    });
  }
};

module.exports = {
  uploadFiles,
  getListFiles,
  download,
};