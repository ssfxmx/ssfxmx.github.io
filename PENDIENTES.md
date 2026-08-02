# Pendientes

Cosas detectadas durante el uso real que todavía no están hechas. Ordenadas por lo que duele antes.

---

## 1. Vincular invitados con jugadores registrados

**Estado:** anotado, sin empezar
**Prioridad:** media — sube cuando haya más gente registrándose

### El problema

Cuando se captura un resultado con el nombre escrito a mano (invitado), ese resultado queda suelto: `player_id` es nulo y solo existe `guest_nickname`.

Si más adelante esa misma persona se registra en el sitio, **no pasa nada automáticamente**. Su historial no aparece en su perfil y el torneo viejo sigue mostrándola como invitada.

### Por qué no se vincula solo

A propósito. Si el sistema uniera resultados por coincidencia de nombre, cualquiera podría registrarse con el nickname de un campeón conocido y heredarle sus torneos. Que haga falta la intervención de un administrador es la protección contra suplantación, no un olvido.

### Lo que falta

Hoy la vinculación ya se puede hacer a mano: Panel → Resultados → abrir el torneo → seleccionar al jugador registrado en lugar del invitado → Guardar. Funciona, pero **nadie avisa de que hay algo que vincular**. Si la coincidencia ocurre tres meses después, el historial se pierde por olvido.

### Propuesta

1. Consulta que cruce `event_results.guest_nickname` contra `profiles.nickname` sin distinguir mayúsculas, devolviendo las coincidencias
2. Aviso en el panel: "3 resultados de invitados coinciden con jugadores registrados"
3. Botón **Vincular** por fila, con confirmación que muestre torneo, posición y a quién se le asignaría
4. Que quede en `audit_log` — es un cambio de historial y debe poder rastrearse

### Cuidado al implementarlo

- La coincidencia de nombre **sugiere**, nunca decide. Siempre confirma una persona.
- Vale la pena mostrar la fecha de registro del jugador junto a la del torneo: si alguien se registró después y reclama un torneo de hace dos años, conviene verlo.
- Respetar `event_results_unique_player_per_event`: si el jugador ya tiene otra posición en ese mismo torneo, la vinculación debe rechazarse con un mensaje claro en lugar de reventar.

---

## 2. Ciudad como lista desplegable, con opción "Otro"

**Estado:** anotado, falta decidir el enfoque
**Prioridad:** alta — cuanto antes, más barato

### El problema

Hoy la ciudad es texto libre en el registro. Con diez personas ya habrá "CDMX", "Ciudad de México", "cdmx" y "Distrito Federal" conviviendo como si fueran cuatro lugares distintos.

Esto **ya está afectando** al filtro de ciudad del directorio de jugadores, que construye sus opciones leyendo los valores existentes: cada variante aparece como una entrada separada. Y hará imposible cualquier estadística por escena local ("cuántos jugadores hay en Monterrey") sin limpiar los datos a mano.

### Por qué urge decidirlo ahora

Con un solo usuario registrado, cambiar esto cuesta nada. Con cien, hay que normalizar datos reales, decidir a qué ciudad canónica corresponde cada texto raro, y hacerlo sin romper perfiles. El momento barato es ahora.

### Comportamiento deseado

- Lista desplegable con las ciudades disponibles
- Opción **"Otro"** al final; al elegirla aparece un campo de texto libre
- Lo mismo en el registro y en la edición de perfil, y como filtro en el directorio

### Decisión pendiente

**Opción A — catálogo en la base de datos (recomendada).**
Tabla `cities` (nombre, estado, activa, orden) editable desde el panel, con `profiles.city_id` como llave foránea y una columna aparte para el texto de quien eligió "Otro". Cuando varias personas escriban la misma ciudad nueva, el administrador la promueve al catálogo desde el panel y deja de ser texto libre.

Ventajas: los datos quedan limpios de verdad, las estadísticas por ciudad son fiables, y agregar una ciudad no requiere desplegar. Encaja con la filosofía de que el sitio se administre solo.
Coste: una migración y tocar tres pantallas. Es el momento más barato para hacerlo.

**Opción B — lista fija en el código.**
Un arreglo de ciudades junto al de países, guardando el nombre como texto igual que ahora.

Ventajas: se hace en una tarde, sin migración.
Coste: agregar una ciudad obliga a desplegar el sitio, y "Otro" vuelve a meter texto sucio sin forma de limpiarlo.

### Detalles a cuidar

- Sembrar el catálogo con las ciudades grandes de México agrupadas por estado, no con las 2 400 del país: una lista inmanejable es peor que un campo de texto.
- Los perfiles existentes conservan su texto actual; hay que decidir si se migran a mano o se dejan como "Otro".
- El filtro del directorio debe pasar a leer del catálogo, no de los valores existentes.

---

## 3. Respaldo automático de la base de datos

**Estado:** propuesto en el documento de arquitectura (§9.9), sin construir
**Prioridad:** alta antes de que haya datos reales que perder

El historial de torneos es el activo irremplazable del proyecto y el plan gratuito de Supabase no garantiza respaldos recuperables a largo plazo.

Falta un workflow semanal de GitHub Actions que exporte las tablas a un repositorio privado. Mientras solo haya datos de prueba no urge; en cuanto se cargue el primer torneo real, sí.

---

## 4. SMTP propio

**Estado:** pospuesto conscientemente durante la configuración inicial
**Prioridad:** BLOQUEANTE antes de anunciar el sitio a la comunidad

El servidor de correo integrado de Supabase envía unos pocos mensajes por hora. Alcanza para pruebas de una persona.

El día que se anuncie el sitio y se registren veinte personas a la vez, la mayoría no recibirá su correo de confirmación, no podrá entrar, y se perderán en el peor momento posible.

Configurar Resend o Brevo son 15 minutos. Está detallado en el bloque 3 de la guía de configuración.

---

## 5. Revisar textos de contacto

**Estado:** menor

La configuración del sitio trae `ssfxmx@gmail.com` como correo público, pero la cuenta de administrador se registró con otro. Revisar en Panel → Configuración cuál debe quedar visible.

---

## Ideas sin compromiso

Cosas que pueden tener sentido más adelante. Ninguna es urgente y varias pueden no valer la pena:

- **Invitar jugadores por correo desde el panel.** Requiere una Edge Function que guarde la llave secreta en el servidor. Solo tiene sentido si hay gente que no logra registrarse sola; antes de construirlo conviene ver si el registro actual es el problema.
- **Cambio de nickname por el propio jugador**, con límite de frecuencia. Hoy lo hace un administrador para evitar suplantaciones.
- **Vista previa de cómo se verá un enlace al compartirlo** en WhatsApp o Discord, dentro del editor de noticias.
- **Recordatorio del próximo torneo** por correo a quienes se inscriban.
