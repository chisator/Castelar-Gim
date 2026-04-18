# Migración: De Club Deportivo a Gimnasio

## Descripción General
El proyecto ha sido refactorizado para cambiar el modelo de negocio de "Club Deportivo" (asignaciones por deporte) a "Gimnasio" (asignaciones por usuario). Ahora los entrenadores asignan rutinas directamente a usuarios en lugar de a deportes.

---

## Cambios en la Base de Datos

### 1. **Nueva Tabla: `trainer_user_assignments`**
Tabla que gestiona la relación entre entrenadores y usuarios:
```sql
create table public.trainer_user_assignments (
  id uuid primary key,
  trainer_id uuid references profiles(id),
  user_id uuid references profiles(id),
  created_at timestamp,
  unique(trainer_id, user_id)
)
```

### 2. **Modificación en Tabla: `routines`**
- **Removida**: Columna `sport_id` (referencia a sports)
- **Agregada**: Columna `user_id` (referencia directa al usuario)

### 3. **Tablas Eliminadas**
- `public.sports` - Ya no necesaria
- `public.athlete_sports` - Reemplazada por `trainer_user_assignments`

### 4. **Políticas RLS Actualizadas**
- Entrenadores pueden crear rutinas asignadas a sus usuarios
- Usuarios pueden ver sus rutinas asignadas
- Administradores gestionan las asignaciones entrenador-usuario

**Nuevo Script**: `scripts/010_migrate_to_gym.sql` - Contiene todos los cambios de base de datos

---

## Cambios en el Código Frontend

### 1. **Componentes Modificados**

#### `components/create-routine-form.tsx`
- **Antes**: Aceptaba `sports: any[]`
- **Después**: Acepta `athletes: any[]`
- El formulario ahora permite seleccionar el usuario en lugar del deporte

#### `components/edit-routine-form.tsx`
- **Antes**: Campo de selección de deporte
- **Después**: Campo de selección de usuario

#### `components/assignments-table.tsx`
- **Completamente Reescrito**
- Ahora gestiona asignaciones "Entrenador-Usuario" en lugar de "Deportista-Deporte"
- Incluye funcionalidad para remover asignaciones

### 2. **Actions Modificadas**

#### `app/actions/admin-actions.ts`
**Funciones Removidas**:
- `createSport()` - Ya no se crean deportes
- `assignAthleteToSport()` - Reemplazada

**Funciones Nuevas**:
- `assignUserToTrainer()` - Asigna un usuario a un entrenador
- `removeUserFromTrainer()` - Desasigna un usuario de un entrenador

#### `app/actions/trainer-actions.ts`
**Modificación**:
- `updateRoutine()` - Ahora usa `userId` en lugar de `sportId`

### 3. **Páginas Actualizadas**

#### `app/admin/page.tsx`
- Removido tab "Deportes"
- Tab "Asignaciones" ahora muestra asignaciones Entrenador-Usuario
- Actualizado contador de estadísticas
- Cambio de branding: "Club Deportivo" → "Gimnasio"

#### `app/entrenador/page.tsx`
- Removida estadística de "Deportes"
- Agregada estadística de "Usuarios Asignados" (informativa)
- Removida dependencia de tabla `sports`
- Cambio de branding: "Club Deportivo" → "Gimnasio"

#### `app/entrenador/crear-rutina/page.tsx`
- Ahora obtiene usuarios asignados al entrenador
- Cambia consulta de `sports` por `trainer_user_assignments`
- Pasa `athletes` en lugar de `sports` al componente

#### `app/entrenador/editar-rutina/[id]/page.tsx`
- Modificada consulta para obtener usuarios en lugar de deportes
- Consistente con página de crear rutina

---

## Cambios en Scripts SQL

### `scripts/003_seed_data.sql`
- **Antes**: Insertaba 5 deportes de ejemplo (Fútbol, Básquetbol, Natación, etc.)
- **Después**: Archivo vacío (datos de ejemplo ya no necesarios)

### `scripts/010_migrate_to_gym.sql` (NUEVO)
- Crea tabla `trainer_user_assignments`
- Modifica tabla `routines` para agregar `user_id`
- Actualiza políticas RLS
- Proporciona migración limpia de la estructura antigua a la nueva

---

## Impacto en la UX/Flujo de Trabajo

### Para Administrador
1. **Antiguo**: Crear deporte → Asignar deportistas a deportes → Crear rutinas
2. **Nuevo**: Crear usuarios → Asignar usuarios a entrenadores → Crear rutinas

### Para Entrenador
1. **Antiguo**: Seleccionar deporte → Crear rutina
2. **Nuevo**: Seleccionar usuario asignado → Crear rutina

### Para Usuario (Deportista)
- Se reciben rutinas directamente del entrenador asignado
- No necesita seleccionar deporte
- Interfaz más simplificada

---

## Eliminaciones Completas
- ❌ Tabla `sports`
- ❌ Tabla `athlete_sports`
- ❌ Componente `SportsTable`
- ❌ Función `createSport()`
- ❌ Función `assignAthleteToSport()`
- ❌ Tab "Deportes" en panel admin
- ❌ Data seed de deportes

---

## Próximos Pasos Recomendados

1. **Ejecutar el script de migración** en Supabase:
   - Archivo: `scripts/010_migrate_to_gym.sql`
   - Esto agregará la tabla `trainer_user_assignments` y actualizará las políticas RLS

2. **Backup de datos** (si existe data en producción):
   - Si hay datos históricos en `sports` y `athlete_sports`, considerar migración o backup antes de eliminar

3. **Testing**:
   - Probar crear rutina como entrenador
   - Probar asignación usuario-entrenador como admin
   - Verificar que usuarios solo ven sus rutinas

4. **Actualizar documentación de usuario** si existe

---

## Archivo de Resumen Técnico

Cambios totales realizados:
- 5 archivos de componentes modificados
- 3 archivos de actions actualizados
- 4 páginas adaptadas
- 1 script de migración creado
- 1 script de seed actualizado
- 0 errores de compilación
