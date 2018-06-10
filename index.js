// 3rd party libs
var express = require('express')
var bodyparser = require('body-parser')
var mongoose = require('mongoose')
var bcrypt = require('bcrypt')

var db_name = process.env.DB_NAME || require('./data').db_name
var db_password = process.env.DB_PASSWORD || require('./data').db_password
var seed_users = require('./seed').seed_users

var user = require("./schemas").user

// vars
var app = new express()
var port = process.env.PORT || require('./data').port
var db_url = "mongodb://" + db_name + ":" + db_password + "@ds046067.mlab.com:46067/petspot"

// MongoDB connection
mongoose.connect(db_url)
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

    console.log("USERNAME: " + username)
    // console.log("PASSWORD: " + password)

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
    const pet_name = req.body.pet_name
    const pet_category = req.body.pet_category
    const pet_type = req.body.pet_type
    const date = Date.now()

    console.log("\tUSERNAME: " + username)
    console.log("\tEMAIL: " + email)
    // console.log("\tPASSWORD: " + password)
    console.log("\tPET NAME: " + pet_name)
    console.log("\tPET CATEGORY: " + pet_category)
    console.log("\tPET TYPE: " + pet_type)

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
                                pet_name: pet_name,
                                pet_category: pet_category,
                                pet_type: pet_type,
                                friends: [],
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

app.get("/db_seed/:command", function(req, res) {
    let nr_of_seed_users = seed_users.length
    let command = req.params.command
    var count = 0

    function seed_user(seed_users) {
        bcrypt.hash(seed_users[count].password, 12, function(err, hash) {
            if (err) {
                console.log(err)
            }
            else {
                // If hash successful, create user
                user.create({
                    username: seed_users[count].username,
                    email: seed_users[count].email,
                    password: hash,
                    pet_name: seed_users[count].pet_name,
                    pet_category: seed_users[count].pet_category,
                    pet_type: seed_users[count].pet_type,
                    friends: [],
                    date: Date.now()
                }, function(err, item) {
                    if (err) {
                        console.log(err)
                        res.json({message: "Seed failed."})
                    }
                    else if (!item) {
                        console.log("Seed failed.")
                        res.json({message: "Seed failed."})
                    }
                    else {
                        if (count < (nr_of_seed_users - 1)) {
                            count += 1
                            console.log(seed_users[count].username + " seeded.")
                            seed_user(seed_users)
                        }
                        else {
                            console.log("All seeded.")
                            res.json({message: "Seeded."})
                        }
                    }
                })
            }
        })
    }

    function reset_seed(seed_users) {
        user.findOneAndRemove({username: seed_users[count].username}, function(err, item) {
            if (err) {
                console.log(err)
                res.json({message: "Reset failed."})
            }
            else {
                if (count < (nr_of_seed_users - 1)) {
                    count += 1
                    console.log(seed_users[count].username + " deleted.")
                    reset_seed(seed_users)
                }
                else {
                    console.log("All reset.")
                    res.json({message: "All reset."})
                }
            }
        })
    }

    if (command == "seed") seed_user(seed_users)
    else if (command == "reset") reset_seed(seed_users)
    else res.json({message: "Unknown command."})
})

app.post("/search", function(req, res) {
    let query = req.body
    console.log(query)

    // All responses - ERROR, NO_RESULTS, {item}
    user.find(query, function(err, item) {
        if (err) {
            console.log(err)
            res.json({message: "ERROR"})
        }
        else {
            if (item.length == 0) {
                res.json({message: "NO_RESULTS"})
            }
            else if (item.length > 0) {
                res.json({message: "RESULTS_FOUND", item: item})
            }
            else {
                res.json({message: "ERROR"})
            }
        }
    })
})

app.listen(port, function() {
    console.log("Listening to port " + port + "...")
})
