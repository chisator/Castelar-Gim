-- =====================================================================
-- Corrección de escalada de privilegios y fugas de datos en `profiles`
-- =====================================================================
--
-- Problemas que corrige esta migración:
--
-- 1. ESCALADA A ADMINISTRADOR (crítico)
--    La policy "Los usuarios pueden actualizar su propio perfil" tenía
--    USING (auth.uid() = id) y ningún WITH CHECK. En PostgreSQL, cuando
--    una policy de UPDATE omite WITH CHECK se reutiliza el USING como
--    check de la fila nueva, y `auth.uid() = id` se sigue cumpliendo
--    aunque el usuario cambie su propio `role`. Sumado al trigger
--    `sync_role_on_profile_change` (que propaga el rol a
--    auth.users.raw_user_meta_data), cualquier deportista podía
--    convertirse en administrador con un solo UPDATE.
--
-- 2. AUTO-ASIGNACIÓN DE CRÉDITOS (alto)
--    La misma policy permitía que un deportista se escribiera
--    `activity_credits` / `expiring_activity_credits` a voluntad,
--    obteniendo reservas de clases ilimitadas.
--
-- 3. LECTURA DE TODOS LOS PERFILES (alto)
--    La policy "Permitir lectura publica de perfiles" con USING (true)
--    anulaba a las demás policies de SELECT: cualquier usuario
--    autenticado podía leer email, teléfono y créditos de todos los
--    socios.
--
-- Estrategia: las columnas sensibles se protegen con un trigger
-- BEFORE UPDATE (una policy WITH CHECK no puede comparar contra OLD),
-- y se restringe la lectura a las policies específicas que ya existían.
-- =====================================================================


-- ---------------------------------------------------------------------
-- 1. Trigger que protege columnas sensibles de `profiles`
-- ---------------------------------------------------------------------
-- SECURITY INVOKER (por defecto) a propósito: necesitamos que
-- `current_user` refleje el rol real de quien ejecuta. Con SECURITY
-- DEFINER siempre sería el dueño de la función y la excepción para
-- service_role se cumpliría siempre, anulando la protección.

CREATE OR REPLACE FUNCTION "public"."protect_sensitive_profile_columns"()
RETURNS "trigger"
LANGUAGE "plpgsql"
SET "search_path" = "public", "auth"
AS $$
DECLARE
  role_changed    boolean;
  credits_changed boolean;
BEGIN
  role_changed := NEW.role IS DISTINCT FROM OLD.role;
  credits_changed :=
    (NEW.activity_credits IS DISTINCT FROM OLD.activity_credits)
    OR (NEW.expiring_activity_credits IS DISTINCT FROM OLD.expiring_activity_credits);

  -- Nada sensible cambió: dejamos pasar.
  IF NOT role_changed AND NOT credits_changed THEN
    RETURN NEW;
  END IF;

  -- El backend (Server Actions con SUPABASE_SERVICE_ROLE_KEY), las
  -- migraciones y los procesos internos de Supabase pueden operar libremente.
  IF current_user IN (
    'service_role', 'postgres', 'supabase_admin', 'supabase_auth_admin'
  ) THEN
    RETURN NEW;
  END IF;

  -- A partir de acá: request de un usuario autenticado normal.

  IF credits_changed THEN
    RAISE EXCEPTION
      'Los créditos de actividad solo pueden modificarse desde el servidor'
      USING ERRCODE = 'insufficient_privilege';
  END IF;

  IF role_changed THEN
    IF NOT "public"."is_admin"() THEN
      RAISE EXCEPTION 'No tenés permisos para cambiar el rol de un usuario'
        USING ERRCODE = 'insufficient_privilege';
    END IF;

    -- Ni siquiera un administrador puede auto-promoverse/degradarse:
    -- evita que una cuenta comprometida se blinde sola y evita
    -- que un admin se quite el rol por accidente y quede sin acceso.
    IF NEW.id = "auth"."uid"() THEN
      RAISE EXCEPTION 'Un administrador no puede cambiar su propio rol'
        USING ERRCODE = 'insufficient_privilege';
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

ALTER FUNCTION "public"."protect_sensitive_profile_columns"() OWNER TO "postgres";

DROP TRIGGER IF EXISTS "protect_sensitive_profile_columns" ON "public"."profiles";

CREATE TRIGGER "protect_sensitive_profile_columns"
  BEFORE UPDATE ON "public"."profiles"
  FOR EACH ROW
  EXECUTE FUNCTION "public"."protect_sensitive_profile_columns"();


-- ---------------------------------------------------------------------
-- 2. WITH CHECK explícito en la policy de auto-actualización
-- ---------------------------------------------------------------------
-- El trigger de arriba es la defensa real (puede comparar contra OLD).
-- Esto deja además explícito que un usuario no puede reasignar su fila
-- a otro `id`, en vez de depender del USING implícito.

DROP POLICY IF EXISTS "Los usuarios pueden actualizar su propio perfil"
  ON "public"."profiles";

CREATE POLICY "Los usuarios pueden actualizar su propio perfil"
  ON "public"."profiles"
  FOR UPDATE
  USING ("auth"."uid"() = "id")
  WITH CHECK ("auth"."uid"() = "id");


-- ---------------------------------------------------------------------
-- 3. Restringir la lectura de perfiles
-- ---------------------------------------------------------------------
-- Se elimina la policy comodín. Las tres policies que quedan cubren
-- todos los accesos reales de la app:
--   * "Los usuarios pueden ver su propio perfil"      -> auth.uid() = id
--   * "Los entrenadores pueden ver perfiles de deportistas"
--   * "Los administradores pueden ver todos los perfiles" -> is_admin()
-- Los listados del panel de entrenador usan SUPABASE_SERVICE_ROLE_KEY,
-- que no pasa por RLS, así que no se ven afectados.

DROP POLICY IF EXISTS "Permitir lectura publica de perfiles"
  ON "public"."profiles";


-- ---------------------------------------------------------------------
-- 4. Higiene de permisos sobre funciones de trigger
-- ---------------------------------------------------------------------
-- Son funciones que retornan `trigger`: PostgreSQL no permite invocarlas
-- fuera de un contexto de trigger, así que el GRANT a `authenticated`
-- no aportaba nada. Se revoca por principio de mínimo privilegio.
-- Los triggers siguen ejecutándose con los permisos del dueño de la tabla.

REVOKE ALL ON FUNCTION "public"."sync_role_to_user_metadata"() FROM "anon", "authenticated";
REVOKE ALL ON FUNCTION "public"."handle_new_user"() FROM "anon", "authenticated";
REVOKE ALL ON FUNCTION "public"."handle_updated_at"() FROM "anon", "authenticated";
REVOKE ALL ON FUNCTION "public"."protect_sensitive_profile_columns"() FROM "anon", "authenticated";
