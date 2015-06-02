var express = require('express');
var request = require('request');
var async   = require('async');
var _       = require("underscore");
var exphbs = require('express-handlebars');

var host    = "http://graph.facebook.com/?id=";
var baseUrl = "http://www.oppetarkiv.se/nostalgi";
var app = express();

app.engine('.hbs', exphbs());
app.set('view engine', '.hbs');

app.set('port', (process.env.PORT || 5000));
app.use(express.static(__dirname + '/public'));


app.get('/', function(request, response) {
  doAsyncGet(function(json) {
    response.render('index', { body: json.sum });
  });
});

app.get('/data', function(request, response) {
  doAsyncGet(function(json) {
    console.log("Sending response");
    response.contentType('application/json');
    response.send(JSON.stringify(json));
  });
});


function doAsyncGet(callback) {
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

        var json={
          "sum": sum,
          "general": yearWithShares[""], 
          "years": yearWithShares
        }
        
        callback(json);
      }
  });
};

app.listen(app.get('port'), function() {
  console.log('Node app is running on port', app.get('port'));
});

var yearWithShares = {}

var yearRange = _.range(1890, 2006);
yearRange.unshift("");

var facebookUrls = yearRange.map(function(year){
  return host + baseUrl + "/" + year;
});

function putEntry(year, shares) {
  yearWithShares[year] = shares;
}

var fetch = function(file, cb){
  request.get(file, function(err,response,body){
    if (err){
      cb(err);
    } else {
      cb(null, body); 
    }
  });
}

