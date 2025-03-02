// Función para guardar los nombres en el localStorage
function guardarNombres() {
    const namesInput = document.getElementById('names').value;
    const namesArray = namesInput.split('\n').map(name => name.trim()).filter(name => name.length > 0);

    if (namesArray.length === 0) {
        alert('Por favor, ingresa al menos un nombre.');
        return;
    }

    // Crear un array de objetos con la estructura { id: "ID", nombre: "Nombre", emparejamientos: [], posicion: null }
    const jugadores = namesArray.map((nombre, index) => {
        return {
            id: `jugador-${index + 1}`, // ID único
            nombre: nombre,
            emparejamientos: [], // Inicializar emparejamientos como un array vacío
            posicion: null // Inicializar posición como null
        };
    });

    // Guardar el array de objetos en el localStorage
    localStorage.setItem('jugadores', JSON.stringify(jugadores));
    localStorage.setItem('rondas', JSON.stringify([]));

    // Crear la primera ronda
    crearRonda();
}

// Función para verificar si dos jugadores ya se han emparejado
function hanJugadoJuntos(jugador1, jugador2) {
    return jugador1.emparejamientos.includes(jugador2.id);
}

// Función para crear una nueva ronda
function crearRonda() {
    const jugadoresGuardados = localStorage.getItem('jugadores');
    let rondasGuardadas = JSON.parse(localStorage.getItem('rondas')) || []; // Inicializar como array vacío si no existe

    if (!jugadoresGuardados) {
        alert('No hay jugadores guardados. Por favor, ingresa y guarda los jugadores primero.');
        return;
    }

    const tableSize = parseInt(document.getElementById('tableSize').value);
    const jugadores = JSON.parse(jugadoresGuardados);

    if (tableSize < 2 || tableSize > 4) {
        alert('El tamaño de las mesas debe ser 2, 3 o 4.');
        return;
    }

    // Mezclar la lista de jugadores
    const jugadoresMezclados = jugadores.sort(() => Math.random() - 0.5);

    // Crear las mesas evitando emparejamientos repetidos
    const mesas = [];
    const jugadoresSinEmparejar = [...jugadoresMezclados];

    while (jugadoresSinEmparejar.length > 0) {
        const jugadoresMesa = [];
        const mesa = {};
        const jugadorActual = jugadoresSinEmparejar.shift(); // Tomar el primer jugador disponible
        jugadoresMesa.push(jugadorActual);

        // Buscar jugadores que no hayan jugado con el jugadorActual
        for (let i = 0; i < tableSize - 1 && jugadoresSinEmparejar.length > 0; i++) {
            const jugadorSinEmparejar = jugadoresSinEmparejar.find(
                (j) => !hanJugadoJuntos(jugadorActual, j)
            );

            if (jugadorSinEmparejar) {
                jugadoresMesa.push(jugadorSinEmparejar);
                jugadoresSinEmparejar.splice(jugadoresSinEmparejar.indexOf(jugadorSinEmparejar), 1);
            } else {
                // Si no hay jugadores disponibles que no hayan jugado con el jugadorActual,
                // tomar cualquier jugador disponible
                jugadoresMesa.push(jugadoresSinEmparejar.shift());
            }
        }

        // Crear la mesa con los jugadores y el estado de resultado
        mesa.jugadores = jugadoresMesa;
        mesa.resultadoGuardado = false; // Usar booleano en lugar de cadena
        mesas.push(mesa);

        // Guardar los emparejamientos de cada jugador en la mesa
        jugadoresMesa.forEach((jugador) => {
            const emparejamientos = jugadoresMesa
                .filter((j) => j.id !== jugador.id) // Excluir al propio jugador
                .map((j) => j.id); // Obtener solo los IDs de los emparejamientos

            // Añadir los nuevos emparejamientos al jugador
            jugador.emparejamientos.push(...emparejamientos);
        });
    }

    // Guardar los jugadores actualizados en el localStorage
    localStorage.setItem('jugadores', JSON.stringify(jugadores));

    // Guardar la ronda en rondasGuardadas
    rondasGuardadas.push(mesas); // Añadir el array de mesas directamente
    localStorage.setItem('rondas', JSON.stringify(rondasGuardadas)); // Guardar como JSON

    // Mostrar las rondas en el HTML
    mostrarRondas();
    // Inicializar drag and drop
    inicializarDragAndDrop();
}

