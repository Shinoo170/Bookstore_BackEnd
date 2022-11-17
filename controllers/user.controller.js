// [ connect to database ]
const mongoUtil = require('../config/database')
const { MongoClient } = require('mongodb')
const ObjectId = require('mongodb').ObjectId
const Moralis = require('moralis').default
const { EvmChain } = require('@moralisweb3/evm-utils')
const ethers = require('ethers')
// const omise = require('omise')({
//     'publicKey': process.env.OMISE_PUBLIC_KEY,
//     'secretKey': process.env.OMISE_SECRET_KEY
// })

// Bookmark
// ! no longer available
exports.getBookmark = async (req, res) => {
    return res.status(500).send({message: 'This service is not available'})
    try {
        mongoUtil.connectToServer(async function(err, client){
            if (err) res.status(50).send({message: 'Cannot connect to database'})
            var db = mongoUtil.getDb()
            const _id = new ObjectId(req.user_id)
            const data = await db.collection('users').findOne({ _id, bookmark: [parseInt(req.query.seriesId)] })
            if(data){
                res.status(200).send(true)
            } else {
                res.status(200).send(false)
            }
        })
    } catch (error) {
        res.status(500).send({message: 'This service is not available'})
    }
}
// ! no longer available
exports.addNewBookmark = async (req, res) => {
    return res.status(500).send({message: 'This service is not available'})
    try {
        mongoUtil.connectToServer(async function(err, client){
            if (err) res.status(500).send({message: 'Cannot connect to database'})
            var db = mongoUtil.getDb()
            const _id = new ObjectId(req.user_id)
            db.collection('users').updateOne({ _id }, {
                $push: {
                    bookmark: parseInt(req.query.seriesId),
                }
            }, (err, result) => {
                if(err || result.matchedCount != 1) return res.status(400).send({message: 'Error to add bookmark'})
                res.status(201).send(true)
            })
        })
    } catch (error) {
        res.status(500).send({message: 'This service is not available'})
    }
}
// ! no longer available
exports.removeBookmark = async (req, res) => {
    return res.status(500).send({message: 'This service is not available'})
    try {
        mongoUtil.connectToServer(async function(err, client){
            if (err) res.status(500).send({message: 'Cannot connect to database'})
            var db = mongoUtil.getDb()
            const _id = new ObjectId(req.user_id)
            await db.collection('users').updateOne({ _id }, {
                $pull: {
                    bookmark: parseInt(req.query.seriesId),
                }
            }, (err, result) => {
                if(err || result.matchedCount != 1) return res.status(400).send({message: 'Error to remove bookmark'})
                res.status(201).send(false)
            })
        })
    } catch (error) {
        res.status(500).send({message: 'This service is not available'})
    }
}

// Cart
exports.getCart = async (req, res) => {
    const client = new MongoClient(process.env.MONGODB_URI)
    try{
        await client.connect()
        const db = client.db(process.env.DB_NAME)
        const _id = new ObjectId(req.user_id)
        const userCartData = await db.collection('users').findOne({ _id },{
            projection: {
                _id: 0,
                cart: 1
            }
        })
        var productIdList = userCartData.cart.list.map(element => { return element.productId })
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
        res.send({product, userCartData: userCartData.cart.list})
    } catch (err) {
        console.log(err)
        res.status(500).send({message: 'This service not available', err})
    } finally {
        await client.close()
    }
}

exports.addToCart = async (req, res) => {
    const client = new MongoClient(process.env.MONGODB_URI)
    try{
        await client.connect()
        const db = client.db(process.env.DB_NAME)
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
        })
        res.status(200).send({message: 'put success', currentCart: cart})
    } catch (err) {
        console.log(err)
        res.status(500).send({message: 'This service not available', err})
    } finally {
        await client.close()
    }
}

