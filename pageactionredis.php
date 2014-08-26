<?php
/**
 * File Name : pageactionredis.php
 * Creation Date : 09-25-2013
 * Last Modified : Tue Mar  4 10:48:01 2014
 * Author: George
 * Description: Script to pull all PageAction keys stored in redis and display on admin page for easy debugging/viewing
 *
 *
 *
 */
define('DEBUG', 1);
require_once $_SERVER['BASE_HOME'].'/appContent/v2/redis.php';
//require_once $_SERVER['HOME'].'/we-care.com/Maintenance/PageActions/redis.php';
//require_once $_SERVER['HOME'].'/we-care.com/Modules/database.php';

/*
$redis = redis_connect(ACTIONS);
$aID = 2261;
$dom = 'cyberchimps.com';
print_r(getActionIDs($dom));
$filters = $redis->HGET($aID, 'filters');
$filters = json_decode($filters, true);

foreach($filters as $i=>$f)
{
	echo "filters: $filters i: $i f: $f\n";
	$fdata = $redis->HGETALL("$aID.$f");
	print_r($fdata);
	echo "\n";
}
*/

//if(isset($_POST['domain']) && !isset($_POST['action']))

function getActionIDs($domain, &$redis)
{
	$actionIDs = $redis->SMEMBERS($domain);
	//$actionIDs = array(2262, 2261, 334);

	return $actionIDs;
}

//if(isset($_POST['domain']) && isset($_POST['action']))
function getRedisData($domain, &$redis)
{
	$ret = array();
	$actionIDs = getActionIDs($domain, $redis);
	
	//$meta = $redis->HGET($_POST['action'], 'meta');

	foreach($actionIDs as $ID)
	{
		setRedisData($ID, $ret, $redis);
	}
	
	return json_encode($ret);
}

function setRedisData($actionID, &$dataArray, &$redis)
{
	$meta = getMeta($actionID, $redis);
	if($meta)
	{
		$dataArray[$actionID]['meta'] = $meta;

		if(isset($dataArray[$actionID]['meta']['post_action']))
		{
			$postID = $dataArray[$actionID]['meta']['post_action'];
			setRedisData($postID, $dataArray[$actionID]['post_action'], $redis);

		}
	}
	$filters = getFilters($actionID, $redis);
	if($filters)
	{
		$dataArray[$actionID]['filters'] = $filters;
	}
}


function getMeta($actionID, &$redis)
{
	return json_decode($redis->HGET($actionID, 'meta'), true);
}

function getFilters($actionID, &$redis)
{
	$filters = json_decode($redis->HGET($actionID, 'filters'), true);
	if(isset($filters))
	{
		$ret = array();
		foreach($filters as $i => $f)
		{
			$ret[$i] = $redis->HGETALL("$actionID.$f");
		}
		return $ret;
	}
	return FALSE;	
}


//Main Thread
if(isset($_POST['domain']))
{
	$redis = redis_hash_connect(ACTIONS);
	if (!$redis) {
		echo "no redis".PHP_EOL;
		exit;
	}
	
	$redisData = array();
	$redisData = getRedisData($_POST['domain'], $redis);
	$redis->close();	
	$printed = TRUE;
	echo $redisData;
}


if(is_null($printed))
{
	$Template->Append('ADDITIONAL_HEADERS', '<link href="/Templates/ADMINtable.css" rel="stylesheet" type="text/css"/>');
	$Template->Set('UPDATED', '');
	$Template->printTemplate('ADMINheader.html', TRUE);
	$Template->printTemplate('ADMINpageActionRedis.html', TRUE);
}
?>
