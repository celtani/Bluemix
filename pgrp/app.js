/*jshint node:true*/

// app.js
// This file contains the server side JavaScript code for your application.
// This sample application uses express as web application framework (http://expressjs.com/),
// and jade as template engine (http://jade-lang.com/).

var express = require('express');
var https = require('https');
var url = require('url');
var extend = require('util')._extend;

// setup middleware
var app = express();
app.use(express.errorHandler());
app.use(express.urlencoded()); // to support URL-encoded bodies
app.use(app.router);

app.use(express.static(__dirname + '/public')); //setup static public directory
app.set('view engine', 'jade');
app.set('views', __dirname + '/views'); //optional since express defaults to CWD/views

// There are many useful environment variables available in process.env.
// VCAP_APPLICATION contains useful information about a deployed application.
var appInfo = JSON.parse(process.env.VCAP_APPLICATION || "{}");
// TODO: Get application information and use it in your app.

// defaults for dev outside bluemix
var serviceqa_url = '<service_url>';
var serviceqa_username = '<service_username>';
var serviceqa_password = '<service_password>';

var servicemt_url = '<service_url>';
var servicemt_username = '<service_username>';
var servicemt_password = '<service_password>';
qs = require('querystring');

// VCAP_SERVICES contains all the credentials of services bound to
// this application. For details of its content, please refer to
// the document or sample of each service.
if (process.env.VCAP_SERVICES) {
  console.log('Parsing VCAP_SERVICES');
  var services = JSON.parse(process.env.VCAP_SERVICES);
  //service name, check the VCAP_SERVICES in bluemix to get the name of the services you have
  var serviceqa_name = 'question_and_answer';

  if (services[serviceqa_name]) {
    var svc = services[serviceqa_name][0].credentials;
    serviceqa_url = svc.url;
    serviceqa_username = svc.username;
    serviceqa_password = svc.password;
  } else {
    console.log('The service '+serviceqa_name+' is not in the VCAP_SERVICES, did you forget to bind it?');
  }

} else {
  console.log('No VCAP_SERVICES found in ENV, using defaults for local development');
}

console.log('service_url = ' + serviceqa_url);
console.log('service_username = ' + serviceqa_username);
console.log('service_password = ' + new Array(serviceqa_password.length).join("X"));

var authqa = "Basic " + new Buffer(serviceqa_username + ":" + serviceqa_password).toString("base64");

console.log('No VCAP_SERVICES found in ENV, using defaults for local development');

// VCAP_SERVICES contains all the credentials of services bound to
// this application. For details of its content, please refer to
// the document or sample of each service.
if (process.env.VCAP_SERVICES) {
    console.log('Parsing VCAP_SERVICES');
    var services = JSON.parse(process.env.VCAP_SERVICES);
    //service name, check the VCAP_SERVICES in bluemix to get the name of the services you have
    var servicemt_name = 'language_translation';

    if (services[servicemt_name]) {
        var svc = services[servicemt_name][0].credentials;
        servicemt_url = svc.url;
        servicemt_username = svc.username;
        servicemt_password = svc.password;
    } else {
        console.log('The service ' + servicemt_name + ' is not in the VCAP_SERVICES, did you forget to bind it?');
    }

} else {
    console.log('No VCAP_SERVICES found in ENV, using defaults for local development');
}

console.log('service_url = ' + servicemt_url);
console.log('service_username = ' + servicemt_username);
console.log('service_password = ' + new Array(servicemt_password.length).join("X"));

var authmt = "Basic " + new Buffer(servicemt_username + ":" + servicemt_password).toString("base64");
var dataset = '';
var response = "";
var translations = "";
var translations1 = "";

// render index page
app.get('/', function(req, res){
    res.render('index');
});

// Handle the form POST containing the question to translate
app.post('/', function(req, res){
  dataset= req.body.dataset;
  var partsmt = url.parse(servicemt_url + '/v2/translate');
  var optionsmt = {
      host: partsmt.hostname,
      port: partsmt.port,
      path: partsmt.pathname,
      method: 'POST',
      headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Accept': 'text/plain',
          'X-synctimeout': '30',
          'Authorization': authmt
      }
  };

  var partsqa = url.parse(serviceqa_url +'/v1/question/'+dataset);
  var optionsqa = {
      host: partsqa.hostname,
      port: partsqa.port,
      path: partsqa.pathname,
      method: 'POST',
      headers: {
          'Content-Type'  :'application/json',
          'Accept':'application/json',
          'X-synctimeout' : '30',
          'Authorization' :  authqa
      }
  };
    // Create a request to POST to Watson
  var watson_reqqa = https.request(optionsqa, function (result) {
      result.setEncoding('utf-8');
      var response_string = '';

      result.on('data', function (chunk) {
          response_string += chunk;
      });

      result.on('end', function () {
          var answers = JSON.parse(response_string)[0];
          console.log('answers', answers);
          var answer = (answers.question.evidencelist)[0];
          console.log('answer', answer.text);
          response = extend({ 'answer': answer }, response);
          // create the question to Watson
          var requestData = {
              model_id: '',
              source: 'en',
              target: 'pt',
              text: [
                answer.text
              ]
          };
          watson_reqmt1.write(qs.stringify(requestData));
          watson_reqmt1.end();

 //         return res.render('index', response);
      });
  });

  var watson_reqmt = https.request(optionsmt, function (result) {
      result.setEncoding('utf-8');
      var responseString = '';

      result.on("data", function (chunk) {
          responseString += chunk;
      });

      result.on('end', function () {
          // add the response to the request so we can show the text and the response in the template
          console.log('resp', responseString);
          translations = responseString;
          response = extend({ 'translations': translations }, req.body);
          console.log('response', translations);
          console.log('resposta', response);

          var questionData = {
              'question': {
                  'evidenceRequest': {
                      'items': 1 // the number of anwers
                  },
                  'questionText': translations // the question
              }
          };

          // Set the POST body and send to Watson
          watson_reqqa.write(JSON.stringify(questionData));
          watson_reqqa.end();

//          return res.render('index1', response);
      })

  });

  var watson_reqmt1 = https.request(optionsmt, function (result) {
      result.setEncoding('utf-8');
      var responseString = '';

      result.on("data", function (chunk) {
          responseString += chunk;
      });

      result.on('end', function () {
          // add the response to the request so we can show the text and the response in the template
          console.log('resp', responseString);
          translations1 = responseString;
          response = extend({ 'translations1': translations1 }, response);
          console.log('response', translations1);
          console.log('resposta', response);
          return res.render('index', response);
      })

  });
  watson_reqmt.on('error', function (e) {
      return res.render('index', { 'error': e.message });
  });


// create the question to Watson
  var requestData = {
      model_id: '',
      source: 'pt',
      target: 'en',
      text: [
        req.body.questionText
      ]
  };
  console.log('requestData', requestData);
  // Set the POST body and send to Watson
//  watson_reqmt.write(JSON.stringify(requestData));
  watson_reqmt.write(qs.stringify(requestData));
  watson_reqmt.end();

   watson_reqqa.on('error', function(e) {
        return res.render('index', {'error': e.message});
      });

});

// The IP address of the Cloud Foundry DEA (Droplet Execution Agent) that hosts this application:
var host = (process.env.VCAP_APP_HOST || 'localhost');
// The port on the DEA for communication with the application:
var port = (process.env.VCAP_APP_PORT || 3000);
// Start server
app.listen(port, host);