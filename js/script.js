// --- Declaración de Elementos del DOM ---
const API_URL_BASE = "https://dragonball-api.com/api/characters";
const botonAccion = document.getElementById("btn-buscar"); // Renombrado de btnBuscar
const campoTextoBusqueda = document.getElementById("input-busqueda"); // Renombrado de searchInput
const contenedorResultados = document.getElementById("contenedor-data"); // Renombrado de contenedorPadre

// Elementos del modal
const modalInfoElemento = document.getElementById('modal-detalles');
const instanciaModal = new bootstrap.Modal(modalInfoElemento);
const tituloModal = document.getElementById('modal-titulo');
const cuerpoModal = document.getElementById('modal-cuerpo');

// Elemento del spinner de carga
const indicadorCarga = document.getElementById('spinner'); // Renombrado de spinner
const mensajeAlertaBusqueda = document.getElementById('mensaje-error'); // Renombrado de mensajeErrorBusqueda

// Almacena todos los registros de personajes obtenidos de la API
let coleccionCompletaPersonajes = []; // Renombrado de totalPersonajes

// ---
// Función asíncrona para obtener datos de la API
// ---
const obtenerRegistrosAPI = async () => {
    // 1. Ocultar mensajes de error previos y limpiar el contenedor
    mensajeAlertaBusqueda.textContent = '';
    contenedorResultados.innerHTML = '';

    // 2. Mostrar indicador de carga
    indicadorCarga.classList.remove('d-none'); // Muestra el spinner

    try {
        // Hacemos la petición a la API con un límite alto para obtener todos los personajes
        const respuestaHTTP = await fetch(`${API_URL_BASE}?limit=1000`);

        // Verificamos si la respuesta es exitosa
        if (!respuestaHTTP.ok) {
            throw new Error(`Error de red: ${respuestaHTTP.status}. No se pudieron obtener los registros.`);
        }

        // Convertimos la respuesta a JSON
        const datosJSON = await respuestaHTTP.json();

        // Aseguramos que 'items' sea un array y no esté vacío
        if (!datosJSON.items || !Array.isArray(datosJSON.items) || datosJSON.items.length === 0) {
            throw new Error('La API no devolvió registros válidos.');
        }

        // Almacenamos la colección completa de personajes
        coleccionCompletaPersonajes = datosJSON.items;

        // Mostramos todos los personajes obtenidos inicialmente
        desplegarPersonajes(coleccionCompletaPersonajes);

    } catch (error) {
        // Manejo de errores durante la carga inicial
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
        // 3. Ocultar indicador de carga al finalizar
        indicadorCarga.classList.add('d-none'); // Oculta el spinner
    }
};

// ---
// Función para desplegar los personajes en el DOM
// ---
const desplegarPersonajes = (listaPersonajes) => {
    // Limpia el contenedor de resultados
    contenedorResultados.innerHTML = "";

    // Si no hay personajes, muestra un mensaje
    if (listaPersonajes.length === 0) {
        contenedorResultados.innerHTML = `
            <div class="col-12">
                <p class="alert alert-info text-center mt-3">No se encontraron personajes que coincidan con tu búsqueda.</p>
            </div>
        `;
        return;
    }

    // Usamos un DocumentFragment para optimizar la adición al DOM
    const fragmentoDOM = document.createDocumentFragment();

    listaPersonajes.forEach(registro => {
        const columnaElemento = document.createElement("div");
        columnaElemento.className = "col-sm-6 col-md-4 col-lg-3 mb-4"; // Clases de Bootstrap para columnas

        columnaElemento.innerHTML = `
            <div class="card h-100 shadow-sm border-0 cursor-pointer" data-id="${registro.id}">
                <img src="${registro.image || 'https://via.placeholder.com/300x400?text=No+Image+Available'}"
                     class="card-img-top object-fit-cover"
                     alt="Imagen de ${registro.name || 'Personaje'}"
                     style="height: 280px;"
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

    // Añadimos el fragmento al DOM
    contenedorResultados.appendChild(fragmentoDOM);

    // Añadimos los event listeners a las nuevas tarjetas
    configurarEventosTarjeta();
};

// ---
// Función para filtrar y buscar personajes
// ---
const buscarRegistros = () => { // Renombrado de buscarPersonajes
    const textoBusqueda = campoTextoBusqueda.value.trim().toLowerCase(); // Renombrado de texto

    // Validar que el campo de búsqueda no esté vacío
    if (!textoBusqueda) {
        mensajeAlertaBusqueda.textContent = 'Por favor, ingresa un nombre para buscar.';
        desplegarPersonajes(coleccionCompletaPersonajes); // Muestra todos si el campo está vacío
        return;
    }

    // Filtrar los personajes de la colección completa
    const registrosFiltrados = coleccionCompletaPersonajes.filter(registro =>
        registro.name.toLowerCase().includes(textoBusqueda)
    );

    // Desplegar los personajes filtrados
    desplegarPersonajes(registrosFiltrados);

    // Muestra un mensaje si no hay resultados para la búsqueda específica
    if (registrosFiltrados.length === 0) {
        mensajeAlertaBusqueda.textContent = `No se encontraron resultados para "${campoTextoBusqueda.value.trim()}".`;
    } else {
        mensajeAlertaBusqueda.textContent = ''; // Limpia el mensaje de error si se encontraron resultados
    }
};

// ---
// Función para mostrar información detallada en el modal
// ---
const mostrarDetallePersonaje = async (idRegistro) => { // Renombrado de mostrarDetalle
    // Mostrar un spinner de carga en el modal
    tituloModal.textContent = 'Obteniendo información...';
    cuerpoModal.innerHTML = `
        <div class="text-center p-4">
            <div class="spinner-border text-primary" role="status">
                <span class="visually-hidden">Cargando detalles...</span>
            </div>
            <p class="mt-2">Cargando detalles del personaje...</p>
        </div>
    `;
    instanciaModal.show(); // Mostrar el modal

    try {
        // Obtener detalles específicos del personaje por ID
        const respuestaDetalle = await fetch(`${API_URL_BASE}/${idRegistro}`);

        if (!respuestaDetalle.ok) {
            throw new Error(`Error al obtener detalles: ${respuestaDetalle.status}`);
        }

        const registroDetalle = await respuestaDetalle.json();

        // Rellenar el modal con la información detallada
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
                    ${registroDetalle.originPlanet ? `<p class="mb-2"><strong>Planeta Origen:</strong> ${registroDetalle.originPlanet}</p>` : ''}
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
    // El modal permanece abierto para mostrar el error o los detalles
};

// ---
// Función para configurar los event listeners en las tarjetas de personajes
// ---
const configurarEventosTarjeta = () => { // Renombrado de agregarEventosDetalle
    document.querySelectorAll('.card[data-id]').forEach(tarjeta => {
        tarjeta.addEventListener('click', (evento) => {
            const idPersonaje = evento.currentTarget.dataset.id;
            mostrarDetallePersonaje(idPersonaje);
        });
    });
};

// --- Configuración de Eventos Iniciales ---

// Evento para el botón de búsqueda
botonAccion.addEventListener("click", buscarRegistros);

// Evento para la tecla 'Enter' en el campo de búsqueda
campoTextoBusqueda.addEventListener("keyup", (evento) => {
    if (evento.key === "Enter") buscarRegistros();
});

// Carga los datos de los personajes al cargar el DOM
document.addEventListener("DOMContentLoaded", obtenerRegistrosAPI);