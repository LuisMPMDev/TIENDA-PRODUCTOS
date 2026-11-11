//dashboard.js: totales y resumen calculados con los datos guardados en localStorage
(() => {
    const productos = Admin.leer(Admin.K.productos);
    const clientes = Admin.leer(Admin.K.clientes);
    const pedidos = Admin.leer(Admin.K.pedidos);

    document.querySelector("#total-productos").textContent = productos.length;
    document.querySelector("#total-clientes").textContent = clientes.length;
    document.querySelector("#total-pedidos").textContent = pedidos.length;
    document.querySelector("#total-ventas").textContent = Admin.dinero(
        pedidos.filter((p) => p.estado != "cancelado").reduce((s, p) => s + p.total, 0));

    //pedidos por estado (barra de progreso)
    document.querySelector("#por-estado").innerHTML = Admin.ESTADOS.map((estado) => {
        const n = pedidos.filter((p) => p.estado == estado).length;
        const pct = pedidos.length ? Math.round((n * 100) / pedidos.length) : 0;
        return `
            <h4 class="small font-weight-bold">${estado} <span class="float-right">${n}</span></h4>
            <div class="progress mb-3">
                <div class="progress-bar" role="progressbar" style="width: ${pct}%"></div>
            </div>`;
    }).join("");

    //ultimos 5 pedidos
    const ultimos = [...pedidos].sort((a, b) => b.id - a.id).slice(0, 5);
    document.querySelector("#ultimos-pedidos").innerHTML = ultimos.length
        ? ultimos.map((p) => `
            <tr>
                <td>${p.id}</td>
                <td>${Admin.esc(p.cliente)}</td>
                <td>${Admin.esc(p.fecha)}</td>
                <td>${Admin.dinero(p.total)}</td>
                <td>${Admin.esc(p.estado)}</td>
            </tr>`).join("")
        : `<tr><td colspan="5" class="text-center">Aún no hay pedidos</td></tr>`;
})();
