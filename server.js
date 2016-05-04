var Hapi = require('hapi'),
		uuid = require('uuid'),
		fs = require('fs');

var Inert = require('inert');
var Vision = require('vision');

var cards = loadCards();

var server = new Hapi.Server();
server.connection({ port: 3000 });

server.register(Vision , (err) => {
    if (err) {
        throw err;
    }

    server.views({
			engines: { html: require('handlebars') },
			path: './templates'
		});
});

server.register(Inert, function () {

	server.ext('onRequest', function(request, reply){
		console.log('Request Received: ' + request.path);
		reply.continue();
	});

	server.route({
		path: '/',
		method: 'GET',
		handler: function (request, reply) {
            reply.file('templates/index.html');
        }
	});

	server.route({
		path: '/assets/{path*}',
		method: 'GET',
		handler: {
			directory:{
				path: './public'
			}
		}
	});

	server.route({
		path: '/cards/new',
		method: ['GET', 'POST'],
		handler: newCardHandler

	});

	server.route({
		path: '/cards',
		method: 'GET',
		handler: CardsHandler
	});

	server.route({
		path: '/cards/{id}',
		method: 'DELETE',
		handler: deleteCardHandler 
	});

	function loadCards(){
		var file = fs.readFileSync('./cards.json');
		return JSON.parse(file.toString());
	};

	function mapImages(){
		return fs.readdirSync('./public/images/cards');
	};

	function newCardHandler(request, reply){
		if(request.method == 'get'){
			reply.view('new', { card_images: mapImages() });
		} else{

			var card = {
				name: request.payload.name,
				recipient_email: request.payload.recipient_email,
				sender_name: request.payload.sender_name,
				sender_email: request.payload.sender_email,
				card_image: request.payload.card_image
			};

			saveCard(card);
			reply.redirect('/cards');
		}
	};

	function CardsHandler(request, reply){
		reply.view('cards', { cards: cards });
	};

	function deleteCardHandler(request, reply){
		delete cards[request.params.id];
		reply();
	}

	function saveCard(card){
		var id = uuid.v1();
		card.id = id;
		cards[id] = card;
	};

	server.start(function(){
		console.log('Listening on ' + server.info.uri);
	});
});