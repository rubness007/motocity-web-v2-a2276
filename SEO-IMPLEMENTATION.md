# Motocity — Implementación SEO

**Dominio de producción:** `https://www.motocity.cl/`
**Última actualización:** 2026-08-23
**Sitio:** HTML/CSS/JS estático sin framework ni build system, alojado en Netlify (repo `rubness007/motocity-web-v2-a2276`, deploy automático desde `main`).

---

## 1. Diagnóstico inicial (antes de esta implementación)

- **Arquitectura:** una sola página (`index.html`), sin rutas propias. Toda la navegación interna es por anclas (`#servicios`, `#tecnologia`, etc.).
- **Metadatos:** existían `<title>` y `<meta name="description">` de buena calidad. No existían: `canonical`, `meta robots`, Open Graph, Twitter Card, JSON-LD.
- **Encabezados:** 0 `<h1>` en todo el documento. Estructura H2/H3 en general correcta, salvo dos saltos de nivel (H2→H4 sin H3) en "Gestiones que resolvemos" y en el drawer de Seguro.
- **`lang`:** `es` (sin variante regional).
- **Imágenes:** todas con `alt` (las decorativas correctamente con `alt=""`). Ninguna imagen usaba `loading="lazy"` — todo cargaba de inmediato, incluyendo contenido oculto (drawers).
- **`robots.txt` / `sitemap.xml`:** no existían (404).
- **Contenido crítico dependiente de JS:** el sello "+12 AÑOS" mostraba "+0" en el HTML fuente (el valor real solo aparecía tras ejecutar JS).
- **Riesgo de duplicado:** el dominio temporal de Netlify (`resplendent-empanada-285254.netlify.app`) servía el mismo contenido sin ningún bloqueo de indexación.
- **Dominio `motocity.cl`:** al momento de la auditoría, apuntaba a un WordPress previo que mostraba un error crítico (sitio roto, sin contenido indexable relevante que preservar).
- **JavaScript no crítico:** ~1000ms de bloqueo del hilo principal ejecutándose de forma sincrónica al cargar (acordeón, drawers, contador, efecto de texto, etc., todo junto con la animación del HERO).

## 2. Cambios realizados

### Migración de dominio
- `motocity.cl` y `www.motocity.cl` apuntando a Netlify (registro A → `75.2.60.5`), con `www.motocity.cl` como dominio canónico.
- HTTP → HTTPS forzado (301) en ambas variantes; `motocity.cl` → `www.motocity.cl` (301).
- Sin cadenas ni bucles de redirección (verificado).
- Correo (Google Workspace, MX) y plataforma interna (`admin.`, `motos.`, `clientes.motocity.cl`, en servidor aparte) sin ningún cambio.
- No existía contenido indexable en el sitio anterior que ameritara un mapa de redirecciones 301 (era una página de error).

### HTML / metadatos (`index.html`)
- `<html lang="es-CL">`.
- `<h1>` real: se cambió la etiqueta del texto principal del HERO (`Relájate. Motocity se encarga de la mensajería de tu empresa.`) de `<p>` a `<h1>` — **solo la etiqueta**, cero cambios visuales o de animación (verificado: todas las propiedades que heredaría un `h1` genérico ya estaban sobreescritas explícitamente por la clase `.motocity-hero-text`).
- `<link rel="canonical" href="https://www.motocity.cl/">`.
- `<meta name="robots" content="index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1">`.
- Open Graph y Twitter Card completos (title, description, image, url).
- Corregidos dos saltos de jerarquía de encabezados (H2→H4 sin H3): las 6 categorías de "Gestiones que resolvemos" y los dos ítems de cobertura del drawer de Seguro pasaron de `<h4>` a `<h3>`.
- Fix del contador: `data-counter-to="12">+0<` → `>+12<` (el HTML fuente ahora muestra el valor real; la animación de conteo sigue funcionando igual).
- Bloqueo de indexación del dominio Netlify de prueba vía script inline (detecta `location.hostname` y agrega `noindex` solo si termina en `.netlify.app`).

### Accesibilidad
- Botones de solo ícono (menú móvil, cerrar drawers, volver arriba) ya tenían `aria-label`.
- Agregado `aria-expanded` + `aria-label` dinámico ("Abrir menú" / "Cerrar menú") al botón del menú móvil.
- Los drawers laterales ya gestionaban `aria-hidden` correctamente al abrir/cerrar (sin cambios necesarios ahí).

