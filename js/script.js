let rondas = []; // Almacena todas las rondas
let clasificacion = {}; // Almacena la clasificación de los jugadores

// Función para guardar los nombres en el localStorage
function guardarNombres() {
    const namesInput = document.getElementById('names').value;
    const namesArray = namesInput.split('\n').map(name => name.trim()).filter(name => name.length > 0);

    if (namesArray.length === 0) {
        alert('Por favor, ingresa al menos un nombre.');
        return;
    }

    // Guardar los nombres en el localStorage
    localStorage.setItem('nombres', JSON.stringify(namesArray));
    alert('Nombres guardados correctamente.');

    // Crear la primera ronda
    crearRonda();
}

// Función para crear una nueva ronda
function crearRonda() {
    const nombresGuardados = localStorage.getItem('nombres');
    if (!nombresGuardados) {
        alert('No hay nombres guardados. Por favor, ingresa y guarda los nombres primero.');
        return;
    }

    const tableSize = parseInt(document.getElementById('tableSize').value);
    const namesArray = JSON.parse(nombresGuardados);

    if (tableSize < 2 || tableSize > 4) {
        alert('El tamaño de las mesas debe ser 2, 3 o 4.');
        return;
    }

    // Obtener los nombres sin números para la nueva ronda
    const nombresSinNumeros = namesArray.map((nombre) => {
        return nombre.replace(/^\d+\.\s/, ''); // Eliminar el número inicial si existe
    });

    // Mezclar la lista de nombres (sin números)
    const shuffledNames = nombresSinNumeros.sort(() => Math.random() - 0.5);

    // Crear las mesas
    const mesas = [];
    for (let i = 0; i < shuffledNames.length; i += tableSize) {
        mesas.push(shuffledNames.slice(i, i + tableSize));
    }

    // Guardar la ronda
    rondas.push(mesas);

    // Mostrar las rondas en el HTML
    mostrarRondas();

    // Inicializar drag and drop
    inicializarDragAndDrop();
}

// Función para mostrar las rondas en el HTML
function mostrarRondas() {
    const rondasContainer = document.getElementById('rondas-container');
    rondasContainer.innerHTML = '';

    rondas.forEach((ronda, indexRonda) => {
        const rondaDiv = document.createElement('div');
        rondaDiv.className = 'ronda';
        rondaDiv.innerHTML = `<h3>Ronda ${indexRonda + 1}</h3>`;

        const mesasContainer = document.createElement('div');
        mesasContainer.className = 'mesas-container'; // Contenedor de 2 columnas

        ronda.forEach((mesa, indexMesa) => {
            const mesaDiv = document.createElement('div');
            mesaDiv.className = 'mesa';
            mesaDiv.innerHTML = `<h4>Mesa ${indexMesa + 1}</h4>`;

            mesa.forEach((persona) => {
                const personaDiv = document.createElement('div');
                personaDiv.className = 'persona';
                // Mostrar el nombre sin números en la nueva ronda
                if (indexRonda === rondas.length - 1) {
                    personaDiv.textContent = persona; // Nueva ronda sin números
                } else {
                    // Mantener los números en las rondas anteriores
                    personaDiv.textContent = persona;
                }
                mesaDiv.appendChild(personaDiv);
            });

            // Botón para aplicar resultados (fuera del contenedor de la mesa)
            const botonAplicarResultados = document.createElement('button');
            botonAplicarResultados.textContent = 'Aplicar Resultados';
            botonAplicarResultados.className = 'button';
            botonAplicarResultados.onclick = () => aplicarResultados(mesaDiv, indexRonda, indexMesa);

            // Añadir la mesa y el botón al contenedor de la mesa
            const mesaContainer = document.createElement('div');
            mesaContainer.appendChild(mesaDiv);
            mesaContainer.appendChild(botonAplicarResultados);

            // Añadir la mesa al contenedor de 2 columnas
            mesasContainer.appendChild(mesaContainer);
        });

        // Añadir el contenedor de mesas a la ronda
        rondaDiv.appendChild(mesasContainer);
        rondasContainer.appendChild(rondaDiv);
    });

    // Actualizar la clasificación
    actualizarClasificacion();
}

