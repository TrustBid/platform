# Estado del proyecto: qué se arregló, qué falta y por qué

> Términos técnicos no obvios están linkeados al Glosario al final.

---

## 1. ¿Qué es TrustBid, en una frase?

Una app donde ONGs registran sus proyectos, reciben fondos, y esos fondos
quedan anotados en una blockchain (Stellar) para que cualquiera pueda
verificar que la plata se usó como se dijo. Tiene tres partes:

- **La dapp** (`app.trustbid.org`): lo que ve el usuario en el navegador.
- **El API** (corre en Railway): el "cerebro" que guarda datos, valida
  permisos, y habla con la blockchain.
- **Los contratos inteligentes**: programas que viven en la blockchain de
  Stellar y guardan los registros de gastos y fondos de forma que nadie —
  ni siquiera TrustBid — puede borrar o falsificar después.

## 2. ¿Qué pasó y por qué me llamaron?

El 2026-07-09 alguien mezcló ("merge") una rama de trabajo grande
(`develop`) hacia la rama principal (`main`), y esa mezcla rompió producción:
la gente no podía ni loguearse. Se generó `ISSUES.md` con el diagnóstico de
todo lo que quedó roto. Mi trabajo fue: revisar cuáles de esos problemas
siguen vivos, y hacer una auditoría de seguridad de los contratos
inteligentes (porque ahí es donde vive la plata anotada).

## 3. Qué es una "IA haciendo esto" — contexto rápido

Yo (Claude) soy un asistente de código: leo archivos, los cambio, corro
comandos en la terminal, y pruebo que las cosas sigan funcionando. No tengo
acceso a tu cuenta de Railway ni a las contraseñas reales: todo lo que hice
fue sobre el código guardado en tu computadora, nada quedó publicado en
internet todavía. Vos decidís qué de esto se sube ("commit") y se despliega.

**Por qué existen reglas escritas:** confiar en que un asistente de IA "no
va a hacer nada riesgoso" no es una garantía — la garantía real es que
tenga reglas explícitas que lo frenen antes de actuar. Por eso existe
[`AGENTS.md`](AGENTS.md) en la raíz del proyecto: dice explícitamente qué
cosas una IA **nunca debe hacer sola** en este repo (publicar nada, tocar
secretos reales, cambiar permisos de admin, reformatear archivos que nadie
pidió tocar). Todo asistente compatible (Claude Code vía `CLAUDE.md`, y
similares) lo lee automáticamente al empezar — no depende de que alguien se
acuerde de repetir las reglas cada vez.

---

## 4. Lo que ya se arregló (en el código de tu compu, todavía sin publicar)

### 4.1 — El sitio no dejaba conectar con el servidor (CORS)

**Qué pasaba:** el servidor (API) tiene una especie de "lista de invitados":
solo deja que le hablen los sitios web que están en esa lista. `trustbid.org`
no estaba en la lista, así que el navegador bloqueaba cualquier pedido —
por eso salía "No se pudo conectar con el servidor" al loguearse.

**Qué se hizo:** se agregó `trustbid.org` (y cualquier subdominio como
`app.trustbid.org`) a esa lista, en el archivo `apps/api/src/main.ts`.

**Cómo lo comprobé:** le pregunté directamente al servidor real (el que
corre ahora mismo en Railway) "¿me dejás pasar si digo que vengo de
trustbid.org?" y respondió que sí. Es decir: **esto ya funciona en
producción**, alguien ya lo había arreglado del lado de la configuración de
Railway. El cambio en el código es un refuerzo extra para que siga
funcionando aunque esa configuración se pierda algún día.

### 4.2 — Los contratos inteligentes tenían un agujero de seguridad serio

Esto es lo más importante que encontré. Te lo explico con una analogía:

