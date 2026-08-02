-- =============================================================================
-- Contenido inicial — Tutoriales
-- =============================================================================
-- Tres guías para que la sección no arranque vacía, una por cada tipo de
-- visitante que llega al sitio:
--
--   1. Instalación          → el que quiere jugar y no sabe por dónde empezar
--   2. Torneos              → el que ya juega y quiere competir
--   3. Guía del espectador  → el que solo quiere ver y entender qué pasa
--
-- Se puede ejecutar varias veces sin duplicar nada: si el slug ya existe,
-- actualiza el contenido en lugar de insertar otra fila.
--
-- El texto usa comillas dolarizadas ($md$ ... $md$) para no tener que escapar
-- los apóstrofes del español.
--
-- NOTA EDITORIAL: ningún tutorial indica dónde conseguir archivos de juego.
-- Fightcade gestiona lo necesario por su cuenta y el sitio no enlaza ni
-- describe fuentes de material con copyright.
-- =============================================================================

-- -----------------------------------------------------------------------------
-- 1. Cómo instalar Fightcade
-- -----------------------------------------------------------------------------
insert into public.tutorials (
  slug, title, summary, body_md, category_id, difficulty,
  estimated_min, status, display_order, author_id
) values (
  'como-instalar-fightcade',
  'Cómo instalar Fightcade',
  'Todo lo que necesitas para jugar Super Street Fighter II X en línea contra la comunidad. Desde cero, sin saber nada.',
  $md$
Fightcade es el programa donde juega la comunidad. Es gratuito, funciona en Windows, macOS y Linux, y su red está pensada para juegos de pelea de arcade: por eso se siente mejor que otras alternativas aunque el rival esté lejos.

Si nunca has jugado en línea, esta guía te deja listo en unos veinte minutos.

## 1. Descarga el programa

Ve a **fightcade.com** y descarga el instalador para tu sistema operativo.

Descarga siempre desde el sitio oficial. Circulan versiones modificadas en foros y grupos que no son de fiar.

## 2. Instálalo

Ejecuta el instalador y sigue los pasos. En Windows es posible que aparezca un aviso de SmartScreen porque el programa no es de una empresa grande: elige **Más información → Ejecutar de todas formas**.

Si tienes antivirus, puede marcar la carpeta como sospechosa. Es un falso positivo común con emuladores; si te preocupa, verifica que descargaste del sitio oficial antes de crear una excepción.

## 3. Crea tu cuenta

Al abrirlo por primera vez te pide usuario y contraseña. Ese nombre es el que verá todo el mundo en las salas.

**Consejo:** usa el mismo nickname que en esta página. Cuando alguien te vea jugando y quiera buscarte, te encontrará sin dar rodeos.

## 4. Deja que se actualice

Fightcade se actualiza solo. La primera vez puede tardar un poco: déjalo terminar antes de intentar entrar a una sala.

## 5. Busca Super Turbo

En la lista de juegos busca **Super Street Fighter II Turbo**. Aparece como `spf2t`.

Los archivos que el juego necesita los gestiona el propio programa cuando entras a una sala por primera vez. No hace falta que busques nada por tu cuenta.

## 6. Configura tus controles

Antes de jugar contra alguien, entra al modo de un jugador y configura los botones.

Recomendaciones de la comunidad:

- **Palanca o mando de pelea** si tienes. No es obligatorio: hay gente muy buena jugando en teclado.
- **Seis botones**, distribuidos como en el arcade: puño flojo, medio y fuerte arriba; patada floja, media y fuerte abajo.
- **Prueba antes de competir.** Descubrir que un botón está mal a media partida de torneo es frustrante.

## 7. Tu primera partida

En la lista de salas verás jugadores esperando. Cada uno muestra su **ping**: cuanto más bajo, mejor la conexión. Con jugadores de México suele rondar valores cómodos.

Haz doble clic sobre alguien para retarlo. Si acepta, empieza la partida.

**Etiqueta básica de la comunidad:**

- Saluda al empezar y agradece al terminar. Un `gg` basta.
- No abandones a media partida. Si tienes que irte, avisa.
- Si la conexión va mal, dilo con tranquilidad. Le pasa a todo el mundo.

## ¿Y ahora qué?

Ya puedes jugar. El siguiente paso natural es participar en un torneo mensual: hay una guía aparte que explica cómo entrar, y no necesitas ser bueno para apuntarte.

## Si algo no funciona

**No se conecta a las salas.** Suele ser el cortafuegos. Permite Fightcade en la configuración de red de tu sistema.

**Va lento o se entrecorta.** Prueba con cable de red en lugar de wifi. Es la mejora que más se nota, muy por encima de cualquier ajuste dentro del programa.

**No reconoce el mando.** Conéctalo antes de abrir Fightcade y vuelve a configurar los botones.

Si sigues atascado, pregunta en la comunidad. A todos nos costó la primera vez.
$md$,
  (select id from public.tutorial_categories where slug = 'instalacion'),
  1, 20, 'published', 1,
  (select id from public.profiles where role = 'admin' order by created_at limit 1)
)
on conflict (slug) do update set
  title = excluded.title,
  summary = excluded.summary,
  body_md = excluded.body_md,
  category_id = excluded.category_id,
  difficulty = excluded.difficulty,
  estimated_min = excluded.estimated_min,
  status = excluded.status,
  display_order = excluded.display_order;


