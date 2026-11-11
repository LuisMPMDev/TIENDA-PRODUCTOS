//auth.js: login y registro (login.html y register.html)
let mensaje = document.querySelector("#mensaje");

function mostrarMensaje(texto, tipo) {
    mensaje.innerHTML = `<div class="alert alert-${tipo}">${Admin.esc(texto)}</div>`;
}

//si ya hay sesion, ir al dashboard
if (Admin.sesion()) {
    location.replace("index.html");
}

let formLogin = document.querySelector("#form-login");
if (formLogin) {
    formLogin.addEventListener("submit", (e) => {
        e.preventDefault();
        let usuario = document.querySelector("#usuario").value;
        let contrasena = document.querySelector("#contrasena").value;
        if (Admin.login(usuario, contrasena)) {
            location.href = "index.html";
        } else {
            mostrarMensaje("Usuario o contraseña incorrectos", "danger");
        }
    });
}

let formRegistro = document.querySelector("#form-registro");
if (formRegistro) {
    formRegistro.addEventListener("submit", (e) => {
        e.preventDefault();
        let usuario = document.querySelector("#usuario").value;
        let contrasena = document.querySelector("#contrasena").value;
        let repetir = document.querySelector("#repetir").value;

        if (contrasena !== repetir) {
            mostrarMensaje("Las contraseñas no coinciden", "danger");
            return;
        }
        if (!Admin.registrar(usuario, contrasena)) {
            mostrarMensaje("Ese nombre de usuario ya existe", "danger");
            return;
        }
        //entrar de una vez con la cuenta creada
        Admin.login(usuario, contrasena);
        location.href = "index.html";
    });
}
