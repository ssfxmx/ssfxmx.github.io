-- =============================================================================
-- Super Lucha Callejera — crónicas retroactivas
-- =============================================================================
-- Una noticia por cada una de las 24 ediciones de la serie, más una
-- retrospectiva que las enmarca. Todas se publican con su FECHA REAL, no con la
-- de hoy: así el archivo de noticias del sitio queda alineado con el historial
-- de eventos y se puede recorrer la historia de la comunidad de arriba abajo.
--
-- POR QUÉ LA NOTICIA NO REPITE LA CARTELERA
-- La cartelera completa ya vive en la ficha del evento, que es su lugar
-- natural: ahí se consulta, se filtra y algún día se cruzará con resultados.
-- Duplicarla aquí obligaría a corregir dos textos cada vez que aparezca un dato
-- nuevo, y tarde o temprano uno de los dos se quedaría viejo. La crónica cuenta
-- qué tuvo de particular esa noche y enlaza a la ficha; ese enlace es la única
-- relación que hace falta mantener.
--
-- REQUISITO PREVIO
-- Deben estar cargados los eventos (eventos-super-lucha-callejera.sql y
-- eventos-slc-especiales.sql). Los enlaces internos apuntan a sus slugs.
--
-- BORRADO EN BLOQUE
-- Todos los slugs empiezan por 'slc-':
--
--   delete from public.news where slug like 'slc-%';
-- =============================================================================

insert into public.news (
  slug, title, excerpt, body_md, status, is_featured, published_at, author_id
) values

-- 2020 -------------------------------------------------------------------------
(
  'slc-19-mexico-y-estados-unidos-vuelven-a-verse-las-caras',
  'SLC 19: México y Estados Unidos vuelven a verse las caras',
  'La decimonovena entrega de Super Lucha Callejera cerró el año con otra noche de exhibiciones entre las dos escenas.',
  E'Super Lucha Callejera llegó a su edición diecinueve manteniendo la fórmula que la hizo crecer: jugadores de México frente a jugadores de Estados Unidos, series largas y todo en Fightcade.\n\nLa serie nació de una idea de H-Zero y se transmitió con él y Riz0ne en los comentarios. En un año en el que los arcades estaban cerrados, fue el punto de encuentro de buena parte de la comunidad.\n\n[Ficha del evento](/eventos/slc-19) · [Ver la transmisión](https://www.youtube.com/watch?v=8PYJ-Vrmf88)',
  'published', false, '2020-12-11 22:00:00-06',
  (select id from public.profiles where role = 'admin' order by created_at limit 1)
),
(
  'slc-20-veinticuatro-invitados-para-cerrar-el-ano',
  'SLC 20: veinticuatro invitados para cerrar el año',
  'La edición veinte abandonó el formato de exhibiciones y montó un invitacional de 24 jugadores, mitad México y mitad Estados Unidos.',
  E'Para el número redondo, Super Lucha Callejera cambió de formato. En lugar de la ronda habitual de retos, se armó un invitacional con veinticuatro jugadores: doce de México y doce de Estados Unidos.\n\nCon el cuadro resuelto todavía hubo tiempo para exhibiciones. Las más comentadas fueron las dos series FT5 entre MarsGatti, especialista de Guile, y el veterano John Choi.\n\nEs la primera de las dos únicas ediciones de la serie con cuadro de eliminación; la otra llegaría en el número treinta.\n\n[Ficha del evento](/eventos/slc-20) · [Ver la transmisión](https://www.youtube.com/watch?v=NckqspVlmpc)',
  'published', false, '2020-12-18 22:00:00-06',
  (select id from public.profiles where role = 'admin' order by created_at limit 1)
),

