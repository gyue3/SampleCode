/**
 * File Name : coupontweet.js
 * Creation Date : 06-27-2014
 * Last Modified : Thu Oct  2 12:45:59 2014
 * Author:
 * Description:
 *
 *
 *
 */

const CHAR_LIMIT = 140;
$(document).ready(function(){

	$('#dotd').on('shown.bs.modal', function(){
		$('#subdom_tag').html('{' + 'SUBDOM' + '}');

		var tweetCount = $('#tweet').val().length + 1;
		var adjust = 14;
		if( $('#tweet').val().search('{LINK}') == -1){
			adjust = 20; // we use 14 because (20 - 6 ) is 14, 6 is the length of '{LINK}'
		}
		
		$('#tweetCount').html(tweetCount + adjust);

		$('#date').datepicker({
			showOn:"both",
			dateFormat: $.datepicker.W3C,
			buttonImage: CDN_BASE_URL + "images/calendar.png",
			buttonImageOnly: true,
			hideIfNoPrevNext:true
		});
	});

    $('.modal-content').on('click', '#save', function(){
		var valid = true;
		$("#coupon_form").find(".wc_FormItem").each(function(i, element) {
			element.validate = WC.form.validate;
			if(!element.validate($("form")))
			{
				valid = false;
				$(element).parent().removeClass('has-success');
				$(element).parent().addClass('has-error');
			}else
			{
				$(element).parent().removeClass('has-error');
				$(element).parent().addClass('has-success');
			}
		});	
	
		if(valid)
		{
			var opts = $("#coupon_form").serializeArray();

			refreshEntries(opts);			
			$.post(location.href + '/save_tweet', opts, function(data){
				if(data['success'] == 1)
				{
					$('#responseDiv span').removeClass();
					$('#responseDiv span').addClass('text-green');
					$('#responseDiv span').html('Save Successful!');

					//refreshEntries(opts);
				}else
				{
					$('#responseDiv span').removeClass();
					$('#responseDiv span').addClass('text-red');
					$('#responseDiv span').html('Save Unsuccessful!  ' + data['error']);
				}
			}, 'json');

		}
    });

    $('.modal-content').on('click', '#preview', function(){
        var coupon_id = $('#coupon_id').val();
		
        $('#preview').html('Sending...');
        $.post(location.href + '/preview_tweet', {coup:coupon_id}, function(response){
            $('#preview').html('Preview');
            if(response['success'] == 0){
                alert("Error Sending Preview");
            }else
			{
				alert("Sent to " + response['user']);
			}
        });
    });

	$('.modal-content').on('keypress', '#tweet', function(e){
		var charCount = $(this).val().length + 1;
		//we add 20 to account for the bitly link
		var adjust = 14;
		if( $(this).val().search('{LINK}') == -1){
			adjust = 20; // we use 14 because (20 - 6 ) is 14, 6 is the length of '{LINK}'
		}
		if((charCount+adjust) > CHAR_LIMIT){
			e.preventDefault();
			return;
		}
		//get chars reminaing
		var remaining = CHAR_LIMIT - (charCount+adjust);
		$('#tweetRemainder').css('display', 'block');
		$('#tweetCount').html(charCount + adjust);
		$('#remainCount').html(remaining);
	});

});//end on ready

//Returns the tweet string for twitter urls
function encodeTwitter(link)
{
	var twitterEncode = encodeURIComponent(link);
	twitterEncode = twitterEncode.replace(/%20/g, '+');
	return twitterEncode;
}

function refreshEntries(data)
{
	var dataJSON = _.object(_.pluck(data, 'name'), _.pluck(data, 'value'));
	var coupon_id = dataJSON.coupon_id;
	var rows = $('#entries').find('[data-coupon_id="' + coupon_id + '"]').find('td');
	var key = '';
	for(i=0;i<rows.length;i++)
	{
		key = $(rows[i]).data('key');
		if(key && (key in dataJSON))
		{
			$(rows[i]).html(dataJSON[key]);
		}

	}
}




















