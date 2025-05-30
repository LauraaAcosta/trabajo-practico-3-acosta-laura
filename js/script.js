const API_URL_BASE = "https://dragonball-api.com/api/characters";
const botonAccion = document.getElementById("btn-buscar");
const campoTextoBusqueda = document.getElementById("input-busqueda");
const contenedorResultados = document.getElementById("contenedor-data");

const modalInfoElemento = document.getElementById('modal-detalles');
const instanciaModal = new bootstrap.Modal(modalInfoElemento);
const tituloModal = document.getElementById('modal-titulo');
const cuerpoModal = document.getElementById('modal-cuerpo');

const indicadorCarga = document.getElementById('spinner');
const mensajeAlertaBusqueda = document.getElementById('mensaje-error');

let coleccionCompletaPersonajes = [];

const obtenerRegistrosAPI = async () => {
    mensajeAlertaBusqueda.textContent = '';
    contenedorResultados.innerHTML = '';

    indicadorCarga.classList.remove('d-none');

    try {
        const respuestaHTTP = await fetch(`${API_URL_BASE}?limit=1000`);

        if (!respuestaHTTP.ok) {
            throw new Error(`Error de red: ${respuestaHTTP.status}. No se pudieron obtener los registros.`);
        }

        const datosJSON = await respuestaHTTP.json();

        if (!datosJSON.items || !Array.isArray(datosJSON.items) || datosJSON.items.length === 0) {
            throw new Error('La API no devolvió registros válidos.');
        }

        coleccionCompletaPersonajes = datosJSON.items;

        desplegarPersonajes(coleccionCompletaPersonajes);

    } catch (error) {
        console.error('Fallo al cargar registros:', error);
        contenedorResultados.innerHTML = `
            <div class="alert alert-danger text-center p-3" role="alert">
                <h4 class="alert-heading">¡Oops! Hubo un problema.</h4>
                <p>${error.message}</p>
                <hr>
                <p class="mb-0">Por favor, inténtalo de nuevo más tarde.</p>
            </div>
        `;
    } finally {
        indicadorCarga.classList.add('d-none');
    }
};

const desplegarPersonajes = (listaPersonajes) => {
    contenedorResultados.innerHTML = "";

    if (listaPersonajes.length === 0) {
        contenedorResultados.innerHTML = `
            <div class="col-12">
                <p class="alert alert-info text-center mt-3">No se encontraron personajes que coincidan con tu búsqueda.</p>
            </div>
        `;
        return;
    }

    const fragmentoDOM = document.createDocumentFragment();

    listaPersonajes.forEach(registro => {
        const columnaElemento = document.createElement("div");
        columnaElemento.className = "col-sm-6 col-md-4 col-lg-3 mb-4";

        columnaElemento.innerHTML = `
    <div class="card h-100 shadow-sm border-0 cursor-pointer" data-id="${registro.id}">
        <img src="${registro.image || 'https://via.placeholder.com/300x400?text=No+Image+Available'}"
            class="card-img-top" alt="Imagen de ${registro.name || 'Personaje'}"
            onerror="this.onerror=null;this.src='https://via.placeholder.com/300x400?text=Error+Loading+Image';">
        <div class="card-body d-flex flex-column">
            <h5 class="card-title text-primary">${registro.name || 'Nombre Desconocido'}</h5>
            <p class="card-text flex-grow-1">
                <strong>Raza:</strong> ${registro.race || "Desconocida"}<br>
                <strong>Género:</strong> ${registro.gender || "Desconocido"}
            </p>
        </div>
    </div>
`;
        fragmentoDOM.appendChild(columnaElemento);
    });

    contenedorResultados.appendChild(fragmentoDOM);

    configurarEventosTarjeta();
};