-- 2021 -------------------------------------------------------------------------
(
  'slc-21-arranca-el-ano-con-marsgatti-contra-h-zero',
  'SLC 21: el año arranca con MarsGatti contra H-Zero',
  'Cinco series para abrir 2021, con el Guile de MarsGatti frente al O. Sagat de H-Zero como combate estelar a diez.',
  E'Primera edición del año y regreso al formato de exhibiciones. Cuatro series FT5 abrieron la noche y el estelar fue a diez: MarsGatti con Guile contra H-Zero con O. Sagat.\n\nEn el resto de la cartelera aparecieron Lionplex, Goromax, SuperrV, Jarek04, Scuzbucket, Pitufov, BlazedDonuts y Demonio Debian.\n\n[Ficha del evento](/eventos/slc-21) · [Ver la transmisión](https://www.youtube.com/watch?v=M5k4uMd9_VU)',
  'published', false, '2021-01-22 22:00:00-06',
  (select id from public.profiles where role = 'admin' order by created_at limit 1)
),
(
  'slc-22-canada-se-suma-a-la-serie',
  'SLC 22: Canadá se suma a la serie',
  'Atari representó a Canadá y Estados Unidos, y MarsGatti volvió al estelar, esta vez contra el Dictator de Kyouya.',
  E'La edición veintidós amplió el mapa: Atari entró a la cartelera representando a Canadá además de Estados Unidos, en una serie contra el Chun-Li de Demonio Debian.\n\nEl estelar volvió a tener a MarsGatti, esta vez a diez contra el Dictator de Kyouya. Antes pasaron por pantalla Comeback, AR Zumpango, Mr. Carabano, Fack, Enforcer04 y Hassassin10.\n\n[Ficha del evento](/eventos/slc-22) · [Ver la transmisión](https://www.youtube.com/watch?v=HyxRe0MhGV4)',
  'published', false, '2021-02-05 22:00:00-06',
  (select id from public.profiles where role = 'admin' order by created_at limit 1)
),
(
  'slc-23-puerto-rico-entra-a-la-cartelera',
  'SLC 23: Puerto Rico entra a la cartelera',
  'Seis combates, con Real Decoy representando a Puerto Rico y un cierre entre Megaman X y Hokuto.',
  E'La edición veintitrés fue de las más largas de la temporada: seis combates en lugar de los cinco habituales.\n\nReal Decoy representó a Puerto Rico, alternando Blanka y Chun-Li contra el E. Honda de Galo Diaz. El estelar a diez enfrentó al E. Honda de X64 con el Claw de Pitufov, y todavía quedó espacio para ver a Megaman X contra el Fei Long de Hokuto.\n\n[Ficha del evento](/eventos/slc-23) · [Ver la transmisión](https://www.youtube.com/watch?v=YdLq7F-Nw_k)',
  'published', false, '2021-02-19 22:00:00-06',
  (select id from public.profiles where role = 'admin' order by created_at limit 1)
),
(
  'slc-24-krost-contra-hokuto-y-una-sesion-de-ken-contra-claw',
  'SLC 24: Krost contra Hokuto y una sesión de Ken contra Claw',
  'El estelar fue O. Ken contra Claw, y al terminar la transmisión siguió con combates de concepto sobre ese mismo emparejamiento.',
  E'El combate principal de la edición veinticuatro puso el O. Ken de Krost frente al Claw de Hokuto en una serie a diez.\n\nLo interesante llegó después: en vez de cerrar, la transmisión siguió con combates de concepto sobre ese mismo emparejamiento, uno de los más estudiados del juego. Ese tipo de sobremesa técnica es lo que distinguía a la serie de una simple ronda de retos.\n\nNormanJr911 representó a Canadá en la cartelera.\n\n[Ficha del evento](/eventos/slc-24) · [Ver la transmisión](https://www.youtube.com/watch?v=mmQj35HoXQY)',
  'published', false, '2021-03-05 22:00:00-06',
  (select id from public.profiles where role = 'admin' order by created_at limit 1)
),
(
  'slc-25-el-dhalsim-de-yito2k-en-el-estelar',
  'SLC 25: el Dhalsim de Yito2K en el estelar',
  'Yito2K se midió a diez contra ChoiBoy, y Real Decoy volvió a la cartelera representando a Puerto Rico.',
  E'La edición veinticinco cerró con Yito2K y su Dhalsim contra ChoiBoy, que alternó O. Sagat y Ryu, en una serie a diez.\n\nAntes pasaron Rakanishu, Lictrips, AndyMa, Galo Diaz, X64 y Kyouya. Real Decoy repitió presencia representando a Puerto Rico, esta vez contra el Chun-Li de DemonioDebian.\n\n[Ficha del evento](/eventos/slc-25) · [Ver la transmisión](https://www.youtube.com/watch?v=KFyknwyxVKE)',
  'published', false, '2021-03-19 22:00:00-06',
  (select id from public.profiles where role = 'admin' order by created_at limit 1)
),
(
  'slc-26-riz0ne-explica-un-error-del-juego-en-vivo',
  'SLC 26: Riz0ne explica un error del juego en vivo',
  'Al terminar las exhibiciones, la transmisión se detuvo a demostrar por qué Ryu no puede usar el huracán como recuperación tras un anti-aéreo.',
  E'La edición veintiséis terminó con SuperrV contra el Dhalsim de Yito2K a diez, pero lo que quedó de esa noche fue lo que vino después.\n\nCon la cartelera cerrada, Riz0ne se tomó el tiempo de explicar y demostrar en pantalla un error del juego: Ryu no puede ejecutar el huracán como ataque de recuperación después de recibir un anti-aéreo. Documentar ese tipo de detalle en vivo, frente a la comunidad, era parte del valor de la serie.\n\n[Ficha del evento](/eventos/slc-26) · [Ver la transmisión](https://www.youtube.com/watch?v=nfVLQtsEHBU)',
  'published', false, '2021-04-02 22:00:00-06',
  (select id from public.profiles where role = 'admin' order by created_at limit 1)
),
(
  'slc-27-silentscope-al-microfono-y-al-mando',
  'SLC 27: SilentScope, al micrófono y al mando',
  'Comentó buena parte de la noche y después bajó a jugar el estelar con Cammy contra Jarek04.',
  E'En la edición veintisiete SilentScope hizo las dos cosas: comentó junto a Hokuto y Riz0ne, y después jugó el combate principal con Cammy contra Jarek04, que alternó O. Ken y Ken.\n\nEn el resto de la cartelera aparecieron Klimax, Kiba, Mr. Cochise, Kela420, SnoopyGlobal, Hassassin10, Rakanishu y DemonioDebian.\n\n[Ficha del evento](/eventos/slc-27) · [Ver la transmisión](https://www.youtube.com/watch?v=imoNDluVnYY)',
  'published', false, '2021-04-16 22:00:00-05',
  (select id from public.profiles where role = 'admin' order by created_at limit 1)
),
(
  'slc-28-frank-punches-contra-demoniodebian-a-diez',
  'SLC 28: Frank Punches contra DemonioDebian a diez',
  'Ryu contra Chun-Li en el estelar, con Megaman X sumándose a los comentarios.',
  E'La edición veintiocho cerró con uno de los emparejamientos clásicos del juego: el Ryu de Frank Punches contra el Chun-Li de DemonioDebian, a diez.\n\nMegaman X se sumó a Hokuto y Riz0ne en los comentarios. Antes del estelar pasaron Paul5567, DJ_Vanilla, Lionplex, Fiero, Scuzbucket, Fack, CigarBoB y Pitufov.\n\n[Ficha del evento](/eventos/slc-28) · [Ver la transmisión](https://www.youtube.com/watch?v=n8HeCb-46mg)',
  'published', false, '2021-04-30 22:00:00-05',
  (select id from public.profiles where role = 'admin' order by created_at limit 1)
),
(
  'slc-29-jesus4365-contra-galo-diaz-para-cerrar-la-noche',
  'SLC 29: Jesus4365 contra Galo Diaz para cerrar la noche',
  'Claw contra E. Honda en el estelar, en la última edición antes del segundo torneo de la serie.',
  E'La edición veintinueve fue la antesala del segundo invitacional. Cerró con el Claw de Jesus4365 contra el E. Honda de Galo Diaz en una serie a diez.\n\nAntes se vieron Outcider, Lictrips, SeanFPA, Kela420, Jesse James, Goromax, CigarBoB y Kyouya. Comentaron Hokuto y Riz0ne.\n\n[Ficha del evento](/eventos/slc-29) · [Ver la transmisión](https://www.youtube.com/watch?v=uzk7-Lajwtw)',
  'published', false, '2021-05-14 22:00:00-05',
  (select id from public.profiles where role = 'admin' order by created_at limit 1)
),
(
  'slc-30-treinta-y-dos-jugadores-de-tres-paises',
  'SLC 30: treinta y dos jugadores de tres países',
  'El segundo invitacional de la serie creció a 32 plazas y sumó a Canadá junto a México y Estados Unidos.',
  E'Como en la edición veinte, el número redondo trajo torneo. Esta vez el invitacional creció a treinta y dos plazas y abrió la puerta a Canadá, además de México y Estados Unidos.\n\nRiz0ne y H-Zero transmitieron el cuadro completo. Es el evento más grande de toda la serie y el último con formato de eliminación.\n\n[Ficha del evento](/eventos/slc-30) · [Ver la transmisión](https://www.youtube.com/watch?v=E3osuP6ZZhg)',
  'published', false, '2021-05-28 22:00:00-05',
  (select id from public.profiles where role = 'admin' order by created_at limit 1)
),
(
  'slc-31-una-noche-de-espejos',
  'SLC 31: una noche de espejos',
  'Tras dos meses de pausa, la serie regresó con seis combates del mismo personaje en los dos lados.',
  E'Después de casi dos meses sin transmisión, Super Lucha Callejera volvió con una idea distinta: seis series FT5, todas de espejo, con el mismo personaje en ambos lados.\n\nZangief, Guile, Ryu, Chun-Li, Cammy y E. Honda tuvieron cada uno su combate. El formato quita el factor del emparejamiento y deja a la vista lo que muchas veces queda tapado: quién conoce mejor a su personaje.\n\nComentaron Hokuto y Riz0ne.\n\n[Ficha del evento](/eventos/slc-31) · [Ver la transmisión](https://www.youtube.com/watch?v=sDsSWsXWNLo)',
  'published', false, '2021-07-23 22:00:00-05',
  (select id from public.profiles where role = 'admin' order by created_at limit 1)
),
(
  'slc-32-el-kumite-de-yito2k',
  'SLC 32: el kumite de Yito2K',
  'Un solo jugador mexicano contra seis estadounidenses en series FT5. Y al final, también contra los comentaristas.',
  E'La última edición numerada de la serie fue un kumite: Yito2K, especialista de Dhalsim, contra seis jugadores de Estados Unidos, uno tras otro, en series FT5.\n\nPasaron Ultrasean, Real Decoy, Megaman X, Klimax, X64 y Scuzbucket. Con la lista agotada, H-Zero pidió a los comentaristas entrar también, así que Yito2K jugó series extra contra Riz0ne y contra Hokuto.\n\nCon el número treinta y dos terminó la numeración. Lo que siguió fueron formatos especiales.\n\n[Ficha del evento](/eventos/slc-32) · [Ver la transmisión](https://www.youtube.com/watch?v=xl4TzwSdcVc)',
  'published', false, '2021-08-20 22:00:00-05',
  (select id from public.profiles where role = 'admin' order by created_at limit 1)
),
(
  'slc-triple-threat-el-primer-combate-a-tres-bandas',
  'Triple Threat: el primer combate a tres bandas de la serie',
  'Tuesday Night Fights se cruzó con Super Lucha Callejera y estrenó un formato que la serie repetiría cuatro veces más.',
  E'Super Lucha Callejera se cruzó con Tuesday Night Fights para estrenar un formato nuevo: tres jugadores, ganador se queda, primero en llegar a diez series ganadas.\n\nEntraron H-Zero y Goromax por México y ChoiBoy por Estados Unidos. El formato funcionó lo bastante bien como para volver otras cuatro veces a lo largo de los dos años siguientes.\n\n[Ficha del evento](/eventos/slc-triple-threat-1) · [Ver la transmisión](https://www.youtube.com/watch?v=kFsWlHwvzEs)',
  'published', false, '2021-10-05 22:00:00-05',
  (select id from public.profiles where role = 'admin' order by created_at limit 1)
),
(
  'slc-fatal-4-way-el-formato-a-cuatro-bandas',
  'Fatal 4 Way: la serie estrena el formato a cuatro bandas',
  'Enforcer04, DemonioDebian, Goromax y Scuzbucket, ganador se queda, carrera a quince puntos.',
  E'Un mes después del primer triple, la serie subió la apuesta a cuatro jugadores: Enforcer04, DemonioDebian, Goromax y Scuzbucket.\n\nLas series fueron a uno para que la fila se moviera rápido. El ganador sumaba un punto y se quedaba, el perdedor iba al final de la cola, y ganaba el primero en llegar a quince.\n\n[Ficha del evento](/eventos/slc-fatal-4-way) · [Ver la transmisión](https://www.youtube.com/watch?v=I7aKhnJekpY)',
  'published', false, '2021-11-05 22:00:00-06',
  (select id from public.profiles where role = 'admin' order by created_at limit 1)
),

