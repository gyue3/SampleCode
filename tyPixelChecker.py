import pymongo
import datetime
import MySQLdb
import sys
import time
import csv
from bson.son import SON
from pymongo import MongoClient

def connectToMySQL (db):
	if (db is None):
		db = wc_db;
	db = MySQLdb.connect('[server]', '[user]', '[pass]', db);
	return db;

def getMongoHash(date):

	client = MongoClient('[server]', '[pass]');
	client.db_typixel.authenticate('[user]', '[token]');
	db = client.db_typixel;
	col_ty_pixels = db.typixels;

	(year, month, day) = date.split('-');
	mongoDate = datetime.datetime(int(year), int(month), int(day));

	query = [{'$match' : {'date' : {'$gte' : mongoDate}}}, {'$group': {'_id': {'storeId': '$storeId'}, 'count': {'$sum': 1}}}];

	result = col_ty_pixels.aggregate(query);
	documents = result['result'];
	return documents;

def getMerchantHash():
	sqldb = connectToMySQL('wc_db');
	cur = sqldb.cursor();
	merchants = {};

	#sql_query = 'SELECT cs.store_id sid, stc.advertiser_id adv_id FROM cm_stores cs JOIN store_to_comms stc ON cs.store_id = stc.store_id WHERE tyregex IS NOT NULL AND tyregex <> ""';

	sql_query = 'SELECT cs.store_id sid, stc.advertiser_id adv_id FROM cm_stores cs JOIN store_to_comms stc ON cs.store_id = stc.store_id';
	cur.execute(sql_query);

	for row in cur.fetchall():
		merchants[row[1]] = row[0];

	cur.close();
	sqldb.close();
	return merchants;

def getCommCounts(advertiser_ids, date):
	sqldb = connectToMySQL('[db]');
	cur = sqldb.cursor();
	advertisers = '';
	comms = {};

	if(type(advertiser_ids) is list):
		advertisers = ', '.join(advertiser_ids);
		sql_query = 'SELECT count(*), co.advertiser_id, stc.store_id FROM comm_open co JOIN store_to_comms stc ON co.advertiser_id = stc.advertiser_id WHERE co.advertiser_id IN ({0}) AND co.txn_date >= "{1}" GROUP BY co.advertiser_id'.format(advertisers, date);
		cur.execute(sql_query);
		for row in cur.fetchall():
			comms[row[2]] = row[0];

	cur.close();
	sqldb.close();
	return comms;

def writeToCSV(titles, rows):
	if(len(titles) == len(rows[0])):
		file = open('pixelFires.csv', 'w');
		titleRow = ', '.join(titles);
		file.write(titleRow + "\n");
		for row in rows:
			file.write(', '.join(str(e) for e in row) + "\n");

# ------------------------------------------------------------------------------ #
date = '2014-05-01';
mongo = getMongoHash(date);
mongoHash = {};
for row in mongo:
	merchant = row['_id']['storeId'];
	count = row['count'];
	mongoHash[merchant] = count;
	#print "{0} : {1}".format(merchant, count);

merchantHash = getMerchantHash(); #get merchants

advertiserList = [];
for row in merchantHash:
	advertiserList.append('"' + row + '"'); #get merchants into array

commHash = getCommCounts(advertiserList, date); #get comm counts
dataRows = [];

for key, value in commHash.items():
	count = 0;
	if(key in mongoHash):
		count = mongoHash[key];
		print "Store: {0} - Comm#: {1} - MongoPixel#: {2}".format(key, value, count);
		dataRows.append([key, value, count]);
	#else:
		#print "Store: {0} - Comm#: {1} - MongoPixel#: {2}".format(key, value, count);

	#dataRows.append([key, value, count]);

headers = ['Store', '# of Commissions', 'TYPixels'];

writeToCSV(headers, dataRows);











