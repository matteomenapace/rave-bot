#Hello human!

What's this in a nutshell?


##Features
* Configurable Twitter-scraper: filter by #hashtag and/or @username
* Archive tweets w/ pictures, links, mentions, hashtags & geodata to a [Firebase](https://www.firebase.com/) database (but it could be any db that accepts JSON)
* Twitter-bot to reply/poke players (be careful though, Twitter may suspend your account if you abuse this feature)
* Real-time leaderboard


##Requirements

* [Node.js](http://nodejs.org/download/) installed on the machine where you're going to run the bot
* [Noodle.js](http://noodlejs.com/#download) installed and running on the same machine (Noodle is used to scrape Twitter, bypassing the restrictions of the Twitter API)
* A [Firebase app](https://www.firebase.com/account/) ready to accept data
* To have a bot sending out tweets, you'll need an *app* from https://apps.twitter.com/ which provides the authentication keys required (we have one already set up https://apps.twitter.com/app/6575811/)


##Installation

1. To start, make sure you have **Node.js** installed ([download it here](http://nodejs.org/download/)), 
2. Install **npm** ([follow these instructions](http://blog.nodejitsu.com/npm-cheatsheet/#Installing_npm)).
3. Open Terminal (or the equivalent command-line tool for Windows) and navigate to this project's folder
5. `git clone https://github.com/dharmafly/noodle.git`
6. `cd noodle`
7. `npm install` (You may have to use `sudo npm install` if you get errors)
8. `bin/noodle-server` to start the Noodle server
3. Open a new Terminal window (or the equivalent command-line tool for Windows) and navigate to this project's folder
4. `npm install` to install the necessary node_modules ([learn more about Node.js modules](http://nodejs.org/docs/v0.4.1/api/modules.html))
5. `node server` to start the Twitter-scraper






##Setting up the Twitter bot

1. Open `/js/libraries/twitter.auth.js`
2. Make sure that the API key, API secret, Access token and Access token secret are set correctly (copy the values from https://apps.twitter.com/app/6575811/keys) in *exports.auth*
2. If necessary change the value of the *text* string in *exports.testTweet* so that it contains a @twitterName that you can check (change @TableOneTrail to your username for example), remember to save your edits
3. Open Terminal (or the equivalent command-line tool for Windows) and navigate to this project's folder
4. `npm install` to install the necessary node_modules ([learn more about Node.js modules](http://nodejs.org/docs/v0.4.1/api/modules.html))
5. `node tweet` to test the Twitter bot

###Troubleshooting

1. The bot doesn't have permissions to write on behalf of @RaveBaseCamp, so you get this error

        { [Error: HTTP Error 401: Unauthorized, API message: {"request":"\/1.1\/statuses\/update.json","error":"Read-only application cannot POST."}] data: '{"request":"\\/1.1\\/statuses\\/update.json","error":"Read-only application cannot POST."}', statusCode: 401 } 
   
   Go to https://apps.twitter.com/app/6575811/keys and make sure that `Access level` is set to 	`Read, write, and direct messages` for both *Application settings* and *Your access token*
   
2. The bot can't post the same text of a previous tweet, so you get this error

        { [Error: HTTP Error 403: Forbidden, API message: {"errors":[{"code":187,"message":"Status is a duplicate."}]}]  data: '{"errors":[{"code":187,"message":"Status is a duplicate."}]}', statusCode: 403 }
        
   Open `/js/libraries/twitter.auth.js` and change the value of the *text* string in *exports.testTweet*
   
   
   
##To sort out

Make sure App.config.replyToNewTweets = true in `/js/libraries/config.js`   