-- 2022 -------------------------------------------------------------------------
(
  'slc-triple-threat-chuky94-enforcer04-fi3ro',
  'Triple Threat: Chuky94, Enforcer04 y Fi3ro',
  'Regreso del formato a tres bandas, y una clase de Riz0ne y Hokuto sobre Ryu, Guile y Dee Jay al terminar.',
  E'Tras varios meses sin transmisión, la serie volvió con un triple entre Chuky94, Enforcer04 y Fi3ro. Series a dos, ganador se queda, carrera a diez puntos.\n\nAl terminar, Riz0ne y Hokuto se quedaron en pantalla para mostrar técnicas específicas de Ryu, Guile y Dee Jay.\n\n[Ficha del evento](/eventos/slc-triple-threat-2) · [Ver la transmisión](https://www.youtube.com/watch?v=9frhIdEdJio)',
  'published', false, '2022-05-06 22:00:00-05',
  (select id from public.profiles where role = 'admin' order by created_at limit 1)
),
(
  'slc-triple-threat-galodiaz-scuzbucket-pitufov',
  'Triple Threat: GaloDiaz, Scuzbucket y Pitufov',
  'Se resolvió en cerca de una hora y todavía hubo revancha de despecho al final.',
  E'Tres semanas después del anterior, otro triple: GaloDiaz, Scuzbucket y Pitufov, con las mismas reglas de series a dos y carrera a diez puntos.\n\nEsta vez todo se resolvió en cerca de una hora, rápido para el formato. Quedó tiempo de sobra, así que hubo revancha de despecho al final.\n\n[Ficha del evento](/eventos/slc-triple-threat-3) · [Ver la transmisión](https://www.youtube.com/watch?v=gof66IXg-NI)',
  'published', false, '2022-05-30 22:00:00-05',
  (select id from public.profiles where role = 'admin' order by created_at limit 1)
),
(
  'slc-three-amigos-challenge-marsgatti-contra-tres-mexicanos',
  'Three Amigos Challenge: MarsGatti contra tres mexicanos',
  'Uno de los jugadores más fuertes de Estados Unidos frente a Hokuto, Yito2K y H-Zero, en Super Turbo y en New Legacy.',
  E'Formato nuevo dentro de la serie: uno contra tres. MarsGatti, de Estados Unidos, se midió por turnos contra Hokuto, Yito2K y H-Zero.\n\nLa noche tuvo además una segunda capa: no todo se jugó en Super Street Fighter II X, también hubo combates en New Legacy, la versión con ajustes de balance de la comunidad.\n\nTransmitieron Riz0ne y H-Zero.\n\n[Ficha del evento](/eventos/slc-three-amigos-challenge) · [Ver la transmisión](https://www.youtube.com/watch?v=jn0a5a6ttng)',
  'published', false, '2022-09-02 22:00:00-05',
  (select id from public.profiles where role = 'admin' order by created_at limit 1)
),
(
  'slc-road-to-france-preparacion-rumbo-a-lyon',
  'Road to France: preparación rumbo a Lyon',
  'JPong, SilentScope y Megaman X se prepararon contra jugadores mexicanos antes de viajar al X Street Battle.',
  E'Dos semanas antes del X Street Battle de Lyon, la serie montó una noche de preparación para los jugadores norteamericanos que viajaban al torneo.\n\nJPong, SilentScope y Megaman X se midieron contra Hokuto, Yito2K y compañía. Que México sirviera de banco de pruebas para quienes iban a un torneo europeo dice bastante del nivel que la escena había alcanzado.\n\nTransmitieron Riz0ne y H-Zero.\n\n[Ficha del evento](/eventos/slc-road-to-france) · [Ver la transmisión](https://www.youtube.com/watch?v=rYLc5afcGqk)',
  'published', false, '2022-09-16 22:00:00-05',
  (select id from public.profiles where role = 'admin' order by created_at limit 1)
),