-- -----------------------------------------------------------------------------
-- 2. Cómo participar en un torneo
-- -----------------------------------------------------------------------------
insert into public.tutorials (
  slug, title, summary, body_md, category_id, difficulty,
  estimated_min, status, display_order, author_id
) values (
  'como-participar-en-un-torneo',
  'Cómo participar en un torneo',
  'Qué necesitas para entrar a un torneo mensual de SSF2X México. Spoiler: no hace falta ser bueno.',
  $md$
Los torneos son mensuales, gratuitos y abiertos a cualquiera. No hay filtro de nivel: entra gente que lleva treinta años jugando y gente que instaló Fightcade la semana pasada.

## Antes del torneo

**1. Ten Fightcade funcionando.** Si todavía no, empieza por la guía de instalación. Configura los controles con antelación: el día del torneo no es momento de descubrir que un botón está mal.

**2. Crea tu cuenta en esta página.** Sirve para que aparezcas en el directorio de jugadores, para que tus resultados queden en tu perfil y para que tu historial se acumule torneo tras torneo.

Usa el mismo nickname que en Fightcade. Facilita la vida a todo el mundo.

**3. Revisa la sección de Eventos.** Ahí está la fecha, la hora y el enlace de inscripción del próximo torneo. Las horas siempre se muestran en horario de la Ciudad de México, marcado como `CDMX`.

## El día del torneo

**Conéctate con antelación.** Quince minutos antes está bien. Da margen para resolver imprevistos sin retrasar a los demás.

**Usa cable de red si puedes.** Es lo que más mejora la experiencia, más que cualquier ajuste dentro del juego. Si solo tienes wifi, acércate al router.

**Cierra lo que no necesites.** Descargas, streaming y videollamadas compiten por tu conexión.

**Ten a mano el chat de la comunidad.** Ahí se coordinan los emparejamientos y se avisa de cualquier cambio.

## Durante el torneo

El formato exacto se anuncia en cada evento, pero suele ser doble eliminación: pierdes dos veces y quedas fuera.

**Cómo comportarse:**

- Saluda a tu rival antes de empezar
- Si la conexión falla de verdad, propón repetir con calma
- Al terminar, un `gg` y a seguir
- Si pierdes, quédate a ver. Se aprende más viendo buenos combates que jugando

## Después

Los resultados se publican en la sección de Resultados y se suman automáticamente a tu perfil: torneos jugados, podios, mejor puesto y el personaje que usaste en cada uno.

Ese historial se va acumulando. En un par de años tendrás un registro de tu propia trayectoria en la escena.

## Preguntas frecuentes

**¿Necesito ser bueno?** No. La mitad de los que entran van a perder sus primeros combates, y eso está bien. Es cómo empieza todo el mundo.

**¿Cuesta algo?** No.

**¿Puedo participar desde fuera de la Ciudad de México?** Sí. Los torneos en línea son nacionales; hay gente de todo el país. Los presenciales se anuncian con su sede.

**¿Puedo participar desde otro país?** Sí, aunque la conexión manda: cuanto más lejos, más difícil que la partida se sienta bien.

**¿Con qué personaje juego?** Con el que quieras. Los diecisiete son legales.
$md$,
  (select id from public.tutorial_categories where slug = 'competitivo'),
  1, 8, 'published', 1,
  (select id from public.profiles where role = 'admin' order by created_at limit 1)
)
on conflict (slug) do update set
  title = excluded.title,
  summary = excluded.summary,
  body_md = excluded.body_md,
  category_id = excluded.category_id,
  difficulty = excluded.difficulty,
  estimated_min = excluded.estimated_min,
  status = excluded.status,
  display_order = excluded.display_order;


