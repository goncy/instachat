var chatter = require('chatter');
var sala = "";

module.exports = function(app,io){
	//Rutas para la redireccion de la sala
	app.get('/:sala', function(req, res, next){
		sala = req.params.sala;
		var password = io.of(sala).password;
		if(sala.length > 20) res.render('error', {error: "Sala con nombre muy largo"});
		else if(password && req.query.password != password) res.render('error', {error: "Pass incorrecta"});
		else if(password && req.query.password == password)	res.render('index', {title:sala});
		else if(sala.length < 20 && !password) res.render('index', {title:sala});
	});

	//Handling error de rutas
	app.get('/*', function(req, res, next){
	 	res.redirect("/principal");
	});

	//Seteo de redireccion de sockets
	chatter.set_sockets(io.sockets);

	//Redireccion de sockets en conexion
	io.sockets.on('connection', function(socket){
		chatter.connect_chatter({
			socket: socket,
			sala: sala,
			io: io
		});
	});
}