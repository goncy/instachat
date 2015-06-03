var chatter = require('chatter');
var sala = "";
var error = new Error();

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

    function returnError(res, error) {
        res.render('error', {
            error: error
        });
    }

    var setParams = function(req, res, next) {
        req.sala = req.params.sala ? req.params.sala : "principal";
        req.password_sala = getClients(req.sala) < 1 ? resetPassword(req.sala) : getPassword(req.sala);
        req.password = req.params.password;
        error.message = "";
        return next();
    }

    var checkErrors = function(req, res, next) {
        if (req.password_sala && !req.password) error.message = "Esta sala tiene password";
        else if (req.password && !req.password_sala) error.message = "Esta sala no tiene password";
        else if (req.password != req.password_sala) error.message = "La contraseña es incorrecta";
        else if (req.sala.length > 20) error.message = "Sala con nombre muy largo";
        return next();
    }

    var routeHandler = function(req, res) {
        sala = req.params.sala;
        if (error.message) res.render('error', {
            error: error.message
        });
        else res.render('index', {
            title: req.sala
        });
    }

    var checkers = [setParams, checkErrors, routeHandler];
    //Rutas para la redireccion de la sala
    app.get(['/', '/:sala', '/:sala/:password'], checkers);

    app.get('*', function(req, res, next) {
        error.message = "No se encontro la pagina";
        next(error);
    });

    // handling 404 errors
    app.use(function(err, req, res, next) {
        res.render('error', {
            error: err.message || 'Hubo un error, fijate que todo sea correcto'
        });
    });
}