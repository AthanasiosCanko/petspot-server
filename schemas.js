var mongoose = require('mongoose')

var userSchema = mongoose.Schema({
    username: {
        type: String,
        required: true,
        unique: true
    },
    email: {
        type: String,
        required: true,
        unique: true
    },
    password: {
        type: String,
        required: true
    },
    pet_name: String,
    pet_category: String,
    pet_type: String,
    friends: Array,
    friend_requests: Array,
    date: Date
})

var user = mongoose.model("user", userSchema)

module.exports.user = user
