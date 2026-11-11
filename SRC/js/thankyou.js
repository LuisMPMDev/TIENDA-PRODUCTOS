//variables globales
let nombreCliente = document.querySelector(".cliente-nombre");
let numeroOrden = document.querySelector(".orden-numero");
let productosPedido = document.querySelector(".productos-pedido");
let datosEntrega = document.querySelector(".datos-entrega");
let pedidoSubtotal = document.querySelector(".pedido-subtotal");
let pedidoDestino = document.querySelector(".pedido-destino");
let pedidoDomicilio = document.querySelector(".pedido-domicilio");
let pedidoDescuento = document.querySelector(".pedido-descuento");
let pedidoMetodo = document.querySelector(".pedido-metodo");
let pedidoRecargo = document.querySelector(".pedido-recargo");
let pedidoTotal = document.querySelector(".pedido-total");
let btnGracias = document.querySelector(".btn-gracias");

//agregar evento al navegador
document.addEventListener("DOMContentLoaded", ()=>{
    cargarPedido();
})

//funcion para cargar el pedido guardado en localStorage
function cargarPedido() {
    let pedido = JSON.parse(localStorage.getItem("pro-pedido"));

    //si no hay pedido volver al inicio
    if( pedido == null ){
        location.href = "index.html";
        return;
    }

    nombreCliente.textContent = pedido.cliente.nombres;
    numeroOrden.textContent = pedido.orden;

    //cargar productos
    productosPedido.innerHTML = "";
    Object.values(pedido.productos).forEach((producto)=>{
        let cantidad = producto.cantidad || 1;
        let fila = document.createElement("div");
        fila.classList.add("d-flex", "justify-content-between", "mb-2");
        fila.innerHTML = `
            <span>${producto.nombre} x ${cantidad}</span>
            <span>$ ${ (producto.precio * cantidad).toFixed(3) }</span>
        `;
        productosPedido.appendChild(fila);
    });

    //cargar datos de entrega
    datosEntrega.innerHTML = `
        ${pedido.cliente.nombres} ${pedido.cliente.apellidos}<br>
        ${pedido.cliente.email}<br>
        ${pedido.cliente.celular}<br>
        ${pedido.cliente.direccion} ${pedido.cliente.direccion2}<br>
        ${pedido.destino}
        ${ pedido.cliente.notas ? "<br><em>" + pedido.cliente.notas + "</em>" : "" }
    `;

    //cargar resumen de valores
    pedidoSubtotal.textContent = pedido.subtotal;
    pedidoDestino.textContent = pedido.destino;
    pedidoDomicilio.textContent = pedido.docimicilo;
    pedidoDescuento.textContent = pedido.descuento;
    pedidoMetodo.textContent = `${pedido.metodoPago} (${pedido.porcentajeRecargo}%)`;
    pedidoRecargo.textContent = pedido.recargo;
    pedidoTotal.textContent = pedido.totalApagar;
}

//evento al boton para realizar otra compra
btnGracias.addEventListener("click", ()=>{
    location.href = "index.html";
});
