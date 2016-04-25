var Hapi = require('hapi');
var Inert = require('inert');
var Vision = require('vision');
var CardStore = require('./lib/cardStore');
var UserStore = require('./lib/userStore');

var server = new Hapi.Server();

CardStore.initialize();
UserStore.initialize();

server.connection({port:8000});

server.register([Vision, Inert], function (err) {
     if (err) console.log(err);
 });

server.views({
	engines: {
		html: require('handlebars')
	},
	path: './templates'
});

server.register( {  // Register plugins
	register: require('good'),
	options: {             // To configure plugin
		opsInterval: 5000,
		reporters: [
			{
				reporter: require('good-file'),
				events: { ops: '*' },
				config: {
					path: './logs',
					prefix: 'hapi-process',
					rotate: 'daily'
				}
			},
			{
				reporter: require('good-file'),
				events: { response: '*' },
				config: {
					path: './logs',
					prefix: 'hapi-request',
					rotate: 'daily'
				}
			},
			{
				reporter: require('good-file'),
				events: { error: '*' },
				config: {
					path: './logs',
					prefix: 'hapi-error',
					rotate: 'daily'
				}
			}
		]
	}
}, function(err) {
	console.log(err);
});

server.register(require('hapi-auth-cookie'), function(err) {
 	if(err) console.log(err);

 	server.auth.strategy('default', 'cookie', {
 		password: 'mypassword',
 		redirectTo: '/login',
 		isSecure: false
 	});

 	server.auth.default('default');
});

server.ext('onPreResponse', function(request, reply) {
	if(request.response.isBoom) {
		return reply.view('error', request.response);
	}
	reply.continue();
});

server.route(require('./lib/routes'));

server.start(function() {
	console.log('Listening on ' + server.info.uri);
});