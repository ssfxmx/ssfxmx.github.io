-- =============================================================================
-- Super Lucha Callejera — eventos históricos
-- =============================================================================
-- Serie de exhibiciones en línea entre México y Estados Unidos en Super Street
-- Fighter II X, creada por H-Zero y transmitida por Riz0ne.
--
-- FUENTE: el feed XML del playlist de YouTube, que da fecha exacta y la
-- descripción original de cada transmisión.
--
-- SOBRE LAS FECHAS — esto importa:
-- La fecha de SUBIDA del video NO es la del evento. Las descripciones dicen
-- cuándo ocurrió de verdad, y va uno o dos días antes: SLC 19 se subió el 12 de
-- diciembre pero el texto dice "On 12/11/2020, SLC XIX took place". Aquí se usa
-- la fecha del evento, no la de subida. Con la otra, todo el historial habría
-- quedado corrido.
--
-- La hora se fija a las 20:00 de la Ciudad de México porque las descripciones
-- no la registran. Es una aproximación razonable para una serie nocturna en
-- línea; si conoces la real, corrígela desde el panel.
--
-- Tipo de evento:
--   tournament → SLC 20 y 30, que tuvieron cuadro de eliminación en Challonge
--   exhibition → el resto, que eran series de retos FT5 y FT10
--
-- Todos llevan la marca {"_slc": true} en `extra`, así que se pueden localizar
-- o borrar en bloque:
--
--   delete from public.events where extra->>'_slc' = 'true';
-- =============================================================================

insert into public.events (
  slug, name, description_md, kind, mode, status,
  starts_at, venue_name, stream_url, extra, created_by
) values

-- 2020 -----------------------------------------------------------------------
(
  'slc-19', 'Super Lucha Callejera 19',
  E'Decimonovena entrega de la serie de exhibiciones entre México y Estados Unidos, creada por H-Zero y transmitida por Riz0ne y el propio H-Zero.',
  'exhibition', 'online', 'finished',
  '2020-12-11 20:00:00-06', 'Fightcade',
  'https://www.youtube.com/watch?v=8PYJ-Vrmf88',
  '{"_slc": true, "youtube_id": "8PYJ-Vrmf88"}'::jsonb,
  (select id from public.profiles where role = 'admin' order by created_at limit 1)
),
(
  'slc-20', 'Super Lucha Callejera 20',
  E'Cierre épico de la serie. Se invitó a 24 jugadores, la mitad de México y la mitad de Estados Unidos.\n\nDespués del torneo hubo varias exhibiciones, entre ellas dos series FT5 entre el especialista de Guile MarsGatti y el veterano John Choi.\n\n[Cuadro del torneo](https://challonge.com/ulbbtc7t)',
  'tournament', 'online', 'finished',
  '2020-12-18 20:00:00-06', 'Fightcade',
  'https://www.youtube.com/watch?v=NckqspVlmpc',
  '{"_slc": true, "youtube_id": "NckqspVlmpc", "participantes": "24", "reglas": "Invitacional Mexico vs USA"}'::jsonb,
  (select id from public.profiles where role = 'admin' order by created_at limit 1)
),

