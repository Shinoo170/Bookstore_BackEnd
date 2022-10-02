const express = require('express')
const router = express.Router()

const controller = require('../controllers/listProduct.controller')

router.get('/allSeries', controller.getAllProduct)

router.get('/series/:seriesId', controller.getSeriesDetails)

router.get('/product/:productId', (req, res) => {
    res.send( req.params)
})

router.get('/:seriesId/:id', (req, res) => {
    res.send( req.params)
})

module.exports = router