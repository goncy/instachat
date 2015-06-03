var socket = io(), //Creo el socket
    configs = { //Creo una variable para guardar configuraciones
        name: "Anonimo",
        show_sv_notif: true,
        show_cnx_notif: true,
        name_color: "#333",
        bg_img: "",
        owner: false
    },
    msg = $('#msg_input'), //Defino la variable del msg input
    chat = $('#chat'),
    cm_name = $('#c_name'),
    cm_svnot = $('#c_sv_notif'),
    cm_svcnx = $('#c_cnx_notif'),
    cm_img = $('#c_img'),
    sm_pass = $('#c_pass'),
    sm_img = $('#c_img_sala'),
    red_sala = $('#sala_red'),
    prv_name = $('#prv_name'),
    prv_id = $('#prv_id'),
    prv_dismiss = $('#prv_dismiss');;

function emitir() { //Emito los mensajes nuevos
    var msj_class = configs.owner ? "owner" : "own"; //Seteo la clase depende del tipo de persona
    if (msg.val().length < 1) return; //Vuelvo si el mensaje esta vacio
    //Handle de mensajes privados
    var s_prv_name = prv_name.val().length > 1 ? prv_name.val() : null;
    var s_prv_id = prv_id.val().length > 1 ? prv_id.val() : null;
    if (s_prv_name && s_prv_id) {
        socket.emit('prvt message', {
            msg: msg.val(),
            to: s_prv_id,
            name: configs.name
        });
    } else {
        var msj = replaceURLWithHTMLLinks(msg.val());
        socket.emit('chat message', {
            msg: msj,
            name: configs.name
        }); //Emito el msj al servidor
        chat.append($('<div class="media ' + msj_class + '">').html('<div class="media-body"><h5 class="media-heading" style="font-weight: bold">Yo: </h5>' + msj + '</div>'));
    }
    msg.val(''); //Reseteo el campo de texto
    msg.focus(); //Le aplico foco
    goBot(); //Voy abajo de todo el div
};

function goBot() { //Voy al fondo del div de mensajes
    var height = chat[0].scrollHeight;
    chat.scrollTop(height);
}

function cambiarBg(img) { //Cambio el fondo
    $('body').fadeTo('slow', 0.3, function() {
        $(this).css('background-image', 'url(' + img + ')');
    }).fadeTo('slow', 1);
}

function setData() { //Guardo los datos del modal de configuracion
    var final_name = cm_name.val().replace(/[^0-9a-zA-Z]+/g, "")
    var invalid_name = final_name.length > 15 || final_name.length < 2;

    configs.show_sv_notif = cm_svnot.prop('checked');
    configs.show_cnx_notif = cm_svcnx.prop('checked');

    if (invalid_name) alert("Nombre invalido!");

    configs.name = invalid_name ? configs.name : final_name;
    configs.show_sv_notif = cm_svnot.prop('checked');
    configs.show_cnx_notif = cm_svcnx.prop('checked');

    socket.emit('changeData', {
        name: final_name
    });
}

function setSala() { //Hago seteos a la sala en caso de ser el dueño
    var imagen = sm_img.val() ? sm_img.val() : 'public/img/bg.png';
    if (configs.owner) {
        cambiarBg(imagen);
        socket.emit('changeRoom', {
            pass: sm_pass.val(),
            img: imagen
        });
    }
}

function redirectSala() { //Redirijo a otra sala
    window.location.href = '/' + red_sala.val();
}

function sendPrv(id, name) {
    prv_dismiss.show();
    prv_name.val(name);
    prv_id.val(id);
    msg.focus();
}

function prvDismiss() {
    prv_dismiss.hide();
    prv_name.val('');
    prv_id.val('');
}

function replaceURLWithHTMLLinks(text) {
    var exp = /(\b(((https?|ftp|file|):\/\/)|www[.])[-A-Z0-9+&@#\/%?=~_|!:,.;]*[-A-Z0-9+&@#\/%=~_|])/ig;
    text = text.replace(/.*?:\/\//g, "");
    text = text.replace(exp, "<a href='http://$1'>$1</a>");
    return text;
}

/*
function ytVidId(url) {
    var p = /^(?:https?:\/\/)?(?:www\.)?(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=))((\w|-){11})(?:\S+)?$/;
    var devolucion = (url.match(p)) ? '<iframe width="98.5%" height="200" src="http://www.youtube.com/embed/' + RegExp.$1 + '" frameborder="0" allowfullscreen></iframe><br>' + url : url.replace(/(<([^>]+)>)/ig, "")
    return devolucion;
}
*/

$(document).ready(function() { //Preparo el listener del enter
    msg.focus();
    msg.keyup(function(e) {
        if (e.keyCode == 13) emitir();
    });
});

//Seteo los listeners del socket
socket.on('chat message', function(d) {
    var msj_class = d.owner ? "owner" : "other";
    d.color = d.owner ? "#fff" : d.color;
    chat.append($('<div class="media ' + msj_class + '">').html('<div class="media-body"><a href="#msg_input"><h5 onclick="sendPrv(\'' + d.id + '\',\'' + d.usr + '\');" class="media-heading name" style="color:' + d.color + '; font-weight: bold;">' + d.usr + ':</h5></a>' + d.msg + '</div>'));
    goBot();
});

socket.on('prvt message', function(d) {
    chat.append($('<div class="media prvt">').html('<div class="media-body"><h5 class="media-heading name" style="color:white; font-weight: bold;">' + d.usr_from + ' > ' + d.usr_to + ':</h5>' + d.msg + '</div>'));
    goBot();
});

socket.on('server message', function(d) {
    if (configs.show_sv_notif) {
        switch (d.type) {
            case "cnx":
                if (configs.show_cnx_notif) chat.append($('<div class="media server">').html('<div class="media-body"><h5 class="media-heading">' + d.msg + '</h5></div>'));
                break;
            case "dcnx":
                if (configs.show_cnx_notif) chat.append($('<div class="media server">').html('<div class="media-body"><h5 class="media-heading"><span style="color:' + d.color + '; font-weight: bold;">' + d.usr + '</span> se desconectó.</h5></div>'));
                break;
            default:
                if (configs.show_sv_notif) chat.append($('<div class="media server">').html('<div class="media-body"><h5 class="media-heading">' + d.msg + '</h5></div>'));
        }
    }
    goBot();
});

socket.on('bienvenido', function(d) {
    configs.owner = d.owner;
    configs.color = d.color;

    if (d.img) {
        configs.bg_img = d.img;
        cambiarBg(configs.bg_img);
    }

    chat.append($('<div class="media server">').html('<div class="media-body"><h5 class="media-heading">' + d.msg + '</h5></div>'));
    goBot();
});

socket.on('changeRoom', function(d) {
    cambiarBg(d);
});

socket.on('alerta', function(d) {
    alert(d);
});