-- 2023 -------------------------------------------------------------------------
(
  'slc-triple-threat-viernes-13-y-marsgatti-contra-yito2k',
  'Viernes 13: triple amenaza y MarsGatti contra Yito2K',
  'Combate a tres bandas más una serie FT10 de exhibición que se quedaría a medias y tendría continuación.',
  E'La serie abrió 2023 con una edición de viernes trece: un triple más una serie FT10 de exhibición.\n\nEn el triple participaron Demonio Debian con Chun-Li por México y Mr. Carabano con Guile, entre otros. El FT10 entre MarsGatti y Yito2K resultó lo bastante interesante como para merecer su propia noche dos meses después.\n\nTransmitieron Riz0ne y H-Zero.\n\n[Ficha del evento](/eventos/slc-triple-threat-4) · [Ver la transmisión](https://www.youtube.com/watch?v=XSSbLs5JLrY)',
  'published', false, '2023-01-13 22:00:00-06',
  (select id from public.profiles where role = 'admin' order by created_at limit 1)
),
(
  'slc-yito2k-contra-marsgatti-tres-series-ft10',
  'Yito2K contra MarsGatti: tres series FT10',
  'Continuación del estelar de enero, con una variante: personaje principal contra personaje secundario antes del cierre.',
  E'Lo que en enero fue una exhibición dentro de una cartelera más amplia se convirtió en el evento completo: tres series FT10 entre Yito2K y MarsGatti.\n\nAntes del cierre hubo una variante que no se había visto en la serie: una serie de personaje principal contra personaje secundario, con los dos jugadores fuera de su terreno habitual.\n\nTransmitieron Riz0ne y H-Zero.\n\n[Ficha del evento](/eventos/slc-yito2k-vs-marsgatti-ft10) · [Ver la transmisión](https://www.youtube.com/watch?v=1LxDHkHmsu4)',
  'published', false, '2023-03-03 22:00:00-06',
  (select id from public.profiles where role = 'admin' order by created_at limit 1)
),
(
  'slc-regresa-hokuto-con-claw-contra-el-zangief-de-megaman-x',
  'La serie regresa: el Claw de Hokuto contra el Zangief de Megaman X',
  'Tres exhibiciones entre México y Estados Unidos tras seis meses de pausa.',
  E'Después de medio año sin transmisión, Super Lucha Callejera volvió con tres exhibiciones entre México y Estados Unidos.\n\nEl estelar puso a Hokuto con Claw frente a Megaman X con Zangief, uno de los emparejamientos más incómodos del juego para ambos lados.\n\nTransmitieron Riz0ne y H-Zero.\n\n[Ficha del evento](/eventos/slc-hokuto-vs-megaman-x) · [Ver la transmisión](https://www.youtube.com/watch?v=zJ-NqiUR5HA)',
  'published', false, '2023-09-22 22:00:00-06',
  (select id from public.profiles where role = 'admin' order by created_at limit 1)
),
(
  'slc-the-best-hyper-fighters-la-serie-cambia-de-juego',
  'The Best Hyper Fighters: la serie cambia de juego',
  'Por única vez, Super Lucha Callejera se salió de Super Turbo y transmitió una noche completa de Hyper Fighting.',
  E'La última transmisión de la serie fue también la más atípica: no se jugó Super Street Fighter II X, sino **Hyper Fighting**.\n\nEl formato fue un triple entre DJILK con Ryu, Goromax alternando Guile y M. Bison, y Eggsnbaconnn rotando Chun-Li, Dhalsim, Balrog y Sagat, en carrera a diez series ganadas.\n\nEs el único evento de las veinticuatro ediciones que no es de Super Turbo. Conviene tenerlo presente al mirar estadísticas: no debería contarse junto con los demás.\n\n[Ficha del evento](/eventos/slc-best-hyper-fighters) · [Ver la transmisión](https://www.youtube.com/watch?v=r4JpH95XozY)',
  'published', false, '2023-09-29 22:00:00-06',
  (select id from public.profiles where role = 'admin' order by created_at limit 1)
),

