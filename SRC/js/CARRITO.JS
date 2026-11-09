//variable globales
let btnProducts = document.querySelectorAll(".btn-product");
let contadorCarrito = document.querySelector(".contar-pro");
let listadoCarrito = document.querySelector(".list-cart tbody");
let iconoCarrito = document.querySelector(".carrito");
let tablaCarrito = document.querySelector(".list-cart");
const CLAVE = "pro-carrito";

//mostrar / ocultar la tabla del carrito
iconoCarrito.addEventListener("click", () => {
    tablaCarrito.classList.toggle("ocultar");
});

//agregar producto (click en la cesta)
btnProducts.forEach((btn, i) => {
    btn.addEventListener("click", () => {
        infoProducto(i);
    });
});

//leer productos de localStorage (siempre un array)
function leerProductos() {
    try {
        let datos = JSON.parse(localStorage.getItem(CLAVE));
        return Array.isArray(datos) ? datos : [];
    } catch (e) {
        return [];
    }
}

function guardarProductos(productos) {
    localStorage.setItem(CLAVE, JSON.stringify(productos));
}

//pintar tabla y contador A PARTIR de localStorage
function pintarCarrito() {
    let productos = leerProductos();
    listadoCarrito.innerHTML = "";
    productos.forEach((producto, pos) => {
        let fila = document.createElement("tr");
        fila.innerHTML = `
            <td> ${pos + 1} </td>
            <td> <img src="${producto.imagen}" width="70px"> </td>
            <td> ${producto.nombre} </td>
            <td> $${producto.precio} </td>
            <td> <span class="btn btn-danger btn-borrar" data-pos="${pos}"> X </span> </td>
        `;
        listadoCarrito.appendChild(fila);
    });
    contadorCarrito.textContent = productos.length;
}

//tomar la info de la tarjeta del producto y guardarla
function infoProducto(pos) {
    let tarjeta = btnProducts[pos].closest(".card");
    let infoPro = {
        nombre: tarjeta.querySelector("h3").textContent.trim(),
        imagen: tarjeta.querySelector("img").src,
        precio: tarjeta.querySelector("h5").textContent.split("$")[1],
        cantidad: 1
    };
    let productos = leerProductos();
    productos.push(infoPro);
    guardarProductos(productos);
    pintarCarrito();
}

//borrar producto 
listadoCarrito.addEventListener("click", (e) => {
    let btn = e.target.closest(".btn-borrar");
    if (!btn) return;
    let productos = leerProductos();
    productos.splice(Number(btn.dataset.pos), 1);
    guardarProductos(productos);
    pintarCarrito();
});

//al cargar la pagina recuperar lo guardado
pintarCarrito();
