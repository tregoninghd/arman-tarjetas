# Tarjetas Informativas — ARMAN Seguridad Privada

## Cómo abrir el proyecto en VS Code

1. Descarga esta carpeta completa (los 6 archivos) y guárdala en tu computadora, por ejemplo en
   `Documentos/arman-tarjetas/`.
2. Abre VS Code → `Archivo > Abrir carpeta...` → selecciona `arman-tarjetas`.
3. Para probar el formulario: da clic derecho en `index.html` → **"Abrir con Live Server"**
   (si no tienes esa extensión, instálala desde el ícono de extensiones, busca "Live Server").
   - Sin Live Server también funciona: solo abre `index.html` con doble clic desde tu explorador
     de archivos, se abre directo en tu navegador.

**Importante:** para que funcione, los 5 archivos deben estar en la misma carpeta
(`index.html`, `style.css`, `app.js`, `docx.umd.js`, `logo-data.js`). No los muevas por separado.

## Qué archivo tocar según lo que quieras cambiar

| Quiero cambiar... | Edito el archivo... |
|---|---|
| Colores, tamaños, espaciados | `style.css` |
| Preguntas del formulario, textos, orden de las secciones | `index.html` |
| Código de acceso, listas desplegables, lógica, el contenido del Word generado | `app.js` |
| El logo | `logo-data.js` (reemplaza el texto base64) |
| — | `docx.umd.js` → **nunca lo edites**, es la librería que arma el Word |

## Cambios más comunes en `app.js`

Abre `app.js` en VS Code y usa Ctrl+F (buscar) para encontrar estas líneas:

- **Código de acceso:**
  `const ACCESS_CODE = "ARMAN2026";` — cambia el texto entre comillas.

- **Opciones de "Tipo de incidente":**
  busca `buildMultiChips('tipoIncidenteChips'` y edita la lista de textos entre `[ ]`.

- **Corporaciones policiales:** están en `index.html`, busca `<select id="corporacion">`.

- **Límite de caracteres de la descripción:**
  en `index.html` busca `maxlength="1800"`, y en `app.js` busca
  `bindCounter('hechos','countHechos',1800);` — cambia el número en ambos lados por igual.

- **Textos del pie de página (dirección, teléfono, autorización):**
  busca `footerLine(` en `app.js`, cada línea es un renglón del pie.

## Cómo probar tus cambios

1. Guarda el archivo que editaste.
2. Abre (o recarga) `index.html` en tu navegador.
3. Abre la consola del navegador con F12 si algo no funciona — ahí aparece el error exacto
   en rojo, casi siempre apunta a la línea con el problema (coma o comilla faltante).

## Cómo compartirlo con tus supervisores

Sube la carpeta completa a un hosting (Netlify Drop, GitHub Pages, o tu OneDrive/SharePoint)
y comparte el link de `index.html`. Si el hosting sirve un solo archivo, puedes usar
`tarjeta-informativa-arman.html` (la versión de un solo archivo, todo incluido) en vez de esta
carpeta — hace exactamente lo mismo, solo que todo empaquetado en un archivo.
