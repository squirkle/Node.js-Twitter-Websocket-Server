var WebsocketServer = require('ws-server'),
    ws = new WebsocketServer('index.html'),

    TwitterLink = require('twitter-link'),
    TwitterStream = require('twitter-stream'),

    stream = new TwitterStream({
      auth : {
        consumer_key : "...",
        consumer_secret : "...",
        access_token : "...",
        access_token_secret : "..."
      },
      method : "track",
      keywords : ['puppies', 'kittens'],
      onResponse : ws.makeEmitter('tweet')
    });

// Start websocket server
ws.start();

// Connect to Twitter stream
stream.connect();
