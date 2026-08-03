# =============================================================================
# Descarga las miniaturas de Super Lucha Callejera
# =============================================================================
# Deja los 24 archivos listos para arrastrarlos al bucket 'media' de Supabase.
#
# POR QUE SE GUARDAN EN SUPABASE Y NO SE ENLAZAN A YOUTUBE
# Enlazar seria mas rapido, pero las portadas dejarian de existir el dia que un
# video se borre o se haga privado. Este es un archivo historico de la
# comunidad: las imagenes tienen que sobrevivir a la plataforma de un tercero.
#
# POR QUE EL SCRIPT COMPRUEBA EL TAMANO DE LA IMAGEN
# YouTube no devuelve error 404 cuando falta la version grande de una miniatura:
# devuelve un marcador gris de 120x90 con codigo 200. Descargarla a ciegas
# dejaria tres eventos con una portada gris y nadie se enteraria hasta verlo en
# el sitio. Por eso se mide el ancho real de cada archivo y, si no llega, se
# baja la siguiente resolucion disponible.
#
# USO
#   cd C:\stmx
#   powershell -ExecutionPolicy Bypass -File .\scripts\descargar-miniaturas-slc.ps1
# =============================================================================

$ErrorActionPreference = 'Stop'
Add-Type -AssemblyName System.Drawing

$destino = Join-Path $PSScriptRoot '..\miniaturas-slc'
$destino = [System.IO.Path]::GetFullPath($destino)
New-Item -ItemType Directory -Force -Path $destino | Out-Null

# slug del evento  ->  id del video en YouTube
$eventos = [ordered]@{
  'slc-19'                       = '8PYJ-Vrmf88'
  'slc-20'                       = 'NckqspVlmpc'
  'slc-21'                       = 'M5k4uMd9_VU'
  'slc-22'                       = 'HyxRe0MhGV4'
  'slc-23'                       = 'YdLq7F-Nw_k'
  'slc-24'                       = 'mmQj35HoXQY'
  'slc-25'                       = 'KFyknwyxVKE'
  'slc-26'                       = 'nfVLQtsEHBU'
  'slc-27'                       = 'imoNDluVnYY'
  'slc-28'                       = 'n8HeCb-46mg'
  'slc-29'                       = 'uzk7-Lajwtw'
  'slc-30'                       = 'E3osuP6ZZhg'
  'slc-31'                       = 'sDsSWsXWNLo'
  'slc-32'                       = 'xl4TzwSdcVc'
  'slc-triple-threat-1'          = 'kFsWlHwvzEs'
  'slc-fatal-4-way'              = 'I7aKhnJekpY'
  'slc-triple-threat-2'          = '9frhIdEdJio'
  'slc-triple-threat-3'          = 'gof66IXg-NI'
  'slc-three-amigos-challenge'   = 'jn0a5a6ttng'
  'slc-road-to-france'           = 'rYLc5afcGqk'
  'slc-triple-threat-4'          = 'XSSbLs5JLrY'
  'slc-yito2k-vs-marsgatti-ft10' = '1LxDHkHmsu4'
  'slc-hokuto-vs-megaman-x'      = 'zJ-NqiUR5HA'
  'slc-best-hyper-fighters'      = 'r4JpH95XozY'
}

# De mayor a menor calidad. La primera que supere el ancho minimo, gana.
$calidades = @(
  @{ nombre = 'maxresdefault'; anchoMinimo = 1000 },  # 1280x720
  @{ nombre = 'sddefault';     anchoMinimo = 600  },  # 640x480, 16:9 con barras
  @{ nombre = 'hqdefault';     anchoMinimo = 400  }   # 480x360, ultimo recurso
)

function Get-AnchoImagen {
  param([string]$Ruta)
  try {
    $img = [System.Drawing.Image]::FromFile($Ruta)
    $ancho = $img.Width
    $img.Dispose()
    return $ancho
  } catch {
    return 0
  }
}

Write-Host ''
Write-Host "Descargando 24 miniaturas en:" -ForegroundColor Cyan
Write-Host "  $destino"
Write-Host ''

$resumen = @()

foreach ($slug in $eventos.Keys) {
  $id      = $eventos[$slug]
  $archivo = Join-Path $destino "$slug.jpg"
  $logrado = $null

  foreach ($calidad in $calidades) {
    $url = "https://i.ytimg.com/vi/$id/$($calidad.nombre).jpg"

    try {
      Invoke-WebRequest -Uri $url -OutFile $archivo -UseBasicParsing
    } catch {
      continue
    }

    $ancho = Get-AnchoImagen -Ruta $archivo
    if ($ancho -ge $calidad.anchoMinimo) {
      $logrado = "$($calidad.nombre) ($ancho px)"
      break
    }
  }

  if ($logrado) {
    Write-Host ("  OK   {0,-30} {1}" -f $slug, $logrado) -ForegroundColor Green
    $resumen += [pscustomobject]@{ Evento = $slug; Calidad = $logrado }
  } else {
    Write-Host ("  FALLA {0,-30} ninguna resolucion servible" -f $slug) -ForegroundColor Red
    if (Test-Path $archivo) { Remove-Item $archivo -Force }
    $resumen += [pscustomobject]@{ Evento = $slug; Calidad = 'FALLA' }
  }
}

$ok     = ($resumen | Where-Object { $_.Calidad -ne 'FALLA' }).Count
$fallan = ($resumen | Where-Object { $_.Calidad -eq 'FALLA' }).Count

Write-Host ''
Write-Host "Listas: $ok de $($eventos.Count)" -ForegroundColor Cyan
if ($fallan -gt 0) {
  Write-Host "Fallaron: $fallan. Esos eventos se quedaran sin portada." -ForegroundColor Yellow
}

Write-Host ''
Write-Host 'SIGUIENTE PASO' -ForegroundColor Cyan
Write-Host '  1. Abre Supabase -> Storage -> bucket "media"'
Write-Host '  2. Entra a la carpeta "events" (creala si no existe)'
Write-Host '  3. Arrastra ahi los 24 archivos de golpe'
Write-Host '  4. Corre supabase/contenido-inicial/portadas-eventos-slc.sql'
Write-Host ''
Write-Host 'La carpeta miniaturas-slc esta en .gitignore: las imagenes viven en'
Write-Host 'Supabase, no en el repositorio.'
Write-Host ''

Invoke-Item $destino
