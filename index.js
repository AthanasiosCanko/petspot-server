// 3rd party libs
var express = require('express')
var bodyparser = require('body-parser')
var mongoose = require('mongoose')

var db_name = process.env.DB_NAME || require('./data').db_name
var db_password = process.env.DB_PASSWORD || require('./data').db_password

var user = require("./schemas").user

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

app.post('/sign_up', function(req, res) {
    const username = req.body.username
    const email = req.body.email
    const password = req.body.password
    const date = Date.now()

    // All responses - ERROR, NOT_CREATED, CREATED, FOUND
    user.findOne({username: username}, function(err, item) {
        if (err) {
            console.log(err)
            res.json({message: 'ERROR'})
        }
        else if (!item) {
            user.create({
                username: username,
                email: email,
                password: password,
                date: date
            }, function(err, item) {
                if (err) {
                    console.log(err)
                    res.json({message: 'ERROR'})
                }
                else if (!item) res.json({message: 'NOT_CREATED'})
                else res.json({message: 'CREATED'})
            })
        }
        else res.json({message: 'FOUND'})
    })
})

app.listen(port, function() {
    console.log("Listening to port " + port + "...")
})
