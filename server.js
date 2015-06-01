var request = require('request');
var async   = require('async');
var _       = require("underscore");
var host    = "http://graph.facebook.com/?id=";
var baseUrl = "http://www.oppetarkiv.se/nostalgi";

var yearWithShares = {}

var yearRange = _.range(1890, 2006);
//var yearRange = _.range(1981, 1985);
yearRange.unshift("");

var facebookUrls = yearRange.map(function(year){
  return host + baseUrl + "/" + year;
});

function putEntry(year, shares) {
  console.log(year + ": " + shares);
  yearWithShares[year] = shares;
}

var fetch = function(file,cb){
  request.get(file, function(err,response,body){
    if (err){
      cb(err);
    } else {
      cb(null, body); 
    }
  });
}

async.map(facebookUrls, fetch, function(err, results){
    if (err){
      console.err("Sorry, failed :(")
    } else {
      var sum = 0;
      results.map(function (entry, index) {
          var sharesRaw = JSON.parse(entry).shares;
          var shares = sharesRaw ? sharesRaw : 0;
          sum += shares;
          var year = yearRange[index];
          putEntry(year, shares);
      });
      console.log(yearWithShares);
      console.log(sum);
    }
});