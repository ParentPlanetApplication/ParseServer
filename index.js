// Example express application adding the parse-server module to expose Parse
// compatible API routes.

var express = require( 'express' );
var ParseServer = require( 'parse-server' ).ParseServer;
var path = require( 'path' );
var jsonFile = require( 'json-file-plus' );
var nodalytics = require( 'nodalytics' );

// var databaseUri = 'mongodb://p2user:PokePee2016!@app.parentplanet.com:27017/heroku_gflrmr6k';
// var databaseUri = 'mongodb://p2user:PokePee2016!@mw-appdesign.vn:27176/heroku_gflrmr6k';

// var fs = require( "fs" );
var configCRT = {
  key: require( "fs" ).readFileSync( 'certs/ssl/server_parentplanet_com.pem', 'utf8' ),
  cert: require( "fs" ).readFileSync( 'certs/ssl/server_parentplanet_com.crt', 'utf8' ),
  ca: require( "fs" ).readFileSync( 'certs/ssl/server_parentplanet_com.ca-bundle', 'utf8' )
};

// var app = express();
var staging = express();
var production = express();

// const program = require( 'commander' );
// program.option( '--mode [mode]', 'the mode only valid with aws, localhost, heroku' );
// program.parse( process.argv );

var mode = 'aws';
// let mode = program.mode || 'aws';
// mode = mode.toLowerCase();
//
// if (mode !== 'aws' && mode !== 'localhost' && mode !== 'heroku') {
//   console.log('mode [' + mode + '] variable only valid with: aws, heroku, and localhost');
//   process.exit(1);
// }

p = jsonFile( './app.json' );

p.then( config => {
		// var localhost = process.env.PARSE_SERVER_LOCALHOST !== undefined;
		// var serverURL = localhost ? config.data.env.SERVER_URL.localhost : config.data.env.SERVER_URL.aws;
		// var productionURL = localhost ? config.data.env.SERVER_URL.localhost : config.data.env.SERVER_URL.production;

    // var apiStaging = buildApiServer(config, false);
    // var apiProduction = buildApiServer(config, true);
    var stagingURL = config.data.env.SERVER_URL[mode].staging;
    var productionURL = config.data.env.SERVER_URL[mode].production;
    var redisUrl = config.data.env.REDIS[mode].url;

    // // staging
    // setRoutes(staging, buildApiServer(config, stagingURL, false));
    // startServers(staging, 1337, stagingURL);
    // startBackgroundJob(staging, 'emailSender', redisUrl)

    // production
    setRoutes(production, buildApiServer(config, productionURL, true));
    googleAnalytics(production);
    startServers(production, 13370, productionURL, true);
    startBackgroundJob(production, 'emailSenderProduction', redisUrl);
	}, error => {
		if ( error instanceof SyntaxError ) {
			console.log( 'Your config file contains invalid JSON. Exiting.' );
			process.exit( 1 );
		} else if ( error.code === 'ENOENT' ) {
			if ( explicitConfigFileProvided ) {
				console.log( 'Your config file is missing. Exiting.' );
				process.exit( 2 );
			} else {
				console.log( 'You must provide either a config file or required CLI options (app ID, Master Key, and server URL); not both.' );
				process.exit( 3 );
			}
		} else {
			console.log( 'There was a problem with your config. Exiting.' );
			process.exit( -1 );
		}
	} )
	.catch( error => {
		console.log( 'There was a problem loading the dashboard. Exiting.', error );
		process.exit( -1 );
	} );

