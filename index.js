// Example express application adding the parse-server module to expose Parse
// compatible API routes.

var express = require( 'express' );
var ParseServer = require( 'parse-server' ).ParseServer;
var path = require( 'path' );
var jsonFile = require( 'json-file-plus' );

// var databaseUri = 'mongodb://p2user:PokePee2016!@app.parentplanet.com:27017/heroku_gflrmr6k';
// var databaseUri = 'mongodb://p2user:PokePee2016!@mw-appdesign.vn:27176/heroku_gflrmr6k';

var app = express();

p = jsonFile( './app.json' );

p.then( config => {
    var localhost = process.env.PARSE_SERVER_LOCALHOST !== undefined;
		var serverURL = localhost ? config.data.env.SERVER_URL.localhost : config.data.env.SERVER_URL.server;

		var api = new ParseServer( {
			databaseURI: config.data.env.DATABASEURI.value,
			cloud: __dirname + '/cloud/main.js',
			appId: config.data.env.APP_ID.value,
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
						pfx: 'certs/cert-dev.p12',
						bundleId: 'com.ppllc.p2',
						production: false
        } //,
        // {
        //   cert: './p12/production.pem',
        //   bundleId: 'com.ppllc.p2',
        //   production: true // Prod
        // }
      ]
			},
			appName: 'Parent Planet',
			publicServerURL: 'https://mighty-hamlet-52509.herokuapp.com/parse',
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
					passwordResetBody: 'Hi *|username|*,\n\nYou requested a password reset for *|appname|*.\n\nClick here to reset it:\n*|link|*'
				}
			}
		} );

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
		var mountPath = config.data.env.PARSE_MOUNT.value;
		app.use( mountPath, api );

		// Parse Server plays nicely with the rest of your web routes
		app.get( '/', function ( req, res ) {
			res.status( 200 ).send( 'I dream of being a website.  Please star the parse-server repo on GitHub!' );
		} );

		// There will be a test page available on the /test path of your server url
		app.get( '/test', function ( req, res ) {
			res.sendFile( path.join( __dirname, '/public/test.html' ) );
		} );

		var port = process.env.PORT || 1337;
		var httpServer = require( 'http' ).createServer( app );
		httpServer.listen( port, function () {
			// console.log( 'parse server running on port ' + port + '.' );
			console.log( 'clientKey:' + config.data.env.CLIENTKEY.value );
			console.log( 'currently, server url: ' + serverURL + ' with port ' + port );
		} );

		// This will enable the Live Query real-time server
		ParseServer.createLiveQueryServer( httpServer );

		// Start kue service
		// const kue = require( 'kue' );
		// app.use('/queue', kue.app);
		//
		// var schedule = require('./queue/schedule');
		//
		// schedule.create({
		//   title: 'at ' + (new Date())
		// }, function() {
		//   console.log('Create an queue done.');
		// });
		var redis_url = localhost ? config.data.env.REDIS.localhost : config.data.env.REDIS.server;
		var kue = require( 'kue-scheduler' );
    var url = require('url');

    kue.redis.createClient = function () {
			var redisUrl = url.parse( redis_url ),
				client = redis.createClient( redisUrl.port, redisUrl.hostname );
			if ( redisUrl.auth ) {
				client.auth( redisUrl.auth.split( ":" )[ 1 ] );
			}
			return client;
		};

		var ui = require( 'kue-ui' );
		var redis = require( 'kue/lib/redis' );
		var Queue = kue.createQueue();
		var jobName = 'emailSender-test';
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
		Queue.every( '0 20 * * * *', job );

		Queue.process( jobName, function ( job, done ) {
			console.log( '\nProcessing job with id %s at %s', job.id, new Date() );
			done( null, {
				deliveredAt: new Date()
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
		// var jobQueue = kue.createQueue();
		// var jobName = 'emailSender';
		//
		// var job = jobQueue.createJob( jobName, {
		//   title: 'send email every day at 5pm'
		// } )
		// 	.priority( 'high' )
		//   .removeOnComplete(false)
		// 	.attempts( 3 )
		// 	.save();
		//
		// jobQueue.every( 120000, job );
		//
		// job.on( 'complete', function () {
		// 	console.log( 'renewal job completed' );
		// 	console.log( '' );
		// } ).on( 'progress', function ( progress, data ) {
		// 	console.log( '\r  job #' + job.id + ' ' + progress + '% complete with data ', data );
		// } );
		//
		// jobQueue.process( jobName, function ( job, done ) {
		//   var date = new Date();
		// 	console.log( 'running job emailSender at ' + date);
		//   var miliseconds = 120000;
		//
		//   jobQueue.create(jobName).delay(miliseconds).save();
		//
		// 	done();
		// } );
		//
		// kue.Job.rangeByType(jobName, 'delayed', 0, 10, '', function (err, jobs) {
		//     if (err) {return handleErr(err);}
		//     if (!jobs.length) {
		//         jobQueue.create(jobName).save();
		//     }
		//     // Start checking for delayed jobs.  This defaults to checking every 5 seconds
		//     jobQueue.promote();
		// });
		// start the UI
		app.use( '/queue/api', kue.app );
		app.use( '/queue', ui.app );
		// kue.app.listen( 6006 );
		// console.log( 'UI started on port 6006' );
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
