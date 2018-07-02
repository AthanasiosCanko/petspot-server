// 3rd party libs
var express = require('express')
var bodyparser = require('body-parser')
var mongoose = require('mongoose')
var bcrypt = require('bcrypt')

var db_name = process.env.DB_NAME || require('./data').db_name
var db_password = process.env.DB_PASSWORD || require('./data').db_password
var seed_users = require('./seed').seed_users

var user = require("./schemas").user
var pin = require("./schemas").pin

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
                        res.json({message: 'CORRECT_CREDENTIALS', user: item})
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

app.post("/send_request", function(req, res) {
    let username = req.body.username
    let request_username = req.body.request_username

    // All responses - ERROR, NOT_FOUND, NOT_UPDATED, UPDATED, ALREADY_SENT, YOURSELF
    if (username == request_username) {
        res.json({message: "YOURSELF"})
    }
    else {
        // Check if request already sent, or user is already a friend
        user.findOne({username: username}, function(err, item) {
            if (err) {
                console.log(err)
                res.json({message: "ERROR"})
            }
            else if (!item) {
                res.json({message: "NOT_FOUND"})
            }
            else if (item) {
                var found = false
                var sent_requests = item.sent_requests
                var friends = item.friends

                for (var i = 0; i < sent_requests.length; i += 1) {
                    if (sent_requests[i] == request_username) {
                        found = true
                    }
                }

                for (var i = 0; i < friends.length; i += 1) {
                    if (friends[i] == request_username) {
                        found = true
                    }
                }

                if (found == false) {
                    sent_requests.push(request_username)

                    // Add other user to list of sent requests
                    user.findOneAndUpdate(
                        {username: username},
                        {sent_requests: sent_requests},
                        {new: true},
                        function(err, item) {
                            if (err) {
                                console.log(err)
                                res.json({message: "ERROR"})
                            }
                            else if (!item) {
                                res.json({message: "NOT_UPDATED"})
                            }
                            else if (item) {

                                // Add your username to other user's list of friend requests
                                user.findOne({username: request_username}, function(err, item) {
                                    if (err) {
                                        console.log(err)
                                        res.json({message: "ERROR"})
                                    }
                                    else if (!item) {
                                        res.json({message: "NOT_UPDATED"})
                                    }
                                    else if (item) {
                                        var friend_requests = item.friend_requests
                                        friend_requests.push(username)

                                        user.findOneAndUpdate(
                                            {username: request_username},
                                            {friend_requests: friend_requests},
                                            {new: true},
                                            function(err, item) {
                                                if (err) {
                                                    console.log(err)
                                                    res.json({message: "ERROR"})
                                                }
                                                else if (!item) {
                                                    res.json({message: "NOT_UPDATED"})
                                                }
                                                else if (item) {
                                                    res.json({message: "UPDATED"})
                                                }
                                                else {
                                                    res.json({message: "ERROR"})
                                                }
                                            }
                                        )
                                    }
                                    else {
                                        res.json({message: "ERROR"})
                                    }
                                })
                            }
                            else {
                                res.json({message: "ERROR"})
                            }
                    })
                }
                else {
                    res.json({message: "ALREADY_SENT"})
                }
            }
            else {
                res.json({message: "ERROR"})
            }
        })
    }
})

app.post("/user_data", function(req, res) {
    let username = req.body.username

    user.findOne({username: username}, function(err, item) {
        if (err) {
            console.log(err)
            res.json({message: "ERROR"})
        }
        else if (!item) {
            res.json({message: "NOT_FOUND"})
        }
        else if (item) {
            res.json({message: "FOUND", user: item})
        }
        else {
            res.json({message: "ERROR"})
        }
    })
})

