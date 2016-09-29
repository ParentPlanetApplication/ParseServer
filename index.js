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

var mode = 'aws';
// mode = 'localhost';

p = jsonFile( './app.json' );

p.then( config => {
		var stagingURL = config.data.env.SERVER_URL[ mode ].staging;
		var productionURL = config.data.env.SERVER_URL[ mode ].production;
		var redisUrl = config.data.env.REDIS[ mode ].url;

		// production
		setRoutes( production, buildApiServer( config, productionURL, true ) );
		googleAnalytics( production );
		startServers( production, 13370, productionURL, true );
    performCleanup();
		startBackgroundJob( production, 'emailSenderProduction', redisUrl );
    startPingJob( production, 'pingJob', redisUrl );
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

function buildApiServer( config, serverURL, production ) {
	var databaseURI = config.data.env.DATABASEURI[ mode ].staging;
	var appId = config.data.env.APP_ID[ mode ].staging;

	if ( production ) {
		databaseURI = config.data.env.DATABASEURI[ mode ].production;
		appId = config.data.env.APP_ID[ mode ].production;
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

function setRoutes( app, api, config ) {
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

function googleAnalytics( app ) {
	app.use( nodalytics( {
		property_id: 'UA-83656948-1',
		map: function ( req, event ) {
			return event;
		},
		error: function ( error, event, headers, req, grec, gres ) {
		},
		success: function ( event, headers, req, grec, gres ) {
		}
	} ) );
}

function startServers( app, port, serverURL, production ) {
	// var httpServer = require( 'http' ).createServer( app );
	var httpServer;
	if ( mode === 'localhost' ) {
		httpServer = require( 'http' ).createServer( app );
		httpServer.listen( port, function () {
			if ( production ) {
				console.log( 'Production Server: ' + serverURL );
			} else {
				console.log( 'Staging Server: ' + serverURL );
			}
		} );
	} else {
		httpServer = require( 'https' ).createServer( configCRT, app );
		httpServer.listen( port, function () {
			if ( production ) {
				console.log( 'Production Server: ' + serverURL );
			} else {
				console.log( 'Staging Server: ' + serverURL );
			}
		} );
	}

	// This will enable the Live Query real-time server
	ParseServer.createLiveQueryServer( httpServer );
}

function performCleanup() {
  var kue = require('kue');
  var ki = new kue;

  ki.complete(function(err, ids) {
    if (!ids) return;
    ids.forEach(function(id, index) {
      kue.Job.get(id, function(err, job) {
        if (job) {
          job.remove(function(){
          });
        }
      });
    });
  });
}

function startPingJob( app, queueName, redisUrl ) {
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
		.priority( 'normal' )
		.unique( jobName );

	ui.setup( {
		apiURL: '/queue/api', // IMPORTANT: specify the api url
		baseURL: '/queue', // IMPORTANT: specify the base url
		updateInterval: 5000 // Optional: Fetches new data every 5000 ms
	} );

	Queue.every( '* 5 * * * *', job );
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
		Parse.Cloud.run( 'hello', {}, {
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
}

function startBackgroundJob( app, queueName, redisUrl ) {
	var redis_url = redisUrl;
	var kue = require( 'kue-scheduler' );
	var url = require( 'url' );

	var ui = require( 'kue-ui' );
	var Queue = kue.createQueue();
	var jobName = queueName;

	var job = Queue
		.createJob( jobName, {
			title: 'send email from table Email'
		} )
    .priority( 'normal' )
		.unique( jobName );

	ui.setup( {
		apiURL: '/queue/api', // IMPORTANT: specify the api url
		baseURL: '/queue', // IMPORTANT: specify the base url
		updateInterval: 5000 // Optional: Fetches new data every 5000 ms
	} );

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
					status: 'Successfully',
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
