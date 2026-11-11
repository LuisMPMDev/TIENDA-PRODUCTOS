//variables globales
let tablaCarrito = document.querySelector('.cart-table tbody');
let resumenSubTotal = document.querySelector(".res-sub-total");
let resumenDescuento = document.querySelector(".promo");
let resumenTotal = document.querySelector(".total");
let destino = document.querySelector(".destino");
let resumenDomicilo = document.querySelector(".valor-domi");
let btnResumen = document.querySelector(".btn-resumen");

//agregar evento al navegador
document.addEventListener("DOMContentLoaded" , ()=>{
    cargarProductos();
})

//funcion cargar productos guardados en localStorage
function  cargarProductos() {
    //let todosProductos = JSON.parse(localStorage.getItem("pro-carrito")) || [];
    let todosProductos = [];
    let productosPrevios = JSON.parse(localStorage.getItem("pro-carrito"));
    if( productosPrevios != null ){
        todosProductos = Object.values(productosPrevios)
    }



    //limpiar tabla
    tablaCarrito.innerHTML = "";

    //comprobar si hay productos en localStorage
    if(todosProductos.length != 0){
        todosProductos.forEach((producto, i)=>{
           
            //cargar tabla
            let fila = document.createElement("tr");
            fila.innerHTML = `
                <td class="d-flex justify-content-evenly align-items-center"> 
                    <span onclick="borrarProducto(${i})" class="btn btn-danger"> X </span>
                    <img src="${producto.imagen}" width="70px">
                    ${producto.nombre}
                </td>
                <td> 
                    $<span> ${producto.precio} </span>
                </td>
                <td> 
                    <div class="quantity quantity-wrap">
                        <div class="decrement" onclick="actualizarCantidad( ${i},-1 )"> <i class="fa-solid fa-minus"></i></div>
                        <input class="number" type="text" name="quantity" value="${producto.cantidad || 1}" maxlength="2" size="1" readonly>
                        <div class="increment" onclick="actualizarCantidad( ${i},1 )"> <i class="fa-solid fa-plus"></i></div>
                    </div>
                </td>
                <td> $ ${ (producto.precio * producto.cantidad).toFixed(3) } </td>
            `;
            tablaCarrito.appendChild(fila);
        });
    }else{
        let fila = document.createElement("tr");
            fila.innerHTML = `
                <td colspan="4">
                    <p class="text-center fs-3"> No hay productos en el carrito </p>
                </td>
            `;
        tablaCarrito.appendChild(fila);
    }

    //ejecutar el resumen de compra
    resumenCompra();

}

//funcion para actualizar cantidades del producto
function actualizarCantidad(pos, cambio ){
    let todosProductos = [];
    let productosPrevios = JSON.parse(localStorage.getItem("pro-carrito"));
    if( productosPrevios != null ){
        todosProductos = Object.values(productosPrevios)
    }

    if( todosProductos[pos]){
        //actualizar cantidad
        todosProductos[pos].cantidad = (todosProductos[pos].cantidad || 1) + cambio;

        //asdsegurarse de que la cantidad no sea menor a 1
        if(todosProductos[pos].cantidad < 1 ){
            todosProductos[pos].cantidad = 1;
        }

        //calcular subtotal
        let subtotal = todosProductos[pos].precio * todosProductos[pos].cantidad;

    }
    //actualizar en localStorage
    localStorage.setItem("pro-carrito", JSON.stringify(todosProductos));

    //recargar la tabla
    cargarProductos();
}

//funcion para borrar productos del detalle carrito
function borrarProducto(pos) {
    let todosProductos = [];
    let productosPrevios = JSON.parse(localStorage.getItem("pro-carrito"));
    if( productosPrevios != null ){
        todosProductos = Object.values(productosPrevios)
    }
    //eliminar prodcuto
    todosProductos.splice(pos, 1);
    //actaulizar localStorage
    localStorage.setItem("pro-carrito", JSON.stringify(todosProductos));
    //recargar tabla
    cargarProductos();
}

//funcion para el resumen de la compra
function resumenCompra() {
    let todosProductos = JSON.parse(localStorage.getItem("pro-carrito")) || [];
    let subtotal = 0; //acumular el subtotal de los prodcutos
    //recorrer cada producto u acumulamos en el subtotal
    todosProductos.forEach((prodcuto)=>{
        subtotal += prodcuto.precio * prodcuto.cantidad;
    });

    //calcular el valor del docimicilo
    let docimicilo = 0;
    switch (destino.value) {
        case "Medellin": default: docimicilo; break;
        case "Bello": docimicilo = 10.000; break;
        case "Copacabana": case "Caldas": case "La Estrella": docimicilo = 20.000; break;
        case "Itagui": case "Envigado": case "Sabaneta": docimicilo = 15.000; break;
    }

    //calcular descuento del 10% si la compra es mayor a 100k
    let descuento = (subtotal > 100.000) ? subtotal * 0.1 : 0;

    //calcular el total a pagar de la compra
    let totalApagar = subtotal - descuento + docimicilo;


    //console.log( "valor domicio: "+ docimicilo );
    //mostrar los calculos de resumen de compra
    resumenSubTotal.textContent = subtotal.toFixed(3);
    resumenDescuento.textContent = descuento.toFixed(3);
    resumenTotal.textContent = totalApagar.toFixed(3);
    resumenDomicilo.textContent = docimicilo.toFixed(3);

}

//agregar evento change al destino para calcular el valor del domicilio
destino.addEventListener("change", ()=>{
    //actualizar el resumen de la compra
    resumenCompra();
});

//evento al boton pagar para guardar el resumen de la compra en localStorage
btnResumen.addEventListener("click", ()=>{
    //extraer los productos de localStorage
    let prodcutos = JSON.parse(localStorage.getItem("pro-carrito")) || [];
    let resumen = {
        //copiar todos los productos
        "productos" : prodcutos,
    };
    //llenar la varibale resumen con lainformacion del resumen de la compra
    resumen.subtotal = resumenSubTotal.textContent;
    resumen.descuento = resumenDescuento.textContent;
    resumen.destino = destino.value;
    resumen.docimicilo = resumenDomicilo.textContent;
    resumen.totalApagar = resumenTotal.textContent;

    //guardar el resumen de la compra en localStorage
    localStorage.setItem("pro-resumen", JSON.stringify(resumen));
    
    //redirigir el usuario a la pagina de pago
    location.href = "checkout.html";

    //console.log(resumen);
});