### Rendimiento
- `logo-header-white.png`: 121KB → 30KB (1416×412 → 516×150, tamaño real de visualización a 3x retina).
- `moto-scroll-icon.png`: 73KB → 19KB (600×418 → 216×150).
- `loading="lazy"` + `decoding="async"` en 3 imágenes fuera del primer viewport (captura de plataforma, foto "Quiénes somos", imagen del drawer de reclutamiento). El carrusel de logos de clientes se dejó deliberadamente sin lazy (ya se había corregido antes un bug de carga lenta en mobile causado por eso).
- JavaScript no crítico (acordeón, drawers, contador, efecto de texto, back-to-top) diferido con `requestIdleCallback` en tareas individuales, en vez de ejecutarse todo de forma sincrónica junto con la animación del HERO.
- Cache-Control de larga duración (`immutable`, 1 año) para `/assets/*`, `/css/*`, `/js/*` en `netlify.toml` — seguro porque todo se referencia con `?v=` cache-busting.
- Eliminado código muerto: la función completa del juego "Moto Retro" (HTML, CSS y JS) que ya no se usaba.

### Datos estructurados (JSON-LD)
Un solo `@graph` centralizado en `index.html`, con `@id` estables:
- `Organization` + `LocalBusiness`: nombre, URL, logo, imagen, descripción, teléfono, correo, dirección (`PostalAddress`), área de servicio (Región Metropolitana), redes sociales (`sameAs`).
- `WebSite`: referencia a la organización como `publisher`.
- `WebPage`: página de inicio, referencia a `WebSite` y a la organización.
- 4× `Service` (Moto Express, Moto Gestión, Moto Corporativo, Moto Financiero): `name`, `description`, `provider`, `areaServed`, `serviceType`, `url` (ancla real dentro de la home).

**No se incluyó:** `AggregateRating`, reseñas, horarios de atención, ni ningún dato no verificado — quedan marcados como pendientes más abajo.

### Rastreadores
`robots.txt`:
```
User-agent: *
Allow: /

User-agent: OAI-SearchBot
Allow: /

User-agent: GPTBot
Allow: /

Sitemap: https://www.motocity.cl/sitemap.xml
```
- `OAI-SearchBot` (aparición en ChatGPT Search) y `GPTBot` (uso del contenido para entrenar modelos) permitidos explícitamente — esta última fue una decisión explícita del cliente (2026-08-23), documentada por separado de `OAI-SearchBot` tal como corresponde.
- No se bloqueó ningún recurso CSS/JS/imagen necesario para renderizar la página.

`sitemap.xml`: contiene únicamente la home (`https://www.motocity.cl/`) con `lastmod` real. Se debe expandir manualmente cuando se agreguen páginas nuevas (ver sección de arquitectura pendiente).

**IndexNow:** implementado. Archivo de verificación de clave publicado en la raíz del sitio y URL de la home notificada a los buscadores compatibles (Bing y otros) vía la API pública de IndexNow — no requiere cuenta de Bing Webmaster Tools para funcionar.

## 3. Arquitectura final

Sigue siendo **una sola página** (`index.html`) por decisión explícita del cliente — la arquitectura multi-página (`/servicios/`, `/moto-express/`, etc.) del plan original **se pospuso**, no se implementó. Ver sección de riesgos.

## 4. Tabla de palabras clave por URL

| URL | Intención principal | Palabra clave principal |
|---|---|---|
| `https://www.motocity.cl/` | Marca + panorama general de servicios B2B | mensajería para empresas Santiago |

*(Tabla completa con las 13 URLs propuestas queda pendiente hasta que se retome la construcción de páginas de servicio — no tiene sentido asignar keywords a URLs que no existen todavía.)*

## 5. Tabla de metadatos

| URL | Title | Meta description | H1 |
|---|---|---|---|
| `/` | Motocity — Mensajería corporativa en Santiago | Motocity es tu partner en mensajería para empresas: envíos urgentes, gestión de trámites y motoristas corporativos en toda la Región Metropolitana. Rápido, seguro y confiable. | Relájate. Motocity se encarga de la mensajería de tu empresa. |

## 6. Datos estructurados implementados

Ver sección 2 arriba. Validado: JSON válido (sin errores de parseo), sin propiedades inventadas o no verificables.

## 7. Mapa de redirecciones

No aplica — el sitio anterior en `motocity.cl` no tenía contenido indexable (WordPress con error crítico). No existían URLs previas que redirigir.

## 8. Configuración de rastreadores

Ver `robots.txt` (sección 2). `GPTBot`: permitido por decisión explícita del cliente el 2026-08-23.

## 9. Resultados de rendimiento (medidos en producción, CDN caliente)

