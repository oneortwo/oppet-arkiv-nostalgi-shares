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
    response.contentType('application/json');
    response.send(JSON.stringify(json));
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
        yearWithShares.sort(function(a,b) { return parseFloat(b.shares) - parseFloat(a.shares) } );

        var json={
          "sum": sum,
          "popular": yearWithShares[0],
          "general": generalShares,
          "years": yearWithShares
        }
        
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

