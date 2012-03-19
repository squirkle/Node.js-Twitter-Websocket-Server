(function(){

	var websocketServer = require('./components/websocket-server.js').websocketServer,
		twitterFeed = require('./components/api-feeds.js').twitterFeed,

	websocketServer = new websocketServer();
	twitterFeed = new twitterFeed();

	// create an app at https://dev.twitter.com/apps/new
	twitterFeed.init({
		consumer_key : '',
		consumer_secret : '',
		access_token : '',
		access_token_secret : ''
	});
	websocketServer.init({
		port : 8081 /* or whatever */
	})

	// makeEmitter(name) returns a function where {name} is the name of the socket.io event 
	var emitTweet = websocketServer.makeEmitter('tweet');
	twitterFeed.onResponse(function(response){
		emitTweet(response);
	})

	twitterFeed.setMethod('track');
	twitterFeed.addKeywords(['Puppies','Kittens']);
	twitterFeed.server();

})()