// [ connect to database ]
const mongoUtil = require('../config/database')
const ObjectId = require('mongodb').ObjectId
mongoUtil.connectToServer(function(err, client){
    if (err) console.log(err);
})
var omise = require('omise')({
    'publicKey': process.env.OMISE_PUBLIC_KEY,
    'secretKey': process.env.OMISE_SECRET_KEY
})

// Cart
exports.getCart = async (req, res) => {
    try {
        const db = mongoUtil.getDb()
        const _id = new ObjectId(req.user_id)
        const userCartData = await db.collection('users').findOne({_id},{
            projection: {
                _id: 0,
                cart: 1
            }
        })
        const arr = userCartData.cart.list
        var productIdList = []
        arr.forEach(element => {
            productIdList.push(element.productId)
        })
        
        const product = await db.collection('products').find({ productId: { $in: productIdList }
        }).project({
            _id: 0,
            seriesId: 1,
            productId: 1,
            title: 1,
            url: 1,
            bookNum: 1,
            category: 1,
            thai_category: 1,
            status: 1,
            price: 1,
            amount: 1,
            img: 1,
        }).toArray()
        res.send({product, userCartData: arr})
    } catch (err) {
        res.status(400).send({message: 'Server error', err})
    }
}

exports.addToCart = async (req, res) => {
    try {
        const db = mongoUtil.getDb()
        const params = req.body
        const order = { productId: parseInt(params.productId), amount: parseInt(params.amount)}
        const _id = new ObjectId(req.user_id)
        const data = await db.collection('users').findOne({ _id },{
            projection : {
                _id: 0,
                cart: 1
            }
        })
        var notContain = true
        var arr = data.cart.list
        for(let i=0; i<arr.length; i++){
            if(arr[i].productId === params.productId){
                arr[i].amount = parseInt(params.amount)
                notContain = false
                break
            }
        }
        if(notContain) arr.push(order)
        const cart = {
            list: arr,
            startTime: Date.now(),
            ExpireTime: Date.now() + 7*24*60*60*1000 // 7 Days
        }
        await db.collection('users').updateOne({ _id }, {
            $set: { cart }
        }, (err, result) => {
            if(err) res.status(400).send({message: 'Cannot add to cart', err})
            res.status(200).send({message: 'put success', currentCart: cart})
        })
        
    } catch (err) {
        console.log(err)
        res.status(400).send({message: 'Server error', err})
    }
}

exports.deleteItem = async (req, res) => {
    try {
        const db = mongoUtil.getDb()
        const _id = new ObjectId(req.user_id)
        const productId = req.body.productId
        const data = await db.collection('users').findOneAndUpdate({ _id }, {
            $pull: { 'cart.list': {productId} }
        },{
            projection: {
                _id: 0,
                cart: 1
            }
        })
        res.status(200).send({message: 'delete success', currentCart: data.value.cart })
    } catch (err) {
        res.status(400).send({message: 'Server error', err})
    }
}

// Omise
const addNewCardOmise = async (id , token) => {
    omise.customers.update(
        id,
        {'card': token},
        function(error, customer) {
            return customer.cards[customer.cards.length - 1]
        }
    )
}

const chargeOmise = async (amount, token) => {
    const charge = await omise.charges.create({
        amount: amount*100,
        currency: 'thb',
        card: token
    })
    return charge
}

exports.placeOrder = async (req, res) => {
    mongoUtil.connectToServer(function(err, client){
        if (err) return res.status(503).send({message : "Cannot connect to database"})
        try {
            const { amount, method, cart, exchange_rate, shippingFee } = req.body
            const user_id = req.user_id
            const db = mongoUtil.getDb()
            const _id = new ObjectId(user_id)

            mongoUtil.getNextSequence('orderId', async function(err, result){
                var cartProduct = []
                cart.forEach((element, index) => {
                    cartProduct.push({
                        productId: element.productId,
                        amount: element.amount,
                        price: element.price
                    })
                })
                if(method === 'credit_card'){
                    try {
                        const token = req.body.token
                        const charge = await chargeOmise(amount, token)
                        if(charge.status !== 'successful'){
                            return res.status(402).send({
                                message : charge.failure_message,
                                status: charge.status
                            })
                        } else {
                            const date = Date.now()
                            const order = {
                                orderId: result,
                                user_id,
                                amount,
                                shippingFee,
                                exchange_rate,
                                method,
                                cart: cartProduct,
                                created_at: date,
                                data: new Date(date).toISOString(),
                                paymentDetails: {
                                    bank: charge.card.bank,
                                    brand: charge.card.brand,
                                    amount: charge.amount/100,
                                    net: charge.net/100,
                                    fee: charge.fee/100,
                                    fee_vat: charge.fee_vat/100,
                                    omiseCardId: charge.card.id,
                                    omiseChargeId: charge.id,
                                    omiseTransactionId: charge.transaction,
                                },
                                status: 'place_order',
                            }
                            await db.collection('order').insertOne(order)
                            await db.collection('users').updateOne({_id}, {
                                $push: {
                                    order: result
                                },
                                $set : {
                                    cart: {
                                        list: [],
                                        created: data,
                                        expired: data + 7*24*60*60*1000,
                                    }
                                }
                            })
                            return res.status(200).send({
                                message: 'payment successful',
                                status: 'successful',
                                orderId: result
                            })
                        }
                    } catch (error) {
                        res.status(402).send({
                            message : error.message,
                            status: error.code
                        })
                    }
                }
            })
        } catch (error) {
            res.status(402).send({
                message : "Server not available",
                status: "server_down"
            })
        }
    })
}
