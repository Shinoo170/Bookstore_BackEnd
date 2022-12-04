// [ connect to database ]
const mongoUtil = require('../config/database')
const { MongoClient } = require('mongodb')
const ObjectId = require('mongodb').ObjectId
const Moralis = require('moralis').default
const { EvmChain } = require('@moralisweb3/evm-utils')
const ethers = require('ethers')
const request = require('request')

// User data
exports.getUserData = async (req, res) => {
    const client = new MongoClient(process.env.MONGODB_URI)
    try{
        await client.connect()
        const db = client.db(process.env.DB_NAME)
        const _id = new ObjectId(req.user_id)
        const userData = await db.collection('users').findOne({ _id },{
            projection: {
                _id: 0,
                email: 1,
                userData: 1,
            }
        })
        
        res.status(200).send(userData)
    } catch (err) {
        console.log(err)
        res.status(500).send({message: 'This service not available', err})
    } finally {
        await client.close()
    }
}

exports.updateUserData = async (req, res) => {
    const client = new MongoClient(process.env.MONGODB_URI)
    try{
        await client.connect()
        const db = client.db(process.env.DB_NAME)
        const _id = new ObjectId(req.user_id)
        var newValues = {
            $set: {
                "userData.displayName": req.body.u, 
                "userData.tel": req.body.t, 
                "email": req.body.e, 
                "userData.firstName": req.body.firstName, 
                "userData.lastName": req.body.lastName 
            }
        }
        const result = await db.collection('users').updateOne({ _id }, newValues)
        res.status(200).send("update users success")
    } catch (err) {
        console.log(err)
        res.status(500).send({message: 'This service not available', err})
    } finally {
        await client.close()
    }
}

exports.updateUserProfile = async (req, res) => {
    const client = new MongoClient(process.env.MONGODB_URI)
    try{
        await client.connect()
        const db = client.db(process.env.DB_NAME)
        const _id = new ObjectId(req.user_id)
        var newValues = { $set: {"userData.img":req.body.imgURL}}
        await db.collection('users').updateOne({ _id }, newValues)

        if(req.body.previousImgUrl !== null){
            const aws = require('aws-sdk')
            aws.config.update({
                secretAccessKey: process.env.AWS_S3_SECRET_ACCESS_KEY,
                accessKeyId: process.env.AWS_S3_ACCESS_KEY_ID,
                region: process.env.AWS_S3_REGION,
            })
            const s3 = new aws.S3()
            const removePath = process.env.AWS_S3_URL + '/'
            const key = req.body.previousImgUrl.replaceAll(removePath, '')
            await s3.deleteObject({ 
                Bucket: process.env.AWS_S3_BUCKET_NAME,
                Key: key 
            }).promise()
        }
        
        res.status(200).send({message: 'update success'})
    } catch (err) {
        console.log(err)
        res.status(500).send({message: 'This service not available', err})
    } finally {
        await client.close()
    }
}

exports.createUserDataAddress = async (req, res) => {
    const client = new MongoClient(process.env.MONGODB_URI)
    try{
        await client.connect()
        const db = client.db(process.env.DB_NAME)
        const _id = new ObjectId(req.user_id)
        var newAddress = {
            $push: {
                'userData.address': { 
                    Name: req.body.a, 
                    address: req.body.l, 
                    country: req.body.coun, 
                    district: req.body.dist, 
                    province: req.body.prov, 
                    subdistrict: req.body.subd, 
                    zipCode: req.body.zipC 
                }
            }
        }
        await db.collection('users').updateOne({ _id }, newAddress)
        res.status(200).send("delete success")
    } catch (err) {
        console.log(err)
        res.status(500).send({message: 'This service not available', err})
    } finally {
        await client.close()
    }
}

exports.updateUserAddress = async (req, res) => {
    const client = new MongoClient(process.env.MONGODB_URI)
    try{
        await client.connect()
        const db = client.db(process.env.DB_NAME)
        const _id = new ObjectId(req.user_id)
        var target = "userData.address." + req.body.index + ".Name"
        var target2 = "userData.address." + req.body.index + ".address"
        var target3 = "userData.address." + req.body.index + ".country"
        var target4 = "userData.address." + req.body.index + ".district"
        var target5 = "userData.address." + req.body.index + ".province"
        var target6 = "userData.address." + req.body.index + ".subdistrict"
        var target7 = "userData.address." + req.body.index + ".zipCode"
        var newValues = { 
            $set: {
                [target]: req.body.a,
                [target2]: req.body.l,
                [target3]: req.body.coun,
                [target4]: req.body.dist,
                [target5]: req.body.prov,
                [target6]: req.body.subd,
                [target7]: req.body.zipC 
            }
        }
        await db.collection('users').updateOne({ _id }, newValues)
        res.status(200).send("update users success")
    } catch (err) {
        console.log(err)
        res.status(500).send({message: 'This service not available', err})
    } finally {
        await client.close()
    }
}

