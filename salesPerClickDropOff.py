import pymongo
import datetime
import MySQLdb
import sys
from optparse import OptionParser
import time
from bson.son import SON
from pymongo import MongoClient

#arguments 1: windowsize 2: pctThreshold 3:flatThreshold 4:cutoffDate
#sample: salesPerClickDropOff 3 .5 .2 '05-01-2013'

#object for holding merchant information
class Data(object):
	week = None;
	merchant = None;
	comm = None;
	year = None;
	clicks = None;
	date = None;
	wrapWeek = None;
	network = None;

def createData(row):
	entry = Data();
	entry.merchant = row[0];
	entry.year = row[1];
	entry.week = row[2];
	entry.wrapWeek = row[3];
	entry.comm = row[4];
	entry.clicks = row[5];
	entry.network = row[6];
	return entry;

def connectToMySQL (db):
	if (db is None):
		db = wc_db;
	db = MySQLdb.connect('[server]', '[user]', '[password]', db);
	return db;

# ------ function end -------

#Create array with merchant info from sql
def createPreviousCommHash(date):
	sqldb = connectToMySQL('wc_db');
	cur = sqldb.cursor();
	data = [];
	merchant = '';

	sql_query = ("SELECT merch, yearval, weekval, (yearval*100+weekval) as weekyear, comm_total, net FROM ("
	"SELECT week(txn_date) weekval, year(txn_date) yearval, sum(comm_amount) comm_total, store_to_comms.store_id merch, store_to_comms.network net "
	"FROM comm_closed INNER "
	"JOIN store_to_comms ON comm_closed.advertiser_id = store_to_comms.advertiser_id WHERE txn_date > '{0}' GROUP BY comm_closed.advertiser_id, "
	"yearval, weekval "
	"UNION ALL "
	"SELECT week(txn_date) weekval, year(txn_date) yearval, sum(comm_amount) comm_total, store_to_comms.store_id merch, store_to_comms.network net "
	"FROM comm_open INNER JOIN "
	"store_to_comms ON comm_open.advertiser_id = store_to_comms.advertiser_id WHERE txn_date > '{0}' GROUP BY comm_open.advertiser_id, yearval, "
	"weekval "
	") tmp "
	"GROUP BY merch, weekyear").format(date);

	cur.execute(sql_query);

	for row in cur.fetchall():
		if(merchant == ''): #get first values
			merchant = row[0];
			year = row[1];
			
		if(merchant == row[0]):
			data.append(createData(row));
			yearDiff = row[1] - year;
			data[-1].wrapWeek = yearDiff*53 + row[2]; #Add 52 weeks for each year pass the first
		else:
			merchant = row[0];
			year = row[1];
			data.append(createData(row));
			data[-1].wrapWeek = row[2];

	cur.close();
	sqldb.close();
	return data;

def getNetworks():
	sqldb = connectToMySQL('wc_db');
	cur = sqldb.cursor();
	networks = {};
	sql_query = "SELECT store_id, network FROM store_to_comms";
	cur.execute(sql_query);
	
	for row in cur.fetchall():
		networks[row[0].lower()] = (row[1], row[0]);
	
	return networks;

# ------ function end -------

#Create array from mongo with click information
def createClickHash(date):

	client = MongoClient('dove', 12012);
	client.db_click.authenticate('[user]', '[token]');
	db = client.db_click;
	colClickRates = db.clickrates;

	clicks = {};
	(year, month, day) = date.split('-');
	cutOffDate = datetime.datetime(int(year), int(month), int(day))

	#mongo aggregate and sort by combined values, double sorting is buggy
	query = [ 	{"$match": {"$and":[{"date": {"$gte":cutOffDate}}, {"comm_amount": {"$gte":0}}]}},
			{"$project": {'storeId': {"$toLower":"$storeId"}, "date":1, "clicks":1, "comm_amount":1, "weekyear":{"$add":[{'$week':'$date'}, {"$multiply": [{"$year":"$date"}, 100]}]}}},
			{"$group": { "_id" : {"storeId":"$storeId", 'weekyear': '$weekyear'}, "date":{"$first":"$date"}, "clickSum": {"$sum": "$clicks"}, "commSum":{"$sum":"$comm_amount"}}},
				{"$sort": {"_id.storeId":1, "_id.weekyear":1}}
			];


	result = colClickRates.aggregate(query);

	documents = result['result'];
	return documents;


# ------ function end -------


def calculateCommPerClicks(data):

	#return float(data.comm);
	if data.clicks:
		return float(data.comm)/float(data.clicks);
	else:
		return 0;


# ------ function end -------
# time in mm/dd/yyyy format
def timeDelta(date, delta):

	if(date is None or date == "None"):
		return "None";

	u = datetime.datetime.strptime(date, "%m/%d/%Y");
	d = datetime.timedelta(days=21);
	doubleDelta = 2 * delta;
	dd = datetime.timedelta(days=42);
	
	udd = u-dd;
	uddStr = udd.strftime("%m/%d/%Y");
	ud = u-d;
	udStr = ud.strftime("%m/%d/%Y");

	return [uddStr, udStr, udd, ud];

