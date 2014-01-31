# A script for reading in healthmap data into a mongo database.
# The script assumes a config.json file sits alongside the
# script with the healthmap_api_key set.

import json
import datetime
import urllib2
import pymongo
import dateutil.parser

collection = pymongo.Connection()["grits"]["healthmap"]
collection.drop()

config = json.load(open("config.json"))

url = "http://healthmap.org/HMapi.php?auth=" + config["healthmap_api_key"] + "&striphtml=1"

def daterange(start_date, end_date):
    for n in range(int ((end_date - start_date).days)):
        yield start_date + datetime.timedelta(n)

start_date = datetime.date(2012, 01, 01)
end_date = datetime.date.today()

for single_date in daterange(start_date, end_date):
    day = single_date.strftime("%Y-%m-%d")
    print day
    date_url = url + "&sdate=" + day + "&edate=" + day
    records = json.loads(urllib2.urlopen(date_url).read())
    alerts = []
    for r in records:
        for alert in r["alerts"]:
            alert["date"] = dateutil.parser.parse(alert["date"])
            alert["place_name"] = r["place_name"]
            alert["country"] = r["country"]
            alert["lat"] = float(r["lat"])
            alert["lng"] = float(r["lng"])
            alerts.append(alert)
    if len(alerts):
        collection.insert(alerts)
