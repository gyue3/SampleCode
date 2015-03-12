var mongo = require('mongodb').MongoClient;
var client = require('socket.io').listen(8080).sockets;

mongo.connect('mongodb://54.201.46.195/chat', function(err, db) {
	if(err) throw err;

	client.on('connection', function(socket) {
		var col = db.collection('messages');

		sendStatus = function(s) {
			socket.emit('status', s);
		}

		//Emit All Messages
		col.find().limit(50).sort({'date' : 1}).toArray(function(err, result) {
			if(err) throw err;

			socket.emit('output', result);
		});


		socket.on('input', function(data) {
			var name = data.name;
			var message = data.message;
			var d = new Date();
			data.date = d; //Get Date from server

			var whitespacePattern = /^\s*$/;

			if(whitespacePattern.test(name) || whitespacePattern.test(message))
			{
				sendStatus('Name and Message Invalid');
				console.log("Invalid")
			}else
			{
				col.insert({date : d, name: name, message: message}, function() {

					//Emit latest message to all Clients
					client.emit('output', [data]);

					console.log('Inserted');
					sendStatus({message: "Message Sent", clear  : true});
				});
			}
		});

	});

});