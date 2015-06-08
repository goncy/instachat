var chatter = require('chatter');
var sala = "";

module.exports = function(app, io) {
    //Seteo de redireccion de sockets
    chatter.set_sockets(io.sockets);

    //Redireccion de sockets en conexion
    io.sockets.on('connection', function(socket) {
        chatter.connect_chatter({
            socket: socket,
            sala: sala,
            io: io
        });
    });

    function getPassword(sala_id) {
        return io.of(sala_id).password;
    }

    function resetRoom(sala_id) {
        var room = io.of(sala_id);
        room.password = null;
        room.owner = null;
        room.img = null;
        return null;
    }

    function getClients(sala_id) {
        return io.of(sala_id).server.eio.clientsCount;
    }

    var setParams = function(req, res, next) {
        req.sala = req.params.sala ? req.params.sala : "principal";
        req.password_sala = getClients(req.sala) < 1 ? resetRoom(req.sala) : getPassword(req.sala);
        req.password = req.params.password;
        return next();
    };

    var checkErrors = function(req, res, next) {
    	if (req.password && !req.password_sala) next(res.redirect('/'+req.params.sala));

    	if (req.sala.length > 20) next(new Error('Sala con nombre muy largo'));
        else if (req.password_sala && !req.password) next(new Error('La sala '+req.params.sala+' tiene contraseña'));
        else if (req.password != req.password_sala) next(new Error('La contraseña para '+req.params.sala+' es incorrecta'));
        
        return next();
    };

    var routeHandler = function(req, res) {
        sala = req.params.sala;
        res.render('index', {
            title: req.sala
        });
    };

    var checkers = [setParams, checkErrors, routeHandler];

    app.get(['/', '/:sala', '/:sala/:password'], checkers);

    app.get('*', function(req, res, next){res.redirect('/')});

    app.use(function(err, req, res, next) {
        res.render('error', {
            error: err.message || 'Hubo un error, fijate que todo sea correcto',
            sala: req.sala
        });
    });
}