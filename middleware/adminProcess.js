const mongoUtil = require("../config/database");
const multer = require("multer");
const storage = multer.memoryStorage();

exports.checkSeries = async (req, res, next) => {
    var db = mongoUtil.getDb();
    try {
        let data = await db.collection("series").findOne({
            title: req.body.title,
        });
        if (data) {
            return res.status(400).send({ message: "Duplicate series", });
        }
        next();
    } catch (err) {
        res.status(400).send({ message: "error to connect database", error: err.message });
    }
};

const fileFilter = (req, file, callback) => {
    if (file.mimetype.split("/")[0] === "image") {
      callback(null, true);
    } else {
      callback(new multer.MulterError("LIMIT_UNEXPECTED_FILE"), false);
    }
};

exports.upload = multer({
    storage,
    fileFilter,
    limits: { fileSize: 1000000000, files: 10 },
});
