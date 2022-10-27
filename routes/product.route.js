const express = require('express')
const router = express.Router()

const controller = require('../controllers/product.controller')

// Get all series
router.get('/allSeries', controller.getAllSeries)

// Get all product in specific series
router.get('/series/:seriesId', controller.getSeriesDetails)

// Get specific product
router.get('/product/:productURL', controller.getProduct)

// Get latest series
router.get('/latestSeries', controller.getLatestSeries)

// Get latest product
router.get('/latestProduct', controller.getLatestProduct)

router.get('/genres', controller.getAllGenres)

module.exports = router