app.post("/accept_request", function(req, res) {
    let username = req.body.username
    let request_username = req.body.request_username

    console.log(username)
    console.log(request_username)

    user.findOne({username: username}, function(err, item) {
        if (err) {
            console.log(err)
            res.json({message: "ERROR"})
        }
        else if (!item) {
            res.json({message: "USER_NOT_FOUND"})
        }
        else if (item) {
            var friends = item.friends
            var friend_requests = item.friend_requests

            friends.push(request_username)

            for (var i = 0; i < friend_requests.length; i += 1) {
                if (friend_requests[i] == request_username) {
                    friend_requests.splice(i, 1)
                    break
                }
            }

            user.findOneAndUpdate(
                {username: username},
                {friends: friends, friend_requests: friend_requests},
                {new: true},
                function(err, item) {
                    if (err) {
                        console.log(err)
                        res.json({message: "ERROR"})
                    }
                    else if (!item) {
                        res.json({message: "USER_NOT_FOUND"})
                    }
                    else if (item) {
                        user.findOne(
                            {username: request_username},
                            function(err, item) {
                                if (err) {
                                    console.log(err)
                                    res.json({message: "ERROR"})
                                }
                                else if (!item) {
                                    res.json({message: "USER_NOT_FOUND"})
                                }
                                else if (item) {
                                    var friends = item.friends
                                    var sent_requests = item.sent_requests

                                    friends.push(username)

                                    for (var i = 0; i < sent_requests.length; i += 1) {
                                        if (sent_requests[i] == username) {
                                            sent_requests.splice(i, 1)
                                            break
                                        }
                                    }

                                    console.log(username)
                                    console.log(sent_requests)

                                    user.findOneAndUpdate(
                                        {username: request_username},
                                        {friends: friends, sent_requests: sent_requests},
                                        {new: true},
                                    function(err, item) {
                                        if (err) {
                                            console.log(err)
                                            res.json({message: "ERROR"})
                                        }
                                        else if (!item) {
                                            res.json({message: "USER_NOT_FOUND"})
                                        }
                                        else if (item) {
                                            res.json({message: "SUCCESS"})
                                        }
                                        else {
                                            res.json({message: "ERROR"})
                                        }
                                    })
                                }
                                else {
                                    res.json({message: "ERROR"})
                                }
                            })
                    }
                    else {
                        res.json({message: err})
                    }
                })
        }
        else {
            res.json({message: "ERROR"})
        }
    })
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

app.post("/add_pin", function(req, res) {
    let username = req.body.username
    let city = req.body.city
    let latitude = Number(req.body.latitude)
    let longitude = Number(req.body.longitude)

    pin.create({
        username: username,
        city: city,
        latitude: latitude,
        longitude: longitude
    }, function(err, item) {
        if (err) {
            console.log(err)
            res.json({message: "ERROR"})
        }
        else if (!item) {
            res.json({message: "NOT_FOUND"})
        }
        else if (item) {
            res.json({message: "FOUND"})
        }
        else {
            res.json({message: "ERROR"})
        }
    })
})

app.post("/city_pins", function(req, res) {
    let city = req.body.city

    pin.find({city: city}, function(err, item) {
        if (err) {
            console.log(err)
            res.json({message: "ERROR"})
        }
        else if (!item) {
            res.json({message: "NOT_FOUND"})
        }
        else {
            res.json({message: "FOUND", pins: item})
        }
    })
})

app.post("/change_password", function(req, res) {
    let username = req.body.username
    let old_password = req.body.old_password
    let new_password = req.body.new_password

    user.findOne({username: username}, function(err, item) {
        if (err) {
            console.log(err)
            res.json({message: "ERROR"})
        }
        else if (!item) {
            res.json({message: "NOT_FOUND"})
        }
        else if (item) {
            let hash = item.password

            // If username found, compare password and hash
            bcrypt.compare(old_password, hash, function(err, result) {
                if (err) {
                    console.log(err)
                    res.json({message: 'ERROR'})
                }
                else {
                    console.log(result)
                    if (result) {
                        bcrypt.hash(new_password, 12, function(err, hash) {
                            if (err) {
                                console.log(err)
                                res.json({message: "ERROR"})
                            }
                            else {
                                user.findOneAndUpdate(
                                    {username: username},
                                    {password: hash},
                                    {new: true},
                                    function(err, item) {
                                        if (err) {
                                            console.log(err)
                                            res.json({message: "ERROR"})
                                        }
                                        else if (!item) {
                                            res.json({message: "NOT_FOUND"})
                                        }
                                        else if (item) {
                                            res.json({message: "PASSWORD_CHANGED"})
                                        }
                                        else {
                                            res.json({message: "ERROR"})
                                        }
                                    }
                                )
                            }
                        })
                    }
                    else {
                        res.json({message: 'OLD_PASSWORD_NO_MATCH'})
                    }
                }
            })
        }
    })
})

app.listen(port, function() {
    console.log("Listening to port " + port + "...")
})
