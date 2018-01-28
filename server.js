const mongo = require('mongodb').MongoClient;
const client = require('socket.io').listen(4000).sockets;

// CONNECT TO MONGO
mongo.connect('mongodb://127.0.0.1/mongochat', (err, db) => { //this will create database for us!
	if(err){
		throw err;
	}
	console.log('MongoDB connected...');
	
	// CONNECT TO Socket.IO
	client.on('connection', (socket) => {
		let chat = db.collection('chats');
		
		//Create FNC to send status
		sendStatus = (s) => { 
			socket.emit(s); //.emit is called whenever you want to send something through socket.io
		}
		
		//Get chats from mongo collection
		chat.find().limit(100).sort({_id:1}).toArray((err, res) => {
			if(err){
				throw err;
			}
		
			//Emit messages
			socket.emit('output', res);
		});
	
		//Handle input events
		socket.on('input', (data) => {
			let name = data.name;
			let message = data.message;

			//Check for name and message
			if(name == '' || message == ''){
				//Send error status
				sendStatus('Please enter a name and message');
			}
			else {
				//Insert message
				chat.insert({name: name, message: message}), () => {
					client.emit('output', [data]);

					//Send status object
					sendStatus({
						message: 'Message sent',
						clear: true
					});
				}
			} 
		});
		//Handle clear
		socket.on('clear', (data) => {
			//Remove all chats from collection
			chat.remove({}, () => {
				//Emit cleared
				socket.emit('clear');
			});
		})
	});
});