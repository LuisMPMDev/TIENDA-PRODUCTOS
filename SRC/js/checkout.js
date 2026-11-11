//variables globales
let contenedorProductos = document.querySelector(".productos");
let resumenSubTotal = document.querySelector(".res-sub-total");
let resumenDescuento = document.querySelector(".promo");
let resumenTotal = document.querySelector(".total");
let destino = document.querySelector(".destino");
let resumenDomicilo = document.querySelector(".valor-domi");
let resumenRecargo = document.querySelector(".recargo");
let porcentajeRecargo = document.querySelector(".porcentaje-recargo");
let btnPagar = document.querySelector(".btn-checkout");
let metodosPago = document.querySelectorAll("input[name='radio']");

//datos de entrega
let nombres = document.querySelector("#nombres-input");
let apellidos = document.querySelector("#apellidos-input");
let email = document.querySelector("#email-input");
let celular = document.querySelector("#celular-input");
let direccion = document.querySelector("#direccion-input");
let direccion2 = document.querySelector("#direccion-2-input");
let notas = document.querySelector("#additiona-note");

//resumen guardado desde el carrito
let resumenCarrito = JSON.parse(localStorage.getItem("pro-resumen"));

//agregar evento al navegador
document.addEventListener("DOMContentLoaded", ()=>{
    //si no hay resumen o productos, volver al carrito
    if( resumenCarrito == null || resumenCarrito.productos.length == 0 ){
        location.href = "cart.html";
        return;
    }
    cargarProductos();
    cargarCliente();
    resumenCompra();
})

//funcion cargar productos del resumen
function cargarProductos() {
    let todosProductos = Object.values(resumenCarrito.productos);

    //limpiar contenedor
    contenedorProductos.innerHTML = "";

    todosProductos.forEach((producto)=>{
        let cantidad = producto.cantidad || 1;
        let fila = document.createElement("div");
        fila.classList.add("d-flex", "justify-content-between", "align-items-center", "mb-24");
        fila.innerHTML = `
            <p class="lead color-black d-flex align-items-center">
                <img src="${producto.imagen}" width="50px" class="me-2">
                ${producto.nombre} x ${cantidad}
            </p>
            <p class="lead"> $ ${ (producto.precio * cantidad).toFixed(3) } </p>
        `;
        contenedorProductos.appendChild(fila);
    });
}

//funcion para cargar en el formulario los datos del cliente guardados en localStorage
function cargarCliente() {
    let cliente = JSON.parse(localStorage.getItem("pro-cliente"));
    if( cliente != null ){
        nombres.value = cliente.nombres;
        apellidos.value = cliente.apellidos;
        email.value = cliente.email;
        celular.value = cliente.celular;
        direccion.value = cliente.direccion;
        direccion2.value = cliente.direccion2;
        notas.value = cliente.notas;
    }
}

//funcion para obtener el porcentaje de recargo segun el metodo de pago
function metodoSeleccionado() {
    let valor = document.querySelector("input[name='radio']:checked").value;
    switch (valor) {
        case "1": return { nombre: "Contraentrega", porcentaje: 5 };
        case "2": return { nombre: "PSE", porcentaje: 3 };
        default: return { nombre: "Transferencia", porcentaje: 0 };
    }
}

//funcion para el resumen de la compra
function resumenCompra() {
    //los valores del carrito se guardan como texto (ej: "30.000")
    let subtotal = parseFloat(resumenCarrito.subtotal);
    let docimicilo = parseFloat(resumenCarrito.docimicilo);
    let descuento = parseFloat(resumenCarrito.descuento);

    //calcular el recargo sobre lo que se debe pagar (subtotal - descuento + domicilio)
    let metodo = metodoSeleccionado();
    let base = subtotal - descuento + docimicilo;
    let recargo = base * metodo.porcentaje / 100;

    //calcular el total a pagar de la compra
    let totalApagar = base + recargo;

    //mostrar los calculos de resumen de compra
    resumenSubTotal.textContent = subtotal.toFixed(3);
    resumenDescuento.textContent = descuento.toFixed(3);
    resumenDomicilo.textContent = docimicilo.toFixed(3);
    destino.textContent = resumenCarrito.destino;
    porcentajeRecargo.textContent = `(${metodo.porcentaje}%)`;
    resumenRecargo.textContent = recargo.toFixed(3);
    resumenTotal.textContent = totalApagar.toFixed(3);
}

//agregar evento change a los metodos de pago para recalcular el total
metodosPago.forEach((metodo)=>{
    metodo.addEventListener("change", ()=>{
        resumenCompra();
    });
});

