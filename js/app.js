// requires Firebase, jQuery and Underscore


// fetch tweets from the mothership (twitter.com)

	/*
		requires
			$ 	jQuery
			_ 	UnderscoreJS
			S 	StringJS
			config || App.config
	*/
	function fetchTweetsFromTwitter(parameters, callback)
	{
		var $ = this.$,
			_ = this._,
			S = this.S,
			request,
			query = {},
			tweets = []

		// parameters
		
		var config = parameters.config,
			hashtag = (parameters.hashtag) ? parameters.hashtag : config.hashtag
			screenName = parameters.screenName

		// build the Twitter search URL

		query.url = 'https://twitter.com/search?q=%23' + hashtag 
		if (screenName) query.url += '%20from%3A' + screenName
		query.url += '&src=typd&f=realtime'

		query.type = 'html'
		// query.headers = 'all'
		query.cache = false
		query.map = 
		{
			tweetDataArray: 
			{
				selector: 'ol#stream-items-id li .tweet',
				extract: ['data-user-id', 'data-screen-name', 'data-item-id', 'data-name', 'data-mentions', 'data-expanded-footer', 'html']
			},
			tweetTextArray: 
			{
				selector: 'ol#stream-items-id li .tweet .content .tweet-text',
				extract: ['text', 'html']
			},
			tweetTimeArray: 
			{
				selector: 'ol#stream-items-id li .tweet .content .time ._timestamp',
				extract: ['data-time']
			},
			tweetUserProfileImageArray: 
			{
				selector: 'ol#stream-items-id li .tweet .content img.avatar',
				extract: ['src']
			}
		}	
		
		request = config.noodleUrl + '?q=' + encodeURIComponent(JSON.stringify(query)) + '&callback=?'

		$.getJSON(request, function (data) 
		{
			var results = data[0].results,
				tweetDataArray = results['tweetDataArray'],
				tweetTextArray = results['tweetTextArray'],
				tweetTimeArray = results['tweetTimeArray'],
				tweetUserProfileImageArray = results['tweetUserProfileImageArray']

			// if (tweetDataArray.length < 1 || tweetTextArray.length < 1)
			if (tweetDataArray.error || tweetTextArray.error || tweetTimeArray.error || tweetUserProfileImageArray.error)	
			{
				var error = 
				{
					tweetDataArray: tweetDataArray.error,
					tweetTextArray: tweetTextArray.error,
					tweetTimeArray: tweetTimeArray.error,
					tweetUserProfileImageArray: tweetUserProfileImageArray.error
				}
				callback(error)
			}
			else
			{
				if (config.displayTweetsInCronologicalOrder)
				{
					// need to reverse the order of the array, so that we have a chronological order (oldest to newest)
					tweetDataArray.reverse()
					tweetTextArray.reverse()
					tweetTimeArray.reverse()
					tweetUserProfileImageArray.reverse()
				}

				_(tweetDataArray).each(function(tweetData, index)
				{
					var tweet = 
					{
						id: tweetData['data-item-id'],
						text: tweetTextArray[index]['text'],
						timestamp: tweetTimeArray[index]['data-time'],
						user:
						{
							'id': tweetData['data-user-id'],
							'screen-name': tweetData['data-screen-name'],
							'name': tweetData['data-name'],
							'profile-image-url': tweetUserProfileImageArray[index]['src']
						}
					}

					// MENTIONS
					if (tweetData['data-mentions']) tweet.mentions = tweetData['data-mentions'].split(' ')

					// PHOTO
					// look inside the 'data-expanded-footer'
					var $expandedFooter = $(tweetData['data-expanded-footer']),
						hasImg = $expandedFooter.find('img').length > 0
					if (hasImg) tweet.photo = $expandedFooter.find('img').attr('src')

					// LINKS & HASHTAGS
					var html = '<p>' + tweetTextArray[index]['html'] + '</p>', // need to wrap the text in a <p> so that jQuery doesn't choke
						$text = $(html),
						$aArray = $text.find('a')
					$aArray.each(function(index, element)
					{	
						var $a = $(element),
							href = $a.attr('href'),
							cls = $a.attr('class'),
							expandedUrl = $a.data('expanded-url')

						if (expandedUrl)
						{
							if (!tweet.links) tweet.links = []
							tweet.links.push(expandedUrl)	
						}

						if (cls.indexOf('twitter-hashtag') > -1)
						{
							var hashtag = S($a.html()).stripTags().replaceAll('#','').s.toLowerCase()
							if (!tweet.hashtags) tweet.hashtags = []
							tweet.hashtags.push(hashtag)
							// console.log(hashtag)
						}
					})

					// GEO
					var hasGeo = $expandedFooter.find('a.tweet-geo-text').length > 0
					if (hasGeo)
					{
						var href = $expandedFooter.find('a.tweet-geo-text').attr('href'),

						href = S(href).replaceAll('%2C',',').replaceAll('&amp;','&').replaceAll('%20','+').s.substring(href.indexOf('?')+1) // clean up

						var parametersArray = href.split('&'),
							parametersObject = {}

						_(parametersArray).each(function(string)
						{
							var parts = string.split('='),
								key = parts[0],
								value = parts[1]

							parametersObject[key] = value	
						})

						// console.log('href ' + href)
						// console.log(parametersObject)

						var latLng = (parametersObject.ll) ? parametersObject.ll.split(',') : parametersObject.q.split(',')

						// console.log(latLng)

						tweet.geo = { lat: latLng[0], lng: latLng[1] }
					}	

					tweets.push(tweet)
				})

				callback(null, tweets)
			}
			// console.log(tweets)
		})
	}		

