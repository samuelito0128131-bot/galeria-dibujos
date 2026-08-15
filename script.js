// ============================
// CONFIGURACIÓN DE FIREBASE
// ============================
const firebaseConfig = {
  apiKey: "AIzaSyA24efU5FhalWcEbg1-mc1j3Kr6luIfrpo",
  authDomain: "samu-arts.firebaseapp.com",
  projectId: "samu-arts",
  storageBucket: "samu-arts.firebasestorage.app",
  messagingSenderId: "323923454251",
  appId: "1:323923454251:web:c2bab5b74c0f4eddb13d6e"
};

firebase.initializeApp(firebaseConfig);
const storage = firebase.storage();
const db = firebase.firestore();

// ============================
// Sonido al hacer clic en los botones de subir
// ============================
const sonido = new Audio('sonido.mp3');
document.querySelectorAll('.boton-subir').forEach(function (boton) {
  boton.addEventListener('click', function () {
    sonido.currentTime = 0;
    sonido.play();
  });
});

// ============================
// Elementos generales
// ============================
const galeria = document.getElementById('galeria');
let dibujosCache = [];
let historietasCache = [];

// ============================
// Render combinado de la galería
// ============================
function renderGaleria() {
  const todos = [...dibujosCache, ...historietasCache];

  todos.sort(function (a, b) {
    const fechaA = a.datos.fecha ? a.datos.fecha.toMillis() : 0;
    const fechaB = b.datos.fecha ? b.datos.fecha.toMillis() : 0;
    return fechaB - fechaA;
  });

  galeria.innerHTML = '';

  todos.forEach(function (item) {
    if (item.tipo === 'historieta') {
      crearTarjetaHistorieta(item.id, item.datos);
    } else {
      crearTarjeta(item.id, item.datos.url);
    }
  });
}

// ============================
// Tarjeta de dibujo individual
// ============================
function crearTarjeta(id, url) {
  const tarjeta = document.createElement('div');
  tarjeta.className = 'tarjeta';

  const img = document.createElement('img');
  img.src = url;

  const botonEliminar = document.createElement('button');
  botonEliminar.className = 'btn-eliminar';
  botonEliminar.innerHTML = '🗑️';
  botonEliminar.title = 'Eliminar dibujo';

  botonEliminar.addEventListener('click', function () {
    const confirmar = confirm('¿Seguro que quieres eliminar este dibujo?');
    if (!confirmar) return;

    db.collection('dibujos').doc(id).delete().then(function () {
      return storage.refFromURL(url).delete();
    }).catch(function (error) {
      console.error('Error al eliminar:', error);
      alert('Hubo un problema al eliminar el dibujo.');
    });
  });

  tarjeta.appendChild(img);
  tarjeta.appendChild(botonEliminar);
  galeria.appendChild(tarjeta);
}

// ============================
// Tarjeta de historieta (portada)
// ============================
function crearTarjetaHistorieta(id, datos) {
  const tarjeta = document.createElement('div');
  tarjeta.className = 'tarjeta tarjeta-historieta';

  const badge = document.createElement('div');
  badge.className = 'badge-libro';
  badge.innerHTML = '📖';

  const img = document.createElement('img');
  img.src = datos.paginas[0];

  const botonEliminar = document.createElement('button');
  botonEliminar.className = 'btn-eliminar';
  botonEliminar.innerHTML = '🗑️';
  botonEliminar.title = 'Eliminar historieta';

  botonEliminar.addEventListener('click', function (evento) {
    evento.stopPropagation();
    const confirmar = confirm('¿Seguro que quieres eliminar esta historieta completa?');
    if (!confirmar) return;

    db.collection('historietas').doc(id).delete().then(function () {
      const borrados = datos.paginas.map(function (url) {
        return storage.refFromURL(url).delete();
      });
      return Promise.all(borrados);
    }).catch(function (error) {
      console.error('Error al eliminar la historieta:', error);
      alert('Hubo un problema al eliminar la historieta.');
    });
  });

  tarjeta.addEventListener('click', function () {
    abrirLibro(datos.titulo || 'Historieta', datos.paginas);
  });

  tarjeta.appendChild(badge);
  tarjeta.appendChild(img);
  tarjeta.appendChild(botonEliminar);
  galeria.appendChild(tarjeta);
}

