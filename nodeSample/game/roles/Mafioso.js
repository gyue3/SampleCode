Mafioso.prototype = new Role();
Mafioso.prototype.constructor = Mafioso;

function Mafioso()
{
	this.kill = function(target)
	{
		
		socket.emit('action', {
			name: user,
			session_id: sid,
			target: target
		})
		
		
	}


}