//funcion para validar los datos de entrega obligatorios
function validarCliente() {
    let obligatorios = [nombres, apellidos, email, celular, direccion];
    let valido = true;
    obligatorios.forEach((campo)=>{
        if( campo.value.trim() == "" ){
            campo.style.border = "1px solid red";
            valido = false;
        }else{
            campo.style.border = "";
        }
    });
    //validar formato del email
    if( email.value.trim() != "" && !email.checkValidity() ){
        email.style.border = "1px solid red";
        valido = false;
    }
    return valido;
}

//funcion para guardar el cliente y el pedido en las listas del panel admin (ADMIN/)
//el admin guarda los valores en pesos (30000) y la tienda en miles (30.000), por eso se multiplica por 1000
function registrarEnAdmin(cliente, pedido) {
    //cliente: si ya existe un cliente con ese email se actualiza, si no se crea
    let clientes = JSON.parse(localStorage.getItem("adm-clientes")) || [];
    let datosCliente = {
        nombre : cliente.nombres,
        apellido : cliente.apellidos,
        email : cliente.email,
        celular : cliente.celular,
        direccion : cliente.direccion,
        direccion2 : cliente.direccion2,
        notas : cliente.notas,
    };
    let existente = clientes.find((c)=> c.email.toLowerCase() == cliente.email.toLowerCase());
    if( existente ){
        Object.assign(existente, datosCliente);
    }else{
        existente = { id : clientes.reduce((m, c)=> Math.max(m, c.id), 0) + 1, ...datosCliente };
        clientes.push(existente);
    }
    localStorage.setItem("adm-clientes", JSON.stringify(clientes));

    //pedido
    let pedidos = JSON.parse(localStorage.getItem("adm-pedidos")) || [];
    let productos = Object.values(pedido.productos).map((p)=>({
        nombre : p.nombre,
        precio : Math.round(parseFloat(p.precio) * 1000),
        cantidad : p.cantidad || 1,
        imagen : p.imagen,
    }));
    let descuento = Math.round(parseFloat(pedido.descuento) * 1000);
    //aumento = domicilio + recargo del metodo de pago
    let aumento = Math.round(parseFloat(pedido.docimicilo) * 1000) + Math.round(parseFloat(pedido.recargo) * 1000);
    let subtotal = productos.reduce((s, p)=> s + p.precio * p.cantidad, 0);

    let nuevo = {
        id : pedidos.reduce((m, p)=> Math.max(m, p.id), 0) + 1,
        clienteId : existente.id,
        cliente : cliente.nombres + " " + cliente.apellidos,
        email : cliente.email,
        fecha : new Date().toISOString().slice(0, 10),
        metodoPago : pedido.metodoPago,
        productos : productos,
        descuento : descuento,
        aumento : aumento,
        total : subtotal - descuento + aumento,
        estado : "pendiente",
        origen : "tienda",
        notas : cliente.notas,
    };
    pedidos.push(nuevo);
    localStorage.setItem("adm-pedidos", JSON.stringify(pedidos));
    return nuevo.id;
}

//evento al boton pagar orden para guardar el pedido en localStorage
btnPagar.addEventListener("click", ()=>{
    if( !validarCliente() ){
        alert("Por favor completa los datos de entrega obligatorios (*)");
        return;
    }

    //guardar los datos del cliente en localStorage
    let cliente = {
        nombres : nombres.value.trim(),
        apellidos : apellidos.value.trim(),
        email : email.value.trim(),
        celular : celular.value.trim(),
        direccion : direccion.value.trim(),
        direccion2 : direccion2.value.trim(),
        notas : notas.value.trim(),
    };
    localStorage.setItem("pro-cliente", JSON.stringify(cliente));

    //guardar el pedido completo en localStorage
    let metodo = metodoSeleccionado();
    let pedido = {
        "orden" : 0,
        "cliente" : cliente,
        "productos" : resumenCarrito.productos,
        "subtotal" : resumenSubTotal.textContent,
        "descuento" : resumenDescuento.textContent,
        "destino" : resumenCarrito.destino,
        "docimicilo" : resumenDomicilo.textContent,
        "metodoPago" : metodo.nombre,
        "porcentajeRecargo" : metodo.porcentaje,
        "recargo" : resumenRecargo.textContent,
        "totalApagar" : resumenTotal.textContent,
    };
    //registrar el cliente y el pedido en el panel admin (el numero de orden es el id del pedido)
    pedido.orden = registrarEnAdmin(cliente, pedido);
    localStorage.setItem("pro-pedido", JSON.stringify(pedido));

    //vaciar el carrito y el resumen porque la compra ya se realizo
    localStorage.removeItem("pro-carrito");
    localStorage.removeItem("pro-resumen");

    //redirigir el usuario a la pagina de gracias
    location.href = "thankyou.html";
});