-- -----------------------------------------------------------------------------
-- 3. Guía para espectadores
-- -----------------------------------------------------------------------------
insert into public.tutorials (
  slug, title, summary, body_md, category_id, difficulty,
  estimated_min, status, display_order, author_id
) values (
  'guia-para-espectadores',
  'Guía para espectadores',
  'No juegas, pero te gusta ver. Qué está pasando en pantalla y por qué la gente grita.',
  $md$
No hace falta jugar para disfrutar Super Turbo. De hecho, buena parte de la comunidad llegó primero mirando.

Esta guía es para entender qué ocurre en pantalla sin haber tocado nunca el juego.

## Qué estás viendo

Super Street Fighter II X, conocido fuera de Japón como Super Street Fighter II Turbo, salió en 1994. Treinta años después se sigue jugando en torneos de todo el mundo, y no por nostalgia: es un juego que nunca terminó de resolverse.

Cada combate es al mejor de tres asaltos. Gana quien vacíe la barra de vida del otro o quede con más vida cuando se acabe el tiempo.

## Por qué la gente grita

Cuatro momentos que suelen levantar a la sala:

**El anti-aéreo.** El que salta queda comprometido: no puede cambiar de idea en el aire. Golpearlo justo antes de que caiga exige leer la intención medio segundo antes.

**El agarre en el último instante.** Se agarra a quemarropa, sin aviso. Cuando alguien lo hace con la vida al mínimo, es media victoria.

**El combate a un pixel de vida.** Con las barras casi vacías, un solo golpe decide. Ahí es donde el nivel real aparece.

**El personaje inesperado.** Cuando alguien gana con un personaje que nadie considera fuerte, la sala se viene abajo.

## El detalle que hace especial a este juego

Cada personaje pega distinto, se mueve distinto y alcanza distinto. Un jugador experto no gana apretando botones más rápido: gana colocándose a la distancia exacta donde su personaje es peligroso y el rival no.

Eso es lo que se llama **el juego de piernas**. Cuando veas a dos jugadores yendo y viniendo sin tocarse, no están perdiendo el tiempo: están peleando por esa distancia. Es la parte más difícil del juego y la que menos se nota al principio.

## Cómo seguir la escena

**Eventos** — cuándo es el próximo torneo y dónde verlo.

**Resultados** — quién ganó cada torneo, con qué personaje y en qué puesto quedó cada quien.

**Jugadores** — quién es quién en la comunidad. Puedes filtrar por personaje si te interesa ver quién usa al tuyo.

**Noticias** — lo que pasa en la escena mexicana.

No necesitas cuenta para nada de esto. El registro solo hace falta si algún día quieres competir.

## ¿Y si me dan ganas de jugar?

Pasa más de lo que crees.

El juego tiene treinta años, así que corre en cualquier computadora. Empieza por la guía de instalación de Fightcade y en veinte minutos estás dentro.

Nadie espera que seas bueno. Solo que aparezcas.
$md$,
  (select id from public.tutorial_categories where slug = 'fundamentos'),
  1, 6, 'published', 1,
  (select id from public.profiles where role = 'admin' order by created_at limit 1)
)
on conflict (slug) do update set
  title = excluded.title,
  summary = excluded.summary,
  body_md = excluded.body_md,
  category_id = excluded.category_id,
  difficulty = excluded.difficulty,
  estimated_min = excluded.estimated_min,
  status = excluded.status,
  display_order = excluded.display_order;


-- -----------------------------------------------------------------------------
-- Verificación
-- -----------------------------------------------------------------------------
select t.display_order, t.title, c.name as categoria, t.status
from public.tutorials t
left join public.tutorial_categories c on c.id = t.category_id
order by c.display_order, t.display_order;
