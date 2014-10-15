window.WCR = {


	populateMarker: function() {
	
		WCR.preloadImages(); 
		console.log(document.getElementById('wcr_serpId'));
		var dataString = document.getElementById('wcr_serpId').getAttribute('data-key');
		var storeNames = document.getElementById('wcr_serpId').getAttribute('data-storeName').split("|");
		console.log("WCR: " + dataString);	
		console.log("WCR: " + storeNames);
		var listWrapper = document.getElementById('rso');
		var animation = 0;

		//add checker to track if this page has been scraped by PageActions
		var checker = document.createElement('div');
		checker.id = "WCR_Checker";
		listWrapper.insertBefore(checker, listWrapper.firstChild);

		for(var i = 0; i < dataString.length; i++)
		{
			if(dataString[i] == 1)
			{
				var li = listWrapper.getElementsByClassName('g').item(i);
				var h3 = li.getElementsByTagName('h3')

				console.log(h3);
				//listWrapper.getElementsByClassName('rc').item(i).insertBefore(htmlObject, listWrapper.getElementsByTagName('h3').item(i));
				for(var j = 0; j < h3.length; j++)
				{
					h3[j].firstChild.style.verticalAlign = "middle";
					h3[j].insertBefore(WCR.createWrapper(), h3[j].firstChild);
					if(h3[j].getElementsByClassName('serp_wrapper').length <= 1) //Check if icon is already there
					{
						h3[j].getElementsByTagName('div')[0].insertBefore(WCR.createIconObject(), null);
					
						if(j == 0)
						{
							h3[j].getElementsByTagName('div')[0].insertBefore(WCR.createHoverBanner(i, storeNames[i]), null);
							console.log(h3[j].getElementsByTagName('div')[0].getElementsByTagName('div')[0]);
							//WCR.setBackgroundDim(h3[j].getElementsByTagName('div')[0].getElementsByTagName('div')[0]);
							WCR.addHoverListeners(i, h3[j].getElementsByTagName('div')[0].getElementsByTagName('img')[0]);
						}
						
						if(animation == 0)
						{
							h3[0].insertBefore(WCR.createAnimationObject(), h3[j].firstChild);
							WCR.addHoverListeners(i, h3[0].getElementsByTagName('img')[0]);
							animation = 1;
						}
					}
				}
			}
		}
	},

	setIconObject: function() {
		
		var subdom = document.getElementById('wcr_serpId').getAttribute('data-subdom');
				
		WCR.imageIcon = "http://cdn.we-care.com/Content/images/serpIcons/" + subdom + "_serp_icon.png";

		var imgTester = new Image();
	
		imgTester.onerror = function(){
			WCR.imageIcon = "http://cdn.we-care.com/Content/images/serpIcons/default.gif";
			imgTester.src = WCR.imageIcon;
			console.log("Set: " + WCR.imageIcon);
		}	
		
		imgTester.onload = function(){
			WCR.populateMarker();
		}

		imgTester.src = WCR.imageIcon;
	},
	
	createIconObject: function() {
		
		var imgObject = new Image();
		var subdom = document.getElementById('wcr_serpId').getAttribute('data-subdom');
		
		imgObject.id = "WCR_Image";
		
		imgObject.src = WCR.imageIcon;
		return imgObject;

	},

	addHoverListeners: function(index, node) {
		
		node.addEventListener('mouseover', function(){
			
			if(document.getElementById('WCR_Banner'+ index))
			{
				document.getElementById('WCR_Banner' + index).style.opacity = 1;
			}

		});
		node.addEventListener('mouseout', function(){
				
			if(document.getElementById('WCR_Banner'+ index))
			{
				document.getElementById('WCR_Banner' + index).style.opacity = 0;
			}

		});
	},						   

	createWrapper: function() {
		
		var wrapper = document.createElement('div');
		wrapper.className = 'serp_wrapper';
		wrapper.style.display = 'inline';
		return wrapper;

	},
	
	createAnimationObject: function() {
		
		var animationObject = new Image();
		var url = "http://cdn.we-care.com/Content/images/serpIcons/dog.gif";
		animationObject.src = url;
		animationObject.style.position = 'absolute';
		animationObject.style.right = '50px';	
		animationObject.id = "WCR_Animation";
		
		setTimeout(function(){
					
			var url = "http://cdn.we-care.com/Content/images/serpIcons/dog_wag.gif";
			animationObject.style.right = '';
			animationObject.style.left = '-42px';
			animationObject.style.width = '41px';	
			animationObject.src = '';
			animationObject.src = url;
				
		}, 3000);
		return animationObject;
	},

	preloadImages: function() {

		var subdom = document.getElementById('wcr_serpId').getAttribute('data-subdom');
		var imageList = [
			"http://cdn.we-care.com/Content/Causes/" + subdom + "/logo_sm.gif", 
			"http://cdn.we-care.com/Content/images/logo_sm_v.bmp",
			"http://cdn.we-care.com/Content/images/serpIcons/dog_wag.gif",
			"http://cdn.we-care.com/Content/images/serpIcons/dog.gif",
			"http://cdn.we-care.com/Content/images/serpIcons/" + subdom + "_serp_icon.png",
			"http://cdn.we-care.com/Content/images/serpIcons/default.gif"
		];

		for(var i = 0; i < imageList.length; i++)
		{
			var imageObject = new Image();
			imageObject.src = imageList[i];
		}
	},

	createHoverBanner: function(index, storeName) {
	
		var subdom = document.getElementById('wcr_serpId').getAttribute('data-subdom');
		var cause = document.getElementById('wcr_serpId').getAttribute('data-cause');
		var banner = document.createElement('div');

		var serpLogo = "http://cdn.we-care.com/Content/Causes/" + subdom + "/logo_sm.gif";
		var defaultLogo = "http://cdn.we-care.com/Content/images/logo_sm_v.bmp";
		
		var styleString = '-webkit-transition: opacity 0.3s; -moz-transition: opacity 0.3s; -o-transition: opacity 0.3s; transition: opacity 0.3s;';
		banner.setAttribute('style', styleString);

		banner.style.color = 'black';
		banner.style.position = 'absolute';
		banner.style.backgroundColor = '#D3D3D3'; //lightgray
		banner.id = "WCR_Banner" + index;
		banner.style.display = 'block';
		banner.style.opacity = 0;

		//banner.style.width = '300px';
		banner.style.padding = '4px';
		banner.style.zIndex = 1000;

		var bannerSpan = document.createElement('span');
		var bannerImg = new Image();
		var bannerP = document.createElement('p');
		
		bannerImg.onerror = function(){
			this.src = defaultLogo;
		}
		
		bannerImg.onload = function(){
			var totalHeight = this.clientHeight;
			this.parentNode.style.top = -1*totalHeight - 15 + "px"; 

		}

		bannerImg.src = serpLogo;
		
		bannerP.style.verticalAlign = 'middle';
		bannerP.style.margin = '3px';
		bannerP.style.fontSize = '8pt';
		bannerP.style.textAlign = 'center';
		bannerP.style.paddingTop = '6px';
		bannerP.style.display = 'inline';

		bannerImg.style.verticalAlign = 'middle';
		bannerImg.style.position = 'relative';

		bannerSpan.style.whiteSpace = 'nowrap';
		bannerSpan.style.color = 'black';
		
		if(typeof(bannerSpan.innerText) != 'undefined')
		{
			bannerSpan.innerText = 'Support ' + cause + ' by shopping at ' + storeName + '.';
		}else if(typeof(bannerSpan.textContent) != 'undefined')
		{
			bannerSpan.textContent = 'Support ' + cause + ' by shopping at ' + storeName + '.';
		}

		bannerP.insertBefore(bannerSpan, null);
		banner.insertBefore(bannerP, null);
		banner.insertBefore(bannerImg, bannerP);

		return banner;
	}
};

window.WCR.setIconObject();
