/*
* Description  : The weather bug model for booster
*/

Booster.WeatherBug = Booster.LocalSync.extend({
	defaults: {
		INITIALIZED: false,
		city: '',
		conditionDesc: '',
		conditionIcon: '',
		state: '',
		temperature: '',
		temperatureHigh: '',
		temperatureLow: '',
		weatherBugLink: '',
		cache_zip: '',
		userLatLong: ''
	},

	insertTimer: 7200000,

	icons: {
		'clear' : 'wi-day-sunny',
		'sunny' : 'wi-day-sunny',
		'cloudy' : 'wi-cloudy',
		'partlycloudy' : 'wi-day-cloudy',
		'rain' : 'wi-rain',
		'thunderstorms' : 'wi-thunderstorm',
		'snow' : 'wi-snow',
		'flurries' : 'wi-snow',
		'fair' : 'wi-day-cloudy',
		'sleet' : 'wi-rain-mix',
		'freezingrain' : 'wi-rain-mix',
		'fog' : 'wi-day-fog',
		'windy' : 'wi-cloudy-windy',
		'showers' : 'wi-day-showers',
		'drizzle' : 'wi-day-sprinkle',
		'mostlycloudy' : 'wi-day-cloudy',
		'mostlyclear' : 'wi-day-sunny',
		'mostlysunny' : 'wi-day-sunny',
		'frozenmix' : 'wi-rain-mix'
	},

	initialize: function () {
		'use strict';
		var self = this;
		_.bindAll(this);
		this.addCustomBindings();
		//this.initValues();	
		$(window).on('onFetchNewWeather', self.onFetchNewWeather);
		window.onFetchNewWeather = Booster.HandleCallback;
		
		//window.SliderObj.clearTimeout('WeatherBugFetch'); //Fixes Desktop RBAR issue on reload
		
		if(Booster.Models.localStorage.get('lastWeatherFetch'))
		{
			var timer;
			timer = new Date().getTime() - Booster.Models.localStorage.get('lastWeatherFetch');
			if(timer > self.insertTimer || timer < 0)
			{
				window.SliderObj.setTimeout('WeatherBugFetch', 1000, 'onFetchNewWeather', 'RBAR', '');
			}else
			{	
				// set for remaining time.
				window.SliderObj.setTimeout('WeatherBugFetch', (self.insertTimer - timer), 'onFetchNewWeather', 'RBAR', '');
			}
		}else
		{
			self.initValues(true);
			//Want an initial weathercard when cache cleared
			window.SliderObj.setTimeout('WeatherBugFetch', 2000, 'onFetchNewWeather', 'RBAR', '');
		}
	},

	onFetchNewWeather: function () {
		'use strict';	
		var self = this;
		window.SliderObj.clearTimeout('WeatherBugFetch');
		if(self.get('cache_zip') == '')
		{
			self.initValues(false);
			window.SliderObj.setTimeout('WeatherBugFetch', self.insertTimer, 'onFetchNewWeather', 'RBAR', ''); 
		}else
		{
			window.SliderObj.setTimeout('WeatherBugFetch', self.insertTimer, 'onFetchNewWeather', 'RBAR', ''); 
			this.fetchWeather();
		}
	},

	initValues: function (firstRun) {
		'use strict';
		this.set('prettyCityState', this.formatCityState());
		if (this.get('cache_zip') === '') {
			this.fetchLocation(!firstRun);
			/*
			} else if(this.get('temperature') === '') {
			this.fetchWeather();
			*/
		}
	},


	getWeatherCard: function () {
		'use strict';
		var card = new Booster.Card({id:""+new Date().getTime(), timestamp:new Date().getTime(), type:"weather", weather:this.toJSON()});
		return card;
	},

	addCustomBindings: function () {
		'use strict';
		var self = this;
		// Register Global callback ( for IE mostly).
		window.OnWeatherBugResponse = Booster.HandleCallback;
		$(window).on('OnWeatherBugResponse', self.onWeatherMessage);
	},
	formatCityState: function () {
		'use strict';
		return this.get('city') + ', ' + this.get('state');
	},

	fetchLocation: function (doFetchWeather) {
		'use strict';
		var self = this;
		$.get('/appContent/API/GetZipcode.php', function (data) {
			var zipObj = JSON.parse(data);
			if (zipObj.zipcode.toString() !== '') {
				self.set('cache_zip', zipObj.zipcode.toString());
				self.set('city', zipObj.city.toString());
				self.set('state', zipObj.state.toString());
				Booster.Models.localStorage.set('weatherbug_flock', 0);
				Booster.Models.localStorage.set('lastWeatherFetch', new Date().getTime());
			} else {
				// long cant be written as a property because its reserved.
				self.set('userLatLong', zipObj.lat.toString() + ':' + zipObj['long'].toString());
				Booster.Models.localStorage.set('weatherbug_flock', 0);
				Booster.Models.localStorage.set('lastWeatherFetch', new Date().getTime());
				if (doFetchWeather) {
					self.fetchWeather();
				}
			}
		});
	},

	fetchWeather: function () {
		'use strict';
		if (Booster.Models.localStorage.get('weatherbug_flock') === '1') {
			return;
		}
		Booster.Models.localStorage.set('weatherbug_flock', 1);
		gLog("FETCHING WEATHER");
		var weatherUrl = "http://a5777837707.api.wxbug.net/getLiveWeatherRSS.aspx?ACode=A5777837707&OutputType=1";
		weatherUrl = weatherUrl + "&zipCode=" + this.get("cache_zip");
		window.SliderObj.ajax(weatherUrl, 'GET', '', false,  '', "OnWeatherBugResponse", '');
	},

	onWeatherMessage: function(event) {
		'use strict';
		var self = this;
		try {
			var payload = event.value.data;
			var xmlString = payload.dataText;
			var xmlDoc, xml, weatherLink, locationURL,
			patt, locArr, city, state,
			condition, temp, tempHigh, tempLow, tempUnit, imageName, imgUrl,
			httpsImage, currentCallTime, weather_json;
			xmlDoc = $.parseXML(xmlString);
			xml = $(xmlDoc);
			weatherLink = $(xml).find("aws\\:WebURL, WebURL");
			locationURL = $(xml).find("aws\\:InputLocationURL, InputLocationURL").text();
			patt = new RegExp(".*\/\/.*\/(.*)\/(.*)-");
			locArr = patt.exec(locationURL);
			if (locArr && locArr.length > 1) {
				city = locArr[2];
				state = locArr[1];
			}

			condition = $(xml).find("aws\\:current-condition, current-condition");
			temp = parseInt($(xml).find("aws\\:temp, temp").text(), 10);
			tempHigh = parseInt($(xml).find("aws\\:temp-high, temp-high").text(), 10);
			tempLow = parseInt($(xml).find("aws\\:temp-low, temp-low").text(), 10);
			tempUnit = $(xml).find("aws\\:temp, temp").attr('units'); // this is where all the reading and writing will happen
			imageName = condition.attr('icon').split("\/");
			httpsImage = "http://img.weather.weatherbug.com/forecast/icons/localized/40x34/en/trans/" + imageName[imageName.length - 1];
			httpsImage = httpsImage.replace("gif", "png");
			imgUrl = "/appContent/API/pimage.php?i=" + encodeURIComponent(httpsImage); 
			currentCallTime = new Date().getTime();


			weather_json = {};
			//weather_json.city = city;
			weather_json.city = self.get('city');
			//weather_json.state = state;
			weather_json.state = self.get('state');
			weather_json.temperature = temp + tempUnit;
			weather_json.temperatureHigh = tempHigh + tempUnit;
			weather_json.temperatureLow = tempLow + tempUnit;
			//weather_json.weatherBugLink = locationURL;
			weather_json.weatherBugLink = "http://weather.weatherbug.com/?zip="+self.get('cache_zip');
			weather_json.conditionIcon = 'wi-horizon-alt';
			var cond = condition.text().toLowerCase();
			cond = cond.replace(" ", "").replace("chanceof", "").replace("chance", "").replace("freezing ", "").replace("light ", "");
			if(cond in self.icons)
			{
				weather_json.conditionIcon = self.icons[cond];
			}
			weather_json.conditionDesc = condition.text();
			_(weather_json).each(function (val, key) {
				Booster.Models.localStorage.set(key, val);
				self.set(key, val);
			});
			Booster.Models.localStorage.set('cache_zip', self.get('cache_zip'));
			Booster.Models.localStorage.set('weatherbug_flock', 0);
			Booster.eventController.trigger("push_feed_card", this.getWeatherCard(), 'weather');
		} catch (e) {
			//ignore
			//
		}
	} 
});
