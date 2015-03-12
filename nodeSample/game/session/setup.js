var player = new Sheriff();

try{
	var socket = io.connect('http://54.201.46.195:8082');
}catch(e) {}

$(document).ready(function(){
	if(socket !== undefined)
	{
		$('#start_game').click(function(){
			socket.emit('game_start', {
				name: user,
				message: msg
			})
		});
	}
});