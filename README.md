# Dentistetic Turbaco

Aplicación web de una clínica de ortodoncia y estética dental en Turbaco,
Bolívar. Una sola aplicación con cuatro roles: paciente, secretaria, odontólogo
y administrador.

## Qué hace

**Área pública** — Portada, agendamiento en cuatro pasos (tipo de cita, fecha,
datos y confirmación) e ingreso de pacientes y de personal. Solo se ofrecen
horarios realmente libres: pedir una cita imposible y que la rechacen es la peor
experiencia posible.

**Portal del paciente** — Próxima cita, calendario mensual del tratamiento,
avance de la ortodoncia, historial y estado de cuenta con el plan de pagos.
Puede pedir cita desde su sesión sin volver a escribir sus datos, y un control
de ortodoncia de un paciente con tratamiento activo se confirma solo.

**Panel de la clínica** — Indicadores del día, bandeja de solicitudes con sus
tres desenlaces (aprobar, proponer dos horarios alternativos o rechazar con
motivo), agenda semanal en rejilla horaria, creación directa de citas desde el
mostrador y alertas de seguimiento: pacientes de ortodoncia que dejaron de venir
y cuotas vencidas.

Toda resolución genera el mensaje de WhatsApp ya redactado, con el tono de la
casa, listo para enviar. Si el paciente es menor de edad, el mensaje va al
acudiente y se le habla a él.

## Cómo se ejecuta

```bash
npm install
npm run dev        # servidor de desarrollo en http://localhost:5173
npm run build      # comprobación de tipos + compilación a dist/
npm run revisar    # solo comprobación de tipos
```

`npm run dev` escucha en toda la red local, así que la aplicación se puede abrir
desde un celular conectado al mismo wifi.

## Cómo está organizado

```
src/
  compartido/    tipos, permisos, formato, mensajería y la capa de datos
  componentes/   componentes de interfaz reutilizables y la guarda de rutas
  publico/       portada, agendamiento e ingreso
  paciente/      portal del paciente
  clinica/       panel, agenda y bandeja de solicitudes
```

Tres decisiones que conviene conocer antes de tocar el código:

**Los permisos viven en un solo sitio.** `compartido/permisos.ts` tiene la tabla
de qué puede hacer cada rol. Las pantallas nunca preguntan «¿es administrador?»,
preguntan «¿puede ver la cartera?». El día que la clínica quiera que la
secretaria vea ingresos, se cambia una línea de esa tabla y no se toca ninguna
pantalla.

**La sesión es por pestaña, los datos son compartidos.** La sesión vive en
`sessionStorage` y los datos en `localStorage`, de modo que se puede tener
abierto el portal de una paciente en una pestaña y el panel de la clínica en
otra, cada una con su usuario. Un cambio hecho en una aparece en la otra sin
recargar.

**El estilo se cambia en los tokens, no pantalla por pantalla.** `src/index.css`
redefine la rampa de grises, la escala tipográfica y los radios que Tailwind ya
usa, así que una pantalla escrita con `text-sm` o `slate-500` adopta el estilo
sin tocar ni una de sus clases.

## Estado actual: esto todavía no es software de producción

Conviene decirlo claro porque el aspecto engaña:

- **No hay servidor.** `compartido/mockApi.ts` simula la capa de datos y todo se
  guarda en el `localStorage` del navegador. Dos personas en dos computadores no
  comparten nada. El archivo está escrito para poder sustituirse por llamadas
  HTTP reales sin tocar ningún componente, pero ese trabajo está pendiente.
- **Las pantallas de ingreso muestran credenciales de prueba** en un recuadro
  visible, con usuarios, contraseñas y códigos de acceso.
- **Las contraseñas están en texto plano** en `compartido/datosSemilla.ts`.
- Los datos de pacientes son ficticios y se generan al abrir la aplicación.

Antes de usar esto con pacientes reales hace falta, como mínimo: un backend con
autenticación de verdad, quitar los recuadros de credenciales y los avisos de
demostración, y revisar el tratamiento de datos personales de salud según la
Ley 1581 de habeas data.

## Imágenes

Las fotos de `src/assets/imagenes/` son de banco (Unsplash), **no** de esta
clínica. El origen y las condiciones están en `src/assets/imagenes/CREDITOS.md`.
Presentar un consultorio ajeno como propio induce a error al paciente: en cuanto
haya fotos reales de la sede, basta con reemplazar los archivos conservando el
nombre.

## Tecnología

React 18, TypeScript, Vite, Tailwind CSS 4, React Router y date-fns.
Sin dependencias de interfaz de terceros: los componentes son propios.