-- 2021 -----------------------------------------------------------------------
(
  'slc-21', 'Super Lucha Callejera 21',
  E'## Combates\n\n- Lionplex (Ryu) vs. Goromax (Guile) — FT5\n- SuperrV (Boxer) vs. Jarek04 (O. Ken) — FT5\n- Scuzbucket (Chun-Li) vs. Pitufov (Claw) — FT5\n- BlazedDonuts (Boxer) vs. Demonio Debian (Chun-Li) — FT5\n- MarsGatti (Guile) vs. H-Zero (O. Sagat) — FT10',
  'exhibition', 'online', 'finished',
  '2021-01-22 20:00:00-06', 'Fightcade',
  'https://www.youtube.com/watch?v=M5k4uMd9_VU',
  '{"_slc": true, "youtube_id": "M5k4uMd9_VU"}'::jsonb,
  (select id from public.profiles where role = 'admin' order by created_at limit 1)
),
(
  'slc-22', 'Super Lucha Callejera 22',
  E'## Combates\n\n- Comeback (Honda) vs. AR Zumpango (O. Boxer, Zangief) — FT5\n- Mr. Carabano (Guile) vs. Fack (Claw) — FT5\n- Enforcer04 (Ryu) vs. Hassassin10 (Cammy) — FT5\n- Atari (Guile) vs. Demonio Debian (Chun-Li) — FT5\n- MarsGatti (Guile) vs. Kyouya (Dictator) — FT10\n\n> Atari representó a Canadá y Estados Unidos.',
  'exhibition', 'online', 'finished',
  '2021-02-05 20:00:00-06', 'Fightcade',
  'https://www.youtube.com/watch?v=HyxRe0MhGV4',
  '{"_slc": true, "youtube_id": "HyxRe0MhGV4"}'::jsonb,
  (select id from public.profiles where role = 'admin' order by created_at limit 1)
),
(
  'slc-23', 'Super Lucha Callejera 23',
  E'## Combates\n\n- Lionplex (Ryu) vs. DJ_Vanilla (Chun-Li) — FT5\n- Klimax (Boxer) vs. Hassassin10 (Cammy) — FT5\n- Real Decoy (Blanka / Chun-Li) vs. Galo Diaz (E. Honda) — FT5\n- Mr. Carabano (Guile) vs. Paleton17 (Boxer) — FT5\n- X64 (E. Honda) vs. Pitufov (Claw) — FT10\n- Megaman X (Zangief / Ken) vs. Hokuto (Fei Long)\n\n> Real Decoy representó a Puerto Rico.',
  'exhibition', 'online', 'finished',
  '2021-02-19 20:00:00-06', 'Fightcade',
  'https://www.youtube.com/watch?v=YdLq7F-Nw_k',
  '{"_slc": true, "youtube_id": "YdLq7F-Nw_k"}'::jsonb,
  (select id from public.profiles where role = 'admin' order by created_at limit 1)
),
(
  'slc-24', 'Super Lucha Callejera 24',
  E'## Combates\n\n- Enforcer04 (Ryu) vs. Kiba (Guile) — FT5\n- VodkaGobalsky (Zangief) vs. Fack (Claw) — FT5\n- NormanJr911 (Ken) vs. Jarek04 (O. Ken) — FT5\n- CigarBoB (Zangief) vs. Kyouya (Dictator) — FT7\n- Krost (O. Ken) vs. Hokuto (Claw) — FT10\n\nDespués del evento se jugaron combates de concepto Ken contra Claw.\n\n> NormanJr911 representó a Canadá.',
  'exhibition', 'online', 'finished',
  '2021-03-05 20:00:00-06', 'Fightcade',
  'https://www.youtube.com/watch?v=mmQj35HoXQY',
  '{"_slc": true, "youtube_id": "mmQj35HoXQY"}'::jsonb,
  (select id from public.profiles where role = 'admin' order by created_at limit 1)
),
(
  'slc-25', 'Super Lucha Callejera 25',
  E'## Combates\n\n- Rakanishu (Blanka) vs. Lictrips (Boxer) — FT5\n- Real Decoy (Blanka) vs. DemonioDebian (Chun-Li) — FT5\n- AndyMa (Claw) vs. Galo Diaz (E. Honda) — FT5\n- X64 (E. Honda) vs. Kyouya (Dictator) — FT7\n- ChoiBoy (O. Sagat / Ryu) vs. Yito2K (Dhalsim) — FT10\n\n> Real Decoy representó a Puerto Rico.',
  'exhibition', 'online', 'finished',
  '2021-03-19 20:00:00-06', 'Fightcade',
  'https://www.youtube.com/watch?v=KFyknwyxVKE',
  '{"_slc": true, "youtube_id": "KFyknwyxVKE"}'::jsonb,
  (select id from public.profiles where role = 'admin' order by created_at limit 1)
),
(
  'slc-26', 'Super Lucha Callejera 26',
  E'## Combates\n\n- Snoopy Global (Chun-Li) vs. DJ Vanilla (Chun-Li / E. Honda) — FT5\n- Enforcer04 (Ryu) vs. Fack (Claw) — FT5\n- Frank Punches (Ryu) vs. Galo Diaz (E. Honda) — FT5\n- CigarBoB (Zangief) vs. H-Zero (O. Sagat) — FT7\n- SuperrV (Boxer) vs. Yito2K (Dhalsim) — FT10\n\nAl terminar la exhibición, Riz0ne explicó y demostró un error del juego: Ryu no puede hacer huracán como ataque de recuperación tras recibir un anti-aéreo.',
  'exhibition', 'online', 'finished',
  '2021-04-02 20:00:00-06', 'Fightcade',
  'https://www.youtube.com/watch?v=nfVLQtsEHBU',
  '{"_slc": true, "youtube_id": "nfVLQtsEHBU"}'::jsonb,
  (select id from public.profiles where role = 'admin' order by created_at limit 1)
),
(
  'slc-27', 'Super Lucha Callejera 27',
  E'## Combates\n\n- Klimax (Boxer) vs. Kiba (Guile) — FT5\n- Mr. Cochise (E. Honda) vs. Kela420 (Ryu) — FT5\n- SnoopyGlobal (Chun-Li) vs. Hassassin10 (Cammy) — FT5\n- Rakanishu (Blanka) vs. DemonioDebian (Chun-Li) — FT7\n- SilentScope (Cammy) vs. Jarek04 (O. Ken / Ken) — FT10\n\nComentarios de Hokuto, SilentScope y Riz0ne.',
  'exhibition', 'online', 'finished',
  '2021-04-16 20:00:00-05', 'Fightcade',
  'https://www.youtube.com/watch?v=imoNDluVnYY',
  '{"_slc": true, "youtube_id": "imoNDluVnYY"}'::jsonb,
  (select id from public.profiles where role = 'admin' order by created_at limit 1)
),
(
  'slc-28', 'Super Lucha Callejera 28',
  E'## Combates\n\n- Paul5567 (Dictator) vs. DJ_Vanilla (Chun-Li / E. Honda) — FT5\n- Lionplex (Ryu) vs. Fiero (Guile) — FT5\n- Scuzbucket (Chun-Li) vs. Fack (Claw) — FT5\n- CigarBoB (Zangief) vs. Pitufov (Claw) — FT7\n- Frank Punches (Ryu) vs. DemonioDebian (Chun-Li) — FT10\n\nComentarios de Hokuto, Megaman X y Riz0ne.',
  'exhibition', 'online', 'finished',
  '2021-04-30 20:00:00-05', 'Fightcade',
  'https://www.youtube.com/watch?v=n8HeCb-46mg',
  '{"_slc": true, "youtube_id": "n8HeCb-46mg"}'::jsonb,
  (select id from public.profiles where role = 'admin' order by created_at limit 1)
),
(
  'slc-29', 'Super Lucha Callejera 29',
  E'## Combates\n\n- Outcider (Chun-Li) vs. Lictrips (Boxer) — FT5\n- SeanFPA (Boxer) vs. Kela420 (Ryu) — FT5\n- Jesse James (Claw) vs. Goromax (Guile) — FT5\n- CigarBoB (Zangief) vs. Kyouya (Dictator) — FT7\n- Jesus4365 (Claw) vs. Galo Diaz (E. Honda) — FT10\n\nComentarios de Hokuto y Riz0ne.',
  'exhibition', 'online', 'finished',
  '2021-05-14 20:00:00-05', 'Fightcade',
  'https://www.youtube.com/watch?v=uzk7-Lajwtw',
  '{"_slc": true, "youtube_id": "uzk7-Lajwtw"}'::jsonb,
  (select id from public.profiles where role = 'admin' order by created_at limit 1)
),
(
  'slc-30', 'Super Lucha Callejera 30',
  E'Edición de torneo. Riz0ne y H-Zero transmitieron el invitacional de 32 jugadores, con los mejores de Estados Unidos, Canadá y México.\n\n[Cuadro del torneo](https://challonge.com/hgz487uh)',
  'tournament', 'online', 'finished',
  '2021-05-28 20:00:00-05', 'Fightcade',
  'https://www.youtube.com/watch?v=E3osuP6ZZhg',
  '{"_slc": true, "youtube_id": "E3osuP6ZZhg", "participantes": "32", "reglas": "Invitacional USA / Canada / Mexico"}'::jsonb,
  (select id from public.profiles where role = 'admin' order by created_at limit 1)
),
(
  'slc-31', 'Super Lucha Callejera 31',
  E'Tras dos meses de pausa, SLC regresó con una edición temática de espejos: seis combates FT5 con el mismo personaje de los dos lados.\n\n## Combates\n\n- **Zangief** — VodkaGobalsky vs. QCHO\n- **Guile** — Atari vs. Kiba\n- **Ryu** — Lionplex vs. Kela420\n- **Chun-Li** — SnoopyGlobal vs. DemonioDebian\n- **Cammy** — JacTiaf vs. Hassassin10\n- **E. Honda** — X64 vs. GaloDiaz\n\nComentarios de Hokuto y Riz0ne.',
  'exhibition', 'online', 'finished',
  '2021-07-23 20:00:00-05', 'Fightcade',
  'https://www.youtube.com/watch?v=sDsSWsXWNLo',
  '{"_slc": true, "youtube_id": "sDsSWsXWNLo", "reglas": "Espejos: mismo personaje de los dos lados"}'::jsonb,
  (select id from public.profiles where role = 'admin' order by created_at limit 1)
),
(
  'slc-32', 'Super Lucha Callejera 32',
  E'Kumite. El especialista de Dhalsim Yito2K, de México, se midió contra seis jugadores de Estados Unidos en series FT5.\n\n## Rivales\n\n1. Ultrasean\n2. Real Decoy\n3. Megaman X\n4. Klimax\n5. X64\n6. Scuzbucket\n\nDespués del kumite, H-Zero pidió a los comentaristas entrar también, así que Yito2K jugó series extra contra Riz0ne y Hokuto.',
  'exhibition', 'online', 'finished',
  '2021-08-20 20:00:00-05', 'Fightcade',
  'https://www.youtube.com/watch?v=xl4TzwSdcVc',
  '{"_slc": true, "youtube_id": "xl4TzwSdcVc", "reglas": "Kumite FT5"}'::jsonb,
  (select id from public.profiles where role = 'admin' order by created_at limit 1)
),
(
  'slc-triple-threat-1',
  'Super Lucha Callejera: Triple Threat Match',
  E'Tuesday Night Fights se cruza con Super Lucha Callejera en un combate a tres bandas entre H-Zero (México), Goromax (México) y ChoiBoy (Estados Unidos).\n\nFormato de ganador se queda: el primero en llegar a diez series ganadas se lleva la victoria.',
  'exhibition', 'online', 'finished',
  '2021-10-05 20:00:00-05', 'Fightcade',
  'https://www.youtube.com/watch?v=kFsWlHwvzEs',
  '{"_slc": true, "youtube_id": "kFsWlHwvzEs", "reglas": "Triple amenaza, ganador se queda, a 10 series"}'::jsonb,
  (select id from public.profiles where role = 'admin' order by created_at limit 1)
)

on conflict (slug) do update set
  name = excluded.name,
  description_md = excluded.description_md,
  kind = excluded.kind,
  starts_at = excluded.starts_at,
  stream_url = excluded.stream_url,
  extra = excluded.extra;


-- -----------------------------------------------------------------------------
-- Verificación
-- -----------------------------------------------------------------------------
select
  name,
  to_char(starts_at at time zone 'America/Mexico_City', 'DD/MM/YYYY') as fecha,
  kind,
  status
from public.events
where extra->>'_slc' = 'true'
order by starts_at;
