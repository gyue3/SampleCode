var mongoose = require('mongoose');

// define the schema for our user model
var gameSchema = mongoose.Schema({
	session_id: Number,
	players: [Number]
});

// methods ======================
// generating a hash
gameSchema.methods.sync = function(password) {
    return true;
};

// create the model for users and expose it to our app
module.exports = mongoose.model('Game', gameSchema);