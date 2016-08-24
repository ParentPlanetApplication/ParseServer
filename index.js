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
        }//,
        // {
        //   cert: './p12/production.pem',
        //   bundleId: 'com.ppllc.p2',
        //   production: true // Prod
        // }
      ]
    }
	} );

	app.get( '/app.json', function ( req, res ) {
		console.log( res );
	} );

	// Serve static assets from the /public folder
	app.use( '/public', express.static( path.join( __dirname, '/public' ) ) );

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
    console.log('clientKey:' + config.data.env.CLIENTKEY.value);
    console.log( 'currently, server url: ' + serverURL + ' with port ' + port );
	} );

	// This will enable the Live Query real-time server
	ParseServer.createLiveQueryServer( httpServer );

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
