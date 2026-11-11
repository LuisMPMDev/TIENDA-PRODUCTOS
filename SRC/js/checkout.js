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
        "orden" : Date.now(),
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
    localStorage.setItem("pro-pedido", JSON.stringify(pedido));

    //vaciar el carrito y el resumen porque la compra ya se realizo
    localStorage.removeItem("pro-carrito");
    localStorage.removeItem("pro-resumen");

    //redirigir el usuario a la pagina de gracias
    location.href = "thankyou.html";
});