// Función para mostrar las rondas en el HTML
function mostrarRondas() {
    const rondasGuardadas = JSON.parse(localStorage.getItem('rondas'))
    const rondasContainer = document.getElementById('rondas-container')
    rondasContainer.innerHTML = ''

    rondasGuardadas.forEach((ronda, indexRonda) => {
        const rondaDiv = document.createElement('div')
        rondaDiv.className = 'ronda'
        rondaDiv.innerHTML = `<h3>Ronda ${indexRonda + 1}</h3>`

        const mesasContainer = document.createElement('div')
        mesasContainer.className = 'mesas-container' // Contenedor de 2 columnas

        ronda.forEach((mesa, indexMesa) => {
            const mesaDiv = document.createElement('div')
            mesaDiv.className = 'mesa'
            mesaDiv.innerHTML = `<h4>Mesa ${indexMesa + 1}</h4>`

            const resultadoGuardado = mesa.resultadoGuardado // Verificar si los resultados han sido guardados

            mesa.jugadores.forEach((jugador, indexJugador) => {
                const personaDiv = document.createElement('div')
                personaDiv.className = 'persona'

                if (resultadoGuardado) {
                    personaDiv.textContent = `${indexJugador+1}. ${jugador.nombre}`
                } else {
                    personaDiv.textContent = jugador.nombre
                }

                mesaDiv.appendChild(personaDiv)
            })

            // Botón para aplicar resultados (fuera del contenedor de la mesa)
            const botonAplicarResultados = document.createElement('button')
            botonAplicarResultados.textContent = 'Aplicar Resultados'
            botonAplicarResultados.className = 'button'
            botonAplicarResultados.onclick = () => aplicarResultados(mesaDiv, indexRonda, indexMesa)

            // Añadir la mesa y el botón al contenedor de la mesa
            const mesaContainer = document.createElement('div')
            mesaContainer.appendChild(mesaDiv)
            mesaContainer.appendChild(botonAplicarResultados)

            // Añadir la mesa al contenedor de 2 columnas
            mesasContainer.appendChild(mesaContainer)
        })

        // Añadir el contenedor de mesas a la ronda
        rondaDiv.appendChild(mesasContainer)
        rondasContainer.appendChild(rondaDiv)
    })

    inicializarDragAndDrop()
    actualizarClasificacion()
}


// Función para aplicar resultados de una mesa
function aplicarResultados(mesaDiv, indexRonda, indexMesa) {
    // Recuperar las rondas guardadas
    const rondasGuardadas = JSON.parse(localStorage.getItem('rondas'));

    // Verificar si la ronda y la mesa existen
    if (!rondasGuardadas || !rondasGuardadas[indexRonda] || !rondasGuardadas[indexRonda][indexMesa]) {
        alert('No se encontró la mesa especificada.');
        return;
    }

    // Obtener la mesa específica
    const mesa = rondasGuardadas[indexRonda][indexMesa];

    // Obtener los jugadores ordenados de la mesa
    const jugadoresOrdenados = [];
    $(mesaDiv).find('.persona').each(function() {
        jugadoresOrdenados.push($(this).text().replace(/^\d+\.\s/, '')); // Eliminar el número inicial si existe
    });

    // Actualizar el orden de los jugadores en la mesa
    mesa.jugadores = jugadoresOrdenados.map((nombre) => {
        return mesa.jugadores.find((j) => j.nombre === nombre);
    });

    // Marcar la mesa como calculada
    mesa.resultadoGuardado = true;

    // Guardar los cambios en el localStorage
    localStorage.setItem('rondas', JSON.stringify(rondasGuardadas));
    
    // Actualizar la interfaz
    mostrarRondas();
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
            // actualizarEstadoRondas();
        }
    });
}

// Función para actualizar el estado de las rondas
// function actualizarEstadoRondas() {
//     const nuevasRondas = [];
//     $('#rondas-container .ronda').each(function() {
//         const mesas = [];
//         $(this).find('.mesa').each(function() {
//             const personas = [];
//             $(this).find('.persona').each(function() {
//                 personas.push($(this).text().replace(/^\d+\.\s/, '')); // Eliminar el número inicial
//             });
//             mesas.push(personas);
//         });
//         nuevasRondas.push(mesas);
//     });
//
//     rondas = nuevasRondas;
// }

// Función para actualizar la clasificación
function actualizarClasificacion() {
    const rondasGuardadas = JSON.parse(localStorage.getItem('rondas'));
    let clasificacion = [];
    let indexClasificacion = 0;
    rondasGuardadas.forEach((ronda, indexRonda) => {
        ronda.forEach((mesa, indexMesa) => {
            if(mesa.resultadoGuardado){
                mesa.jugadores.forEach((jugador, indexJugador) => {
                    jugador.posicion = indexJugador + 1;

                    //save on clasificacion an array the player name and points that must be 4 - position the key must be the id of jugador like clasificacion[jugador.id] = ['nombre' => jugador.nombre , 'puntos' => 4 - jugador.posicion];
                    if (clasificacion[jugador.id] === undefined) {
                        clasificacion[jugador.id] = { 'nombre': jugador.nombre, 'puntos': 5 - jugador.posicion };
                    }else{
                         clasificacion[jugador.id]['puntos'] = clasificacion[jugador.id]['puntos'] + 5 - jugador.posicion  ;
                    }
                });
            }
        });
    });

    const sortedClasificacion = Object.entries(clasificacion).sort((a, b) => b[1].puntos - a[1].puntos);

    // Update the clasificacion with the sorted entries
    clasificacion = Object.fromEntries(sortedClasificacion);


    const clasificacionList = document.getElementById('clasificacion');
    clasificacionList.innerHTML = '';


    sortedClasificacion.forEach(([id, jugador]) => {
        const li = document.createElement('li');
        li.textContent = `${jugador.nombre}: ${jugador.puntos} puntos`;
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
    const nombresGuardados = localStorage.getItem('jugadores');
    const rondasGuardadas = localStorage.getItem('rondas');
    if (nombresGuardados) {
        const namesInput = document.getElementById('names');
        namesInput.value = JSON.parse(nombresGuardados).map(j => j.nombre).join('\n');
        mostrarRondas();
    }

    // Ocultar el formulario al inicio
    $('#formulario').hide();
});

// Función para alternar la visibilidad del formulario
function toggleFormulario() {
    const formulario = $('#formulario');
    formulario.toggle('slow');
}