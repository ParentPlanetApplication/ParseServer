// Example express application adding the parse-server module to expose Parse
// compatible API routes.

var express = require( 'express' );
var ParseServer = require( 'parse-server' ).ParseServer;
var path = require( 'path' );
var jsonFile = require( 'json-file-plus' );
var nodalytics = require( 'nodalytics' );
var bodyParser = require( 'body-parser' )
var mongodb = require('mongodb');
var MongoClient = mongodb.MongoClient;

var databaseURI;

const commandLineArgs = require('command-line-args')

var configCRT = {
	key: require( "fs" ).readFileSync( 'certs/ssl/server_parentplanet_com.pem', 'utf8' ),
	cert: require( "fs" ).readFileSync( 'certs/ssl/server_parentplanet_com.crt', 'utf8' ),
	ca: require( "fs" ).readFileSync( 'certs/ssl/server_parentplanet_com.ca-bundle', 'utf8' )
};

var staging = express();
var response;

var mode = 'aws';

const optionDefinitions = [
  { name: 'localhost', type: Boolean },
  { name: 'aws', type: Boolean }
]

const options = commandLineArgs(optionDefinitions)

if( options.localhost ) {
  mode = 'localhost';
}

p = jsonFile( './app.json' );

p.then( config => {
		var stagingURL = config.data.env.SERVER_URL[ mode ].staging;
		var redisUrl = config.data.env.REDIS[ mode ].url;

		// staging Server
		setRoutes( staging, buildApiServer( config, stagingURL, true ) );
		googleAnalytics( staging );
		startServers( staging, 1337, stagingURL, true );
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

function buildApiServer( config, serverURL, staging ) {
	databaseURI = config.data.env.DATABASEURI[ 'aws' ].staging;
	var appId = config.data.env.APP_ID[ mode ].staging;

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
		publicServerURL: serverURL.replace(/\/parse$/, ''),
    emailVerifyTokenValidityDuration: true,
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

  app.use( bodyParser.json() ); // to support JSON-encoded bodies
  app.use( bodyParser.urlencoded( { // to support URL-encoded bodies
    extended: true
  } ) );

	app.get( '/apps/*/request_password_reset', function ( req, res ) {
    response = res;
    var userQuery = Parse.Object.extend( "User", {}, {
  		query: function () {
  			return new Parse.Query( this.className );
  		}
  	} );
  	var query = userQuery.query();
  	// query.equalTo( "username", req.query.username );
  	query.equalTo( "_perishable_token", req.query.token );
    query.find({
      success: function(results) {
        if(results.length > 0) {
          console.log('Yes, need call request reset password');
      		res.sendFile( path.join( __dirname, '/apps/choose_password.html' ) );
        } else {
          gotoLink('invalid_link');
        }
      },
      error: function(error) {
        gotoLink('invalid_link');
      }
    });
	} );

  app.post( '/apps/request_password_reset', function ( req, res ) {
    console.log( req.body );
    response = res;
    checkUser( req );
  } );

	app.get( '/apps/password_reset_success', function ( req, res ) {
		res.sendFile( path.join( __dirname, '/apps/password_updated.html' ) );
	} );

	app.get( '/apps/password_reset_fail', function ( req, res ) {
		res.sendFile( path.join( __dirname, '/apps/password_cannot_updated.html' ) );
	} );

	app.get( '/apps/*/verify_email_success', function ( req, res ) {
		res.sendFile( path.join( __dirname, '/apps/password_reset_success.html' ) );
	} );

	app.get( '/apps/invalid_link', function ( req, res ) {
		res.sendFile( path.join( __dirname, '/apps/invalid_link.html' ) );
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

function startServers( app, port, serverURL, staging ) {
	var httpServer;
	if ( mode === 'localhost' ) {
		httpServer = require( 'http' ).createServer( app );
		httpServer.listen( port, function () {
			console.log( 'Staging Server: ' + serverURL );
		} );
	} else {
		httpServer = require( 'https' ).createServer( configCRT, app );
		httpServer.listen( port, function () {
			console.log( 'Staging Server: ' + serverURL );
		} );
	}

	// This will enable the Live Query real-time server
	ParseServer.createLiveQueryServer( httpServer );
}

function checkUser( req ) {
	var userQuery = Parse.Object.extend( "User", {}, {
		query: function () {
			return new Parse.Query( this.className );
		}
	} );
	var query = userQuery.query();
	query.equalTo( "username", req.body.username );
  query.find({
    success: function(results) {
      if(results.length > 0) {
        updatePassword(results[0], req.body.new_password)
      } else {
        gotoLink('password_reset_fail');
      }
    },
    error: function(error) {
      console.log(error);
      gotoLink('password_reset_fail');
    }
  });
}

function updatePassword( user, password ) {
	user.set( 'password', password );

  user.save( null, {
		useMasterKey: true
	} ).then(
		function ( object ) {
			console.log( 'object' );
			console.log( object );
      resetToken(user.id);
      gotoLink('password_reset_success');
		},
		function ( error ) {
			console.log( error );
      gotoLink('password_reset_fail');
		} );
}

function resetToken(id) {
  MongoClient.connect(databaseURI, function (err, db) {
    if (err) {
      console.log('Unable to connect to the mongoDB server. Error:', err);
    } else {
      //HURRAY!! We are connected. :)
      console.log('Connection established to', databaseURI);

      // Get the documents collection
      var collection = db.collection('_User');

      collection.update(
        {
          _id: id
        },
        {
          $set: {
            _perishable_token: ''
          }
        },
        function(result) {
          console.log(result);
        }
      );
      db.close();
    }
  })
}

function gotoLink(url) {
  response.statusCode = 302;
  response.setHeader("Location", "/apps/" + url);
  response.end();
}