// Firebase data manipulationz

	function getTweets(hashtag, screenName, callback)
	{
		if (screenName)
		{
			getTweetsByScreenName(screenName, function(error, tweets)
			{
				if (error) 
				{
					callback(error)
				}
				else
				{
					if (hashtag)
					{
						filterTweetsByHastag(tweets, hashtag, function(error, tweets)
						{
							if (error)
							{
								callback(error)
							}	
							else
							{
								callback(null, tweets)
							}
						})
					}
					else 
					{
						callback(null, tweets)
					}	
				}
			})
		}
		else
		{
			getTweetsByHashtag(hashtag, function(error, tweets)
			{
				if (error) 
				{
					callback(error)
				}
				else
				{
					/*_(tweets).each(function(tweet)
					{
						console.log(tweet.text + ' ' + tweet.hashtags)	
					})*/
					
					callback(null, tweets)
				}
			})
		}
	}

	function filterTweetsByHastag(tweets, hashtag, callback)
	{
		var filteredTweets = _(tweets).filter( function(tweet)
		{
			return _(tweet.hashtags).contains(hashtag)
		})

		if (filteredTweets.length > 0)
		{
			callback(null, filteredTweets)
		}
		else
		{
			callback({message: 'There are no tweets with #' + hashtag})
		}
	}

	// bit of a hack.. get all tweets and then filter them
	function getTweetsByHashtag(hashtag, callback)
	{
		var url = App.config.firebaseUrl + App.config.firebaseTweetsPath,
			fbs = new Firebase(url)

		fbs.once('value', function(snapshot) 
		{
			if (snapshot.val() === null) 
			{
				// TODO
				var error = { message: snapshot.name() + ' does not exist'}
				callback(error)
			}
			else
			{
				var tweets = snapshot.val()
				filterTweetsByHastag(tweets, hashtag, callback)
				// callback(null, tweets)
			}
		})
	}

	function getTweetsByScreenName(screenName, callback)
	{
		// console.log('getTweetsByScreenName ' + screenName)

		getUserByScreenName(screenName, function(error, user)
		{
			if (error)
			{
				console.error(error.message)
				callback(error)
			}
			else
			{
				// console.log(user)

				var parameters  = 
				{
					config: App.config, // TODO
					id: user.id
				}

				getTweetsByUser(parameters, function(error, tweets)
				{
					if(error)
					{
						console.error(error.message)
						callback(error)
					}
					else
					{
						callback(null, tweets)
					}
				})
			}	
		})
	}

	function ensureTweet(parameters, callback)
	{
		// parameters

		var config = parameters.config,
			tweet = parameters.tweet

		console.log('ensureTweet ', tweet)	

		var url = config.firebaseUrl + config.firebaseTweetsPath + '/' + tweet.id

		parameters.fb = new Firebase(url)

		_ensureTweet(parameters, callback)
	}

	function _ensureTweet(parameters, callback)
	{
		// parameters

		var fb = parameters.fb,
			tweet = parameters.tweet/*,
			print = parameters.print*/

		// console.log('_ensureTweet ' + tweet.text)

		// check if tweet exists
		fb.once('value', function(snapshot) 
		{	
			// if not, add/update it
			if (snapshot.val() === null) 
			{
				// console.log('tweet ' + tweet.id + ' should be saved')

				tweet.score = 1 // by default, 1 point

				// using the user.id to order tweets
				// from the oldest account (lower number > higher priority) to the newest
				// fb.setWithPriority(tweet, Number(tweet.user.id), function(error)

				fb.setWithPriority(tweet, Number(tweet.id), function(error)	
				{
					if (!error)
					{
						tweet.cls = 'new'
						callback(null, tweet)
					}
					else 
					{
						callback(error)
					}	
				})

				// if (print) tweet.cls = 'new'
			}
			else
			{
				// console.log('tweet ' + tweet.id + ' has been saved already')

				tweet.score = snapshot.val().score

				tweet.cls = 'existing'

				callback(null, tweet)

				// if (print) tweet.cls = 'existing'					
			}

			// if (tweet.cls == 'new') console.log(tweet.cls.toUpperCase() + ' ' + tweet.id + ' ' + tweet.text)
			// console.log(tweet.cls.toUpperCase() + ' ' + tweet.id + ' ' + tweet.text)

			// if (print) printTweet(tweet)
		})
	}

	function updateScore(tweetId)
	{
		var score = $('#' + tweetId + ' .score').val()
		// console.log('score is ' + score)

		var url = App.config.firebaseUrl + 'test-tweets/' + tweetId,
			fb = new Firebase(url)

		fb.once('value', function(snapshot) 
		{	
			if (snapshot.val().score !== score) 
			{
				fb.update({score: score}, function(error)
				{
					if (error)
					{
						// TODO
						console.error('score update failed')
						console.error(error)
					} 
					else 
					{
						// TODO
						// console.log('score updated')
					}	
				})
			}	
		})	
	}

	function ensureUser(tweet)
	{
		var url = App.config.firebaseUrl + App.config.firebaseUsersPath + '/' + tweet.user['screen-name'],
			fbUser = new Firebase(url)
		
		// check if user exists
		fbUser.once('value', function(snapshot) 
		{
			// console.log(url + ' val() ' + snapshot.val())	
			// if not, add/update it
			if (snapshot.val() === null) 
			{
				// console.log('user ' + tweet.user['screen-name'] + ' should be saved')

				// fbUser.set(tweet.user)
				fbUser.setWithPriority(tweet.user, Number(tweet.user.id))
				// using the user.id to order users
				// from the oldest account (lower number > higher priority) to the newest
			}
			else
			{
				// TODO update picture?
				// console.log('user ' + tweet.user['screen-name'] + ' has been saved already')
			}
		})
	}

	function getTweetsByUser(parameters, callback)
	{

		var id = Number(parameters.id), // just in case
			config = parameters.config

		// console.log('getTweetsByUser ' + id)

		if (isNodeJS())
		{
			Firebase = this.Firebase
		}	

		var url = config.firebaseUrl + config.firebaseTweetsPath,
			fb = new Firebase(url).startAt(id).endAt(id)

		// console.log('getTweetsByUser ' + id)

		fb.once('value', function(snapshot) 
		{
			if (snapshot.val() === null) 
			{
				var error = { message: snapshot.name() + ' does not exist'}
				callback(error)
			}
			else
			{
				var tweets = snapshot.val()
				callback(null, tweets)
			}
		})
	}

	function getUserByScreenName(screenName, callback)
	{
		var url = App.config.firebaseUrl + App.config.firebaseUsersPath + '/' + screenName,
			fbUser = new Firebase(url)
		
		// check if user exists
		fbUser.once('value', function(snapshot) 
		{
			// console.log(url + ' val() ' + snapshot.val())	
			if (snapshot.val() === null) 
			{
				var error = { message: 'user "' + snapshot.name() + '" does not exist'}
				callback(error)
			}
			else
			{
				var user = snapshot.val()
				callback(null, user)
			}
		})
	}