exports.deleteItem = async (req, res) => {
    const client = new MongoClient(process.env.MONGODB_URI)
    try{
        await client.connect()
        const db = client.db(process.env.DB_NAME)
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
        console.log(err)
        res.status(500).send({message: 'This service not available', err})
    } finally {
        await client.close()
    }
}

// Omise
// const addNewCardOmise = async (id , token) => {
//     omise.customers.update(
//         id,
//         {'card': token},
//         function(error, customer) {
//             return customer.cards[customer.cards.length - 1]
//         }
//     )
// }

// const chargeOmise = async (amount, token) => {
//     const charge = await omise.charges.create({
//         amount: amount*100,
//         currency: 'thb',
//         card: token
//     })
//     return charge
// }

exports.placeOrder = async (req, res) => {
    if(req.body.method !== 'metamask') return res.status(400).send({message : "Please use another service"})
    const client = new MongoClient(process.env.MONGODB_URI)
    try{
        await client.connect()
        const db = client.db(process.env.DB_NAME)
        const { amount, method, exchange_rate, shippingFee, cart } = req.body
        const date = Date.now()
        const user_id = req.user_id
        const _id = new ObjectId(user_id)

        const productIdList = cart.map(element => { return element.productId })
        const product = await db.collection('products').find({ productId: { $in: productIdList }})
            .project({
                _id: 0,
                seriesId: 1,
                productId: 1,
                status: 1,
                price: 1,
                amount: 1,
            }).toArray()

        var totalPriceSummary = shippingFee
        var refund = 0
        const finalOrder = cart.map((element) => {
            const productIndex = product.findIndex(e => e.productId === element.productId)
            var finalAmount = element.amount
            if(element.amount > product[productIndex].amount){
                finalAmount = product[productIndex].amount
                refund += Math.round( (element.amount - finalAmount) * product[productIndex].price / exchange_rate * 100) / 100
            }
            totalPriceSummary +=  Math.round(finalAmount * product[productIndex].price / exchange_rate * 100) / 100
            return {
                productId: element.productId,
                amount: finalAmount,
                price: element.price
            }
        })

        finalOrder.forEach(async element => {
            await db.collection('products').updateOne({productId: element.productId}, {
                $inc : { amount: -element.amount, sold: element.amount }
            })
        })

        const orderId = await mongoUtil.getNextSequence(db, 'orderId')
        var orderDetail = {
            orderId,
            user_id,
            total: amount,
            shippingFee: shippingFee,
            exchange_rate,
            method,
            cart: finalOrder,
            created_at: date,
            date: new Date(date).toISOString(),
            paymentDetails: {},
            address: {},
            status: 'place_order',
        }
        if(( refund > 0 ) && (method === 'metamask') ){
            orderDetail.paymentDetails.refund = true
            orderDetail.paymentDetails.refundDetails = {
                refundTotal: refund,
            }
        }
        await db.collection('orders').insertOne(orderDetail)
        await db.collection('users').updateOne({ _id }, {
            $push: { order: orderId },
            // $set : {
            //     cart: {
            //         list: [],
            //         created: data,
            //         expired: data + 7*24*60*60*1000,
            //     }
            // }
        })
        res.send({
            message: 'place order successful',
            status: 'successful',
            orderId,
        })
        if( method === 'metamask') {
            const { hash } = req.body
            const chain = EvmChain.BSC_TESTNET
            var refundHash
            var refundTx = null
            var transaction = null
            
            await Moralis.start({ apiKey: process.env.MORALIS_API_KEY, })
            while( transaction === null){
                transaction = await Moralis.EvmApi.transaction.getTransaction({
                    transactionHash: hash,
                    chain,
                })
                await new Promise((resolve) => {
                    setTimeout(resolve, 1000)
                })
            }
            if(refund > 0){
                let abi = [
                    "function name() public view returns (string)",
                    "function symbol() public view returns (string)",
                    "function decimals() public view returns (uint8)",
                    "function totalSupply() public view returns (uint256)",
                    "function transfer(address to, uint amount) returns (bool)",
                    "function approve(address _spender, uint256 _value) public returns (bool success)"
                ]
                let provider = new ethers.providers.JsonRpcProvider(process.env.BSC_RPC_URLS)
                let wallet = new ethers.Wallet(process.env.METAMASK_PRIVATE_KEY, provider)
                let contract = new ethers.Contract(process.env.BUSD_CONTRACT, abi, provider)
                let contractWithSigner = contract.connect(wallet)
                let refundTotal = ethers.utils.parseUnits(String(refund), 18)
                // If all order product is out of stock
                if(totalPriceSummary === shippingFee ){
                    refund += shippingFee
                    totalPriceSummary = 0
                    refundTotal = ethers.utils.parseUnits(String(amount), 18)
                }
                refundTx = await contractWithSigner.transfer(
                    transaction.data.from_address,
                    refundTotal
                )
                refundTx.wait()
                refundHash = refundTx.hash
            }
            // ! address
            const paidDate = Date.now()
            var orderUpdate = {
                $set: {
                    paymentDetails: {
                        total: amount,
                        net: totalPriceSummary,
                        hash,
                        created_at: paidDate,
                        date: new Date(paidDate).toISOString(),
                    },
                    status: 'paid',
                }
            }
            if(refund > 0){
                orderUpdate.$set.paymentDetails.refund = true
                orderUpdate.$set.paymentDetails.refundDetails = {
                    refundTotal: refund,
                    hash: refundHash,
                }
                if( totalPriceSummary === 0 ){
                    orderUpdate.$set.status = 'refund'
                    orderUpdate.$set.cancel_message = 'all product out of stock'
                    orderUpdate.$set.failure_code = 'all_product_out_of_stock'
                    orderUpdate.$set.failure_message = 'all product out of stock'
                }
            }
            await db.collection('orders').updateOne({orderId}, orderUpdate)
            return
        }
    } catch (err) {
        console.log(err)
        res.status(500).send({message: 'This service not available', err})
    } finally {
        await client.close()
    }
}


