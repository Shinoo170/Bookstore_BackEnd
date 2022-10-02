const express = require('express')
const router = express.Router()
const multer = require("multer");

const middleware = require('../middleware/adminProcess')
const jwt_middleware = require('../middleware/authJwt')
const controller = require('../controllers/adminRoute.controller')
// jwt_middleware.adminVerify
router.post('/addProduct', middleware.upload.array('file'), controller.addProduct );

router.post('/addSeries', [middleware.upload.array('file'), middleware.checkSeries] , controller.addSeries );

router.use((error, req, res, next) => {
    if (error instanceof multer.MulterError) {
      if (error.code === "LIMIT_FILE_SIZE") {
        return res.status(400).json({
          message: "file is too large",
        });
      }
  
      if (error.code === "LIMIT_FILE_COUNT") {
        return res.status(400).json({
          message: "File limit reached",
        });
      }
  
      if (error.code === "LIMIT_UNEXPECTED_FILE") {
        return res.status(400).json({
          message: "File must be an image",
        });
      }
    }
})

module.exports = router