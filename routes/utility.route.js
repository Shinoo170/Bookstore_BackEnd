const express = require('express')
const router = express.Router()

const controller = require('../controllers/util.controller')

router.get('/exchangeRate/:symbol', controller.getExchangeRate)

module.exports = router