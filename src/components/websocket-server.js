// environment convenience methods
// standard foreach type iterator
Array.prototype.each = function(fn) {
	for (var i = 0; i < this.length; i++) fn(this[i]);
}
// remove item from array
Array.prototype.remove = function(e) {
	for (var i = 0; i < this.length; i++)
		if (e == this[i]) return this.splice(i, 1);
}
// allows us to do cb.do('funcName')(args) without getting an error if callback isn't set
var CallbackHandler = function(){
	cbs = {};
	return {
		add : function(name, func){
			cbs[name] = func;
		},
		do : function(name){
			// return false or return the function
			return cbs[name] ? !!cbs[name] : cbs[name];
		}
	}
}

exports.websocketServer = function(){
	var http	= require('http'),
		clients = [],
		callbacks = new CallbackHandler();

		start = function(params){
			// create http server to answer requests on port specified on web.listen() below,
			web = http.createServer(function(req, res) {
				var fs = require('fs'),
					// point this to your html page where you want to make the socket.io connection
					// may need to be an absolute path...
					pageFile = 'app.html';
	
				// get index.html from the filesystem
				fs.readFile(pageFile,
					function (err, data) {
						// if request fails, respond 500 and output error
						if (err) {
							res.writeHead(500);
							return res.end('Error loading ' + pageFile);
						}
						// else give a 200/success response and output data
						res.writeHead(200);
						res.end(data);
					}
				);
			});
			
			// get socket.io
			io = require('socket.io');
	
			// run web server on {port} or 8080
			web.listen(params.port || 8080);
	
			// serve socket.io to requests on web
			io = io.listen(web);
	
			// on client connection: run onConnect() and onDisconnect() callbacks below
			io.sockets.on('connection', function(socket){
				
				callbacks.do('onConnect')(socket);
	
				clients.push(socket);
	
				socket.on("connect", function(resource){
					console.log("connect: " + resource);
				})
	
				socket.on('disconnect', function(){
	
					callbacks.do('onDisconnect');
	
					clients.remove(socket);
					console.log("disconnect");
				})
			});
		};

	return {
		init : function(paramsObj){
			start(paramsObj);
		},
		makeEmitter : function(eventName){
			return function(data){
				clients.each(function(client){
					client.emit(eventName, data);
				})
			}
		},
		onConnect : function(func){
			callbacks.add('onConnect', func);
		},
		onDisconnect : function(func){
			callbacks.add('onDisconnect', func);
		}
	}
};