// ============================
// Subir un dibujo individual
// ============================
const inputImagen = document.getElementById('subirImagen');

inputImagen.addEventListener('change', function (evento) {
  const archivos = evento.target.files;

  for (const archivo of archivos) {
    const nombreArchivo = Date.now() + '_' + archivo.name;
    const referencia = storage.ref('dibujos/' + nombreArchivo);

    referencia.put(archivo).then(function (snapshot) {
      return snapshot.ref.getDownloadURL();
    }).then(function (url) {
      return db.collection('dibujos').add({
        url: url,
        fecha: firebase.firestore.FieldValue.serverTimestamp()
      });
    }).catch(function (error) {
      console.error('Error al subir el dibujo:', error);
      alert('Hubo un problema al subir el dibujo. Intenta de nuevo.');
    });
  }

  evento.target.value = '';
});

// ============================
// Subir una historieta (varias páginas)
// ============================
const inputHistorieta = document.getElementById('subirHistorieta');

inputHistorieta.addEventListener('change', function (evento) {
  const archivos = Array.from(evento.target.files);
  if (archivos.length === 0) return;

  const titulo = prompt('¿Cómo se llama tu historieta?', 'Mi historieta');
  if (titulo === null) {
    evento.target.value = '';
    return;
  }

  const subidas = archivos.map(function (archivo, index) {
    const nombreArchivo = Date.now() + '_' + index + '_' + archivo.name;
    const referencia = storage.ref('historietas/' + nombreArchivo);
    return referencia.put(archivo).then(function (snapshot) {
      return snapshot.ref.getDownloadURL();
    });
  });

  Promise.all(subidas).then(function (urls) {
    return db.collection('historietas').add({
      titulo: titulo,
      paginas: urls,
      fecha: firebase.firestore.FieldValue.serverTimestamp()
    });
  }).catch(function (error) {
    console.error('Error al subir la historieta:', error);
    alert('Hubo un problema al subir la historieta. Intenta de nuevo.');
  });

  evento.target.value = '';
});

// ============================
// Modo libro (visor de páginas)
// ============================
const modalLibro = document.getElementById('modalLibro');
const tituloLibro = document.getElementById('tituloLibro');
const paginaActualImg = document.getElementById('paginaActual');
const contadorPaginas = document.getElementById('contadorPaginas');
const botonCerrarLibro = document.getElementById('cerrarLibro');
const botonAnterior = document.getElementById('paginaAnterior');
const botonSiguiente = document.getElementById('paginaSiguiente');

let libroPaginas = [];
let paginaIndex = 0;

function abrirLibro(titulo, paginas) {
  libroPaginas = paginas;
  paginaIndex = 0;
  tituloLibro.textContent = titulo;
  actualizarPagina();
  modalLibro.classList.remove('oculto');
}

function actualizarPagina() {
  paginaActualImg.src = libroPaginas[paginaIndex];
  contadorPaginas.textContent = (paginaIndex + 1) + ' / ' + libroPaginas.length;
}

botonAnterior.addEventListener('click', function () {
  if (paginaIndex > 0) {
    paginaIndex--;
    actualizarPagina();
  }
});

botonSiguiente.addEventListener('click', function () {
  if (paginaIndex < libroPaginas.length - 1) {
    paginaIndex++;
    actualizarPagina();
  }
});

botonCerrarLibro.addEventListener('click', function () {
  modalLibro.classList.add('oculto');
});

// ============================
// Cargar dibujos e historietas desde Firebase
// ============================
db.collection('dibujos').orderBy('fecha', 'desc').onSnapshot(function (snapshot) {
  dibujosCache = snapshot.docs.map(function (doc) {
    return { id: doc.id, tipo: 'dibujo', datos: doc.data() };
  });
  renderGaleria();
});

db.collection('historietas').orderBy('fecha', 'desc').onSnapshot(function (snapshot) {
  historietasCache = snapshot.docs.map(function (doc) {
    return { id: doc.id, tipo: 'historieta', datos: doc.data() };
  });
  renderGaleria();
});
