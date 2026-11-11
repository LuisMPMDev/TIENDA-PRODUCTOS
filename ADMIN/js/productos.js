//productos.js: listado (buscar / editar / eliminar) y formulario (crear / editar) de productos
(() => {
    const CLAVE = Admin.K.productos;

    //---------- listado ----------
    const tbody = document.querySelector("#tabla-productos");
    if (tbody) {
        const buscador = document.querySelector("#buscador");

        const pintar = () => {
            const q = buscador.value.trim().toLowerCase();
            const lista = Admin.leer(CLAVE).filter((p) =>
                [p.nombre, p.descripcion, p.precio, p.stock].join(" ").toLowerCase().includes(q));

            if (lista.length == 0) {
                tbody.innerHTML = `<tr><td colspan="7" class="text-center">No hay productos</td></tr>`;
                return;
            }
            tbody.innerHTML = lista.map((p) => `
                <tr>
                    <td>${p.id}</td>
                    <td>${Admin.esc(p.nombre)}</td>
                    <td>${Admin.esc(p.descripcion)}</td>
                    <td>${Admin.dinero(p.precio)}</td>
                    <td>${p.stock}</td>
                    <td><img src="${Admin.esc(p.imagen)}" width="60" alt=""></td>
                    <td>
                        <a href="crear-pro.html?id=${p.id}" class="btn btn-sm btn-warning">Editar</a>
                        ${Admin.puede("eliminar") ? `<button class="btn btn-sm btn-danger" data-eliminar="${p.id}">Eliminar</button>` : ""}
                    </td>
                </tr>`).join("");
        };

        tbody.addEventListener("click", (e) => {
            const btn = e.target.closest("[data-eliminar]");
            if (!btn) return;
            if (!confirm("¿Eliminar este producto? No se puede deshacer.")) return;
            Admin.eliminar(CLAVE, btn.dataset.eliminar);
            Admin.aviso("Producto eliminado");
            pintar();
        });
        buscador.addEventListener("input", pintar);
        pintar();
    }

    //---------- formulario ----------
    const form = document.querySelector("#formulario-producto");
    if (form) {
        const select = document.querySelector("#productos-select");
        const precio = document.querySelector("#precio-pro");
        const stock = document.querySelector("#stock-pro");
        const descripcion = document.querySelector("#descripcion-pro");
        const img = document.querySelector("#imagen-pro");
        let imagen = img.src;

        Admin.CATALOGO.forEach((c) => select.add(new Option(c.nombre, c.nombre)));

        //al elegir un producto del catalogo se llenan precio, imagen y descripcion
        select.addEventListener("change", () => {
            const c = Admin.CATALOGO.find((x) => x.nombre === select.value);
            if (!c) return;
            precio.value = c.precio;
            imagen = c.url;
            img.src = c.url;
            if (descripcion.value.trim() == "") descripcion.value = "Delicioso " + c.nombre.toLowerCase();
        });

        //modo editar: crear-pro.html?id=3
        const id = Admin.idURL();
        let producto = null;
        if (id) {
            producto = Admin.obtener(CLAVE, id);
            if (!producto) {
                Admin.aviso("No existe el producto que intentas editar", "danger");
                document.querySelector("#btn-guardar").disabled = true;
            } else {
                document.querySelector("#titulo").textContent = "Editar Producto";
                document.querySelector("#btn-guardar").textContent = "Guardar Cambios";
                if (![...select.options].some((o) => o.value === producto.nombre)) select.add(new Option(producto.nombre, producto.nombre));
                select.value = producto.nombre;
                precio.value = producto.precio;
                stock.value = producto.stock;
                descripcion.value = producto.descripcion;
                imagen = producto.imagen;
                img.src = imagen;
            }
        }

        form.addEventListener("submit", (e) => {
            e.preventDefault();
            const nombre = select.value;
            if (nombre == "") return Admin.aviso("Selecciona un producto", "danger");
            if (Number(precio.value) <= 0) return Admin.aviso("El precio debe ser mayor a 0", "danger");
            if (!Number.isInteger(Number(stock.value)) || Number(stock.value) < 0) return Admin.aviso("El stock debe ser un número entero (0 o más)", "danger");

            //no repetir nombre de producto
            const repetido = Admin.leer(CLAVE).some((p) => p.nombre.toLowerCase() == nombre.toLowerCase() && (!producto || p.id != producto.id));
            if (repetido) return Admin.aviso("Ya existe un producto con ese nombre", "danger");

            const datos = {
                nombre: nombre,
                descripcion: descripcion.value.trim(),
                precio: Number(precio.value),
                stock: Number(stock.value),
                imagen: imagen,
            };
            try {
                if (producto) {
                    Admin.actualizar(CLAVE, producto.id, datos);
                    Admin.flash("Producto actualizado");
                } else {
                    Admin.crear(CLAVE, datos);
                    Admin.flash("Producto creado");
                }
                location.href = "listado-pro.html";
            } catch (err) {
                Admin.aviso(err.message, "danger");
            }
        });
    }
})();
