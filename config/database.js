const MongoClient = require('mongodb').MongoClient
const url = process.env.MONGODB_URL

var _db

module.exports = {
  connectToServer: function( callback ) {
    MongoClient.connect( url,  { useNewUrlParser: true }, function( err, client ) {
      _db  = client.db('bookstore')
      console.log("connected to database")
      return callback( err )
    })
  },

  getDb: function() {
    return _db
  }
}