const MongoClient = require('mongodb').MongoClient
const url = process.env.MONGODB_URI

var _db

module.exports = {
  connectToServer: function( callback ) {
    MongoClient.connect( url,  { useNewUrlParser: true }, function( err, client ) {
      _db  = client.db('bookstore')
      // console.log("connected to database")
      return callback( err )
    })
  },

  getDb: function() {
    return _db
  },

  getNextSequence( field, callback) {
    _db.collection('counters').findOneAndUpdate(
      { _id: field },
      { $inc: { seq: 1 } },
      function (err, result) {
        if (err) {
          callback(err, result)
        }
        callback(err, result.value.seq)
      }
    )
  },

  // when error
  previousSequence( field ) {
    _db.collection('counters').findOneAndUpdate(
      { _id: field },
      { $inc: { seq: -1 } }
    )
  },
}