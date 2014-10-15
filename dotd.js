/**
 * File Name : dotd.js
 * Creation Date : 06-25-2014
 * Last Modified : Tue Sep 30 17:46:50 2014
 * Author:
 * Description:
 *
 *
 *
 */

$(document).ready(function(){

	var currentDate = getDate(0);	
	var monthBefore = getDate(-1);
	$('#date-end').val(currentDate);
	$('#date-start').val(monthBefore);

	//Prime page with a month of Dotds
	setEntries(monthBefore, currentDate);	

	$('#send_dotd').click(function(){
		sendDeal();
		sendToBlog();

	});

	$('#entries').on('click', '.deleteTweet', function(){
		var delete_id = $(this).data('coupon_id');
		deleteTweet(delete_id);
	});

	$('#query').click(function(){

		var startDate = $('#date-start').val();
		var endDate = $('#date-end').val();
	
		setEntries(startDate, endDate);	

	});

	$('#date-start').datepicker({
		showOn:"both",
		dateFormat: $.datepicker.W3C,
		buttonImage: CDN_BASE_URL + "images/calendar.png",
		buttonImageOnly: true,
		hideIfNoPrevNext: true
	});

	$('#date-end').datepicker({
		showOn:"both",
		dateFormat: $.datepicker.W3C,
		buttonImage: CDN_BASE_URL + "images/calendar.png",
		buttonImageOnly: true,
		hideIfNoPrevNext: true
	});

	$('.edit').click(function(){
		var coupon_id = $(this).attr('href').split('/')[1];

		//var frame = document.createElement('IFRAME');
		//x.setAttribute('src', document.URL + '/' + coupon_id);
		//document.body.appendChild(x);
		//$.post('coupontweet.php', {coup_id:coupon_id}, function(data){
	});

	$(document.body).on('hidden.bs.modal', function () {
	    $('.modal').removeData('bs.modal');
	});
});

function getDate(monthDiff)
{
	var today = new Date();
	var dd = today.getDate();
	var mm = today.getMonth()+1 + monthDiff; //January is 0!
	var yyyy = today.getFullYear();

	if(dd<10) {
		dd='0'+dd
	} 

	if(mm<10) {
		mm='0'+mm
	} 

	today = yyyy+'-'+mm+'-'+dd;
	return today;
}

function setEntries(start, end)
{
	if(end >= start)
	{
		$.get(location.href, {query:1, start_date:start, end_date:end}, function(data){

			if(data['success'] == 1)
			{
				$('.entryRow').remove();
				templateEntries(data['data']);
				//$('#entries').append(data);
			}else
			{
				alert('Query Failed');
			}
		});
	}else
	{
		alert("Start Date > End Date -- Why are you trying to break me?");	
	}
}

function templateEntries(data)
{
	$('#entries tbody').html('');		
	_.templateSettings.variable = 'rc';
	var template = _.template($('script.template').html());

	var templateData = {
		params: data,
		cdn: CDN_BASE_URL
	}
		
	$('#entries tbody').append(template(templateData));
}

function deleteTweet(coupon_id)
{
	$.post(location.href + '/delete_tweet', {'coupon_id' : coupon_id}, function(response){
		if(response['success'] == 1)
		{
			alert(coupon_id + ' deleted!');
			$("#coupTweet" + coupon_id).remove();
		}else
		{
			alert('Deletion Failed!  Notify Tech');
		}
	}, 'json');
}

function sendToBlog() {
	if( confirm("Do you want to post to the blog?") ){
		$.post(location.href + '/dotd_to_blog', {}, function(d){
			if(d['success'])
			{
				$('#dotdOut').html('Sent to Blog!');
			}else
			{
				$('#dotdOut').html('Error Sending to Blog!');
			}	
		});
	}
}

function sendDeal(){
	if( confirm("Are you sure you want to send the Deal of The Day?") ){
		/*
		$('#stod').attr('disabled', 'disabled');
		$('#readOut').html("Sending...");
		$.post(location.href + '/send_dotd', {}, function(response){
			$('#readOut').html("Response: " + response['process']);

			if( response['process'] == 'Started!'){
				//start to poll every 5 seconds for status updates
				setTimeout( function(){ pollDealStatus(10000); }, 1000);
			}else{
				alert('DYLAN! Tell Bryan what this says:'+ response['error']);
			}
		}, 'json');
		*/
	}
}

function pollDealStatus(sleepTime){
	$.post(location.href + '/get_dotd_status', {}, function(stat){
		if(stat['out'] == 'DONE'){
			$('#readOut').html("Sent!");
		}else{
			if( $('#readOut').html() == stat['out'] ) {
				return;
			}
			$('#readOut').html(stat['out']);
			setTimeout( function(){ pollDealStatus(sleepTime);}, sleepTime);
		}

	});
}
