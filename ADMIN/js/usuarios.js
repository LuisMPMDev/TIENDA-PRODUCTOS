//usuarios.js: listado (buscar / filtrar por rol / editar / eliminar) y formulario (crear / editar) de usuarios
//este modulo es solo para el administrador (Admin.render() redirige a un vendedor)
(() => {
    const CLAVE = Admin.K.usuarios;
    const admins = () => Admin.leer(CLAVE).filter((u) => u.rol == "administrador");

    //---------- listado ----------
    const tbody = document.querySelector("#tabla-usuarios");
    if (tbody) {
        const buscador = document.querySelector("#buscador");
        const filtroRol = document.querySelector("#filtro-rol");

        const pintar = () => {
            const q = buscador.value.trim().toLowerCase();
            const lista = Admin.leer(CLAVE).filter((u) =>
                (filtroRol.value == "" || u.rol == filtroRol.value) && u.usuario.toLowerCase().includes(q));

            if (lista.length == 0) {
                tbody.innerHTML = `<tr><td colspan="5" class="text-center">No hay usuarios</td></tr>`;
                return;
            }
            tbody.innerHTML = lista.map((u) => `
                <tr>
                    <td>${u.id}</td>
                    <td>${Admin.esc(u.usuario)}</td>
                    <td><span class="badge badge-${u.rol == "administrador" ? "primary" : "secondary"}">${Admin.esc(u.rol)}</span></td>
                    <td>${Admin.esc(u.creado)}</td>
                    <td>
                        <a href="crear-usuario.html?id=${u.id}" class="btn btn-sm btn-warning">Editar</a>
                        ${Admin.puede("eliminar") ? `<button class="btn btn-sm btn-danger" data-eliminar="${u.id}">Eliminar</button>` : ""}
                    </td>
                </tr>`).join("");
        };

        tbody.addEventListener("click", (e) => {
            const btn = e.target.closest("[data-eliminar]");
            if (!btn) return;
            const u = Admin.obtener(CLAVE, btn.dataset.eliminar);
            if (u.id == Admin.sesion().id) return Admin.aviso("No puedes eliminar tu propio usuario", "danger");
            if (u.rol == "administrador" && admins().length <= 1) return Admin.aviso("Debe quedar al menos un administrador", "danger");
            if (!confirm("¿Eliminar al usuario " + u.usuario + "? No se puede deshacer.")) return;
            Admin.eliminar(CLAVE, u.id);
            Admin.aviso("Usuario eliminado");
            pintar();
        });
        buscador.addEventListener("input", pintar);
        filtroRol.addEventListener("change", pintar);
        pintar();
    }

    //---------- formulario ----------
    const form = document.querySelector("#formulario-usuario");
    if (form) {
        const rol = document.querySelector("#rol");
        const usuario = document.querySelector("#usuario");
        const contrasena = document.querySelector("#contrasena");
        const confirmar = document.querySelector("#confirmar_contrasena");

        //modo editar: crear-usuario.html?id=2 (la contrasena se deja vacia para no cambiarla)
        const id = Admin.idURL();
        let user = null;
        if (id) {
            user = Admin.obtener(CLAVE, id);
            if (!user) {
                Admin.aviso("No existe el usuario que intentas editar", "danger");
                document.querySelector("#btn-guardar").disabled = true;
            } else {
                document.querySelector("#titulo").textContent = "Editar Usuario";
                document.querySelector("#btn-guardar").textContent = "Guardar Cambios";
                rol.value = user.rol;
                usuario.value = user.usuario;
                contrasena.required = false;
                confirmar.required = false;
                document.querySelector("#ayuda-contrasena").textContent = "Déjala vacía para mantener la contraseña actual";
            }
        }

        form.addEventListener("submit", (e) => {
            e.preventDefault();
            const nombre = usuario.value.trim();
            if (nombre == "") return Admin.aviso("Escribe el nombre de usuario", "danger");
            if (contrasena.value !== confirmar.value) return Admin.aviso("Las contraseñas no coinciden", "danger");

            const repetido = Admin.leer(CLAVE).some((u) => u.usuario.toLowerCase() == nombre.toLowerCase() && (!user || u.id != user.id));
            if (repetido) return Admin.aviso("Ese nombre de usuario ya existe", "danger");

            //no dejar la tienda sin administradores
            if (user && user.rol == "administrador" && rol.value != "administrador" && admins().length <= 1) {
                return Admin.aviso("Debe quedar al menos un administrador", "danger");
            }

            try {
                if (user) {
                    const cambios = { usuario: nombre, rol: rol.value };
                    if (contrasena.value != "") cambios.contrasena = contrasena.value;
                    Admin.actualizar(CLAVE, user.id, cambios);
                    Admin.flash("Usuario actualizado");
                } else {
                    Admin.crear(CLAVE, { usuario: nombre, contrasena: contrasena.value, rol: rol.value, creado: Admin.hoy() });
                    Admin.flash("Usuario creado");
                }
                location.href = "listado-usuarios.html";
            } catch (err) {
                Admin.aviso(err.message, "danger");
            }
        });
    }
})();
