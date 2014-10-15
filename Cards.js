/**
* Description: The Cards collection (feed) for the Cards model.
*/
Booster.Cards = Backbone.Collection.extend({
	model: Booster.Card,
	url: '/appContent/v2/API/fetch.php',
	feeds: '',
	lastFetchTime: 0,
	initialize : function () {	
		'use strict';
		_.bindAll(this);
		this.lastFetchTime = Booster.Models.localStorage.get('tw_lastFetch');
		this.addCustomBindings();
	},

	addCustomBindings: function () {
		'use strict';
		var self = this;
		this.listenTo(Booster.Models.localStorage, 'change:tweet_list', self.updateCards);
		Booster.eventController.on("push_feed_card", self.pushCard);
		Booster.eventController.on("remove_duplicate_weather", self.removeDuplicateWeather);
	},

	updateCards: function () {
		'use strict';
		//this.reset(JSON.parse(Booster.Models.localStorage.get('tweet_list')));
		this.trigger('updateCardsView');
	},

	setFeed: function (feed) {
		'use strict';
		var init = false;
		if (this.feeds == '') {
			init = true;
		}

		if (this.feeds != feed ) {
			this.feeds = feed;
			if (!init) {
				this.lastFetchTime =0;
				this.trigger('fetchCards', 0);
			}
		}
	},

	pushCard: function (cardModel, removeDuplicateType) {
		'use strict';
		if(typeof removeDuplicateType !== 'undefined')
		{
			var i = 0;
			while(i < this.length) //catch all cards up to last card
			{
				if(this.at(i).get('type') == removeDuplicateType)
				{
					this.remove(this.at(i));
				}
				i++;
			}
		}
		this.trigger('updateCardsView', 1);
		this.add(cardModel);
		
		this.removeOldCards();
		Booster.Models.localStorage.set('tweet_list', JSON.stringify(this.toJSON()));
		
	},
	//timer for threshold in hours* if not specified default to 24 hours
	removeOldCards: function(timer) { 
		var self = this;
		var lastElement;
		var continueFlag = true;  //If we find a card thats less than the time threshold we are done
		var timeStamp, elapsedTime;
		var timeThreshold = 1000 * 60 * 60 * 24; //remove cards after 24 hours making 

		if(timer)
		{
			timeThreshold = 1000 * 60 * 60 * timer;	
		}

		while(self.length > 5 && continueFlag == true)
		{
			lastElement = self.at(self.length-1);
			timeStamp = new Date().getTime();

			elapsedTime = timeStamp - lastElement.get('timestamp');
			if(elapsedTime > timeThreshold)
			{
				self.remove(lastElement);
			}else
			{
				continueFlag = false;
			}
		}
		Booster.Models.localStorage.set('tweet_list', JSON.stringify(this.toJSON()));	

	},
	
	removeDuplicateWeather: function(type) {

		var i = 0;
		var firstWeather = 0;
		alert('rmove weather');
		while(i < this.length)
		{
			if(this.at(i).get('type') == type && firstWeather == 0)
			{
				firstWeather = 1;
			}
			else if (this.at(i).get('type') == 'weather')
			{
				this.remove(this.at(i));
			}
			i++;
		}
	},

	fetchFromServer: function(lastServerTweetId, handles) {
		'use strict';
		var self = this;
		var fdata = {
			feeds: this.feeds,
			last: this.lastFetchTime
		};
		this.fetch({
			data: fdata,
			success: function (collection, response) { // options can be a third argument.
				self.lastFetchTime = new Date().getTime();
				self.removeOldCards();
				self.trigger("updateCardsView");
				Booster.Models.localStorage.set('tw_lastFetch', self.lastFetchTime);
				Booster.Models.localStorage.set('tweet_list', JSON.stringify(collection.toJSON()));
				gLog("success fetching from server!");

			},
			error: function (model, xhr, options) {
				gLog("ERROR", xhr);
				gLog("error fetching from server!");
				gLog(self);
			},
			remove: false
		});
		this.lastFetchTime = new Date().getTime();
		Booster.Models.localStorage.set('tw_lastFetch', self.lastFetchTime);
		self.trigger("fetchTweets"); // sets next timer
	},
	comparator: function (tweet){
		'use strict';
		return -1*tweet.get('timestamp');
	}
});
