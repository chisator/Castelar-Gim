# Guía de Ejecución de Migración

## Resumen Rápido

Has migrado exitosamente tu proyecto de "Club Deportivo" (basado en deportes) a "Gimnasio" (basado en usuarios). El código está listo, pero hay un paso en la base de datos que debes ejecutar.

---

## ✅ Qué se ha hecho

- ✅ Código frontend adaptado
- ✅ Componentes actualizados  
- ✅ Actions refactorizados
- ✅ Sin errores de compilación
- ⏳ **Pendiente**: Ejecutar script SQL en Supabase

---

## 📋 Paso 1: Ejecutar Script SQL en Supabase

### Ubicación del Script
`scripts/010_migrate_to_gym.sql`

### Pasos para Ejecutar

1. **Accede a Supabase Console**
   - Ve a: https://app.supabase.com
   - Selecciona tu proyecto

2. **Abre el SQL Editor**
   - En el panel izquierdo: SQL Editor
   - Haz clic en "New Query"

3. **Copia el contenido de `010_migrate_to_gym.sql`**
   - Pega todo el contenido en el editor

4. **Ejecuta el Script**
   - Haz clic en el botón "Run" (o Ctrl+Enter)
   - Espera a que se complete

5. **Verifica que se creó la tabla**
   - Ve a "Database" → "Tables"
   - Deberías ver: `trainer_user_assignments`

---

## 🔍 Verificación Post-Migración

### 1. Verifica la Nueva Tabla

```sql
-- En Supabase SQL Editor
SELECT * FROM public.trainer_user_assignments;
-- Debería estar vacía inicialmente
```

### 2. Verifica que Routines tiene user_id

```sql
-- Verificar estructura de tabla routines
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'routines';
-- Debería mostrar user_id
```

### 3. Verifica Políticas RLS

```sql
-- Ver políticas de la nueva tabla
SELECT policyname, qual 
FROM pg_policies 
WHERE tablename = 'trainer_user_assignments';
```

---

## 🚀 Primer Uso Después de Migración

### Flujo para Administrador

1. **Crear Usuarios** (si no existen)
   - Admin Panel → Usuarios → Crear Usuario
   - Crear usuarios con rol "deportista" y "entrenador"

2. **Asignar Usuarios a Entrenadores**
   - Admin Panel → Asignaciones → Nueva Asignación
   - Selecciona: Usuario (deportista) + Entrenador

3. **Ahora el entrenador puede crear rutinas**
   - Panel Entrenador → Nueva Rutina
   - Selecciona el usuario asignado
   - Define ejercicios y guarda

### Flujo para Entrenador

1. **Ver usuarios asignados**
   - Solo ve opciones en "Nueva Rutina" de sus usuarios asignados
   - (Esto lo maneja automáticamente el backend)

2. **Crear rutina**
   - Nueva Rutina → Seleccionar Usuario → Agregar Ejercicios → Guardar

---

## ⚠️ Datos Históricos

### Si tienes datos en la versión anterior

**Opción 1: Empezar desde cero**
- Más simple y recomendado para desarrollo
- Todos los datos viejos se mantienen pero no se usan
- Las nuevas asignaciones funcionan con la nueva tabla

**Opción 2: Migrar datos históricos**
- Complejo, requiere script personalizado
- Contacta si necesitas migrar datos existentes

### Sports y Athlete_Sports
- Estas tablas ya no se usan
- Se mantienen por compatibilidad
- Puedes dejarlas o eliminarlas manualmente si prefieres limpiar

---

## 🐛 Troubleshooting

### Error: "relation 'trainer_user_assignments' does not exist"
- El script SQL no fue ejecutado
- Ejecuta el script en Supabase siguiendo los pasos arriba

### Error: "column 'user_id' does not exist"  
- Similar al anterior
- Verifica que `010_migrate_to_gym.sql` se ejecutó completo

### El selector de usuarios está vacío en "Nueva Rutina"
- Esto es normal si no hay asignaciones todavía
- Crea una asignación primero en Admin Panel

---

## 📝 Comandos Útiles en SQL (Supabase)

### Ver todas las asignaciones
```sql
SELECT 
  tua.id,
  u1.full_name as "Usuario",
  u2.full_name as "Entrenador",
  tua.created_at
FROM trainer_user_assignments tua
JOIN profiles u1 ON tua.user_id = u1.id
JOIN profiles u2 ON tua.trainer_id = u2.id;
```

### Ver rutinas con usuario
```sql
SELECT 
  r.id,
  r.title,
  p.full_name as "Usuario",
  r.scheduled_date
FROM routines r
JOIN profiles p ON r.user_id = p.id
ORDER BY r.scheduled_date DESC;
```

### Limpiar asignaciones (si es necesario)
```sql
DELETE FROM trainer_user_assignments;
```

---

## ✨ Branding Actualizado

Los siguientes textos han sido actualizados en todo el proyecto:
- "Club Deportivo" → "Gimnasio"
- Referencias a "deportes" → "usuarios" o "ejercicios"
- Descripciones adaptadas al contexto de gimnasio

---

## ✅ Checklist Final

- [ ] Ejecuté el script `010_migrate_to_gym.sql` en Supabase
- [ ] Verifiqué que se creó la tabla `trainer_user_assignments`
- [ ] Creé usuarios (deportistas y entrenadores)
- [ ] Creé una asignación usuario-entrenador
- [ ] Un entrenador puede ver el usuario en "Nueva Rutina"
- [ ] Un entrenador puede crear una rutina asignada al usuario
- [ ] El usuario puede ver su rutina asignada

---

## 📞 Soporte

Si algo no funciona:
1. Verifica el log de Supabase (Database → Webhooks → Logs)
2. Revisa los errores del navegador (F12 → Console)
3. Confirma que el script SQL fue ejecutado exitosamente

¡La migración está completa y lista para usar! 🎉
