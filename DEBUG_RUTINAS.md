# 🔧 Debugging: Rutinas no aparecen

## Problema
- ✅ Las rutinas se crean sin error
- ❌ El entrenador no ve las rutinas creadas
- ❌ El usuario (deportista) no ve las rutinas asignadas

## Causa Probable
Las políticas RLS de la tabla `routines` están bloqueando la lectura.

---

## ✅ Solución Paso a Paso

### 1. Ejecutar script de corrección RLS

**Archivo**: `scripts/CORREGIR_RLS_ROUTINES.sql`

**Pasos**:
1. Abre `scripts/CORREGIR_RLS_ROUTINES.sql`
2. Cópialo todo (Ctrl+A, Ctrl+C)
3. Ve a Supabase → SQL Editor → New Query
4. Pega (Ctrl+V)
5. Ejecuta (Ctrl+Enter)

Este script:
- ✅ Elimina todas las políticas antiguas/conflictivas
- ✅ Crea políticas simples y claras:
  - Entrenador ve SUS rutinas (donde él es trainer_id)
  - Usuario ve SUS rutinas (donde él es user_id)
  - Admin ve TODAS

---

## 🔍 Verificación Manual

Después de ejecutar el script, en Supabase SQL Editor pega esto:

```sql
-- Ver rutinas creadas
SELECT 
  r.id,
  r.title,
  r.trainer_id,
  r.user_id,
  p.full_name as "Usuario Asignado",
  r.scheduled_date
FROM routines r
LEFT JOIN profiles p ON r.user_id = p.id
ORDER BY r.created_at DESC;
```

Deberías ver las rutinas con:
- ✅ trainer_id = ID del entrenador que las creó
- ✅ user_id = ID del usuario seleccionado
- ✅ Usuario Asignado = nombre del usuario

---

## 📋 Test Completo

### 1. Admin crea dos usuarios
- Usuario A: "deportista" (ejemplo: juan@example.com)
- Usuario B: "entrenador" (ejemplo: carlos@example.com)

### 2. Admin asigna Usuario A a Usuario B
- Admin Panel → Asignaciones → Nueva Asignación
- Selecciona: Usuario A + Entrenador B

### 3. Entrenador B crea rutina
- Inicia sesión como Usuario B
- Panel Entrenador → Nueva Rutina
- Selecciona Usuario A en el dropdown
- Crea la rutina

### 4. Verificar visibilidad

**Como Entrenador B**: Debería ver la rutina en "Panel Entrenador"

**Como Usuario A**: Debería ver la rutina en su panel (si existe)

**Como Admin**: Debería ver todo

---

## 🐛 Si sigue sin funcionar

### Paso 1: Verifica que user_id se guarda
```sql
SELECT id, user_id, title FROM routines LIMIT 5;
```

Si `user_id` es NULL, el problema está en el formulario (usuario no se está guardando).

### Paso 2: Verifica las políticas
```sql
SELECT policyname, qual FROM pg_policies 
WHERE tablename = 'routines';
```

Deberías ver 7 políticas (sin nombres duplicados).

### Paso 3: Test directo de política
```sql
-- Como admin, query sin RLS
SELECT * FROM routines 
WHERE trainer_id = 'ID_DEL_ENTRENADOR'
LIMIT 5;
```

Si esto devuelve resultados pero el app no, es un problema de RLS.

---

## 💡 Tips

1. **Limpia el navegador**: A veces Next.js cachea datos
   - F12 → Application → Storage → Clear Site Data
   - O Ctrl+Shift+R para refresh forzado

2. **Verifica logs**: En Supabase → Logs → Edge Functions
   - Puede haber errores de RLS que no se ven en el frontend

3. **Usuario vacío**: Si el dropdown de usuarios está vacío
   - Significa que el entrenador no tiene asignaciones
   - Ve a Admin Panel y crea una asignación primero

---

## ✨ Resumen

Si después de ejecutar `CORREGIR_RLS_ROUTINES.sql` sigue sin funcionar:

1. Verifica que `user_id` se guardó en la rutina (SQL query arriba)
2. Verifica que las 7 políticas existen sin duplicados
3. Limpia cache del navegador
4. Si aún no, avísame con el resultado del SQL

Debería funcionar 100% después de esto 🚀