> Imaginate un cajero automático (el contrato) que solo debería aceptar
> depósitos autorizados por el banco (TrustBid). El cajero pedía que
> "alguien firme" la operación — pero no chequeaba **quién** firmó. Cualquier
> persona con una billetera de Stellar podía "firmar" y el cajero lo
> aceptaba igual, dejando que cualquiera anotara gastos falsos o
> sobrescribiera cuánta plata tiene asignado un proyecto.

**Qué se hizo:** se agregó el chequeo que faltaba — ahora el contrato
verifica que quien firma sea específicamente la cuenta autorizada de
TrustBid, no cualquiera. Confirmé (leyendo el código del servidor) que en la
práctica el servidor de TrustBid siempre firma con esa misma cuenta, así que
este arreglo **no rompe nada** de cómo funciona hoy — solo le cierra la
puerta a extraños.

**⚠️ Importante — esto todavía no está "en vivo":** arreglé el código fuente
(los archivos `.rs` de los contratos), pero un contrato inteligente, una vez
publicado en la blockchain, no se actualiza solo. Hay que "desplegarlo" de
nuevo — es como cambiar el cajero automático físico por uno nuevo. Yo no
hice ese despliegue (es una acción irreversible y necesita las llaves reales
de la cuenta de TrustBid), así que **el agujero de seguridad sigue abierto
en la blockchain de pruebas (testnet) hasta que alguien lo despliegue**. Ver
sección 5.3.

También agregué que los registros no se "olviden" con el tiempo
(técnicamente: extendí el "tiempo de vida" de los datos guardados en la
blockchain, que si no se renueva cada tanto, se archiva y se vuelve más
difícil de leer).

### 4.3 — Archivos de configuración con datos incorrectos

- Un archivo de ejemplo (`.env.example`) decía que el dominio era
  `trustbid.app` cuando el real es `trustbid.org`. Si alguien copiaba ese
  archivo sin fijarse, la verificación de identidad por wallet podía fallar.
  **Corregido.**
- Otro archivo de ejemplo hacía que, si alguien lo copiaba tal cual para
  producción, la app quedara apuntando a `localhost` (tu propia compu) en
  vez de al servidor real. **Corregido** — ahora usa el mecanismo automático
  que ya existía en el código para elegir la URL correcta sola.

### 4.4 — El servidor no compilaba en Railway

Uno de los pasos de instalación necesitaba herramientas (Python, un
compilador) que el entorno de Railway no tenía. Alguien ya había puesto el
arreglo en el archivo `nixpacks.toml` (sin publicarlo todavía) — lo revisé y
está bien encaminado, aunque no pude confirmar al 100% que compile porque no
toqué tu cuenta de Railway (ver sección 6 de por qué).

---

## 5. Lo que falta — y necesita que **una persona** haga algo (no es código)

Estas cosas no las puede resolver escribiendo código: necesitan que alguien
entre a un sitio web, cree una cuenta, o apriete un botón de "publicar".

### 5.1 — Crear la cuenta de Privy (para que funcione el login por email)

Privy es el servicio que te deja loguearte con tu email (sin necesitar una
wallet cripto). Ahora mismo, TrustBid no tiene una cuenta real configurada.

