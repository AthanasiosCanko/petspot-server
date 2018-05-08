// 3rd party libs
var express = require('express')
var bodyparser = require('body-parser')
var mongoose = require('mongoose')

var db_name = require('./data').db_name
var db_password = require('./data').db_password

// vars
var app = new express()
var port = process.env.PORT || require('./data').port

// MongoDB connection
mongoose.connect("mongodb://" + db_name + ":" + db_password + "@ds046067.mlab.com:46067/petspot")
mongoose.connection.on("error", function(err) {
    if (err) console.log(err)
})

mongoose.connection.once("open", function() {
    console.log("Database connected...")
})

app.use(bodyparser.urlencoded({extended: true}))

app.get('/', function(req, res) {
    res.json({
        message: 'Hello!'
    })
})

app.listen(port, function() {
    console.log("Listening to port " + port + "...")
})