# ------ function end -------

# time in mm/dd/yyyy format
def incrementDate(date, delta):

	if(date is None or date == "None"):
		return "None";

	u = datetime.datetime.strptime(date, "%m/%d/%Y");
	d = datetime.timedelta(days=7);
	ud = u+d;
	dStr = ud.strftime("%m/%d/%Y");
	return dStr;

# ------ function end -------

def weekYearToDate(year, week):
	ret = datetime.datetime.strptime('%04d-%02d-1' % (year, week), '%Y-%W-%w');
	if(datetime.date(year, 1, 4).isoweekday() > 4):
		ret -= datetime.timedelta(days=7);
		
	return ret.strftime("%m/%d/%Y");

# ------ function end -------

def calculateStdDev(data):
	Xavg = float(sum(data))/float(len(data));
	sigma = 0;
	for each in data:
		sigma += (each - Xavg)**2;
	
	sigma = float(sigma)/len(data);
	stdDev = sigma**.5;
	return stdDev;

# ------ function end -------

def calculateZValue(u, dataArray):
	xAvg = float(sum(dataArray))/float(len(dataArray));
	sigma = calculateStdDev(dataArray);
	if(sigma != 0):
		zVal = float(u - xAvg)/float(sigma);
	else:
		print "DIVIDE BY ZERO";
		zVal = 99999;
	
	return zVal;

# ------ function end -------

def insertRecord(batchId, merchant, network, preDropAvg, postDropVal, flatDropoff, dropDate, riseDate, cutOffDate, cursor):

	preDropAvg = float('%.5f'%preDropAvg);
	postDropVal = float('%.5f'%postDropVal);
	flatDropoff = float('%.5f'%flatDropoff);

	sql = ("INSERT INTO comm_click_dropoff (batch_id, merchant, network, before_comm_click, after_comm_click, flat_dropoff, window_start, window_end, batch_start) "
	"VALUES ({0}, '{1}', '{2}', {3}, {4}, {5}, '{6}', '{7}', '{8}')").format(batchId, merchant, network, preDropAvg, postDropVal, flatDropoff, dropDate,  riseDate, cutOffDate);
	cursor.execute(sql);


#Writes drop offs of trending click/comm data from each merchant within the time frame to dropOff.csv.  The formula to highlight drops off is:
# 			prevAvg * pctThreshold - flatThreshold > newAvg 
#  prevAvg is average value of comm/click for the window specified
#  newAvg is the next windows worth of comm/click values for comparison to prevAvg
#  pctThreshold is % difference of the two windows for flagging drop offs
#  The flatThreshold is to limit the amount of low commission values that may coicidentally and legitly drop to 0 which would be falsely flagged
#  with only a percentage threshold.
def findDropOff(date, data, setMin, zVal, insert):

	i = 1;
	datalength = len(data);
	merchant = data[0].merchant;
	dataSet = [];
	dataSet.append(calculateCommPerClicks(data[0]));
	week = data[0].wrapWeek;
	year = data[0].year;
	dateTrack = data[0].date;
	batchId = 0;
	cutOffDate = datetime.datetime.strptime(date, "%Y-%m-%d");
	dropFlag = 0;
	entryCount = 0;
	zCritical = zVal;
	avgThreshold = .05;
	dateTrack = '';

	if data[i].network:
		network = data[i].network;
	else:
		network = '';

	merchantDropOffCount = 0;
	merchantDropOffFlag = 0;

	if(insert==1):
		sqldb = connectToMySQL('wc_db');
		cur = sqldb.cursor();
		sql = "SELECT MAX(batch_id) FROM comm_click_dropoff";
		cur.execute(sql);
		for row in cur.fetchall():
			if(row[0] is None):
				batchId = 1;
			else:
				batchId = row[0] + 1;

	#f = open('dropOff.csv', 'w');
	#f.write("Merchant, Network, Date,PrevAverage,NewAverage\n");
	while i < datalength:
		
		if merchant == data[i].merchant:

			if(len(dataSet) > setMin):
				stdDev = calculateStdDev(dataSet);
				if(data[i].wrapWeek - week > 1): #fill in 0s where a weeks info is missing
					#dataSet.append(0);
					if(week >= 53):
						dateTrack = weekYearToDate(year + 1, week - 53);
					else:
						dateTrack = weekYearToDate(year, week);
						
					dataPoint = 0;
					zVal = 0;
					i -= 1; #dont increment in this branch
				elif(data[i].clicks > 0):
					dateTrack = weekYearToDate(data[i].year, data[i].week);
					#dataSet.append(calculateCommPerClicks(data[i]));
					dataPoint = calculateCommPerClicks(data[i]);
				else:
					data[i].clicks = -1;

				avg = float(sum(dataSet))/float(len(dataSet));

				if(data[i].clicks != -1 and avg > avgThreshold):

					zVal = calculateZValue(dataPoint, dataSet);

					if(zVal < (-1*zCritical)):
						if(dropFlag == 0):
							dropFlag = 1;
							dropDate = dateTrack;
							preDropAvg = float(sum(dataSet))/float(len(dataSet));
							postDropVal = dataPoint;
							flatDropAmt = avg - dataPoint;

							if(merchantDropOffFlag == 0):
								merchantDropOffCount += 1;
								merchantDropOffFlag = 1;

					elif(dropFlag == 1):
						dropFlag = 0;
						dataSet.append(dataPoint);
						if(insert == 1):
							dateTrackObj = datetime.datetime.strptime(dateTrack, "%m/%d/%Y");
							dropDateObj = datetime.datetime.strptime(dropDate, "%m/%d/%Y");
							insertRecord(batchId, merchant, network, preDropAvg, postDropVal, flatDropAmt, dropDateObj, dateTrackObj, cutOffDate, cur); #Insert Record
							entryCount = entryCount + 1;
					else:
						dataSet.append(dataPoint);

			else: #Not enough data points in array yet (for calculating stdDev)
				if(data[i].wrapWeek - week > 1): #fill in 0s where a weeks info is missing
					dataSet.append(0);
					i -= 1; #dont increment in this branch
				else:
					dataSet.append(calculateCommPerClicks(data[i]));

			week += 1;
					
		else: #Reset variables for new merchants
			if(dropFlag == 1 and insert == 1): #If dropflag == 1, log current drop from the previous merchant
				dateTrackObj = datetime.datetime.strptime(dateTrack, "%m/%d/%Y");
				dropDateObj = datetime.datetime.strptime(dropDate, "%m/%d/%Y");
				insertRecord(batchId, merchant, network, preDropAvg, postDropVal, flatDropAmt, dropDateObj, dateTrackObj, cutOffDate, cur); #Insert Record
				entryCount = entryCount + 1;
			
			dropFlag = 0;
			merchant = data[i].merchant;

			if data[i].network:
				network = data[i].network;
			else:
				network = '';

			dataSet = [];
			if(data[i].clicks > 0):
				dataSet.append(calculateCommPerClicks(data[i]));

			week = data[i].wrapWeek;
			year = data[i].year;
			merchantDropOffFlag = 0;

		i += 1;

	print "Distinct Merchant Drop Off Count: {0}".format(merchantDropOffCount);
	#f.close();

	if(insert == 1):
		cur.close();
		sqldb.close();

	print "ENTRYCOUNT: {0}".format(entryCount);