const buscarRegistros = () => {
    const textoBusqueda = campoTextoBusqueda.value.trim().toLowerCase();

    if (!textoBusqueda) {
        mensajeAlertaBusqueda.textContent = 'Por favor, ingresa un nombre para buscar.';
        desplegarPersonajes(coleccionCompletaPersonajes);
        return;
    }

    const registrosFiltrados = coleccionCompletaPersonajes.filter(registro =>
        registro.name.toLowerCase().includes(textoBusqueda)
    );

    desplegarPersonajes(registrosFiltrados);

    if (registrosFiltrados.length === 0) {
        mensajeAlertaBusqueda.textContent = `No se encontraron resultados para "${campoTextoBusqueda.value.trim()}".`;
    } else {
        mensajeAlertaBusqueda.textContent = '';
    }
};

const mostrarDetallePersonaje = async (idRegistro) => {
    tituloModal.textContent = 'Obteniendo información...';
    cuerpoModal.innerHTML = `
        <div class="text-center p-4">
            <div class="spinner-border text-primary" role="status">
                <span class="visually-hidden">Cargando detalles...</span>
            </div>
            <p class="mt-2">Cargando detalles del personaje...</p>
        </div>
    `;
    instanciaModal.show();

    try {
        const respuestaDetalle = await fetch(`${API_URL_BASE}/${idRegistro}`);

        if (!respuestaDetalle.ok) {
            throw new Error(`Error al obtener detalles: ${respuestaDetalle.status}`);
        }

        const registroDetalle = await respuestaDetalle.json();

        tituloModal.textContent = registroDetalle.name || 'Detalles del Personaje';
        cuerpoModal.innerHTML = `
            <div class="row align-items-center">
                <div class="col-md-5 text-center mb-3 mb-md-0">
                    <img src="${registroDetalle.image || 'https://via.placeholder.com/400x400?text=No+Image+Available'}"
                        class="img-fluid rounded-3 shadow-sm"
                        alt="Imagen de ${registroDetalle.name || 'Personaje'}"
                        onerror="this.onerror=null;this.src='https://via.placeholder.com/400x400?text=Error+Loading+Image';">
                </div>
                <div class="col-md-7 text-start">
                    <p class="mb-2"><strong>ID:</strong> ${registroDetalle.id || 'N/A'}</p>
                    <p class="mb-2"><strong>Nombre:</strong> ${registroDetalle.name || 'Desconocido'}</p>
                    <p class="mb-2"><strong>Raza:</strong> ${registroDetalle.race || 'Desconocida'}</p>
                    <p class="mb-2"><strong>Género:</strong> ${registroDetalle.gender || 'Desconocido'}</p>
                    ${registroDetalle.ki ? `<p class="mb-2"><strong>Ki:</strong> ${registroDetalle.ki}</p>` : ''}
                    ${registroDetalle.affiliation ? `<p class="mb-2"><strong>Afiliación:</strong> ${registroDetalle.affiliation}</p>` : ''}
                    ${registroDetalle.originPlanet.name ? `<p class="mb-2"><strong>Planeta Origen:</strong> ${registroDetalle.originPlanet.name}</p>` : ''}
                    ${registroDetalle.transformations && registroDetalle.transformations.length > 0 ?
                        `<p class="mb-2"><strong>Transformaciones:</strong> ${registroDetalle.transformations.map(t => t.name).join(', ')}</p>` : ''}
                </div>
            </div>
            ${registroDetalle.description ? `<hr><p>${registroDetalle.description}</p>` : ''}
        `;

    } catch (error) {
        console.error('Fallo al obtener detalles del registro:', error);
        tituloModal.textContent = 'Error';
        cuerpoModal.innerHTML = `
            <div class="alert alert-danger text-center p-2" role="alert">
                ¡Error! ${error.message}<br>No se pudieron cargar los detalles.
            </div>
        `;
    }
};

const configurarEventosTarjeta = () => {
    document.querySelectorAll('.card[data-id]').forEach(tarjeta => {
        tarjeta.addEventListener('click', (evento) => {
            const idPersonaje = evento.currentTarget.dataset.id;
            mostrarDetallePersonaje(idPersonaje);
        });
    });
};

botonAccion.addEventListener("click", buscarRegistros);

campoTextoBusqueda.addEventListener("keyup", (evento) => {
    if (evento.key === "Enter") buscarRegistros();
});

document.addEventListener("DOMContentLoaded", obtenerRegistrosAPI);