function buildApiServer(config, serverURL, production) {
  var databaseURI = config.data.env.DATABASEURI[mode].staging;
  var appId = config.data.env.APP_ID[mode].staging;

  if ( production ) {
    databaseURI = config.data.env.DATABASEURI[mode].production;
    appId = config.data.env.APP_ID[mode].production;
  }

  var api = new ParseServer( {
    databaseURI: databaseURI,
    cloud: __dirname + '/cloud/main.js',
    appId: appId,
    masterKey: config.data.env.MASTER_KEY.value,
    clientKey: config.data.env.CLIENTKEY.value,
    serverURL: serverURL,
    liveQuery: {
      classNames: [ "Posts", "Comments" ] // List of classes to support for query subscriptions
    },
    push: {
      android: {
        senderId: '52244621335',
        apiKey: 'AIzaSyAVU2RjkybQvfY7lbbONRoFgO24M114NIo'
      },
      ios: [
        {
          pfx: 'certs/P2_Dev_pushCert.p12',
          bundleId: 'com.ppllc.p2',
          production: false
        },
        {
          pfx: 'certs/PushCert.p12',
          bundleId: 'com.ppllc.p2',
          production: true
        }
      ]
    },
    appName: 'Parent Planet',
    // publicServerURL: 'https://mighty-hamlet-52509.herokuapp.com/parse',
    publicServerURL: serverURL,
    // publicServerURL: 'http://localhost:1337/parse',
    emailAdapter: {
      module: 'parse-server-mandrill-adapter',
      options: {
        fromEmail: 'no-reply@parentplanet.com',
        displayName: 'Parent Planet',
        apiKey: '8yGg33UeVP1q1iPNifqAOw',
        verificationSubject: 'Please verify your e-mail for *|appname|*',
        // Verification email body
        verificationBody: 'Hi *|username|*,\n\nYou are being asked to confirm the e-mail address *|email|* with *|appname|*\n\nClick here to confirm it:\n*|link|*',
        // Password reset email subject
        passwordResetSubject: 'Password Reset Request for *|appname|*',
        // Password reset email body
        passwordResetBody: 'Hi *|username|*,\n\nYou requested a password reset for *|appname|*.\n\nClick here to reset it:\n*|link|*',
		customUserAttributesMergeTags: []
      }
    }
  } );

  return api;
}

function setRoutes(app, api, config) {
  app.get( '/app.json', function ( req, res ) {
    console.log( res );
  } );

  // Serve static assets from the /public folder
  app.use( '/public', express.static( path.join( __dirname, '/public' ) ) );
  app.use( '/apps', express.static( path.join( __dirname, '/apps' ) ) );

  app.get( '/apps/*/request_password_reset', function ( req, res ) {
    res.sendFile( path.join( __dirname, '/apps/choose_password.html' ) );
  } );

  app.get( '/apps/*/password_reset_success', function ( req, res ) {
    res.sendFile( path.join( __dirname, '/apps/password_reset_success.html' ) );
  } );

  app.get( '/apps/*/verify_email_success', function ( req, res ) {
    res.sendFile( path.join( __dirname, '/apps/password_reset_success.html' ) );
  } );

  app.get( '/apps/*/invalid_link', function ( req, res ) {
    res.sendFile( path.join( __dirname, '/apps/password_reset_success.html' ) );
  } );

  // Serve the Parse API on the /parse URL prefix
  // var mountPath = config.data.env.PARSE_MOUNT.value;
  app.use( '/parse', api );

  // Parse Server plays nicely with the rest of your web routes
  app.get( '/', function ( req, res ) {
    res.status( 200 ).send( 'Welcome Parse Server on AWS.' );
  } );

  // There will be a test page available on the /test path of your server url
  app.get( '/test', function ( req, res ) {
    res.sendFile( path.join( __dirname, '/public/test.html' ) );
  } );
}

function googleAnalytics(app) {
	app.use( nodalytics( {
		property_id: 'UA-83656948-1',
		map: function ( req, event ) {
			// This function is called to augment the default Google Analytics Event object
			// created by nodalitics for the specified request.
			// Parameters:
			// - req - the Http request that triggered logging attempt
			// - event - an object representing default values of the Google Analytics Event
			//           created by nodalitics for the specified request
			// Return: a Google Analytics Event object to log.
			return event;
		},
		error: function ( error, event, headers, req, grec, gres ) {
			// This function is called when an error occurs communicating with Google Analytics.
			// Parameters:
			// - error - the error
			// - event - the Google Analytics Event logging of which failed
			// - headers - HTTP request headers sent to Google Analytics
			// - req - the HTTP request that triggered logging attempt
			// - greq - the HTTP request sent to Google Analytics that failed
			// - gres - the HTTP response from Google Analytics
		},
		success: function ( event, headers, req, grec, gres ) {
			// This function is called after successful logging with Google Analytics.
			// Parameters are the same as with the errors handler above.
		}
	} ) );
}

