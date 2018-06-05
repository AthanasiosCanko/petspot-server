// 3rd party libs
var express = require('express')
var bodyparser = require('body-parser')
var mongoose = require('mongoose')
var bcrypt = require('bcrypt')

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
    res.json({message: 'Hello!'})
})

app.post('/log_in', function(req, res) {
    const username = req.body.username
    const password = req.body.password

    console.log(username)
    console.log(password)

    // All responses - ERROR, INCORRECT_CREDENTIALS, CORRECT_CREDENTIALS

    // Search by username
    user.findOne({username: username}, function(err, item) {
        if (err) {
            console.log(err)
            res.json({message: 'ERROR'})
        }
        else if (!item) {
            console.log("INCORRECT_CREDENTIALS_NO_ITEM")
            res.json({message: 'INCORRECT_CREDENTIALS'})
        }
        else {
            let hash = item.password

            // If username found, compare password and hash
            bcrypt.compare(password, hash, function(err, result) {
                if (err) {
                    console.log(err)
                    res.json({message: 'ERROR'})
                }
                else {
                    console.log(result)
                    if (result) {
                        console.log("CORRECT_CREDENTIALS")
                        res.json({message: 'CORRECT_CREDENTIALS'})
                    }
                    else {
                        console.log("INCORRECT_CREDENTIALS")
                        res.json({message: 'INCORRECT_CREDENTIALS'})
                    }
                }
            })
        }
    })
})

app.post('/sign_up', function(req, res) {
    const username = req.body.username
    const email = req.body.email
    const password = req.body.password
    const date = Date.now()

    console.log(username)
    console.log(email)
    console.log(password)

    // All responses - ERROR, NO_HASH, NOT_CREATED, CREATED, EMAIL_FOUND, USERNAME_FOUND

    // Search by username first
    user.findOne({username: username}, function(err, item) {
        if (err) {
            console.log(err)
            res.json({message: 'ERROR'})
        }
        else if (!item) {

            // Search by email next
            user.findOne({email: email}, function(err, item) {
                if (err) {
                    console.log(err)
                    res.json({message: 'ERROR'})
                }
                else if (!item) {

                    // Hash password if no user exists
                    bcrypt.hash(password, 12, function(err, hash) {
                        if (err) {
                            console.log(err)
                            res.json({message: 'NO_HASH'})
                        }
                        else {
                            console.log(hash)

                            // If hash successful, create user
                            user.create({
                                username: username,
                                email: email,
                                password: hash,
                                date: date
                            }, function(err, item) {
                                if (err) {
                                    console.log(err)
                                    res.json({message: 'ERROR'})
                                }
                                else if (!item) {
                                    console.log("NOT_CREATED")
                                    res.json({message: 'NOT_CREATED'})
                                }
                                else {
                                    console.log("CREATED")
                                    res.json({message: 'CREATED'})
                                }
                            })
                        }
                    })
                }
                else {
                    console.log("EMAIL_FOUND")
                    res.json({message: 'EMAIL_FOUND'})
                }
            })
        }
        else {
            console.log("USERNAME_FOUND")
            res.json({message: 'USERNAME_FOUND'})
        }
    })
})

app.listen(port, function() {
    console.log("Listening to port " + port + "...")
})
