// [ connect to database ]
const mongoUtil = require('../config/database')
const ObjectId = require('mongodb').ObjectId
mongoUtil.connectToServer(function(err, client){
    if (err) console.log(err);
})

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
            res.status(201).send({message: 'add', currentCart: cart})
        })
        
    } catch (err) {
        console.log(err)
        res.status(400).send({message: 'Server error', err})
    }
}

exports.deleteItem = async (req, res) => {

}