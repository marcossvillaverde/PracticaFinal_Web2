# EXAMEN — Marcos Villaverde

## Reto
F8 — Sanitización NoSQL + semántica HTTP 403→409 + tests de albarán

## Tarea técnica

### Qué problema detecté
Tres problemas en el proyecto: (1) No existía protección contra inyección NoSQL — `express-mongo-sanitize` no estaba instalado ni configurado, por lo que cualquier payload con operadores como `$gt`, `$ne`, etc. llegaba directamente a las queries de Mongoose. (2) En `deleteDeliveryNote`, cuando el albarán está firmado se devolvía un 403 (Forbidden) en lugar de un 409 (Conflict), que es el código semánticamente correcto para un conflicto de estado del recurso. (3) No existían tests de integración para el endpoint de albaranes.

### Cómo lo arreglé
- Instalé `express-mongo-sanitize` y lo añadí como middleware en `src/app.js` después de `express.json()` y antes de las rutas. En Express 5, `req.query` es de solo lectura (getter inmutable), por lo que `app.use(mongoSanitize())` lanza un error al intentar reasignarlo. La solución fue usar `mongoSanitize.sanitize()` directamente sobre `req.body` y `req.params`, que son los vectores de entrada donde realmente llegan los operadores NoSQL maliciosos.
- En `src/controllers/deliverynote.controller.js`, cambié `AppError.forbidden(...)` por `AppError.conflict(...)` en la función `deleteDeliveryNote`, alineándolo con el mismo patrón que ya usa `signDeliveryNote`.
- Creé `tests/deliverynote.test.js` con 4 tests de integración que cubren: creación exitosa (201), firma exitosa (200), intento de borrar firmado (409) y aislamiento multi-tenant (404).

### Por qué mi solución es correcta
- `mongoSanitize.sanitize()` elimina claves que empiezan por `$` o contienen `.` del body y params antes de que lleguen a cualquier controlador, bloqueando la inyección NoSQL a nivel de middleware global. La adaptación para Express 5 es necesaria porque el framework hace `req.query` inmutable, pero la protección real está en body y params que es donde viajan los datos de creación/actualización.
- El 409 (Conflict) es el código correcto porque el problema no es de permisos (el usuario SÍ tiene permiso para borrar sus albaranes), sino que el estado actual del recurso (firmado) impide la operación. Un 403 indicaría al consumidor de la API que carece de permisos, lo cual es incorrecto.
- Los tests verifican tanto el happy path como los edge cases críticos (conflicto de estado y aislamiento entre compañías), y el test de 409 habría fallado con el código original (que devolvía 403).

## Respuestas socráticas

1. `signDeliveryNote` devuelve 409 y `deleteDeliveryNote` devolvía 403 para la misma situación: el albarán está firmado e impide la acción. Son dos códigos distintos pero el patrón es idéntico, por lo que el correcto es 409 en ambos casos. Un 403 (Forbidden) significa que el usuario no tiene permisos para realizar la acción, independientemente del estado del recurso. Un 409 (Conflict) indica que la petición no puede completarse porque el estado actual del recurso lo impide. Para el consumidor de la API, un 403 le haría pensar que necesita más permisos, mientras que un 409 le comunica que el recurso está en un estado que bloquea la operación.

2. Si un atacante intenta inyección NoSQL y Mongoose lanza un `MongoServerError`, ese error NO llegaría a Slack en la mayoría de casos. El middleware `error-handler.js` comprueba primero si el error es operacional (`err.isOperational`), luego si es un `ValidationError` de Mongoose, y después si es un duplicado (`err.code === 11000`). Si el error es un `ValidationError` de Mongoose (que es lo más probable con un objeto en vez de un string), se manejaría en la línea 17 y devolvería un 400 sin notificar a Slack, ya que el middleware lo considera un error controlado. Solo si fuera un `MongoServerError` genérico que no encaja en ningún caso intermedio caería al bloque final (línea 37) donde SÍ se llama a `sendErrorToSlack`.

3. Sin `mongoSanitize()`, el payload `{ "name": "Empresa", "cif": { "$gt": "" } }` llegaría intacto al `createClient` en `client.controller.js`. En la línea 17, la query `Client.findOne({ company: company._id, cif: { "$gt": "" }, deleted: false })` interpretaría `$gt` como un operador de Mongoose, buscando cualquier cliente cuyo CIF sea mayor que una cadena vacía (es decir, cualquier cliente existente). Esto podría producir un falso positivo en la comprobación de duplicado y devolver un 409 incorrecto, o si no hay duplicado, Mongoose intentaría guardar un objeto `{ "$gt": "" }` en el campo `cif` (tipo String), lo que podría causar un error de validación o guardar datos corruptos. Con `mongoSanitize()` activo, el middleware eliminaría la clave `$gt` del body antes de que llegue al controlador, convirtiendo el campo en un objeto vacío o eliminándolo.

4. Si un usuario conecta 50 sockets simultáneos, el middleware de auth en `src/sockets/index.js` ejecutaría `User.findById(payload._id).populate('company')` una vez por cada conexión, es decir, 50 consultas a la base de datos con el mismo resultado. Una alternativa sería cachear el resultado del primer `findById` en memoria (por ejemplo, con un Map de `userId → userData` con TTL de unos minutos), o almacenar los datos de `company` directamente en el payload del JWT para evitar la consulta. El caché en memoria no compromete la seguridad multi-tenant siempre que se invalide cuando el usuario cambie de compañía o se elimine.

5. El caso de prueba más crítico para albaranes que no está cubierto por los tests de proyecto es el del albarán firmado: verificar que un albarán con `signed: true` no puede ser eliminado (devuelve 409). Este caso es exclusivo de albaranes porque los proyectos no tienen un estado "firmado" que bloquee operaciones. Un albarán firmado tiene implicaciones legales (es un documento con validez contractual), por lo que el test debe verificar que el sistema protege su inmutabilidad. El test de multi-tenant de proyecto demuestra aislamiento por compañía, pero no cubre la lógica de conflicto de estado que es específica del ciclo de vida del albarán.

## Proceso
Tiempo total invertido: 2 horas
Herramientas usadas: VS Code, Claude (IA)
Prompts a IA (si aplica, copia literal):
- "Sobre este repositorio de github tengo que hacer un reto que te voy a pasar ahora, hay que hacer algún commit en otra rama que la he llamado Examen."