const express = require('express')
const router = express.Router()
const authJwt = require('../middleware/authJwt')

const controller  = require('../controllers/user.controller')

// Get cart
router.get('/cart', authJwt.verifyToken, controller.getCart)

// Add product to cart
router.put('/cart', authJwt.verifyToken, controller.addToCart)

// Delete product in cart
router.patch('/cart', authJwt.verifyToken, controller.deleteItem)

// Place order, create omise customer and charges
router.post('/placeOrder', authJwt.verifyToken, controller.placeOrder)

// subscribe and wishlists
router.get('/getSubscribes', authJwt.verifyToken, controller.getSubscribes)
router.get('/getWishlists', authJwt.verifyToken, controller.getWishlists)

const request = require('request')
router.post('/omise', async (req, res) => {
    var headers = {
        'Content-Type': 'application/x-www-form-urlencoded'
    };
    
    var dataString = 'amount=10000&currency=thb&card=' + req.body.token;
    
    var options = {
        url: 'https://api.omise.co/charges',
        method: 'POST',
        headers: headers,
        body: dataString,
        auth: {
            'user': 'skey_test_5tphsxg5lj1j0k7uojy',
            'pass': ''
        }
    };
    function callback(error, response, body) {
        if (!error && response.statusCode == 200) {
            console.log(body);
        } else if(!error) {
            console.log(body);
        }
    }
    
    request(options, callback);
    res.send('ok')
})

module.exports = router