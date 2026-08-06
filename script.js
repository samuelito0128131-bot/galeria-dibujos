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
// Sonido al hacer clic en "Subir un dibujo"
// ============================
const botonSubir = document.querySelector('.boton-subir');
const sonido = new Audio('sonido.mp3');

botonSubir.addEventListener('click', function () {
  sonido.currentTime = 0;
  sonido.play();
});

// ============================
// Elementos de la galería
// ============================
const inputImagen = document.getElementById('subirImagen');
const galeria = document.getElementById('galeria');

// ============================
// Crear una tarjeta de dibujo en la galería
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

    // Borra el registro en Firestore
    db.collection('dibujos').doc(id).delete().then(function () {
      // Borra el archivo en Storage usando su URL
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
// Subir un dibujo nuevo a Firebase
// ============================
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
});

// ============================
// Cargar todos los dibujos guardados al abrir la página
// ============================
db.collection('dibujos').orderBy('fecha', 'desc').onSnapshot(function (snapshot) {
  galeria.innerHTML = '';
  snapshot.forEach(function (doc) {
    const datos = doc.data();
    crearTarjeta(doc.id, datos.url);
  });
});