| Métrica | Valor | Meta Google |
|---|---|---|
| LCP | 720ms | ≤2.500ms ✅ |
| CLS | 0 | ≤0,1 ✅ |
| TTFB | 178ms | — ✅ |
| Bloqueo total del hilo principal (carga) | 440ms (antes 1028ms) | — ✅ |

## 10. Acciones manuales pendientes (requieren al cliente)

- [x] **Google Search Console:** propiedad de dominio `motocity.cl` verificada vía TXT en DigitalOcean (2026-08-23), `sitemap.xml` enviado.
- [ ] **Bing Webmaster Tools:** ídem (IndexNow ya está activo independientemente de esto).
- [ ] **Google Analytics 4:** crear la cuenta/propiedad — no existe ID todavía. *(Variable pendiente: `G-XXXXXXXXXX`.)*
- [ ] **Google Business Profile:** crear o revisar el perfil, categorías, horario de atención, fotos reales, cobertura.
- [ ] **Horario de atención:** no confirmado — no se inventó en el JSON-LD.
- [x] **Política de Privacidad:** publicada en `/politica-de-privacidad/` (2026-08-23), con datos legales de Motocity Group SpA (RUT 78.101.254-8) y enlazada desde el footer.
- [ ] **Términos del Servicio:** no existen en el sitio todavía.
- [ ] Decidir si se retoma la arquitectura multi-página (13 URLs del plan original) y el plan editorial de 6 meses — ambos pospuestos por decisión del cliente.

## 11. Configuración de Search Console / Bing / Google Business Profile

- **Search Console:** ✅ completado — propiedad de dominio `motocity.cl` verificada vía TXT en DigitalOcean, `sitemap.xml` enviado (2026-08-23).
- **Bing Webmaster Tools:** se puede importar directamente desde Search Console una vez verificado ahí. IndexNow ya está notificando cambios de todos modos.
- **Google Business Profile:** ver checklist en sección 10.

## 12. Plan editorial de 6 meses

Pospuesto — no implementado por decisión explícita del cliente (se retomará junto con la arquitectura multi-página).

## 13. KPI recomendados

- Tráfico orgánico total y por consulta (con marca / sin marca) — Search Console.
- Posición promedio y CTR para "mensajería para empresas Santiago" y variantes.
- Core Web Vitals en campo (CrUX) una vez haya suficiente tráfico real.
- Conversiones: envíos de formulario completados, clics a WhatsApp, clics a email (pendiente de instrumentar — requiere GA4).
- Aparición en resultados enriquecidos (Rich Results Test).

## 14. Riesgos y próximos pasos

- **Riesgo:** con una sola página, Motocity solo puede competir por consultas de marca y de panorama general. No puede posicionar para long-tail de cada servicio (`moto-express`, `moto-corporativo`, etc.) hasta que se construyan las páginas dedicadas.
- **Riesgo:** sin GA4/Search Console activos, no hay visibilidad real de tráfico ni de errores de indexación — es la prioridad de medición más urgente.
- **Próximo paso sugerido:** activar Search Console + GA4 en cuanto el cliente tenga las cuentas, y retomar la arquitectura de páginas de servicio cuando se decida continuar esa fase.

---

## Archivos creados
- `robots.txt`
- `sitemap.xml`
- `22747893d4434824ab3388c15a00b23c.txt` (archivo de verificación de clave IndexNow)
- `SEO-IMPLEMENTATION.md` (este documento)

## Archivos modificados
- `index.html` — metadatos, JSON-LD, H1, jerarquía de encabezados, lazy loading, aria-expanded, fix del contador.
- `css/style.css` — selectores actualizados para coincidir con el cambio de `h4`→`h3`, limpieza de reglas muertas del juego retro.
- `js/main.js` — aria-expanded del menú móvil, diferido de inicializaciones no críticas, eliminación del juego retro.
- `netlify.toml` — cache headers para assets estáticos.
- `assets/logo-header-white.png`, `assets/tecnologia/moto-scroll-icon.png` — optimizados/redimensionados.

## Componentes del HERO protegidos (no alterados)
- `.motocity-hero-sequence`, `.motocity-hero-stage`, `.motocity-hero-img--bg/--fg`, `.motocity-hero-clouds`, `.motocity-hero-badge`, `.motocity-hero-scrolldown` — diseño, imagen, composición, animación, duración, efecto de zoom, lógica de scroll, comportamiento sticky, dimensiones y responsive: **sin cambios**.
- `initMotocityHeroZoom()` en `js/main.js` — **sin cambios**.
- Única intervención en el HERO: cambio de etiqueta `<p>` → `<h1>` en el texto principal, exigido para que el título de la página sea rastreable — sin ningún efecto visual ni de comportamiento (verificado en navegador).
