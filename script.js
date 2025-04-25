document.addEventListener('DOMContentLoaded', () => {
    const bbRangeButtons = document.querySelectorAll('.bb-range-btn');
    const heroPositionsDiv = document.getElementById('hero-positions');
    const villainPositionsDiv = document.getElementById('villain-positions');
    const heroPositionButtons = heroPositionsDiv.querySelectorAll('.position-btn');
    const villainPositionButtons = villainPositionsDiv.querySelectorAll('.position-btn');
    const flopImage = document.getElementById('flop-image');
    const flopsListDiv = document.getElementById('flops-list');
    const flopsContainer = document.getElementById('flops-container');
    const rootDirectoryInput = document.getElementById('root-directory');
    let rootDirectory = null;

    // Al hacer clic en el input de directorio, abrir el selector
    rootDirectoryInput.addEventListener('click', async () => {
        try {
            rootDirectory = await window.showDirectoryPicker();
            rootDirectoryInput.value = rootDirectory.name; // Mostrar el nombre del directorio
            console.log('Root directory selected:', rootDirectory);
            loadAvailableFlops(); // Recarga los flops con el nuevo directorio
        } catch (err) {
            console.error('Error selecting directory:', err);
            alert('Error selecting directory. Please try again.');
        }
    });

    let currentBBRange = null;
    let currentHeroPosition = null;
    let currentVillainPosition = null;

    // Función para manejar la selección del rango BB
    bbRangeButtons.forEach(button => {
        button.addEventListener('click', () => {
            // Deselecciona el botón de rango BB previamente seleccionado
            bbRangeButtons.forEach(btn => btn.classList.remove('selected'));

            // Activa el botón seleccionado
            button.classList.add('selected');
            currentBBRange = button.dataset.range;

            // Muestra la sección de posiciones del héroe
            heroPositionsDiv.style.display = 'block';
            hideVillainPositionsAndFlops();

            // Limpia las selecciones de héroe y villano
            currentHeroPosition = null;
            currentVillainPosition = null;
            heroPositionButtons.forEach(btn => btn.classList.remove('selected'));
            villainPositionButtons.forEach(btn => btn.classList.remove('selected'));
            hideFlopImage(); // Oculta la imagen
            loadAvailableFlops(); // Cargar flops cuando cambia el rango BB
        });
    });

    // Función para manejar la selección de la posición del héroe
    heroPositionButtons.forEach(button => {
        button.addEventListener('click', () => {
            // Deselecciona la posición de héroe seleccionada previamente
            heroPositionButtons.forEach(btn => btn.classList.remove('selected'));

            // Activa el botón seleccionado
            button.classList.add('selected');
            currentHeroPosition = button.dataset.position;

            // Muestra la sección de posiciones del villano
            villainPositionsDiv.style.display = 'block';
            hideFlopsList();

            // Limpia la selección del villano
            currentVillainPosition = null;
            villainPositionButtons.forEach(btn => btn.classList.remove('selected'));
            hideFlopImage(); // Oculta la imagen
            loadAvailableFlops(); // Cargar flops cuando cambia la posicion de héroe
        });
    });

    // Función para manejar la selección de la posición del villano
    villainPositionButtons.forEach(button => {
        button.addEventListener('click', () => {
            // Deselecciona la posición del villano seleccionada previamente
            villainPositionButtons.forEach(btn => btn.classList.remove('selected'));

            // Activa el botón seleccionado
            button.classList.add('selected');
            currentVillainPosition = button.dataset.position;

            // Muestra la lista de flops
            flopsListDiv.style.display = 'block';

            // Actualiza la lista de flops disponibles
            hideFlopImage(); // Oculta la imagen
            loadAvailableFlops(); // Cargar flops cuando cambia la posicion del villano
        });
    });

    // Función para cargar los flops disponibles quecoinciden con la selección actual
    async function loadAvailableFlops() {
        // Limpia la lista de flops
        flopsContainer.innerHTML = '';

        // Si no se han seleccionado los 3 parámetros, no cargar ningún flop
        if (!currentBBRange || !currentHeroPosition || !currentVillainPosition) {
            return;
        }

        // Construye la ruta base de la carpeta
        const basePath = `${currentBBRange}/${currentHeroPosition}/${currentVillainPosition}/`;

        try {
            // Obtiene el directorio para el BB Range, Hero Position y Villain Position
            const directoryHandle = await getDirectoryHandle(rootDirectory, basePath);

            if (directoryHandle) {
                // Iterar sobre las carpetas (categorías) dentro del directorio
                for await (const categoryEntry of directoryHandle.values()) {
                    if (categoryEntry.kind === 'directory') {
                        const categoryName = categoryEntry.name; // Nombre de la carpeta = Categoría

                        // Crear el contenedor de la categoría
                        const categoryContainer = document.createElement('div');
                        categoryContainer.classList.add('category-container');

                        // Crea un encabezado para la categoría
                        const categoryHeader = document.createElement('div');
                        categoryHeader.classList.add('category-header');
                        categoryHeader.textContent = categoryName;
                        categoryContainer.appendChild(categoryHeader);

                        // Crea la lista de flops para esta categoría
                        const flopList = document.createElement('div');
                        flopList.classList.add('flop-list');

                        // Obtiene los archivos dentro de la categoría
                        const availableFiles = [];
                        for await (const entry of categoryEntry.values()) {
                            if (entry.kind === 'file') {
                                availableFiles.push(entry.name);
                            }
                        }

                        // Ordenar los nombres de los archivos alfabéticamente
                        availableFiles.sort();

                        // Crea los chips de flop para cada archivo
                        if (availableFiles.length > 0) {
                            availableFiles.forEach(fileName => {
                                // Elimina la extensión del archivo
                                const fileNameWithoutExtension = fileName.replace(/\.[^/.]+$/, "");

                                // Reemplaza las letras con los símbolos de palo
                                const formattedFileName = fileNameWithoutExtension
                                    .replace(/c/g, "♣️") // Clubs
                                    .replace(/s/g, "♠️") // Spades
                                    .replace(/h/g, "♥️") // Hearts
                                    .replace(/d/g, "♦️"); // Diamonds

                                const flopChip = document.createElement('div');
                                flopChip.classList.add('flop-chip');
                                flopChip.textContent = formattedFileName; // Muestra el nombre formateado
                                flopChip.addEventListener('click', () => showFlopDetails(`${basePath}${categoryName}/${fileName}`)); // Pasa la ruta completa a showFlopDetails
                                flopList.appendChild(flopChip);
                            });
                        } else {
                            // Si no hay archivos, muestra un mensaje
                            const noFilesMessage = document.createElement('div');
                            noFilesMessage.textContent = 'No flops available in this category.';
                            flopList.appendChild(noFilesMessage);
                        }

                        // Añade la lista de flops al contenedor de la categoría
                        categoryContainer.appendChild(flopList);

                        // Añade el contenedor de la categoría al contenedor principal
                        flopsContainer.appendChild(categoryContainer);

                        // Añade funcionalidad para expandir/colapsar la categoría
                        categoryHeader.addEventListener('click', () => {
                            categoryContainer.classList.toggle('expanded');
                            categoryHeader.classList.toggle('collapsed');
                        });
                    }
                }

                // Si no se encontraron categorías
                if (flopsContainer.children.length === 0) {
                    const noFilesMessage = document.createElement('div');
                    noFilesMessage.textContent = 'No categories or flops available for this combination.';
                    flopsContainer.appendChild(noFilesMessage);
                }
            } else {
                console.warn('Directory not found:', basePath);
                const noFilesMessage = document.createElement('div');
                noFilesMessage.textContent = 'Directory not found. Please check the directory path.';
                flopsContainer.appendChild(noFilesMessage);
            }
        } catch (err) {
            console.error('Error loading flops:', err);
            const noFilesMessage = document.createElement('div');
            noFilesMessage.textContent = 'Error loading flops. Please check the directory path.';
            flopsContainer.appendChild(noFilesMessage);
        }
    }

    // Función para obtener el directorio
    async function getDirectoryHandle(root, subDirectoryPath) {
        if (!root) {
            return null;
        }

        let currentDirectory = root;
        const pathParts = subDirectoryPath.split('/').filter(part => part !== '');

        for (const part of pathParts) {
            try {
                currentDirectory = await currentDirectory.getDirectoryHandle(part);
            } catch (err) {
                console.warn(`Directory not found: ${part} in path ${subDirectoryPath}`);
                return null;
            }
        }

        return currentDirectory;
    }

    // Función para mostrar los detalles de un flop seleccionado
    async function showFlopDetails(fullImagePath) {
        try {
            // Obtiene el archivo de la imagen
            const fileHandle = await getFileHandleFromPath(rootDirectory, fullImagePath);

            if (fileHandle) {
                const file = await fileHandle.getFile();
                const reader = new FileReader();

                reader.onload = (e) => {
                    flopImage.src = e.target.result; // Carga la imagen
                    flopImage.style.display = 'block';
                };

                reader.readAsDataURL(file); // Lee el archivo como Data URL
            } else {
                console.warn('File not found:', fullImagePath);
                flopImage.src = '#'; // Limpia la imagen
                flopImage.style.display = 'none';
                alert('Image not found!');
            }
        } catch (err) {
            console.error('Error loading file:', err);
            flopImage.src = '#'; // Limpia la imagen
            flopImage.style.display = 'none';
            alert('Error loading image!');
        }
    }

     // Función auxiliar para obtener un FileHandle a partir de una ruta completa
    async function getFileHandleFromPath(root, fullImagePath) {
      if (!root) {
        return null;
      }

      const pathParts = fullImagePath.split('/').filter(part => part !== '');
      let currentDirectory = root;
      let fileHandle = null;

      // Navega por el directorio
      for (let i = 0; i < pathParts.length - 1; i++) {
        try {
          currentDirectory = await currentDirectory.getDirectoryHandle(pathParts[i]);
        } catch (err) {
          console.warn(`Directory not found: ${pathParts[i]} in path ${fullImagePath}`);
          return null;
        }
      }

      // Obtiene el archivo
      try {
        fileHandle = await currentDirectory.getFileHandle(pathParts[pathParts.length - 1]);
        } catch (err) {
          console.warn(`File not found: ${pathParts[pathParts.length - 1]} in path ${fullImagePath}`);
          return null;
        }

      return fileHandle;
    }

    function hideVillainPositionsAndFlops() {
        villainPositionsDiv.style.display = 'none';
        flopsListDiv.style.display = 'none';
    }

    function hideFlopsList() {
        flopsListDiv.style.display = 'none';
    }

    function hideFlopImage() {
        flopImage.src = '#';
        flopImage.style.display = 'none';
    }
});
