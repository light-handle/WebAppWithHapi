var Hapi = require('hapi');
var Inert = require('inert');
var Vision = require('vision');
var Uuid = require('uuid');
var Fs = require('fs');

var server = new Hapi.Server();

var cards = loadCards();

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

server.ext('onRequest', function(request, reply) {
	console.log('Request received: ' + request.path);
	reply.continue(); //To continue request lifecycle and hand back control to server.
});

server.route({
	path: '/',
	method: 'GET',
	handler: {
		file: 'templates/index.html'
	}
});

server.route({
	path: '/assets/{path*}',
	method: 'GET',
	handler: {
		directory: {
			path: './public',
			listing: false
		}
	}
});

server.route({
	path: '/cards/new',
	method: ['GET', 'POST'],
	handler:  newCardHandler	
});

server.route({
	path: '/cards',
	method: 'GET',
	handler: cardsHandler
});

server.route({
	path: '/cards/{id}',
	method: 'DELETE',
	handler: deleteCardHandler
});

function newCardHandler(request, reply) {
	if(request.method === 'get') {
		reply.view('new');
	} else {
		var card = {
			name: request.payload.name,
			recipient_email: request.payload.recipient_email,
			sender_name: request.payload.sender_name,
			sender_email: request.payload.sender_email,
			card_image: request.payload.card_image
		};

		saveCard(card);

		console.log(cards);

		reply.redirect('/cards');
	}
}

function deleteCardHandler(request, reply) {
	delete cards[request.params.id];
	reply();
}

function cardsHandler(request, reply) {
	//reply.file('templates/cards.html');
	reply.view('cards', {cards: cards} );
}

function saveCard(card) {
	var id = Uuid.v1();
	card.id = id;
	cards[id] = card;
}

function loadCards() {
	var file = Fs.readFileSync('./cards.json');
	return JSON.parse(file.toString());
}

server.start(function() {
	console.log('Listening on ' + server.info.uri);
});