-- Retrospectiva ----------------------------------------------------------------
(
  'slc-la-serie-que-conecto-a-mexico-con-el-mundo',
  'Super Lucha Callejera: la serie que conectó a México con el resto del mundo',
  'Veinticuatro transmisiones entre diciembre de 2020 y septiembre de 2023. Un repaso a la serie que puso a la escena mexicana de Super Turbo frente a Estados Unidos, Canadá y Puerto Rico.',
  E'Entre diciembre de 2020 y septiembre de 2023, Super Lucha Callejera transmitió veinticuatro noches de Super Street Fighter II X. La idea fue de H-Zero y la sostuvo junto a Riz0ne en los comentarios: poner a los mejores jugadores de México frente a los de fuera, en series largas, y transmitirlo.\n\nTodo el historial está ahora en [Eventos pasados](/eventos), con su fecha real y su cartelera.\n\n## Cómo cambió el formato\n\nLa columna vertebral fueron las **ediciones numeradas**, de la 19 a la 32: cuatro o cinco series FT5 y un estelar a diez. Dos veces, en los números redondos, se cambió a **torneo**: veinticuatro invitados en la edición 20 y treinta y dos, con Canadá incluido, en la 30.\n\nDespués del número 32 la serie dejó la numeración y se dedicó a **formatos especiales**: combates a tres y cuatro bandas con la regla de ganador se queda, kumites de un jugador contra media docena, y retos de uno contra tres.\n\n## Quiénes pasaron por ahí\n\nLa lista es larga y cruza cuatro países. Del lado mexicano aparecen con frecuencia Hokuto, Yito2K, H-Zero, Goromax, DemonioDebian, Galo Diaz, Pitufov, Scuzbucket, Kyouya y Fack. Del lado estadounidense, MarsGatti, Megaman X, SilentScope, X64, Klimax, Lionplex, CigarBoB, ChoiBoy y John Choi. Atari y NormanJr911 representaron a Canadá; Real Decoy, a Puerto Rico.\n\n## Dos noches que valen por sí solas\n\nLa **edición 31** rompió con todo y montó seis combates de espejo: mismo personaje en ambos lados. Sin la ventaja o desventaja del emparejamiento, lo único que quedaba a la vista era quién conocía mejor a su personaje.\n\nLa **edición 32** fue el kumite de Yito2K: su Dhalsim contra seis estadounidenses seguidos y, cuando se acabó la fila, también contra los dos comentaristas.\n\n## Un asterisco\n\nLa última transmisión, *The Best Hyper Fighters*, no fue de Super Turbo sino de **Hyper Fighting**. Está registrada como parte de la serie porque lo fue, pero es el único evento de los veinticuatro que corresponde a otro juego.\n\n## Sobre las fechas\n\nEl archivo se armó a partir del canal de YouTube, y ahí hay una trampa: la fecha de subida del video no es la del evento. Las transmisiones salían por Twitch y el video se publicaba uno o dos días después. Donde la descripción original dice la fecha real, se usó esa. En tres casos no la dice, y esos eventos van marcados como fecha aproximada para poder corregirlos si aparece el dato exacto.\n\nSi jugaste alguna de estas noches y tienes fotos, resultados o correcciones, escríbenos: el historial se completa entre todos.',
  'published', true, '2023-09-29 23:30:00-06',
  (select id from public.profiles where role = 'admin' order by created_at limit 1)
)

on conflict (slug) do update set
  title        = excluded.title,
  excerpt      = excluded.excerpt,
  body_md      = excluded.body_md,
  status       = excluded.status,
  is_featured  = excluded.is_featured,
  published_at = excluded.published_at;


-- -----------------------------------------------------------------------------
-- Verificación: las crónicas en orden, como se verán en el sitio
-- -----------------------------------------------------------------------------
select
  to_char(published_at at time zone 'America/Mexico_City', 'DD/MM/YYYY') as fecha,
  case when is_featured then '★' else ' ' end as destacada,
  title
from public.news
where slug like 'slc-%'
order by published_at;


-- -----------------------------------------------------------------------------
-- Comprobación de enlaces: ninguna crónica debe apuntar a un evento inexistente
-- -----------------------------------------------------------------------------
-- Devuelve 0 filas si todo está bien. Si devuelve alguna, falta cargar el
-- archivo de eventos correspondiente antes que este.
select n.slug as noticia, m.enlace as evento_que_no_existe
from public.news n
cross join lateral (
  select (regexp_matches(n.body_md, '\(/eventos/([a-z0-9-]+)\)', 'g'))[1] as enlace
) m
left join public.events e on e.slug = m.enlace
where e.id is null;
