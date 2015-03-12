var mongoose = require('mongoose');
var Game = mongoose.model('Counter');
var counter = new Counter();

console.log('session');
var ids = counter.getDoc();

console.log(ids.user_counter);