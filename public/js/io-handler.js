var socket = io(), //Creo el socket
    configs = { //Creo una variable para guardar configuraciones
        name: "Anonimo",
        show_sv_notif: true,
        show_cnx_notif: true,
        name_color: "#333",
        bg_img: null,
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
    prv_id = $('#prv_id'),
    prv_dismiss = $('#prv_dismiss'),
    prv_kick = $('#prv_kick'),
    alert_modal = $('#alertModal'),
    alert_error = $('#alertError');

function emitir() { //Emito los mensajes nuevos
    var msj_class = configs.owner ? "owner" : "own"; //Seteo la clase depende del tipo de persona
    if (msg.val().length < 1) return; //Vuelvo si el mensaje esta vacio

    var s_prv_id = prv_id.val().length > 1 ? prv_id.val() : null; //Handle de mensajes privados
    if (s_prv_id) {
        socket.emit('prvt message', {
            msg: msg.val(),
            to: s_prv_id,
        });
    } else {
        var msj = replaceURLWithHTMLLinks(msg.val());
        socket.emit('chat message', {
            msg: msj,
        });
        chat.append($('<div class="media ' + msj_class + '">').html('<div class="media-body"><h5 class="media-heading" style="font-weight: bold">Yo: </h5>' + msj + '</div>'));
    }
    msg.val('');
    goBot();
};

function goBot() { //Voy al fondo del div de mensajes
    var height = chat[0].scrollHeight;
    chat.scrollTop(height);
    msg.focus();
}

function cambiarBg(img) { //Cambio el fondo
    if (img) {
        $('body').fadeTo('slow', 0.3, function() {
            $(this).css('background-image', 'url(' + img + ')');
        }).fadeTo('slow', 1);
    }
}

function setData() { //Guardo los datos del modal de configuracion
    var final_name = cm_name.val().replace(/[^0-9a-zA-Z ]+/g, "");
    var invalid_name = final_name.length > 15 || final_name.length < 2;

    configs.show_sv_notif = cm_svnot.prop('checked');
    configs.show_cnx_notif = cm_svcnx.prop('checked');

    if (invalid_name) {
        alert("Nombre invalido!");
    } else {
        configs.name = invalid_name ? configs.name : final_name;
        configs.show_sv_notif = cm_svnot.prop('checked');
        configs.show_cnx_notif = cm_svcnx.prop('checked');

        cm_name.val(final_name);

        socket.emit('changeData', {
            name: final_name
        });
    }
    goBot();
}

function setSala() { //Hago seteos a la sala en caso de ser el dueño
    cambiarBg(sm_img.val());
    socket.emit('changeRoom', {
        pass: sm_pass.val(),
        img: sm_img.val()
    });
    goBot();
}

function redirectSala() { //Redirijo a otra sala
    window.location.href = '/' + red_sala.val();
}

function setPrv(id) {
    if (configs.owner) prv_kick.show();
    prv_dismiss.show();
    prv_id.val(id);
    goBot();
}

function unsetPrv() {
    prv_kick.hide();
    prv_dismiss.hide();
    prv_id.val('');
    goBot();
}

function kickPrv() {
    socket.emit('kickPrv', prv_id.val());
    prv_kick.hide();
    prv_dismiss.hide();
    prv_id.val('');
    goBot();
}

function replaceURLWithHTMLLinks(text) {
    var exp = /(\b(((https?|ftp|file|):\/\/)|www[.])[-A-Z0-9+&@#\/%?=~_|!:,.;]*[-A-Z0-9+&@#\/%=~_|])/ig;
    text = text.replace(/.*?:\/\//g, "");
    text = text.replace(exp, "<a target='_blank' href='http://$1'>$1</a>");
    return text;
}

$(document).ready(function() { //Preparo el listener del enter
    msg.focus();
    msg.keyup(function(e) {
        if (e.keyCode == 13) emitir();
    });
    red_sala.keyup(function(e) {
        if (e.keyCode == 13) redirectSala();
    });
});

//Seteo los listeners del socket
socket.on('chat message', function(d) {
    var msj_class = d.owner ? "owner" : "other";
    d.color = d.owner ? "#fff" : d.color;
    chat.append($('<div class="media ' + msj_class + '">').html('<div class="media-body"><a href="#msg_input"><h5 onclick="setPrv(\'' + d.id + '\',\'' + d.usr + '\');" class="media-heading name" style="color:' + d.color + '; font-weight: bold;">' + d.usr + ':</h5></a>' + d.msg + '</div>'));
    goBot();
});

socket.on('prvt message', function(d) {
    chat.append($('<div class="media prvt">').html('<div class="media-body"><a href="#msg_input"><h5 onclick="setPrv(\'' + d.feedback + '\');" class="media-heading name" style="color:white; font-weight: bold;">' + d.usr_from + ' > ' + d.usr_to + ':</h5></a>' + d.msg + '</div>'));
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
    configs.name = d.name;

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
    if (d == "Fuiste expulsado de la sala") {
        chat.append($('<div class="media error">').html('<div class="media-body"><h5 class="media-heading">' + d + '</h5></div>'));
    }
    alert_error.text(d);
    alert_modal.modal('show');
    goBot();
});

socket.on('image message', image);

function image (data) {
    chat.append($('<button class="media image" onclick="previewImage(\''+data.img+'\',\''+data.username+'\')"><span class="label label-info">'+data.username+'</span></button>').css("background-image","url("+data.img+")"));
    goBot();
}

function previewImage(img,username){
    $.fancybox.open([{href : img, title: username}],{padding:5,closeBtn:true});
}

$('#imagefile').on('change', function(e) {
    //Get the first (and only one) file element
    //that is included in the original event
    var file = e.originalEvent.target.files[0],
        reader = new FileReader();
    //When the file has been read...
    reader.onload = function(evt) {
        //Because of how the file was read,
        //evt.target.result contains the image in base64 format
        //Nothing special, just creates an img element
        //and appends it to the DOM so my UI shows
        //that I posted an image.
        //send the image via Socket.io
        socket.emit('image message', evt.target.result);
    };
    //And now, read the image and base64
    reader.readAsDataURL(file);
});