exports.deleteUserDataAddress = async (req, res) => {
    const client = new MongoClient(process.env.MONGODB_URI)
    try{
        await client.connect()
        const db = client.db(process.env.DB_NAME)
        const _id = new ObjectId(req.user_id)
        var target = "userData.address." + req.body.index
        var newValues = { $unset: {[target]: '' }}
        await db.collection("users").updateOne({ _id }, newValues)
        var newValues2 = { $pull: {'userData.address': null}}
        await db.collection("users").updateOne({ _id }, newValues2)
        res.status(200).send("delete success")
    } catch (err) {
        console.log(err)
        res.status(500).send({message: 'This service not available', err})
    } finally {
        await client.close()
    }
}

exports.getUserAddress = async (req, res) => {
    const client = new MongoClient(process.env.MONGODB_URI)
    try{
        await client.connect()
        const db = client.db(process.env.DB_NAME)
        const _id = new ObjectId(req.user_id)
        var address = await db.collection('users').findOne({ _id },{
            projection: {
                _id: 0,
                email: 1,
                userData: 1,
            }
        })
        address.userData.email = address.email
        res.status(200).send(address.userData)
    } catch (err) {
        console.log(err)
        res.status(500).send({message: 'This service not available', err})
    } finally {
        await client.close()
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

exports.placeOrder = async (req, res) => {
    const client = new MongoClient(process.env.MONGODB_URI)
    try{
        await client.connect()
        const db = client.db(process.env.DB_NAME)
        const { amount, method, exchange_rate, crypto_exchange_rate, shippingFee, cart, selectAddress} = req.body
        const date = Date.now()
        const user_id = req.user_id
        const _id = new ObjectId(user_id)

        const productIdList = cart.map(element => { return element.productId })
        const product = await db.collection('products').find({ productId: { $in: productIdList }})
            .project({
                _id: 0,
                seriesId: 1,
                productId: 1,
                title: 1,
                bookNum: 1,
                thai_category: 1,
                status: 1,
                price: 1,
                amount: 1,
                img: 1,
            }).toArray()

        var totalPriceSummary = shippingFee
        var refund = 0
        var seriesId = []   // update series sold count
        var round = 100
        if(method === 'metamask'){
            const currency = req.body.currency
            if(currency === 'ETH'){ round = 100000 }
            else if(currency === 'BTC'){ round = 100000 }
        }
        const finalOrder = cart.map((element) => {
            const productIndex = product.findIndex(e => e.productId === element.productId)
            var finalAmount = element.amount
            if(element.amount > product[productIndex].amount){
                finalAmount = product[productIndex].amount
                refund += Math.round( ((((element.amount - finalAmount) * product[productIndex].price) / exchange_rate) / crypto_exchange_rate) * round) / round
            }
            totalPriceSummary +=  Math.round( ( (finalAmount * product[productIndex].price / exchange_rate) / crypto_exchange_rate ) * round) / round
            seriesId.push({seriesId: product[productIndex].seriesId, amount: finalAmount})
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

        const finalOrderDetails = finalOrder.map(element => {
            const productIndex = product.findIndex(e => e.productId === element.productId)
            return {
                ...product[productIndex],
                amount: element.amount,
            }
        })

        var total = Math.round(amount * round) / round
        const orderId = await mongoUtil.getNextSequence(db, 'orderId')
        var orderDetail = {
            orderId,
            user_id,
            total: Math.round(totalPriceSummary * round) / round,
            shippingFee: shippingFee,
            exchange_rate,
            method,
            cart: finalOrder,
            created_at: date,
            date: new Date(date).toLocaleString('no-NO', { hour12: false}),
            paymentDetails: {},
            address: selectAddress,
            status: 'ordered',
        }
        if(method === 'metamask'){
            orderDetail.crypto_exchange_rate = parseFloat(req.body.crypto_exchange_rate)
            orderDetail.paymentDetails.hash = req.body.hash
            if( refund > 0){
                orderDetail.paymentDetails.refund = true
                orderDetail.paymentDetails.refundDetails = {
                    refundTotal: refund,
                }
            }
        }
        await db.collection('orders').insertOne(orderDetail)
        // ! reset cart
        await db.collection('users').updateOne({ _id }, {
            $push: { order: orderId },
            $set : {
                cart: {
                    list: [],
                    created: Date.now(),
                    expired: Date.now() + 7*24*60*60*1000,
                }
            }
        })
        res.send({
            message: 'place order successful',
            status: 'successful',
            orderId,
            finalOrder: finalOrderDetails,
        })
        if( method === 'credit_card'){
            var headers = {
                'Content-Type': 'application/x-www-form-urlencoded'
            }
            var dataString = 'amount=' + totalPriceSummary*100 + '&currency=thb&card=' + req.body.token
            var options = {
                url: 'https://api.omise.co/charges',
                method: 'POST',
                headers: headers,
                body: dataString,
                auth: {
                    'user': process.env.OMISE_SECRET_KEY,
                    'pass': ''
                }
            }
            async function callback(error, response, body) {
                if (!error && response.statusCode == 200) {
                    const omiseCharge = JSON.parse(body)
                    if(omiseCharge.status !== 'successful') {
                        // ! if Charge error
                        finalOrder.forEach(async element => {
                            await db.collection('products').updateOne({productId: element.productId}, {
                                $inc : { amount: element.amount ,sold: -element.amount}
                            })
                        })
                        await db.collection('orders').updateOne({orderId}, {
                            $set: {
                                status: 'cancel',
                                cancel_message: 'Payment refuse',
                                failure_code: omiseCharge.failure_code,
                                failure_message: omiseCharge.failure_message,
                            }
                        })
                        return
                    } else {
                        // * if Charge success
                        const paidDate = Date.now()
                        await db.collection('orders').updateOne({orderId},{
                            $set : {
                                paymentDetails: {
                                    bank: omiseCharge.card.bank,
                                    brand: omiseCharge.card.brand,
                                    total: omiseCharge.amount/100,
                                    net: omiseCharge.net/100,
                                    fee: omiseCharge.fee/100,
                                    fee_vat: omiseCharge.fee_vat/100,
                                    omiseCardId: omiseCharge.card.id,
                                    omiseChargeId: omiseCharge.id,
                                    omiseTransactionId: omiseCharge.transaction,
                                    created_at: paidDate,
                                    date: new Date(date).toLocaleString('no-NO', { hour12: false}),
                                },
                                status: 'paid',
                            }
                        })
                        seriesId.forEach(async (element, index) => {
                            await db.collection('series').updateOne({seriesId: element.seriesId}, {
                                $inc: {
                                    sold: element.amount
                                }
                            })
                        })
                        return
                    }
                } else {
                    console.log(error)
                    console.log(response.statusCode)
                    finalOrder.forEach(async element => {
                        await db.collection('products').updateOne({productId: element.productId}, {
                            $inc : { amount: element.amount, sold: -element.amount }
                        })
                    })
                    await db.collection('orders').updateOne({orderId}, {
                        $set: {
                            status: 'cancel',
                            cancel_message: 'Payment refuse',
                            failure_code: 'payment_error',
                            failure_message: 'payment error',
                        }
                    })
                    return
                }
            }
            request(options, callback)

        }
        else if( method === 'metamask') {
            const { hash, currency } = req.body
            const chain = EvmChain.BSC_TESTNET
            var refundHash
            var refundTx = null
            var transaction = null
            
            await Moralis.start({ apiKey: process.env.MORALIS_API_KEY, })
            while( transaction === null){
                try {
                    transaction = await Moralis.EvmApi.transaction.getTransaction({
                        transactionHash: hash,
                        chain,
                    })
                    await new Promise((resolve) => {
                        setTimeout(resolve, 1000)
                    })
                } catch (error) { }
            }
            const paidDate = Date.now()
            var orderUpdate = {
                $set: {
                    paymentDetails: {
                        total,
                        net: Math.round(totalPriceSummary * round) / round,
                        currency,
                        hash,
                        created_at: paidDate,
                        date: new Date(paidDate).toLocaleString('no-NO', { hour12: false}),
                    },
                    status: 'paid',
                }
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

                let contract_address = process.env.BUSD_CONTRACT
                if(currency === 'ETH') contract_address = process.env.ETH_CONTRACT
                else if(currency === 'BTC') contract_address = process.env.BTC_CONTRACT

                let contract = new ethers.Contract(contract_address, abi, provider)
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
                orderUpdate.$set.paymentDetails.refund = true
                orderUpdate.$set.paymentDetails.refundDetails = {
                    refundTotal: refund,
                    hash: refundHash,
                }
                if( totalPriceSummary === 0 ){
                    orderUpdate.$set.status = 'cancel'
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
        // ! already close
        // await client.close()
    }
}

exports.getOrder = async (req, res) => {
    const client = new MongoClient(process.env.MONGODB_URI)
    try{
        await client.connect()
        const db = client.db(process.env.DB_NAME)

        var status_sort = req.query.sort || 'all'
        var pages = parseInt(req.query.pages) || 1
        var pageLimit = 10
        const _id = new ObjectId(req.user_id)
        const orderId = await db.collection('users').findOne({_id}, { projection: { _id: 0, order: 1}})
        
        var query = { orderId: { $in: orderId.order } }
        if(status_sort !== 'all'){
            query.status = status_sort
        }
        var sort = { 'orderId': -1 }
        if(status_sort === 'paid'){
            sort = { 'paymentDetails.created_at': 1 }
        }
        const order = await db.collection('orders').find(query).sort(sort).limit(pageLimit).skip((pages-1) * pageLimit).toArray()
        res.status(200).send(order)
    } catch (err) {
        console.log(err)
        res.status(500).send({message: 'This service not available', err})
    } finally {
        await client.close()
    }
}

exports.getOrderDetails = async (req, res) => {
    const client = new MongoClient(process.env.MONGODB_URI)
    try{
        await client.connect()
        const db = client.db(process.env.DB_NAME)
        const orderId = req.query.orderId
        const order = await db.collection('orders').findOne({ user_id: req.user_id, orderId: parseInt(orderId) })
        if(order){
            var productIdList = order.cart.map(element => { return element.productId })
            var productDetails = await db.collection('products').find({ productId: { $in: productIdList }
            }).project({
                _id: 0,
                seriesId: 1,
                productId: 1,
                title: 1,
                url: 1,
                bookNum: 1,
                category: 1,
                thai_category: 1,
                price: 1,
                amount: 1,
                img: 1,
            }).toArray()

            order.cart.map((element) => {
                for(let i=0; i<productDetails.length; i++){
                    if(element.productId === productDetails[i].productId){
                        productDetails[i].amount = element.amount
                        productDetails[i].price = element.price
                    }
                }
            })
            res.status(200).send({order, productDetails})
        } else {
            res.status(404).send({message: 'No order found'})
        }
    } catch (err) {
        console.log(err)
        res.status(500).send({message: 'This service not available', err})
    } finally {
        await client.close()
    }
}

exports.getSubscribes = async (req, res) => {
    const client = new MongoClient(process.env.MONGODB_URI)
    try{
        await client.connect()
        const db = client.db(process.env.DB_NAME)
        const _id = new ObjectId(req.user_id)
        const subscribeData = await db.collection('users').findOne({ _id }, {
            projection: {
                _id: 0,
                subscribe : 1
            }
        })
        const data = await db.collection('series')
            .find({seriesId : { $in : subscribeData.subscribe }})
            .project({
                _id: 0,
                seriesId: 1,
                title: 1,
                img: 1,
                score: 1,
                addDate: 1,
                lastModify: 1,
                status: 1,
            }).toArray()
        res.status(200).send(data)
    } catch (err) {
        console.log(err)
        res.status(500).send({message: 'This service not available', err})
    } finally {
        await client.close()
    }
}

exports.getWishlists = async (req, res) => {
    const client = new MongoClient(process.env.MONGODB_URI)
    try{
        await client.connect()
        const db = client.db(process.env.DB_NAME)
        const _id = new ObjectId(req.user_id)
        const wishlistsData = await db.collection('users').findOne({ _id }, {
            projection: {
                _id: 0,
                wishlists : 1
            }
        })
        const data = await db.collection('products')
            .find({productId : { $in : wishlistsData.wishlists }})
            .project({
                _id: 0,
                productId: 1,
                seriesId: 1,
                title: 1,
                url: 1,
                bookNum: 1,
                category: 1,
                thai_category: 1,
                status: 1,
                price: 1,
                score: 1,
                img: 1,
                amount: 1,
            }).toArray()
        res.status(200).send(data)
    } catch (err) {
        console.log(err)
        res.status(500).send({message: 'This service not available', err})
    } finally {
        await client.close()
    }
}