# ------ function end ------
date = datetime.datetime.now();

newMonth = date.month - 8; #Make default range default 8 months from first of this month
newYear = date.year;
if (newMonth <= 0):
	newMonth = 12 + newMonth; #newMonth is negative here so we are essentially subracting leftover month from 12
	newYear = newYear - 1;

date = "{0}-{1}-01".format(newYear, newMonth);
print "Starting from {0}".format(date);

#default parameters
windowSize = 3;
insert = 0;
zValue = 2.0;


parser = OptionParser()
parser.add_option("-i", "--insert", dest="insert", action="store_true",
                  help="Insert values to DB")
parser.add_option("-d", "--date", dest="date", help="Start Date to query from in the following format (yyyy-mm-dd)");

parser.add_option("-z", "--zValue", dest="zValue", help="zValue for standard deviation calculations generally 1.0 - 2.0");

(options, args) = parser.parse_args()

if (options.insert is not None):
	insert = 1;
if (options.date is not None):
	date = options.date;
if(options.zValue is not None):
	zValue = float(options.zValue);

#sqlData = createPreviousCommHash(date);

#for row in sqlData:
#	print "{0} : {1} : {2} : {3}".format(row.merchant, row.year, row.week, row.wrapWeek);


mongo = createClickHash(date);
commClickArray = [];
netorks = [];
networks = getNetworks();
merchantTrack = '';

for row in mongo:
	#print "{0} : {1} : {2} : {3}".format(row['_id']['storeId'].encode('utf-8'), row['_id']['weekyear'], row['clickSum'], row['commSum']);
	merchant = row['_id']['storeId'].encode('utf-8').lower();
	network = '';
	if(merchant != ''):
		if(merchant in networks):
			weekyear = str(row['_id']['weekyear']);
			year = int(weekyear[:4]);
			week = int(weekyear[4:]);
			
			if(merchant != merchantTrack):
				year = int(weekyear[:4]);
				startYear = year;
		
			wrapWeek = (year - startYear) * 52 + week;

			network = networks[merchant][0];
			rowData = [];

			rowData.append(networks[merchant][1]); #Merchant name with uppercases
			rowData.append(year); #year
			rowData.append(week); #week
			rowData.append(wrapWeek);
			rowData.append(row['commSum']);
			rowData.append(row['clickSum']);
			rowData.append(network); #get the network for merchant from wc_db
			commClickArray.append(createData(rowData));
			notfirst = 1;

findDropOff(date, commClickArray, windowSize, zValue, insert);
