// allows us to do cb.call('funcName')(args) without getting an error if callback isn't set
var CallbackHandler = function(){
	cbs = {};
	return {
		add : function(name, func){
			cbs[name] = func;
		},
		do : function(name){
			// return false or return the function
			return cbs[name] ? cbs[name] : function(){};
		}
	}
}

Feed = function(){
	
	this.callbacks = new CallbackHandler();
	
	this.start = function(){
		!this.server || this.server();
	};
	this.init = function(obj){
		this.params = obj;
	};

	this.onResponse = function(func){
		this.callbacks.add('onResponse', func);
	}
};

exports.twitterFeed = function(){
	
	// set reference to Feed obj
	Feed.call(this);
	
	var method, keywords = [],
		params = this.params,

		// access point 'constants'
		REQUEST_TOKEN_URI = "https://api.twitter.com/oauth/request_token",
		ACCESS_TOKEN_URI = "https://api.twitter.com/oauth/access_token",
		STREAM_API_URI = "https://stream.twitter.com/1/statuses/filter.json";

	this.setMethod = function(m){
		if( m.match(/(track|locations|follow)/) ){
			method = m;
		} else {
			return false;
		}
	}
	this.addKeywords = function(key){
		if(key instanceof Array){
			key.each(function(keyString){
				keywords.push(keyString);
			})
		} else {
			keywords.push(key);
		}
	}
	
	this.server = function(){

		// so we don't lose scope farther in
		callbacks = this.callbacks;

		// get auth token via OAUTH request
		var OAuth = require('./oauth/oauth').OAuth,
			oa = new OAuth(
				REQUEST_TOKEN_URI,
				ACCESS_TOKEN_URI,
				this.params.consumer_key,
				this.params.consumer_secret,
				"1.0A",
				null,
				"HMAC-SHA1"
			);

		// establish connection to Twitter API
		// store in {servs} obj
		twitter = oa.post(
			STREAM_API_URI+"?"+method+"="+keywords.join(','),
			this.params.access_token,
			this.params.access_token_secret
		);

		// container to drop twitter response chunks into
		var message = '';

		// Add listener to Twitter connection--call to .onTweet() callback in this block
		twitter.addListener('response', function (response) {
			response.setEncoding('utf8');
			response.addListener("data", function (chunk) {
				message += chunk;
				var newlineIndex = message.indexOf('\r');

				// response should not be sent until message includes '\r'.
				// see: https://dev.twitter.com/docs/streaming-api/concepts#parsing-responses
		    	if (newlineIndex !== -1) {
		        	var tweet = message.slice(0, newlineIndex);
					tweet = tweet.trim();
					if(tweet !== ''){
						if(tweet.indexOf('{') !== -1 && tweet.indexOf('}') !== -1){
							// ping out to console
							tweet = JSON.parse(tweet);
							callbacks.do('onResponse')(tweet);
						}
					}
		        }
		        message = message.slice(newlineIndex + 1);
		    });

		});
		twitter.end();
	}
}