// Sonido al hacer clic en "Subir un dibujo"
const botonSubir = document.querySelector('.boton-subir');
const sonido = new Audio('sonido.mp3');

botonSubir.addEventListener('click', function () {
  sonido.currentTime = 0;
  sonido.play();
});

// Mostrar los dibujos subidos en la galería
const inputImagen = document.getElementById('subirImagen');
const galeria = document.getElementById('galeria');

inputImagen.addEventListener('change', function (evento) {
  const archivos = evento.target.files;

  for (const archivo of archivos) {
    const lector = new FileReader();

    lector.onload = function (e) {
      const tarjeta = document.createElement('div');
      tarjeta.className = 'tarjeta';

      const img = document.createElement('img');
      img.src = e.target.result;

      tarjeta.appendChild(img);
      galeria.appendChild(tarjeta);
    };

    lector.readAsDataURL(archivo);
  }
});