// Firebase authentication for browser-based calls	
	
	function initAuth(callback)
	{
		App.auth = new FirebaseSimpleLogin(new Firebase(App.config.firebaseUrl), function(error, user) 
		{
			if (error) 
			{
				// an error occurred while attempting login
				console.log(error)

				// an error occurred while attempting login
				switch(error.code) 
				{
					case 'INVALID_EMAIL':
					case 'INVALID_PASSWORD':
					default:
				}

				// TODO
				/*

					AUTHENTICATION_DISABLED	 The specified authentication type is not enabled for this Firebase.
					EMAIL_TAKEN	The specified email address is already in use.
					INVALID_EMAIL	The specified email address is incorrect.
					INVALID_FIREBASE	Invalid Firebase specified.
					INVALID_ORIGIN	 Unauthorized request origin, please check application configuration.
					INVALID_PASSWORD	The specified password is incorrect.
					INVALID_USER	The specified user does not exist.
					UNKNOWN_ERROR	An unknown error occurred. Please contact support@firebase.com.
					USER_DENIED	User denied authentication request.

				*/

			} 
			else if (user) 
			{
				// user authenticated with Firebase
				// console.log(user)
				if (callback) callback(null, user)
			} 
			else 
			{
				// user is logged out
				if (callback) callback(null, null)
			}

			// TODO thirdPartyUserData
		})
	}

// Node.js

	function isNodeJS()
	{
		return (typeof module !== 'undefined' && typeof module.exports !== 'undefined')
	}

	if (isNodeJS()) 
	{
		module.exports.$ = 							require('jquery')
		module.exports._ = 							require('underscore')
		module.exports.S = 							require('string')
		module.exports.Firebase = 					require('firebase')

		module.exports.fetchTweetsFromTwitter = 	fetchTweetsFromTwitter
		module.exports._ensureTweet = 				_ensureTweet
		// module.exports.ensureUser = ensureUser
		module.exports.getTweetsByUser = 			getTweetsByUser
		module.exports.isNodeJS = 					isNodeJS
	}
/**/
