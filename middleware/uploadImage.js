const util = require("util");
const multer = require("multer");
const { GridFsStorage } = require("multer-gridfs-storage");

var storage = new GridFsStorage({
  url: process.env.MONGODB_URI + process.env.DB_NAME,
  options: { useNewUrlParser: true, useUnifiedTopology: true },
  file: (req, file) => {
    const match = ["image/png", "image/jpeg", "image/gif"];

    if (match.indexOf(file.mimetype) === -1) {
      const filename = `${Date.now()}-shinoo-${file.originalname}`;
      return filename;
    }

    return {
      bucketName: 'photos',
      filename: `${Date.now()}-shinoo-${file.originalname}`
    };
  }
});

var uploadFiles = multer({ storage: storage }).single("file");
var uploadFilesMiddleware = util.promisify(uploadFiles);
module.exports = uploadFilesMiddleware;