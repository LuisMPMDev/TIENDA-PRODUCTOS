//admin-core.js: datos (localStorage), sesion, permisos por rol y layout compartido del panel admin
const Admin = (() => {
    //claves de localStorage (la tienda, SRC/js/checkout.js, escribe en adm-clientes y adm-pedidos)
    const K = {
        productos: "adm-productos",
        clientes: "adm-clientes",
        pedidos: "adm-pedidos",
        usuarios: "adm-usuarios",
        sesion: "adm-sesion",
        aviso: "adm-aviso",
    };

    const ESTADOS = ["pendiente", "en proceso", "enviado", "entregado", "cancelado"];

    //permisos por rol
    const PERMISOS = {
        administrador: ["crear", "leer", "editar", "eliminar"],
        vendedor: ["crear", "leer", "editar"],
    };
    //modulos que solo puede ver el administrador (un vendedor podria darse el rol admin)
    const SOLO_ADMIN = ["usuarios"];

    const PAGINAS_PUBLICAS = /(login|register)\.html$/;

    //productos que se pueden elegir al crear un producto
    const CATALOGO = [
        { nombre: "Hamburguesa", precio: 30000, url: "https://th.bing.com/th/id/R.c691ed37c9ce3040c3ebd2892e88870c?rik=QUBcFflN%2b9oqPQ&pid=ImgRaw&r=0" },
        { nombre: "Pizza", precio: 45000, url: "https://www.ocu.org/-/media/ocu/images/home/alimentacion/alimentos/pizzas_selector_1600x900.jpg?rev=6a81e278-07fc-4e95-9ba1-361063f35adf&hash=B8B1264AB6FC3F4B1AE140EB390208CD" },
        { nombre: "Pasta", precio: 25000, url: "https://cdn.shopify.com/s/files/1/2538/5286/products/Spaghetti-with-Meat-Sauce-Recipe-1-1200_787x787.jpg?v=1588772697" },
        { nombre: "Perro", precio: 22000, url: "https://th.bing.com/th/id/OIP.2QjcuwsTimAImo8WSQdTdAHaFp?rs=1&pid=ImgDetMain" },
        { nombre: "Burrito", precio: 25000, url: "https://th.bing.com/th/id/R.1a7d6f0af7be590eb4e27d96ce3530e5?rik=eiCcb%2f%2b9TYNzXQ&pid=ImgRaw&r=0" },
        { nombre: "Tacos", precio: 26000, url: "https://th.bing.com/th/id/R.d50b293e5d2de51d349691db78f71f8c?rik=FfttXcgxjuqR%2fQ&pid=ImgRaw&r=0" },
        { nombre: "Pollo", precio: 35000, url: "https://th.bing.com/th/id/OIP.IAza-1yPPvzA55qlI0VqvQHaF7?w=744&h=595&rs=1&pid=ImgDetMain" },
        { nombre: "Chuzo", precio: 22000, url: "https://th.bing.com/th/id/R.c0d3de5bd13edcc5323d074e4ba8f864?rik=lFbTsZF0ESAN5w&pid=ImgRaw&r=0" },
        { nombre: "Sanchipapa", precio: 20000, url: "https://1.bp.blogspot.com/-6lKIIVq3CXw/WK8raCAD-gI/AAAAAAABMnI/5VoCplTPogASfSZS5XzIFZizMBZ8yO8bQCLcB/s1600/salchipapa%2Bcolombiana.png" },
        { nombre: "Picada", precio: 65000, url: "https://cdn.colombia.com/gastronomia/2016/06/21/picada-colombiana-2990.jpg" },
    ];

    const MODULOS = [
        { id: "productos", icono: "fa-box", titulo: "Productos", listado: "listado-pro.html", crear: "crear-pro.html" },
        { id: "clientes", icono: "fa-users", titulo: "Clientes", listado: "listado-clientes.html", crear: "crear-cliente.html" },
        { id: "pedidos", icono: "fa-shopping-cart", titulo: "Pedidos", listado: "listado-pedidos.html", crear: "crear-pedido.html" },
        { id: "usuarios", icono: "fa-user-tie", titulo: "Usuarios", listado: "listado-usuarios.html", crear: "crear-usuario.html" },
    ];

    //-------- utilidades --------
    //escapar texto antes de meterlo en innerHTML (evita inyectar HTML con datos del usuario)
    const esc = (t) => String(t ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
    const dinero = (n) => "$" + Number(n || 0).toLocaleString("es-CO");
    const hoy = () => new Date().toISOString().slice(0, 10);
    const idURL = () => new URLSearchParams(location.search).get("id");

    //-------- localStorage --------
    function leer(clave) {
        try {
            let datos = JSON.parse(localStorage.getItem(clave));
            return Array.isArray(datos) ? datos : [];
        } catch (e) {
            return [];
        }
    }
    function guardar(clave, lista) {
        localStorage.setItem(clave, JSON.stringify(lista));
    }
    function obtener(clave, id) {
        return leer(clave).find((x) => x.id == id) || null;
    }

    //-------- sesion y permisos --------
    //la sesion se valida contra la tabla de usuarios, asi un cambio de rol aplica de inmediato
    function sesion() {
        try {
            let s = JSON.parse(localStorage.getItem(K.sesion));
            if (!s) return null;
            let u = leer(K.usuarios).find((x) => x.id == s.id);
            return u ? { id: u.id, usuario: u.usuario, rol: u.rol } : null;
        } catch (e) {
            return null;
        }
    }
    function puede(accion) {
        let s = sesion();
        return !!s && (PERMISOS[s.rol] || []).includes(accion);
    }
    function exigir(accion) {
        if (!puede(accion)) throw new Error("Tu rol no permite la accion: " + accion);
    }

    //-------- CRUD generico --------
    function crear(clave, obj) {
        exigir("crear");
        let lista = leer(clave);
        obj.id = lista.reduce((m, x) => Math.max(m, x.id), 0) + 1;
        lista.push(obj);
        guardar(clave, lista);
        return obj;
    }
    function actualizar(clave, id, cambios) {
        exigir("editar");
        let lista = leer(clave);
        let i = lista.findIndex((x) => x.id == id);
        if (i < 0) return null;
        lista[i] = { ...lista[i], ...cambios, id: lista[i].id };
        guardar(clave, lista);
        return lista[i];
    }
    function eliminar(clave, id) {
        exigir("eliminar");
        guardar(clave, leer(clave).filter((x) => x.id != id));
    }

    //-------- usuarios / login --------
    function login(usuario, contrasena) {
        let u = leer(K.usuarios).find((x) => x.usuario.toLowerCase() == usuario.trim().toLowerCase() && x.contrasena == contrasena);
        if (!u) return false;
        localStorage.setItem(K.sesion, JSON.stringify({ id: u.id }));
        return true;
    }
    function logout() {
        localStorage.removeItem(K.sesion);
        location.href = "login.html";
    }
    //registro publico: siempre crea rol vendedor
    function registrar(usuario, contrasena) {
        let lista = leer(K.usuarios);
        if (lista.some((x) => x.usuario.toLowerCase() == usuario.trim().toLowerCase())) return false;
        lista.push({
            id: lista.reduce((m, x) => Math.max(m, x.id), 0) + 1,
            usuario: usuario.trim(),
            contrasena: contrasena,
            rol: "vendedor",
            creado: hoy(),
        });
        guardar(K.usuarios, lista);
        return true;
    }

    //-------- datos iniciales --------
    function sembrar() {
        if (localStorage.getItem(K.usuarios) === null) {
            guardar(K.usuarios, [
                { id: 1, usuario: "admin", contrasena: "admin123", rol: "administrador", creado: hoy() },
                { id: 2, usuario: "vendedor", contrasena: "vendedor123", rol: "vendedor", creado: hoy() },
            ]);
        }
        if (localStorage.getItem(K.productos) === null) {
            guardar(K.productos, CATALOGO.map((c, i) => ({
                id: i + 1, nombre: c.nombre, descripcion: "Delicioso " + c.nombre.toLowerCase(),
                precio: c.precio, stock: 20, imagen: c.url,
            })));
        }
    }

    //-------- mensajes --------
    function aviso(texto, tipo = "success") {
        let cont = document.querySelector(".container-fluid");
        let div = document.createElement("div");
        div.className = "alert alert-" + tipo;
        div.setAttribute("role", "alert");
        div.textContent = texto;
        cont.prepend(div);
        setTimeout(() => div.remove(), 4000);
    }
    //mensaje que se muestra en la pagina siguiente (ej: despues de guardar y volver al listado)
    function flash(texto) {
        sessionStorage.setItem(K.aviso, texto);
    }

    //-------- guardia: sin sesion, a login --------
    function guardia() {
        if (PAGINAS_PUBLICAS.test(location.pathname)) return;
        if (!sesion()) location.replace("login.html");
    }

    //-------- layout: sidebar, topbar y modal de logout --------
    function render() {
        let s = sesion();
        if (!s) return;
        let modulo = document.body.dataset.modulo || "dashboard";
        let pagina = document.body.dataset.pagina || "";

        if (SOLO_ADMIN.includes(modulo) && s.rol !== "administrador") {
            alert("Solo el administrador puede entrar a este modulo");
            location.replace("index.html");
            return;
        }

        let html = `
            <a class="sidebar-brand d-flex align-items-center justify-content-center" href="index.html">
                <div class="sidebar-brand-icon rotate-n-15"><i class="fas fa-laugh-wink"></i></div>
                <div class="sidebar-brand-text mx-3">Tienda</div>
            </a>
            <hr class="sidebar-divider my-0">
            <li class="nav-item ${modulo === "dashboard" ? "active" : ""}">
                <a class="nav-link" href="index.html"><i class="fas fa-fw fa-tachometer-alt"></i><span>Dashboard</span></a>
            </li>
            <hr class="sidebar-divider">
            <div class="sidebar-heading">Módulos</div>`;

        MODULOS.filter((m) => !SOLO_ADMIN.includes(m.id) || s.rol === "administrador").forEach((m) => {
            let abierto = modulo === m.id;
            html += `
            <li class="nav-item">
                <a class="nav-link ${abierto ? "" : "collapsed"}" href="#" data-toggle="collapse" data-target="#collapse${m.id}"
                    aria-expanded="${abierto}" aria-controls="collapse${m.id}">
                    <i class="fas fa-fw ${m.icono}"></i><span>${m.titulo}</span>
                </a>
                <div id="collapse${m.id}" class="collapse ${abierto ? "show" : ""}" data-parent="#accordionSidebar">
                    <div class="bg-white py-2 collapse-inner rounded">
                        <h6 class="collapse-header">Acciones:</h6>
                        <a class="collapse-item ${abierto && pagina === "listado" ? "active" : ""}" href="${m.listado}">Ver ${m.titulo}</a>
                        <a class="collapse-item ${abierto && pagina === "crear" ? "active" : ""}" href="${m.crear}">Crear ${m.titulo}</a>
                    </div>
                </div>
            </li>`;
        });

        html += `
            <hr class="sidebar-divider">
            <li class="nav-item">
                <a class="nav-link" href="../SRC/index.html"><i class="fas fa-fw fa-store"></i><span>Ir a la tienda</span></a>
            </li>
            <hr class="sidebar-divider">
            <div class="text-center d-none d-md-inline"><button class="rounded-circle border-0" id="sidebarToggle"></button></div>`;
        document.querySelector("#accordionSidebar").innerHTML = html;

        document.querySelector("#topbar").innerHTML = `
            <button id="sidebarToggleTop" class="btn btn-link d-md-none rounded-circle mr-3"><i class="fa fa-bars"></i></button>
            <ul class="navbar-nav ml-auto">
                <li class="nav-item dropdown no-arrow">
                    <a class="nav-link dropdown-toggle" href="#" id="userDropdown" role="button" data-toggle="dropdown" aria-haspopup="true" aria-expanded="false">
                        <span class="mr-2 d-none d-lg-inline text-gray-600 small">${esc(s.usuario)} (${esc(s.rol)})</span>
                        <img class="img-profile rounded-circle" src="img/undraw_profile.svg">
                    </a>
                    <div class="dropdown-menu dropdown-menu-right shadow animated--grow-in" aria-labelledby="userDropdown">
                        <a class="dropdown-item" href="#" data-toggle="modal" data-target="#logoutModal">
                            <i class="fas fa-sign-out-alt fa-sm fa-fw mr-2 text-gray-400"></i> Cerrar sesión
                        </a>
                    </div>
                </li>
            </ul>`;

        let modal = document.createElement("div");
        modal.innerHTML = `
            <div class="modal fade" id="logoutModal" tabindex="-1" role="dialog" aria-hidden="true">
                <div class="modal-dialog" role="document">
                    <div class="modal-content">
                        <div class="modal-header">
                            <h5 class="modal-title">¿Cerrar sesión?</h5>
                            <button class="close" type="button" data-dismiss="modal" aria-label="Close"><span aria-hidden="true">×</span></button>
                        </div>
                        <div class="modal-body">Selecciona "Cerrar sesión" si quieres terminar tu sesión actual.</div>
                        <div class="modal-footer">
                            <button class="btn btn-secondary" type="button" data-dismiss="modal">Cancelar</button>
                            <button class="btn btn-primary" type="button" id="btn-logout">Cerrar sesión</button>
                        </div>
                    </div>
                </div>
            </div>`;
        document.body.appendChild(modal);
        document.querySelector("#btn-logout").addEventListener("click", logout);

        //mensaje pendiente de la pagina anterior
        let pendiente = sessionStorage.getItem(K.aviso);
        if (pendiente) {
            sessionStorage.removeItem(K.aviso);
            aviso(pendiente);
        }
    }

    sembrar();
    guardia();

    return {
        K, ESTADOS, CATALOGO, esc, dinero, hoy, idURL,
        leer, guardar, obtener, crear, actualizar, eliminar,
        sesion, puede, login, logout, registrar, aviso, flash, render,
    };
})();
