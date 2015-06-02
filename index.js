var express = require('express');
var request = require('request');
var async   = require('async');
var _       = require("underscore");
var exphbs = require('express-handlebars');
var NodeCache = require( "node-cache" );

var host    = "http://graph.facebook.com/?id=";
var baseUrl = "http://www.oppetarkiv.se/nostalgi";
var ttl = 3600;
var JSON_CACHE_KEY = "key-full-json";

var app = express();
var cache = new NodeCache({stdTTL: ttl});

app.engine('.hbs', exphbs());
app.set('view engine', '.hbs');

app.set('port', (process.env.PORT || 5000));
app.use(express.static(__dirname + '/public'));


app.get('/', function(request, response) {
  var renderTemplate = function(json) {
    response.render('index', { body: json });
  };

  var cached = cache.get(JSON_CACHE_KEY);
  if (cached == undefined ){
    doAsyncGet(renderTemplate);
  } else {
    console.log("Used cached json");
    renderTemplate(cached);
  }
});

app.get('/data', function(request, response) {
  var rederFunction = function(json) {
    response.contentType('application/json');
    response.send(JSON.stringify(json));
  };

  var cached = cache.get(JSON_CACHE_KEY);
  if (cached == undefined ){
    doAsyncGet(rederFunction);
  } else {
    console.log("Used cached json");
    rederFunction(cached);
  }
});

app.get('/resetcache', function(request, response) {
  cache.del(JSON_CACHE_KEY,  function( err, count ){
    if( !err ){
      response.send("Successfully deleted " + count); 
    } else {
      response.send("Delete failed " + err);
    }
  });
});

var yearWithShares = [];

function doAsyncGet(callback) {
  async.map(facebookUrls, fetch, function(err, results){
      if (err){
        console.err("Sorry, failed :(")
      } else {
        var sum = 0;
        results.map(function (entry, index) {
            var sharesRaw = JSON.parse(entry).shares;
            var shares = sharesRaw ? sharesRaw : 0;
            var year = yearRange[index];
            
            sum += shares;

            yearWithShares.push({
              "year": year,
              "shares": shares
            });
        });

        var generalShares = _.find(yearWithShares, function(entry){ return entry.year  === '' });
        yearWithShares = _.without(yearWithShares, function(entry){ return entry.year  === '' });
        
        yearWithShares.sort(function(a,b) { return parseFloat(b.shares) - parseFloat(a.shares) } );

        var json={
          "sum": sum,
          "popular": yearWithShares[0],
          "general": generalShares,
          "years": yearWithShares
        }
        
        cache.set(JSON_CACHE_KEY, json, function( err, success ){
          if( !err && success ){
            console.log("Updated cached json");
          } else {
            console.err("FAILED in updating cached json");
          }
        });
        callback(json);
      }
  });
};

app.listen(app.get('port'), function() {
  console.log('Node app is running on port', app.get('port'));
});



var yearRange = _.range(1890, 2006);
yearRange.unshift("");

var facebookUrls = yearRange.map(function(year){
  return host + baseUrl + "/" + year;
});

var fetch = function(file, cb){
  request.get(file, function(err,response,body){
    if (err){
      cb(err);
    } else {
      cb(null, body); 
    }
  });
}