function startServers(app, port, serverURL, production) {
  // var httpServer = require( 'http' ).createServer( app );
  var httpServer;
  if(mode === 'localhost') {
    httpServer = require( 'http' ).createServer( app );
    httpServer.listen( port, function () {
      // console.log( 'parse server running on port ' + port + '.' );
      // console.log( 'currently, server url: ' + serverURL + ' with port ' + port );
      if ( production ) {
        console.log( 'Production Server: ' + serverURL);
      } else {
        console.log( 'Staging Server: ' + serverURL);
      }
    } );
  } else {
    httpServer = require( 'https' ).createServer( configCRT, app );
    httpServer.listen( port, function () {
      // console.log( 'parse server running on port ' + port + '.' );
      // console.log( 'currently, server url: ' + serverURL + ' with port ' + port );
      if ( production ) {
        console.log( 'Production Server: ' + serverURL);
      } else {
        console.log( 'Staging Server: ' + serverURL);
      }
    } );
  }

  // This will enable the Live Query real-time server
  ParseServer.createLiveQueryServer( httpServer );
}

function startBackgroundJob(app, queueName, redisUrl) {
  var redis_url = redisUrl;
  var kue = require( 'kue-scheduler' );
  var url = require( 'url' );

  var ui = require( 'kue-ui' );
  var Queue = kue.createQueue();
  var jobName = queueName;
  var job = Queue
    .createJob( jobName, {
      title: 'will send email every day at 5pm'
    } )
    .attempts( 3 )
    .backoff( {
      delay: 60000,
      type: 'fixed'
    } )
    .priority( 'normal' );

  ui.setup( {
    apiURL: '/queue/api', // IMPORTANT: specify the api url
    baseURL: '/queue', // IMPORTANT: specify the base url
    updateInterval: 5000 // Optional: Fetches new data every 5000 ms
  } );

  // Queue.every( '0 10 17 * * *', job );
  // Queue.every( '0 10 17 * * *', job );
  // 12h UTC -> 5h -> Los Angeles
  // Queue.every( '0 0 12 * * *', job );
  // 0h UTC -> 17h -> Los Angeles
  Queue.every( '0 0 0 * * *', job );
  var isRunning = false;

  Queue.process( jobName, function ( job, done ) {
    console.log( 'current status, isRunning = ' + isRunning );
    if ( isRunning ) {
      console.log( '\Job running ....' );
      done( null, {
        status: 'running',
        message: '',
        deliveredAt: new Date()
      } );
      return;
    }
    isRunning = true;
    console.log( '\nProcessing job with id %s at %s', job.id, new Date() );
    Parse.Cloud.run( 'emailSender', {}, {
      success: function ( secretString ) {
        // obtained secret string
        done( null, {
          status: 'Status:successfully',
          message: secretString,
          deliveredAt: new Date()
        } );
        isRunning = false;
      },
      error: function ( error ) {
        // error
        isRunning = false;
        done( null, {
          status: 'fail',
          message: error,
          deliveredAt: new Date()
        } );
      }
    } );
  } );

  //listen on scheduler errors
  Queue.on( 'schedule error', function ( error ) {
    //handle all scheduling errors here
    console.log( error );
  } );


  //listen on success scheduling
  Queue.on( 'schedule success', function ( job ) {
    //a highly recommended place to attach
    //job instance level events listeners

    job.on( 'complete', function ( result ) {
      console.log( 'Job completed with data ', result );

    } ).on( 'failed attempt', function ( errorMessage, doneAttempts ) {
      console.log( 'Job failed' );

    } ).on( 'failed', function ( errorMessage ) {
      console.log( 'Job failed' );

    } ).on( 'progress', function ( progress, data ) {
      console.log( '\r  job #' + job.id + ' ' + progress + '% complete with data ', data );
    } );
  } );

  // start the UI
  app.use( '/queue/api', kue.app );
  app.use( '/queue', ui.app );

}
