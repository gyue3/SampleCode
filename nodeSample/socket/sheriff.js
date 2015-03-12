//Script to set up a game session
var mongoose = require('mongoose');
var game_client = require('socket.io').listen(8082).sockets;
game_client.on('connection', function(socket){

    socket.on('game_start', function(data) {
        console.log('game_start');
        var Game = mongoose.model('Game');
        var game_session = new Game();
        game_session.session_id = 3;
        game_session.players = [1, 2, 3, 4, 5];

        game_session.save(function(err){
            if (err)
            {
                throw err;
            }else
            {
                console.log('Game_Session saved!');   
            }
            //return done(null, game_session);
        });
    });
});