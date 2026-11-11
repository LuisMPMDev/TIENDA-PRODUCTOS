//pedidos.js: listado (buscar / filtrar por estado / ver / cambiar estado / eliminar) y formulario (crear / editar)
(() => {
    const CLAVE = Admin.K.pedidos;

    //---------- listado ----------
    const tbody = document.querySelector("#tabla-pedidos");
    if (tbody) {
        const buscador = document.querySelector("#buscador");
        const filtroEstado = document.querySelector("#filtro-estado");
        Admin.ESTADOS.forEach((e) => filtroEstado.add(new Option(e, e)));

        const pintar = () => {
            const q = buscador.value.trim().toLowerCase();
            const estado = filtroEstado.value;
            const lista = Admin.leer(CLAVE)
                .filter((p) => (estado == "" || p.estado == estado)
                    && [p.id, p.cliente, p.email, p.fecha, p.metodoPago].join(" ").toLowerCase().includes(q))
                .sort((a, b) => b.id - a.id);

            if (lista.length == 0) {
                tbody.innerHTML = `<tr><td colspan="7" class="text-center">No hay pedidos</td></tr>`;
                return;
            }
            tbody.innerHTML = lista.map((p) => `
                <tr>
                    <td>${p.id}</td>
                    <td>${Admin.esc(p.cliente)}</td>
                    <td>${Admin.esc(p.email)}</td>
                    <td>${Admin.esc(p.fecha)}</td>
                    <td>${Admin.dinero(p.total)}</td>
                    <td>
                        <select class="form-control form-control-sm cambiar-estado" data-id="${p.id}">
                            ${Admin.ESTADOS.map((e) => `<option value="${e}" ${e == p.estado ? "selected" : ""}>${e}</option>`).join("")}
                        </select>
                    </td>
                    <td>
                        <button class="btn btn-sm btn-info" data-ver="${p.id}">Ver</button>
                        <a href="crear-pedido.html?id=${p.id}" class="btn btn-sm btn-warning">Editar</a>
                        ${Admin.puede("eliminar") ? `<button class="btn btn-sm btn-danger" data-eliminar="${p.id}">Eliminar</button>` : ""}
                    </td>
                </tr>`).join("");
        };

        tbody.addEventListener("click", (e) => {
            const ver = e.target.closest("[data-ver]");
            if (ver) {
                const p = Admin.obtener(CLAVE, ver.dataset.ver);
                document.querySelector("#detalle-titulo").textContent = "Pedido #" + p.id;
                document.querySelector("#detalle-cuerpo").innerHTML = `
                    <p><strong>Cliente:</strong> ${Admin.esc(p.cliente)} (${Admin.esc(p.email)})<br>
                    <strong>Fecha:</strong> ${Admin.esc(p.fecha)} &nbsp; <strong>Pago:</strong> ${Admin.esc(p.metodoPago)}
                    &nbsp; <strong>Origen:</strong> ${Admin.esc(p.origen || "admin")}</p>
                    ${p.notas ? `<p><strong>Notas:</strong> ${Admin.esc(p.notas)}</p>` : ""}
                    <table class="table table-sm">
                        <thead><tr><th>Producto</th><th>Precio</th><th>Cant.</th><th>Subtotal</th></tr></thead>
                        <tbody>${p.productos.map((x) => `
                            <tr><td>${Admin.esc(x.nombre)}</td><td>${Admin.dinero(x.precio)}</td><td>${x.cantidad}</td>
                            <td>${Admin.dinero(x.precio * x.cantidad)}</td></tr>`).join("")}</tbody>
                    </table>
                    <p class="mb-0">Descuento: ${Admin.dinero(p.descuento)} &nbsp; Envío / recargo: ${Admin.dinero(p.aumento)}</p>
                    <h5 class="mt-2">Total: ${Admin.dinero(p.total)}</h5>`;
                $("#modalDetalle").modal("show");
                return;
            }
            const del = e.target.closest("[data-eliminar]");
            if (del) {
                if (!confirm("¿Eliminar este pedido? No se puede deshacer.")) return;
                Admin.eliminar(CLAVE, del.dataset.eliminar);
                Admin.aviso("Pedido eliminado");
                pintar();
            }
        });

        //cambiar el estado desde la tabla (vendedor y admin pueden editar)
        tbody.addEventListener("change", (e) => {
            const sel = e.target.closest(".cambiar-estado");
            if (!sel) return;
            try {
                Admin.actualizar(CLAVE, sel.dataset.id, { estado: sel.value });
                Admin.aviso("Estado del pedido #" + sel.dataset.id + " actualizado");
            } catch (err) {
                Admin.aviso(err.message, "danger");
            }
        });

        buscador.addEventListener("input", pintar);
        filtroEstado.addEventListener("change", pintar);
        pintar();
    }

    //---------- formulario ----------
    const form = document.querySelector("#formulario-pedido");
    if (form) {
        const selCliente = document.querySelector("#id_cliente");
        const selMetodo = document.querySelector("#metodo_pago");
        const selEstado = document.querySelector("#estado");
        const selProducto = document.querySelector("#id_producto");
        const cantidad = document.querySelector("#cantidad");
        const tbodyCarrito = document.querySelector("#tabla-carrito tbody");
        const descuento = document.querySelector("#descuento");
        const aumento = document.querySelector("#aumento");
        const totalSpan = document.querySelector("#total-pedido");

        let items = []; // productos del pedido: {nombre, precio, cantidad, imagen}

        Admin.leer(Admin.K.clientes).forEach((c) => selCliente.add(new Option(`${c.nombre} ${c.apellido} (${c.email})`, c.id)));
        Admin.leer(Admin.K.productos).forEach((p) => selProducto.add(new Option(`${p.nombre} - ${Admin.dinero(p.precio)}`, p.id)));
        Admin.ESTADOS.forEach((e) => selEstado.add(new Option(e, e)));

        const subtotal = () => items.reduce((s, x) => s + x.precio * x.cantidad, 0);
        const total = () => Math.max(0, subtotal() - Number(descuento.value || 0) + Number(aumento.value || 0));

        const pintar = () => {
            if (items.length == 0) {
                tbodyCarrito.innerHTML = `<tr><td colspan="5" class="text-center">Aún no hay productos</td></tr>`;
            } else {
                tbodyCarrito.innerHTML = items.map((x, i) => `
                    <tr>
                        <td>${Admin.esc(x.nombre)}</td>
                        <td>${Admin.dinero(x.precio)}</td>
                        <td>${x.cantidad}</td>
                        <td>${Admin.dinero(x.precio * x.cantidad)}</td>
                        <td><button type="button" class="btn btn-sm btn-danger" data-quitar="${i}">X</button></td>
                    </tr>`).join("");
            }
            totalSpan.textContent = Admin.dinero(total());
        };

        document.querySelector("#btn-agregar").addEventListener("click", () => {
            const p = Admin.obtener(Admin.K.productos, selProducto.value);
            const cant = Number(cantidad.value);
            if (!p) return Admin.aviso("Selecciona un producto", "danger");
            if (!Number.isInteger(cant) || cant < 1) return Admin.aviso("La cantidad debe ser un entero mayor a 0", "danger");
            const existente = items.find((x) => x.nombre == p.nombre);
            if (existente) {
                existente.cantidad += cant;
            } else {
                items.push({ nombre: p.nombre, precio: p.precio, cantidad: cant, imagen: p.imagen });
            }
            cantidad.value = 1;
            pintar();
        });
        tbodyCarrito.addEventListener("click", (e) => {
            const btn = e.target.closest("[data-quitar]");
            if (!btn) return;
            items.splice(Number(btn.dataset.quitar), 1);
            pintar();
        });
        descuento.addEventListener("input", pintar);
        aumento.addEventListener("input", pintar);

        //modo editar: crear-pedido.html?id=3
        const id = Admin.idURL();
        let pedido = null;
        if (id) {
            pedido = Admin.obtener(CLAVE, id);
            if (!pedido) {
                Admin.aviso("No existe el pedido que intentas editar", "danger");
                document.querySelector("#btn-guardar").disabled = true;
            } else {
                document.querySelector("#titulo").textContent = "Editar Pedido #" + pedido.id;
                document.querySelector("#btn-guardar").textContent = "Guardar Cambios";
                //si el cliente ya no existe, se deja el nombre guardado en el pedido
                if (![...selCliente.options].some((o) => o.value == pedido.clienteId)) selCliente.add(new Option(pedido.cliente + " (eliminado)", pedido.clienteId));
                selCliente.value = pedido.clienteId;
                selMetodo.value = pedido.metodoPago;
                selEstado.value = pedido.estado;
                descuento.value = pedido.descuento;
                aumento.value = pedido.aumento;
                items = pedido.productos.map((x) => ({ ...x }));
            }
        }
        pintar();

        form.addEventListener("submit", (e) => {
            e.preventDefault();
            if (items.length == 0) return Admin.aviso("Agrega al menos un producto al pedido", "danger");
            if (Number(descuento.value) > subtotal() + Number(aumento.value || 0)) return Admin.aviso("El descuento no puede ser mayor al valor del pedido", "danger");

            const c = Admin.obtener(Admin.K.clientes, selCliente.value);
            const datos = {
                //si el cliente se borro, se conservan los datos que ya tenia el pedido
                clienteId: c ? c.id : pedido.clienteId,
                cliente: c ? `${c.nombre} ${c.apellido}` : pedido.cliente,
                email: c ? c.email : pedido.email,
                metodoPago: selMetodo.value,
                estado: selEstado.value,
                productos: items,
                descuento: Number(descuento.value || 0),
                aumento: Number(aumento.value || 0),
                total: total(),
            };
            try {
                if (pedido) {
                    Admin.actualizar(CLAVE, pedido.id, datos);
                    Admin.flash("Pedido actualizado");
                } else {
                    datos.fecha = Admin.hoy();
                    datos.origen = "admin";
                    Admin.crear(CLAVE, datos);
                    Admin.flash("Pedido creado");
                }
                location.href = "listado-pedidos.html";
            } catch (err) {
                Admin.aviso(err.message, "danger");
            }
        });
    }
})();