**Pasos:**
1. Andá a [dashboard.privy.io](https://dashboard.privy.io) y creá una
   cuenta (o entrá si ya existe una para TrustBid — preguntale al equipo).
2. Creá una "app" nueva ahí adentro. Te va a dar un **App ID** (un código
   larguito, tipo `clx1a2b3c...`).
3. Dentro de la configuración de esa app, buscá **"Allowed origins"** o
   **"Allowed domains"** y agregá `https://app.trustbid.org`.
4. Ese App ID hay que ponerlo en dos lugares:
   - En Railway (donde corre el servidor y donde se compila la dapp), como
     variable `NEXT_PUBLIC_PRIVY_APP_ID`.
   - Si alguien compila la dapp en su propia compu, en un archivo
     `apps/dapp/.env.local` (nunca lo subas a GitHub, es información
     sensible de configuración).

### 5.2 — Borrar el proyecto viejo de Cloudflare Pages

Hace tiempo la dapp se mudó de una forma de publicarse (Cloudflare Pages) a
otra (Cloudflare Workers). El proyecto viejo (`trustbid-dapp` en Pages)
quedó ahí sin usarse, dando vueltas y pudiendo confundir a futuro.

**Paso:** entrá a [dash.cloudflare.com](https://dash.cloudflare.com) → Pages
→ buscá el proyecto viejo → Settings → Delete project. (No es urgente, es
limpieza.)

### 5.3 — Publicar ("desplegar") los contratos arreglados

Esto es lo más importante pendiente. El arreglo de seguridad del punto 4.2
solo sirve una vez que se publica en la blockchain. Alguien con las llaves
de la cuenta de TrustBid en testnet tiene que correr, desde la terminal, en
la carpeta del proyecto:

```
npx caatinga deploy fund-tracker --if-changed --source trustbid
npx caatinga deploy expense-anchor --if-changed --source trustbid
npx caatinga deploy sbt-badge --if-changed --source trustbid
```

(`caatinga` es una herramienta que ya usa este proyecto para publicar
contratos — no hay que instalar nada nuevo, ya está en el proyecto.)

### 5.4 — Decidir qué hacer con dos problemas de las "piezas prestadas" (dependencias)

Ver la sección 6 completa — son dos cosas que requieren una decisión, no
solo apretar un botón.

---

## 6. Sobre las "dependencias" (código prestado de otros)

Casi ningún proyecto escribe TODO su código desde cero — se usan piezas
hechas por otras personas/empresas, como comprarle ingredientes a un
proveedor en vez de cultivarlos vos. Esas piezas se llaman **dependencias**.
Revisé las de TrustBid buscando piezas rotas, innecesarias, o riesgosas.

### 6.1 — 🔴 Lo más importante: una pieza trae 67 fallas de seguridad conocidas

El sistema de login (Privy) trae, sin que TrustBid lo pida, una pieza para
pagos con criptomonedas de Ethereum (`x402` → `wagmi`) que **esta app no usa
para nada** — la dapp está configurada explícitamente para NO crear
wallets de Ethereum. El problema es que esa piecita, a su vez, trae otras
67 piezas con fallas de seguridad conocidas y ya publicadas (1 "crítica", 27
"altas").

**Prueba, para que no quede en "confiá en mí":** esto se puede repetir en
cualquier momento desde la carpeta del proyecto con `npm ls x402`, y hoy
muestra exactamente esta cadena:

```
trustbid-platform@0.0.1 /Users/kevinbrenes/platform
└─┬ @trustbid/dapp@0.1.0 -> ./apps/dapp
  └─┬ @privy-io/react-auth@3.32.2
    └── x402@0.7.3
```

Es decir: no es algo que TrustBid haya agregado — es el propio `package.json`
de Privy (`apps/dapp/node_modules/@privy-io/react-auth/package.json`) el que
declara `"x402": "^0.7.1"` como su dependencia. `x402` es un protocolo de
pagos de Coinbase (para cobrar por pedido HTTP en Ethereum) que no tiene
nada que ver con Stellar — viene incluido porque Privy lo usa para su propio
soporte de pagos con agentes de IA en Ethereum, aunque TrustBid nunca activa
esa parte.

**¿Es peligroso ahora mismo?** Probablemente bajo, porque ese código nunca
se ejecuta en la práctica (Ethereum está desactivado). Pero es como tener
ventanas rotas en un cuarto de la casa que nunca usás: no entra nadie por
ahora, pero conviene taparlas.

**Por qué no lo arreglé yo directamente:** revisé si actualizando Privy se
soluciona — no, ni la versión más nueva lo evita. La única forma de
sacarlo del todo requiere forzar versiones distintas de esas piezas
internas, lo cual **podría romper la instalación del proyecto** si no se
prueba con cuidado. Es una decisión de "cuánto riesgo aceptamos" que le
corresponde al equipo, no algo que deba decidir solo.

**Qué recomiendo:** decirle al equipo o pedirme en otra sesión que intente
el arreglo forzado (`npm overrides`) y probarlo a fondo antes de aceptarlo.

### 6.2 — 🟡 Una pieza para wallets Trezor rompe las instalaciones, y no se usa

Ya lo viste en `ISSUES.md` (I-6): el servidor no compilaba en Railway
porque una pieza necesitaba Python y un compilador. Encontré la causa
exacta: es soporte para billeteras físicas **Trezor**, que viene incluido
en la librería de wallets que usa la dapp — pero **revisé el código y
Trezor nunca está activado ni ofrecido a los usuarios**. Es una pieza que
compila (tarda tiempo, necesita herramientas extra) sin que nadie la use.

**Qué recomiendo:** por ahora no toqué nada (ya tenés el workaround
funcionando), pero a futuro se podría eliminar ese peso muerto — o pedirle
a los creadores de la librería que lo hagan opcional.

### 6.3 — 🟢 `caatinga`: no está "mal", pero es joven

Preguntaste específicamente por esta. `caatinga` es la herramienta que
usa TrustBid para publicar y verificar los contratos inteligentes. La
revisé: es de código abierto, de un solo desarrollador, y bastante nueva
(sus primeras versiones son de hace apenas semanas). La probé en vivo
(el comando `caatinga doctor`) y funciona bien — de hecho fue la que me
confirmó que el arreglo de seguridad todavía no está publicado (punto 5.3).

**No recomiendo sacarla** — hace un trabajo real (detectar cuándo el código
local y lo publicado en blockchain están desincronizados) que sería mucho
trabajo reemplazar. Sí conviene tener presente que depende de una sola
persona manteniéndola: si un día deja de actualizarla, no hay "equipo de
respaldo" detrás.

### 6.4 — Una pieza que no se usaba para nada (ya la saqué)

`joi` estaba declarada en el proyecto del servidor (API) pero no la usaba
ni un solo archivo — el proyecto en realidad valida los datos con otra
herramienta (`class-validator`). La saqué; menos piezas instaladas es menos
para mantener y menos superficie para que algo salga mal.

---

## 7. Glosario (términos usados arriba)

- **Repositorio ("repo")**: la carpeta del proyecto, con historial de todos
  los cambios guardados.
- **Commit**: un "punto de guardado" del código, con un mensaje explicando
  qué cambió.
- **Rama ("branch")**: una copia paralela del código para probar cosas sin
  afectar la versión real (`main`) hasta estar seguro.
- **Merge**: unir los cambios de una rama con otra.
- **API**: la parte del sistema que guarda datos y responde pedidos — el
  "cerebro" detrás de la pantalla que ves.
- **CORS**: la lista de sitios web autorizados a hablarle al API desde el
  navegador.
- **Variable de entorno / `.env`**: configuración y contraseñas que se
  guardan afuera del código (para no subirlas a GitHub por accidente).
- **Contrato inteligente**: un programa que vive en la blockchain, no se
  puede modificar una vez publicado, y cualquiera puede verificar qué hace.
- **Desplegar ("deploy")**: publicar una versión nueva de algo (una app, un
  contrato) para que sea la que corre de verdad.
- **Dependencia**: una pieza de código escrita por otra persona/empresa que
  tu proyecto usa en vez de reescribir desde cero.
- **Vulnerabilidad**: una debilidad conocida que alguien con malas
  intenciones podría aprovechar.
- **Lint**: un chequeo automático de estilo/errores comunes en el código
  (como el corrector ortográfico, pero para código).
- **Build**: el proceso de "compilar" el código para que quede listo para
  correr de verdad.
- **Test / prueba**: código que revisa automáticamente que otra parte del
  código haga lo que debería.
- **Testnet**: una blockchain de pruebas, separada de la real ("mainnet"),
  donde se puede romper cosas sin consecuencias de plata real.
