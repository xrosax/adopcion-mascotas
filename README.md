# 🐾 Huellitas Oruro — Portal de adopción de mascotas

Aplicación web en **Angular 22** + **Bootstrap 5** + **IndexedDB** para el Examen Final.

Las personas pueden:
- **Consultar** mascotas disponibles (con búsqueda por texto y filtros por especie y estado).
- **Enviar una solicitud de adopción** (formulario con validaciones y reglas).
- **Revisar el historial** de solicitudes enviadas y recibidas, filtrando por estado.
- **Ver el detalle** de una solicitud (`/solicitudes/:id`) y **cancelarla**, o, si publicaron la mascota, **aprobarla o rechazarla**.
- **Publicar una mascota** (por ejemplo, un perrito de la calle que tienen en casa temporal).

## Regla principal
Una mascota pasa a estado **"En proceso"** al recibir una solicitud y **no acepta más solicitudes** hasta que se rechace o se cancele.
- Cancelada / Rechazada → la mascota vuelve a **Disponible**.
- Aprobada → la mascota pasa a **Adoptada**.
- Una solicitud ya procesada no se puede modificar de nuevo.

Reglas extra: no puedes solicitar una mascota que tú publicaste, y un perro grande requiere vivienda con patio.

## Requisitos
- [Node.js](https://nodejs.org/) 20.19 o superior (recomendado 22 LTS)
- Angular CLI: `npm install -g @angular/cli`

## Instalación y ejecución
```bash
git clone https://github.com/xrosax/adopcion-mascotas.git
cd adopcion-mascotas
npm install
ng serve -o
```
Se abre en http://localhost:4200

## Cuenta de prueba
| Correo | Contraseña | Rol |
|---|---|---|
| refugio@huellitas.bo | refugio123 | Publicó las mascotas de ejemplo (puede aprobar/rechazar) |

También puedes crear tu propia cuenta desde **Ingresar → Crear cuenta**.

> Para reiniciar los datos: F12 → Application → IndexedDB → `huellitas-db` → Delete database.

## Estructura
```
src/app/
├── models/modelos.ts            Interfaces: Usuario, Mascota, Solicitud
├── services/
│   ├── db.service.ts            Acceso a IndexedDB (único que la toca) + datos iniciales
│   ├── auth.service.ts          Registro, login y sesión
│   └── adopcion.service.ts      Reglas del negocio (solicitar, cancelar, aprobar...)
├── guards/auth.guard.ts         Protege las rutas que requieren sesión
├── components/
│   ├── mascota-card/            Componente hijo: input() mascota, output() solicitar
│   └── estado-badge/            Componente hijo: input() estado, usa ngClass
└── pages/
    ├── login/                   Ingresar / crear cuenta
    ├── mascotas/                1. Consulta principal
    ├── nueva-solicitud/         2. Registro
    ├── historial/               3. Historial
    ├── detalle-solicitud/       4. Detalle y actualización
    └── publicar-mascota/        Extra: publicar mascota
```

## Tecnologías usadas (requisitos del examen)
- **Pipes:** `date`, `titlecase`, `uppercase`
- **Directivas:** `routerLink`, `routerLinkActive`, `ngClass`, `formGroup`/`formControlName`
- **Plantillas:** `{{ }}`, `[propiedad]`, `(evento)`, `@if`, `@for`
- **Formularios reactivos** con validaciones y mensajes
- **Rutas** con lazy loading, guard y parámetro `:id`

## Autores
## Autores
- ROSALINDA AIMA BAUTISTA— [@xrosax](https://github.com/xrosax)
