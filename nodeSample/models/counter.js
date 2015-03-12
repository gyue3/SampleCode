var mongoose = require('mongoose');

// define the schema for our user model
var counterSchema = mongoose.Schema({
	user_counter : Number
});

// methods ======================
// generating a hash
counterSchema.methods.getDoc = function() {
    return counterSchema.user_counter.findOne({sequence: 1});
};

// create the model for users and expose it to our app
module.exports = mongoose.model('Counter', counterSchema);