var chatter = require('chatter');

module.exports = function(app, express) {
    // Set .ejs as the default template extension
    app.set('view engine', 'ejs');

    // Tell express where it can find the templates
    app.set('views', __dirname + '/views');

    //Declaracion de la carpeta public
    app.use('*/public', express.static('public'));
}