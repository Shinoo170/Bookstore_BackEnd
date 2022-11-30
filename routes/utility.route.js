const express = require('express')
const router = express.Router()

const controller = require('../controllers/util.controller')

router.get('/exchangeRate/:symbol', controller.getExchangeRate)

router.get('/getDigitalCurrencyRate/:symbol', controller.getDigitalCurrencyRate)

module.exports = router