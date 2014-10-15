$(document).ready(function(){

	$(document).ajaxStart(function(){
		$('.spinner').show();
	});

	$(document).ajaxStop(function(){
		$('.spinner').hide();
	});

	$('#enabled').change(function() {
		if($('#enabled').is(':checked') && $('#disabled').is(':checked'))
		{
			$('#disabled').prop('checked', false);		
		}	
	});

	$('#disabled').change(function() {
		if($('#enabled').is(':checked') && $('#disabled').is(':checked'))
		{
			$('#enabled').prop('checked', false);		
		}	
	});

	$('#hasPlugin').change(function() {
		if($('#hasPlugin').is(':checked') && $('#noPlugin').is(':checked'))
		{
			$('#noPlugin').prop('checked', false);		
		}	
	});

	$('#noPlugin').change(function() {
		if($('#hasPlugin').is(':checked') && $('#noPlugin').is(':checked'))
		{
			$('#hasPlugin').prop('checked', false);		
		}	
	});


	if(window.location.search != '')
	{
		setStores();
		setForm();
	}

	$('#search').click(function(){

		var params = $('form#storesearch').serialize();
		$('#results').html('');
		$('#results').html('<tr id="headers"><th>Store ID</th><th>Store Name</th><th>Network</th><th>Advertiser ID</th><th>Modified Time</th><th>Create Time</th></tr>');


		window.history.pushState('', '', 'storesearch?' + params);
		setStores();

	});

	function setForm()
	{
		var qString = window.location.search.substr(1);
		var pair = qString.split('&');
		var set = null, key = '', val = '';
		
		for(i=0; i < pair.length; i++)
		{	
			set =  pair[i].split('=');
			key = set[0];
			val = set[1];
			if(key.substr(0, 7) == 'network')
			{
				key = 'network';
			}	

			if($('#'+key).length > 0)
			{
				if(key == 'network') //network[]
				{
					$('#network option[value="' + val + '"]').attr('selected', 'selected')
				}else if(key == 'keywords' && val != '')
				{
					$('#keywords').attr('value', val);
				}else if($('#' + key).attr('type') == 'checkbox')
				{
					$('#'+key).attr('checked', 'checked');
				}
			}
		}
	}

	function setStores()
	{
		var qString = window.location.search.substr(1);

		$.get(location.origin + location.pathname + '/query', qString, function(data){
			
			if(data['count'] > 0)
			{
				var count = data['count'];
				$('#rowCount').html('Showing ' + count + ' results');
				_.templateSettings.variable = 'rc';
				var template = _.template($('script.template').html());
				
				var templateData = {
					params: data['stores']
				};
				
				$('#results tbody').append(template(templateData));
			}else
			{
				$('#results tbody').append("<tr><td class='noResults' colspan='6'>No Results</td></tr>");
			}
		}, 'json');

	}
});