// Función para aplicar resultados de una mesa
function aplicarResultados(mesaDiv, indexRonda, indexMesa) {
    const personas = [];
    $(mesaDiv).find('.persona').each(function() {
        personas.push($(this).text().replace(/^\d+\.\s/, '')); // Eliminar el número inicial si existe
    });

    // Reiniciar los puntos de los jugadores en esta mesa (para evitar duplicados)
    const tableSize = parseInt(document.getElementById('tableSize').value);
    personas.forEach((persona) => {
        if (clasificacion[persona]) {
            // Restar los puntos anteriores de esta mesa
            clasificacion[persona] -= (tableSize - personas.indexOf(persona));
        }
    });

    // Asignar nuevas posiciones y puntos
    personas.forEach((persona, index) => {
        const puntos = tableSize - index;
        if (!clasificacion[persona]) {
            clasificacion[persona] = 0;
        }
        clasificacion[persona] += puntos;
    });

    // Mostrar las posiciones en la mesa
    $(mesaDiv).find('.persona').each(function(index) {
        const nombre = $(this).text().replace(/^\d+\.\s/, ''); // Eliminar el número inicial
        $(this).text(`${index + 1}. ${nombre}`); // Asignar el nuevo número
    });

    // Actualizar la clasificación
    actualizarClasificacion();
}

// Función para inicializar drag and drop
function inicializarDragAndDrop() {
    $('.persona').draggable({
        revert: 'invalid',
        cursor: 'move',
        helper: 'clone', // Usar un clon para el arrastre
    });

    $('.mesa').droppable({
        accept: '.persona',
        drop: function(event, ui) {
            const persona = ui.draggable;
            const mesaDestino = $(this);

            // Obtener la posición donde se suelta la persona
            const offset = ui.offset;
            const mesaOffset = mesaDestino.offset();
            const y = offset.top - mesaOffset.top;

            // Calcular la posición de inserción
            let insertIndex = 0;
            mesaDestino.find('.persona').each(function() {
                const personaOffset = $(this).offset();
                if (y > personaOffset.top - mesaOffset.top) {
                    insertIndex++;
                }
            });

            // Insertar la persona en la posición correcta
            if (mesaDestino.is(persona.parent())) {
                // Si es la misma mesa, insertar en la posición calculada
                persona.detach().insertBefore(mesaDestino.find('.persona').eq(insertIndex));
            } else {
                // Si es otra mesa, insertar en la posición calculada
                persona.detach().insertBefore(mesaDestino.find('.persona').eq(insertIndex));
            }

            // Actualizar el estado de las rondas
            actualizarEstadoRondas();
        }
    });
}

// Función para actualizar el estado de las rondas
function actualizarEstadoRondas() {
    const nuevasRondas = [];
    $('#rondas-container .ronda').each(function() {
        const mesas = [];
        $(this).find('.mesa').each(function() {
            const personas = [];
            $(this).find('.persona').each(function() {
                personas.push($(this).text().replace(/^\d+\.\s/, '')); // Eliminar el número inicial
            });
            mesas.push(personas);
        });
        nuevasRondas.push(mesas);
    });

    rondas = nuevasRondas;
}

// Función para actualizar la clasificación
function actualizarClasificacion() {
    const clasificacionList = document.getElementById('clasificacion');
    clasificacionList.innerHTML = '';

    const sortedClasificacion = Object.entries(clasificacion).sort((a, b) => b[1] - a[1]);

    sortedClasificacion.forEach(([nombre, puntos]) => {
        const li = document.createElement('li');
        li.textContent = `${nombre}: ${puntos} puntos`;
        clasificacionList.appendChild(li);
    });
}

// Función para crear una nueva ronda
function crearNuevaRonda() {
    crearRonda();
}

// Esperar a que el DOM esté listo
$(document).ready(function() {
    // Asignar el evento click al botón de hamburguesa
    $('#hamburger-button').on('click', function() {
        toggleFormulario();
    });

    // Asignar el evento click al botón de nueva ronda
    $('#nueva-ronda-button').on('click', function() {
        crearNuevaRonda();
    });

    // Cargar los nombres y el histórico al cargar la página
    const nombresGuardados = localStorage.getItem('nombres');
    if (nombresGuardados) {
        const namesInput = document.getElementById('names');
        namesInput.value = JSON.parse(nombresGuardados).join('\n');
        crearRonda();
    }

    // Ocultar el formulario al inicio
    $('#formulario').hide();
});

// Función para alternar la visibilidad del formulario
function toggleFormulario() {
    const formulario = $('#formulario');
    formulario.toggle('slow');
}