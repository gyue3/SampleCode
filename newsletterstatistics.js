/**
 * File Name : newsletterstatistics.js
 * Creation Date : 08-20-2014
 * Last Modified : Fri Sep 19 17:08:42 2014
 * Author: George
 * Description: Javascript for newsletterstatistics page.
 *
 *
 *
 */

$(document).ready(function(){
	//Load spinner for when ajax is running
	$(document).ajaxStart(function(){
		$('.spinner').show();
	});

	$(document).ajaxStop(function(){
		$('.spinner').hide();
	});


	$('#query').click(function(){

		if($('#date-start').val() == '')
		{
			$('#date-start').parent().addClass('has-error');
		}else if($('#date-start').parent().hasClass('has-error'))
		{
			$('#date-start').parent().removeClass('has-error');
		}
		
		if($('#date-end').val() == '')
		{
			$('#date-end').parent().addClass('has-error');
		}else if($('#date-end').parent().hasClass('has-error'))
		{
			$('#date-end').parent().removeClass('has-error');
		}

		if($('#date-start').val() != '' && $('#date-end').val() != '')
		{
			var opts = { };
			var emmID = $('#src option:selected').data('emm');
			var sendDate = $('#src option:selected').data('sendDate');
			
			$("#table_div").empty();
			$("#graph_div").empty();
			$("#emm_div").empty();

			opts[$("#date-start").attr('name')] = $("#date-start").val();
			opts[$("#date-end").attr('name')] = $("#date-end").val();
			opts["src"] = $("select option:selected").val();
			opts["table"] = "1";
			opts["mailingID"] = emmID;
			opts["sendDate"] = sendDate;

			//Get the data into an opts array and send a post to the php
			$.get('newsletterstatistics/ajax', opts, function(response){
				if(response['success'] == 1)
				{
					$("#table_div").empty().append(response['table']);
					graph(response['graph']); //Create and render highchart
				}else
				{
					$("#table_div").empty().append(response['error']);
				}

				if(response['emm_success'] == 0)
				{
					$("#emm_div").append(response['emm_error']);
				}else
				{
					//Create emm statistics ------------------------------------------------------------------------------
					var linkTable = '<table class="table"><tr><th>URL</th><th>Clicks Gross</th><th>Clicks Net</th></tr>';
					var linkSet = '';
					var clicks = '';
					var net = '';
					for(i = 0 ; i < response['emmStats']['links'].length ; i++)
					{
						linkSet = response['emmStats']['links'][i];	
						linkTable += '<tr><td>' + linkSet['url'] + '</td><td>' + linkSet['gross_clicks'] + '</td><td>' + linkSet['net_clicks'] + '</td></tr>';
					}
					linkTable += '</table>';

					var statTable = '<table class="table"><tr><th>Stat</th><th>Clicks Gross</th><th>Clicks Net</th></tr>';
					var statKey = '';
					for(var key in response['emmStats'])
					{
						if(key != 'links')
						{
							clicks = response['emmStats'][key];
							statKey = key.replace(/_/g, ' ');
							statTable += '<tr><td>' + statKey + '</td><td>' + clicks['gross_clicks'] + '</td><td>' + clicks['net_clicks'] + '</td></tr>';
						}
					}
					statTable += '</table>';
					$('#emm_div').append("<h3>EMM Statistics</h3>");
					$('#emm_div').append(linkTable);
					$('#emm_div').append(statTable);
					// -----------------------------------------------------------------------------------------------------
				}
			}, 'json');
		}

	});

	//Jquery-UI datepicker
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

	function graph(datum){
		$('#graph_div').empty(); //Clear any old graphs in the div

		//Create high chart object
		chart = new Highcharts.Chart({
			chart: {
				defaultSeriesType: 'spline',
				type: '',
				zoomType: 'xy',
				renderTo: 'graph_div'  //div high chart will be rendered to
			},
			title: {
				text: 'Newsletter Coupon Graph'
			},
			xAxis: {
				type: 'datetime',
				title: {
					text: 'date'
				}
			},
			yAxis: {
				type: '',
				title:{
					text: 'Count'
				},
				max: null,
				min: null
			},
			tooltip: {
				shared: true
			}
		});

		/*
        while(chart.series.length > 0){
            chart.series[0].remove();
        }
		*/
		
		//Add series of data to graph
        for(var index in datum) {
			console.log(index);
            var thisseries = {
                    name : index,
                    data : datum[index]
            };

            chart.addSeries(thisseries);
        }
	}
});












