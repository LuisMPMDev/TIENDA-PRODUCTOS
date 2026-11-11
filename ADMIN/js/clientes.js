//clientes.js: listado (buscar / editar / eliminar) y formulario (crear / editar) de clientes
(() => {
    const CLAVE = Admin.K.clientes;

    //---------- listado ----------
    const tbody = document.querySelector("#tabla-clientes");
    if (tbody) {
        const buscador = document.querySelector("#buscador");

        const pintar = () => {
            const q = buscador.value.trim().toLowerCase();
            const lista = Admin.leer(CLAVE).filter((c) =>
                [c.nombre, c.apellido, c.email, c.celular, c.direccion, c.direccion2].join(" ").toLowerCase().includes(q));

            if (lista.length == 0) {
                tbody.innerHTML = `<tr><td colspan="7" class="text-center">No hay clientes</td></tr>`;
                return;
            }
            tbody.innerHTML = lista.map((c) => `
                <tr>
                    <td>${c.id}</td>
                    <td>${Admin.esc(c.nombre)}</td>
                    <td>${Admin.esc(c.apellido)}</td>
                    <td>${Admin.esc(c.email)}</td>
                    <td>${Admin.esc(c.celular)}</td>
                    <td>${Admin.esc(c.direccion)} ${Admin.esc(c.direccion2)}</td>
                    <td>
                        <a href="crear-cliente.html?id=${c.id}" class="btn btn-sm btn-warning">Editar</a>
                        ${Admin.puede("eliminar") ? `<button class="btn btn-sm btn-danger" data-eliminar="${c.id}">Eliminar</button>` : ""}
                    </td>
                </tr>`).join("");
        };

        tbody.addEventListener("click", (e) => {
            const btn = e.target.closest("[data-eliminar]");
            if (!btn) return;
            if (!confirm("¿Eliminar este cliente? No se puede deshacer.")) return;
            Admin.eliminar(CLAVE, btn.dataset.eliminar);
            Admin.aviso("Cliente eliminado");
            pintar();
        });
        buscador.addEventListener("input", pintar);
        pintar();
    }

    //---------- formulario ----------
    const form = document.querySelector("#formulario-cliente");
    if (form) {
        const campos = {
            nombre: document.querySelector("#nombre-cli"),
            apellido: document.querySelector("#apellido-cli"),
            email: document.querySelector("#email-cli"),
            celular: document.querySelector("#celular-cli"),
            direccion: document.querySelector("#direccion-cli"),
            direccion2: document.querySelector("#direccion2-cli"),
            notas: document.querySelector("#descripcion-cli"),
        };

        //modo editar: crear-cliente.html?id=3
        const id = Admin.idURL();
        let cliente = null;
        if (id) {
            cliente = Admin.obtener(CLAVE, id);
            if (!cliente) {
                Admin.aviso("No existe el cliente que intentas editar", "danger");
                document.querySelector("#btn-guardar").disabled = true;
            } else {
                document.querySelector("#titulo").textContent = "Editar Cliente";
                document.querySelector("#btn-guardar").textContent = "Guardar Cambios";
                Object.keys(campos).forEach((k) => (campos[k].value = cliente[k] || ""));
            }
        }

        form.addEventListener("submit", (e) => {
            e.preventDefault();
            const datos = {};
            Object.keys(campos).forEach((k) => (datos[k] = campos[k].value.trim()));

            //el email identifica al cliente (la tienda tambien lo usa para no duplicarlo)
            const repetido = Admin.leer(CLAVE).some((c) => c.email.toLowerCase() == datos.email.toLowerCase() && (!cliente || c.id != cliente.id));
            if (repetido) return Admin.aviso("Ya existe un cliente con ese email", "danger");

            try {
                if (cliente) {
                    Admin.actualizar(CLAVE, cliente.id, datos);
                    Admin.flash("Cliente actualizado");
                } else {
                    Admin.crear(CLAVE, datos);
                    Admin.flash("Cliente creado");
                }
                location.href = "listado-clientes.html";
            } catch (err) {
                Admin.aviso(err.message, "danger");
            }
        });
    }
})();
