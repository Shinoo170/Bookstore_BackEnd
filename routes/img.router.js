const express = require('express')
const router = express.Router()

const Controller = require("../controllers/uploadImage.controller")

router.post('/upload', Controller.uploadFiles)
router.get('/', Controller.getListFiles)
router.get("/:name", Controller.download)

module.exports = router