// if(method === 'credit_card'){
//     var charge
//     try {
//         // Charge
//         const token = req.body.token
//         charge = await chargeOmise(totalPriceSummary, token)
//     } catch (error) {
//         finalOrder.forEach(async element => {
//             await db.collection('products').updateOne({productId: element.productId}, {
//                 $inc : { amount: element.amount, sold: -element.amount }
//             })
//         })
//         db.collection('orders').updateOne({orderId}, {
//             $set: {
//                 status: 'cancel',
//                 cancel_message: 'Payment refuse',
//                 failure_code: 'payment_error',
//                 failure_message: 'payment error',
//             }
//         })
//         return
//     }
//     if(charge.status !== 'successful'){
//         // ! Charge error
//         finalOrder.forEach(async element => {
//             await db.collection('products').updateOne({productId: element.productId}, {
//                 $inc : { amount: element.amount ,sold: -element.amount}
//             })
//         })
//         db.collection('orders').updateOne({orderId}, {
//             $set: {
//                 status: 'cancel',
//                 cancel_message: 'Payment refuse',
//                 failure_code: charge.failure_code,
//                 failure_message: charge.failure_message,
//             }
//         })
//         return
//     } else {
//         // * Charge success
//         const paidDate = Date.now()
//         await db.collection('orders').updateOne({orderId},{
//             $set : {
//                 paymentDetails: {
//                     bank: charge.card.bank,
//                     brand: charge.card.brand,
//                     total: charge.amount/100,
//                     net: charge.net/100,
//                     fee: charge.fee/100,
//                     fee_vat: charge.fee_vat/100,
//                     omiseCardId: charge.card.id,
//                     omiseChargeId: charge.id,
//                     omiseTransactionId: charge.transaction,
//                     created_at: paidDate,
//                     date: new Date(paidDate).toISOString(),
//                 },
//                 status: 'paid',
//             }
//         })
//         return
//     }
// }