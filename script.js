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