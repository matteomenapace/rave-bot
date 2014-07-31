/* 
	App is a global variable 
	holding all the configuration (App.config) 
	and code utilities
*/

var App = {}

App.config = App.config || {}

App.config.firebaseUrl = 'https://vivid-fire-3575.firebaseio.com/'
App.config.firebaseSecret = 'lpXdLC2nfIuGZN4XpKpcd70kksTmWnpvRpaglMWl'
App.config.firebaseTweetsPath = 'ravedztest-tweets'
App.config.firebaseUsersPath = 'ravedztest-users'

App.config.hashtag = 'ravedztest' // you can try also 'nosleep' (high frequency)

App.config.noodleUrl = 'http://localhost:8888/' // 'http://example.noodlejs.com/'

App.config.displayTweetsInCronologicalOrder = false

App.config.fetchTweetsFromTwitterInterval = 1 * 60 * 1000 // milliseconds

App.config.replyToNewTweets = true

// TODO time zone

// Node.js

if (typeof module !== 'undefined' && typeof module.exports !== 'undefined') 
{
	module.exports = App.config
}
