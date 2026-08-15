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
let animacionesCache = [];

// ============================
// Render combinado de la galería
// ============================
function renderGaleria() {
  const todos = [...dibujosCache, ...animacionesCache];

  todos.sort(function (a, b) {
    const fechaA = a.datos.fecha ? a.datos.fecha.toMillis() : 0;
    const fechaB = b.datos.fecha ? b.datos.fecha.toMillis() : 0;
    return fechaB - fechaA;
  });

  galeria.innerHTML = '';

  todos.forEach(function (item) {
    if (item.tipo === 'animacion') {
      crearTarjetaAnimacion(item.id, item.datos);
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
// Tarjeta de animación (video de "Entre Bestias" + burbuja)
// ============================
function crearTarjetaAnimacion(id, datos) {
  const tarjeta = document.createElement('div');
  tarjeta.className = 'tarjeta';

  const badge = document.createElement('div');
  badge.className = 'badge-animacion';
  badge.innerHTML = '🎬';

  const contenedorVideo = document.createElement('div');
  contenedorVideo.className = 'contenedor-video';

  if (datos.frase) {
    const burbuja = document.createElement('div');
    burbuja.className = 'burbuja';
    burbuja.textContent = datos.frase;
    contenedorVideo.appendChild(burbuja);
  }

  const video = document.createElement('video');
  video.src = datos.url;
  video.controls = true;
  video.playsInline = true;

  contenedorVideo.appendChild(video);

  const botonEliminar = document.createElement('button');
  botonEliminar.className = 'btn-eliminar';
  botonEliminar.innerHTML = '🗑️';
  botonEliminar.title = 'Eliminar animación';

  botonEliminar.addEventListener('click', function () {
    const confirmar = confirm('¿Seguro que quieres eliminar esta animación?');
    if (!confirmar) return;

    db.collection('animaciones').doc(id).delete().then(function () {
      return storage.refFromURL(datos.url).delete();
    }).catch(function (error) {
      console.error('Error al eliminar:', error);
      alert('Hubo un problema al eliminar la animación.');
    });
  });

  tarjeta.appendChild(badge);
  tarjeta.appendChild(contenedorVideo);
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
// Subir una animación (video de "Entre Bestias")
// ============================
const inputAnimacion = document.getElementById('subirAnimacion');

inputAnimacion.addEventListener('change', function (evento) {
  const archivo = evento.target.files[0];
  if (!archivo) return;

  const frase = prompt('¿Qué dice el personaje en esta escena? (déjalo vacío si no quieres burbuja)', '');

  const nombreArchivo = Date.now() + '_' + archivo.name;
  const referencia = storage.ref('animaciones/' + nombreArchivo);

  referencia.put(archivo).then(function (snapshot) {
    return snapshot.ref.getDownloadURL();
  }).then(function (url) {
    return db.collection('animaciones').add({
      url: url,
      frase: frase || '',
      fecha: firebase.firestore.FieldValue.serverTimestamp()
    });
  }).catch(function (error) {
    console.error('Error al subir la animación:', error);
    alert('Hubo un problema al subir la animación. Intenta de nuevo.');
  });

  evento.target.value = '';
});

// ============================
// Cargar dibujos y animaciones desde Firebase
// ============================
db.collection('dibujos').orderBy('fecha', 'desc').onSnapshot(function (snapshot) {
  dibujosCache = snapshot.docs.map(function (doc) {
    return { id: doc.id, tipo: 'dibujo', datos: doc.data() };
  });
  renderGaleria();
});

db.collection('animaciones').orderBy('fecha', 'desc').onSnapshot(function (snapshot) {
  animacionesCache = snapshot.docs.map(function (doc) {
    return { id: doc.id, tipo: 'animacion', datos: doc.data() };
  });
  renderGaleria();
});
