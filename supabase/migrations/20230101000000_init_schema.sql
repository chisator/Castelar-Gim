


SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;


COMMENT ON SCHEMA "public" IS 'standard public schema';



CREATE EXTENSION IF NOT EXISTS "pg_graphql" WITH SCHEMA "graphql";






CREATE EXTENSION IF NOT EXISTS "pg_stat_statements" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "pgcrypto" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "supabase_vault" WITH SCHEMA "vault";






CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA "extensions";






CREATE OR REPLACE FUNCTION "public"."create_first_admin"() RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
  -- Esta función debe ser llamada desde tu aplicación
  -- No se puede crear usuarios de auth directamente desde SQL
  RAISE NOTICE 'Usa la página de registro especial /auth/setup-admin para crear el primer administrador';
END;
$$;


ALTER FUNCTION "public"."create_first_admin"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_my_role"() RETURNS "text"
    LANGUAGE "sql" STABLE SECURITY DEFINER
    AS $$
  select role from public.profiles where id = auth.uid() limit 1;
$$;


ALTER FUNCTION "public"."get_my_role"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."handle_new_user"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
  user_count INTEGER;
BEGIN
  -- Contar cuántos perfiles existen
  SELECT COUNT(*) INTO user_count FROM public.profiles;
  
  -- Si es el primer usuario, hacerlo admin
  IF user_count = 0 THEN
    INSERT INTO public.profiles (id, email, role, full_name)
    VALUES (
      NEW.id,
      NEW.email,
      'administrador',
      COALESCE(NEW.raw_user_meta_data->>'full_name', 'Administrador')
    );
  ELSE
    -- Los demás usuarios son deportistas por defecto
    INSERT INTO public.profiles (id, email, role, full_name)
    VALUES (
      NEW.id,
      NEW.email,
      'deportista',
      COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email)
    );
  END IF;
  
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."handle_new_user"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."handle_updated_at"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
begin
  new.updated_at = now();
  return new;
end;
$$;


ALTER FUNCTION "public"."handle_updated_at"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."is_admin"() RETURNS boolean
    LANGUAGE "sql" STABLE SECURITY DEFINER
    AS $$
  select exists (
    select 1 from public.profiles 
    where id = auth.uid() and role = 'administrador'
  );
$$;


ALTER FUNCTION "public"."is_admin"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."is_first_user"() RETURNS boolean
    LANGUAGE "sql" SECURITY DEFINER
    AS $$
  SELECT NOT EXISTS (SELECT 1 FROM public.profiles WHERE role = 'administrador');
$$;


ALTER FUNCTION "public"."is_first_user"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."is_routine_assigned_to_user"("routine_id_to_check" "uuid", "user_id_to_check" "uuid") RETURNS boolean
    LANGUAGE "sql" SECURITY DEFINER
    AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.routine_user_assignments
    WHERE routine_id = routine_id_to_check AND user_id = user_id_to_check
  );
$$;


ALTER FUNCTION "public"."is_routine_assigned_to_user"("routine_id_to_check" "uuid", "user_id_to_check" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."is_trainer"() RETURNS boolean
    LANGUAGE "sql" STABLE SECURITY DEFINER
    AS $$
  select exists (
    select 1 from public.profiles 
    where id = auth.uid() and role = 'entrenador'
  );
$$;


ALTER FUNCTION "public"."is_trainer"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."sync_role_to_user_metadata"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
begin
  -- Actualizar los metadatos del usuario en auth.users
  update auth.users
  set raw_user_meta_data = jsonb_set(
    coalesce(raw_user_meta_data, '{}'::jsonb),
    '{role}',
    to_jsonb(NEW.role)
  )
  where id = NEW.id;
  
  return NEW;
end;
$$;


ALTER FUNCTION "public"."sync_role_to_user_metadata"() OWNER TO "postgres";

SET default_tablespace = '';

SET default_table_access_method = "heap";


CREATE TABLE IF NOT EXISTS "public"."athlete_sports" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "athlete_id" "uuid" NOT NULL,
    "sport_id" "uuid" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."athlete_sports" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."attendance" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "routine_id" "uuid" NOT NULL,
    "athlete_id" "uuid" NOT NULL,
    "completed" boolean DEFAULT false,
    "notes" "text",
    "completed_at" timestamp with time zone,
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."attendance" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."exercise_catalog" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "name" "text" NOT NULL,
    "video_url" "text",
    "created_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()) NOT NULL
);


ALTER TABLE "public"."exercise_catalog" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."gym_classes" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "title" "text" NOT NULL,
    "description" "text",
    "start_time" timestamp with time zone NOT NULL,
    "end_time" timestamp with time zone NOT NULL,
    "instructor_id" "uuid",
    "capacity" integer DEFAULT 20,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "is_cancelled" boolean DEFAULT false
);


ALTER TABLE "public"."gym_classes" OWNER TO "postgres";


COMMENT ON TABLE "public"."gym_classes" IS 'Tabla para almacenar eventos y clases del gimnasio (ej. Zumba, Spinning).';



CREATE TABLE IF NOT EXISTS "public"."profiles" (
    "id" "uuid" NOT NULL,
    "email" "text" NOT NULL,
    "full_name" "text" NOT NULL,
    "role" "text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "reservation_credits" integer DEFAULT 0,
    "plan_credits" integer DEFAULT 0,
    "expiring_credits" integer DEFAULT 0,
    "last_renewal_date" "date" DEFAULT CURRENT_DATE,
    "last_expiration_date" "date" DEFAULT CURRENT_DATE,
    "activity_credits" "jsonb" DEFAULT '{}'::"jsonb",
    "expiring_activity_credits" "jsonb" DEFAULT '{}'::"jsonb",
    CONSTRAINT "profiles_role_check" CHECK (("role" = ANY (ARRAY['deportista'::"text", 'entrenador'::"text", 'administrador'::"text"])))
);


ALTER TABLE "public"."profiles" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."reservations" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "class_id" "uuid" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()) NOT NULL
);


ALTER TABLE "public"."reservations" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."routine_user_assignments" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "routine_id" "uuid" NOT NULL,
    "user_id" "uuid" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."routine_user_assignments" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."routines" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "sport_id" "uuid",
    "trainer_id" "uuid" NOT NULL,
    "title" "text" NOT NULL,
    "description" "text",
    "exercises" "jsonb" DEFAULT '[]'::"jsonb" NOT NULL,
    "scheduled_date" "date",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "user_id" "uuid",
    "start_date" timestamp with time zone,
    "end_date" timestamp with time zone,
    "updated_by" "uuid"
);


ALTER TABLE "public"."routines" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."sports" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "name" "text" NOT NULL,
    "description" "text",
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."sports" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."trainer_user_assignments" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "trainer_id" "uuid" NOT NULL,
    "user_id" "uuid" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."trainer_user_assignments" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."workout_log_entries" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "workout_log_id" "uuid" NOT NULL,
    "exercise_name" "text" NOT NULL,
    "sets_data" "jsonb" DEFAULT '[]'::"jsonb",
    "notes" "text",
    "order" integer DEFAULT 0,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."workout_log_entries" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."workout_logs" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "routine_id" "uuid",
    "date" timestamp with time zone DEFAULT "now"() NOT NULL,
    "notes" "text",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."workout_logs" OWNER TO "postgres";


ALTER TABLE ONLY "public"."athlete_sports"
    ADD CONSTRAINT "athlete_sports_athlete_id_sport_id_key" UNIQUE ("athlete_id", "sport_id");



ALTER TABLE ONLY "public"."athlete_sports"
    ADD CONSTRAINT "athlete_sports_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."attendance"
    ADD CONSTRAINT "attendance_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."attendance"
    ADD CONSTRAINT "attendance_routine_id_athlete_id_key" UNIQUE ("routine_id", "athlete_id");



ALTER TABLE ONLY "public"."exercise_catalog"
    ADD CONSTRAINT "exercise_catalog_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."gym_classes"
    ADD CONSTRAINT "gym_classes_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."profiles"
    ADD CONSTRAINT "profiles_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."reservations"
    ADD CONSTRAINT "reservations_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."reservations"
    ADD CONSTRAINT "reservations_user_id_class_id_key" UNIQUE ("user_id", "class_id");



ALTER TABLE ONLY "public"."routine_user_assignments"
    ADD CONSTRAINT "routine_user_assignments_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."routines"
    ADD CONSTRAINT "routines_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."sports"
    ADD CONSTRAINT "sports_name_key" UNIQUE ("name");



ALTER TABLE ONLY "public"."sports"
    ADD CONSTRAINT "sports_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."trainer_user_assignments"
    ADD CONSTRAINT "trainer_user_assignments_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."trainer_user_assignments"
    ADD CONSTRAINT "trainer_user_assignments_trainer_id_user_id_key" UNIQUE ("trainer_id", "user_id");



ALTER TABLE ONLY "public"."workout_log_entries"
    ADD CONSTRAINT "workout_log_entries_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."workout_logs"
    ADD CONSTRAINT "workout_logs_pkey" PRIMARY KEY ("id");



CREATE INDEX "idx_routine_user_assignments_routine_id" ON "public"."routine_user_assignments" USING "btree" ("routine_id");



CREATE INDEX "idx_routine_user_assignments_user_id" ON "public"."routine_user_assignments" USING "btree" ("user_id");



CREATE OR REPLACE TRIGGER "profiles_updated_at" BEFORE UPDATE ON "public"."profiles" FOR EACH ROW EXECUTE FUNCTION "public"."handle_updated_at"();



CREATE OR REPLACE TRIGGER "routines_updated_at" BEFORE UPDATE ON "public"."routines" FOR EACH ROW EXECUTE FUNCTION "public"."handle_updated_at"();



CREATE OR REPLACE TRIGGER "sync_role_on_profile_change" AFTER INSERT OR UPDATE OF "role" ON "public"."profiles" FOR EACH ROW EXECUTE FUNCTION "public"."sync_role_to_user_metadata"();



ALTER TABLE ONLY "public"."athlete_sports"
    ADD CONSTRAINT "athlete_sports_athlete_id_fkey" FOREIGN KEY ("athlete_id") REFERENCES "public"."profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."athlete_sports"
    ADD CONSTRAINT "athlete_sports_sport_id_fkey" FOREIGN KEY ("sport_id") REFERENCES "public"."sports"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."attendance"
    ADD CONSTRAINT "attendance_athlete_id_fkey" FOREIGN KEY ("athlete_id") REFERENCES "public"."profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."attendance"
    ADD CONSTRAINT "attendance_routine_id_fkey" FOREIGN KEY ("routine_id") REFERENCES "public"."routines"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."gym_classes"
    ADD CONSTRAINT "gym_classes_instructor_id_fkey" FOREIGN KEY ("instructor_id") REFERENCES "public"."profiles"("id");



ALTER TABLE ONLY "public"."profiles"
    ADD CONSTRAINT "profiles_id_fkey" FOREIGN KEY ("id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."reservations"
    ADD CONSTRAINT "reservations_class_id_fkey" FOREIGN KEY ("class_id") REFERENCES "public"."gym_classes"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."reservations"
    ADD CONSTRAINT "reservations_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."routine_user_assignments"
    ADD CONSTRAINT "routine_user_assignments_routine_id_fkey" FOREIGN KEY ("routine_id") REFERENCES "public"."routines"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."routine_user_assignments"
    ADD CONSTRAINT "routine_user_assignments_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."routines"
    ADD CONSTRAINT "routines_sport_id_fkey" FOREIGN KEY ("sport_id") REFERENCES "public"."sports"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."routines"
    ADD CONSTRAINT "routines_trainer_id_fkey" FOREIGN KEY ("trainer_id") REFERENCES "public"."profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."routines"
    ADD CONSTRAINT "routines_updated_by_fkey" FOREIGN KEY ("updated_by") REFERENCES "public"."profiles"("id");



ALTER TABLE ONLY "public"."routines"
    ADD CONSTRAINT "routines_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."trainer_user_assignments"
    ADD CONSTRAINT "trainer_user_assignments_trainer_id_fkey" FOREIGN KEY ("trainer_id") REFERENCES "public"."profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."trainer_user_assignments"
    ADD CONSTRAINT "trainer_user_assignments_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."workout_log_entries"
    ADD CONSTRAINT "workout_log_entries_workout_log_id_fkey" FOREIGN KEY ("workout_log_id") REFERENCES "public"."workout_logs"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."workout_logs"
    ADD CONSTRAINT "workout_logs_routine_id_fkey" FOREIGN KEY ("routine_id") REFERENCES "public"."routines"("id");



ALTER TABLE ONLY "public"."workout_logs"
    ADD CONSTRAINT "workout_logs_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id");



CREATE POLICY "Admin y Entrenadores pueden gestionar clases" ON "public"."gym_classes" USING ((EXISTS ( SELECT 1
   FROM "public"."profiles"
  WHERE (("profiles"."id" = "auth"."uid"()) AND (("profiles"."role" = 'administrador'::"text") OR ("profiles"."role" = 'entrenador'::"text"))))));



CREATE POLICY "Allow all read access based on role" ON "public"."routines" FOR SELECT USING ((("auth"."uid"() = "trainer_id") OR (( SELECT "profiles"."role"
   FROM "public"."profiles"
  WHERE ("profiles"."id" = "auth"."uid"())) = 'administrador'::"text") OR ("auth"."uid"() = "user_id") OR "public"."is_routine_assigned_to_user"("id", "auth"."uid"())));



CREATE POLICY "Allow assignment creation for trainers and admins" ON "public"."routine_user_assignments" FOR INSERT WITH CHECK (((EXISTS ( SELECT 1
   FROM "public"."routines" "r"
  WHERE (("r"."id" = "routine_user_assignments"."routine_id") AND ("r"."trainer_id" = "auth"."uid"())))) OR (( SELECT "profiles"."role"
   FROM "public"."profiles"
  WHERE ("profiles"."id" = "auth"."uid"())) = 'administrador'::"text")));



CREATE POLICY "Allow routine creation for trainers and admins" ON "public"."routines" FOR INSERT WITH CHECK (((("auth"."uid"() = "trainer_id") AND (( SELECT "profiles"."role"
   FROM "public"."profiles"
  WHERE ("profiles"."id" = "auth"."uid"())) = 'entrenador'::"text")) OR (( SELECT "profiles"."role"
   FROM "public"."profiles"
  WHERE ("profiles"."id" = "auth"."uid"())) = 'administrador'::"text")));



CREATE POLICY "Allow routine deletion for trainers and admins" ON "public"."routines" FOR DELETE USING ((("auth"."uid"() = "trainer_id") OR (( SELECT "profiles"."role"
   FROM "public"."profiles"
  WHERE ("profiles"."id" = "auth"."uid"())) = 'administrador'::"text")));



CREATE POLICY "Allow routine updates for trainers and admins" ON "public"."routines" FOR UPDATE USING ((("auth"."uid"() = "trainer_id") OR (( SELECT "profiles"."role"
   FROM "public"."profiles"
  WHERE ("profiles"."id" = "auth"."uid"())) = 'administrador'::"text")));



CREATE POLICY "Los administradores pueden actualizar deportes" ON "public"."sports" FOR UPDATE USING ("public"."is_admin"());



CREATE POLICY "Los administradores pueden actualizar perfiles" ON "public"."profiles" FOR UPDATE USING ("public"."is_admin"());



CREATE POLICY "Los administradores pueden asignar deportes" ON "public"."athlete_sports" FOR INSERT WITH CHECK ("public"."is_admin"());



CREATE POLICY "Los administradores pueden asignar usuarios a entrenadores" ON "public"."trainer_user_assignments" FOR INSERT WITH CHECK ((EXISTS ( SELECT 1
   FROM "public"."profiles"
  WHERE (("profiles"."id" = "auth"."uid"()) AND ("profiles"."role" = 'administrador'::"text")))));



CREATE POLICY "Los administradores pueden crear deportes" ON "public"."sports" FOR INSERT WITH CHECK ("public"."is_admin"());



CREATE POLICY "Los administradores pueden eliminar asignaciones" ON "public"."athlete_sports" FOR DELETE USING ("public"."is_admin"());



CREATE POLICY "Los administradores pueden eliminar asignaciones" ON "public"."trainer_user_assignments" FOR DELETE USING ((EXISTS ( SELECT 1
   FROM "public"."profiles"
  WHERE (("profiles"."id" = "auth"."uid"()) AND ("profiles"."role" = 'administrador'::"text")))));



CREATE POLICY "Los administradores pueden eliminar deportes" ON "public"."sports" FOR DELETE USING ("public"."is_admin"());



CREATE POLICY "Los administradores pueden insertar perfiles" ON "public"."profiles" FOR INSERT WITH CHECK ("public"."is_admin"());



CREATE POLICY "Los administradores pueden ver toda la asistencia" ON "public"."attendance" FOR SELECT USING ("public"."is_admin"());



CREATE POLICY "Los administradores pueden ver todas las asignaciones" ON "public"."athlete_sports" FOR SELECT USING ("public"."is_admin"());



CREATE POLICY "Los administradores pueden ver todas las asignaciones" ON "public"."trainer_user_assignments" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM "public"."profiles"
  WHERE (("profiles"."id" = "auth"."uid"()) AND ("profiles"."role" = 'administrador'::"text")))));



CREATE POLICY "Los administradores pueden ver todos los perfiles" ON "public"."profiles" FOR SELECT USING ("public"."is_admin"());



CREATE POLICY "Los deportistas pueden actualizar su asistencia" ON "public"."attendance" FOR UPDATE USING (("auth"."uid"() = "athlete_id"));



CREATE POLICY "Los deportistas pueden marcar su asistencia" ON "public"."attendance" FOR INSERT WITH CHECK (("auth"."uid"() = "athlete_id"));



CREATE POLICY "Los deportistas pueden ver su asistencia" ON "public"."attendance" FOR SELECT USING (("auth"."uid"() = "athlete_id"));



CREATE POLICY "Los deportistas pueden ver sus deportes" ON "public"."athlete_sports" FOR SELECT USING (("auth"."uid"() = "athlete_id"));



CREATE POLICY "Los entrenadores pueden crear registros de asistencia" ON "public"."attendance" FOR INSERT WITH CHECK ((EXISTS ( SELECT 1
   FROM "public"."routines"
  WHERE (("routines"."id" = "attendance"."routine_id") AND ("routines"."trainer_id" = "auth"."uid"())))));



CREATE POLICY "Los entrenadores pueden ver asignaciones de deportistas" ON "public"."athlete_sports" FOR SELECT USING ("public"."is_trainer"());



CREATE POLICY "Los entrenadores pueden ver asistencia de sus rutinas" ON "public"."attendance" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM "public"."routines"
  WHERE (("routines"."id" = "attendance"."routine_id") AND ("routines"."trainer_id" = "auth"."uid"())))));



CREATE POLICY "Los entrenadores pueden ver perfiles de deportistas" ON "public"."profiles" FOR SELECT USING ((("role" = 'deportista'::"text") AND "public"."is_trainer"()));



CREATE POLICY "Los entrenadores pueden ver sus asignaciones de usuarios" ON "public"."trainer_user_assignments" FOR SELECT USING (("auth"."uid"() = "trainer_id"));



CREATE POLICY "Los usuarios pueden actualizar su propio perfil" ON "public"."profiles" FOR UPDATE USING (("auth"."uid"() = "id"));



CREATE POLICY "Los usuarios pueden crear su propio perfil" ON "public"."profiles" FOR INSERT WITH CHECK (("auth"."uid"() = "id"));



CREATE POLICY "Los usuarios pueden ver los entrenadores asignados" ON "public"."trainer_user_assignments" FOR SELECT USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Los usuarios pueden ver su propio perfil" ON "public"."profiles" FOR SELECT USING (("auth"."uid"() = "id"));



CREATE POLICY "Permitir lectura publica de perfiles" ON "public"."profiles" FOR SELECT TO "authenticated" USING (true);



CREATE POLICY "Primer usuario es admin" ON "public"."profiles" FOR INSERT WITH CHECK (("public"."is_first_user"() OR ("auth"."uid"() = "id")));



CREATE POLICY "Todos pueden ver clases" ON "public"."gym_classes" FOR SELECT USING (("auth"."role"() = 'authenticated'::"text"));



CREATE POLICY "Todos pueden ver deportes" ON "public"."sports" FOR SELECT USING (true);



CREATE POLICY "Trainers can view entries of their assigned users" ON "public"."workout_log_entries" FOR SELECT USING (((EXISTS ( SELECT 1
   FROM ("public"."workout_logs"
     JOIN "public"."trainer_user_assignments" ON (("workout_logs"."user_id" = "trainer_user_assignments"."user_id")))
  WHERE (("workout_logs"."id" = "workout_log_entries"."workout_log_id") AND ("trainer_user_assignments"."trainer_id" = "auth"."uid"())))) OR (EXISTS ( SELECT 1
   FROM "public"."profiles"
  WHERE (("profiles"."id" = "auth"."uid"()) AND ("profiles"."role" = 'administrador'::"text"))))));



CREATE POLICY "Trainers can view logs of their assigned users" ON "public"."workout_logs" FOR SELECT USING (((EXISTS ( SELECT 1
   FROM "public"."trainer_user_assignments"
  WHERE (("trainer_user_assignments"."user_id" = "workout_logs"."user_id") AND ("trainer_user_assignments"."trainer_id" = "auth"."uid"())))) OR (EXISTS ( SELECT 1
   FROM "public"."profiles"
  WHERE (("profiles"."id" = "auth"."uid"()) AND ("profiles"."role" = 'administrador'::"text"))))));



CREATE POLICY "Users can create own reservations" ON "public"."reservations" FOR INSERT WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can delete entries for their own logs" ON "public"."workout_log_entries" FOR DELETE USING ((EXISTS ( SELECT 1
   FROM "public"."workout_logs"
  WHERE (("workout_logs"."id" = "workout_log_entries"."workout_log_id") AND ("workout_logs"."user_id" = "auth"."uid"())))));



CREATE POLICY "Users can delete own reservations" ON "public"."reservations" FOR DELETE USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can delete their own workout logs" ON "public"."workout_logs" FOR DELETE USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can insert entries for their own logs" ON "public"."workout_log_entries" FOR INSERT WITH CHECK ((EXISTS ( SELECT 1
   FROM "public"."workout_logs"
  WHERE (("workout_logs"."id" = "workout_log_entries"."workout_log_id") AND ("workout_logs"."user_id" = "auth"."uid"())))));



CREATE POLICY "Users can insert their own workout logs" ON "public"."workout_logs" FOR INSERT WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can update entries for their own logs" ON "public"."workout_log_entries" FOR UPDATE USING ((EXISTS ( SELECT 1
   FROM "public"."workout_logs"
  WHERE (("workout_logs"."id" = "workout_log_entries"."workout_log_id") AND ("workout_logs"."user_id" = "auth"."uid"())))));



CREATE POLICY "Users can update their own workout logs" ON "public"."workout_logs" FOR UPDATE USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can view own reservations" ON "public"."reservations" FOR SELECT USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can view their own workout log entries" ON "public"."workout_log_entries" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM "public"."workout_logs"
  WHERE (("workout_logs"."id" = "workout_log_entries"."workout_log_id") AND ("workout_logs"."user_id" = "auth"."uid"())))));



CREATE POLICY "Users can view their own workout logs" ON "public"."workout_logs" FOR SELECT USING (("auth"."uid"() = "user_id"));



CREATE POLICY "admin_see_all" ON "public"."routines" FOR SELECT USING ((( SELECT "profiles"."role"
   FROM "public"."profiles"
  WHERE ("profiles"."id" = "auth"."uid"())) = 'administrador'::"text"));



ALTER TABLE "public"."athlete_sports" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."attendance" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "delete_assignments" ON "public"."routine_user_assignments" FOR DELETE USING (((EXISTS ( SELECT 1
   FROM "public"."routines" "r"
  WHERE (("r"."id" = "routine_user_assignments"."routine_id") AND ("r"."trainer_id" = "auth"."uid"())))) OR (( SELECT "profiles"."role"
   FROM "public"."profiles"
  WHERE ("profiles"."id" = "auth"."uid"())) = 'administrador'::"text")));



ALTER TABLE "public"."gym_classes" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."profiles" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."reservations" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."routine_user_assignments" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."routines" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "select_assignments" ON "public"."routine_user_assignments" FOR SELECT USING ((("user_id" = "auth"."uid"()) OR (EXISTS ( SELECT 1
   FROM "public"."routines" "r"
  WHERE (("r"."id" = "routine_user_assignments"."routine_id") AND ("r"."trainer_id" = "auth"."uid"())))) OR (( SELECT "profiles"."role"
   FROM "public"."profiles"
  WHERE ("profiles"."id" = "auth"."uid"())) = 'administrador'::"text")));



ALTER TABLE "public"."sports" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "trainer_delete" ON "public"."routines" FOR DELETE USING ((("trainer_id" = "auth"."uid"()) AND (( SELECT "profiles"."role"
   FROM "public"."profiles"
  WHERE ("profiles"."id" = "auth"."uid"())) = 'entrenador'::"text")));



CREATE POLICY "trainer_insert" ON "public"."routines" FOR INSERT WITH CHECK ((("trainer_id" = "auth"."uid"()) AND (( SELECT "profiles"."role"
   FROM "public"."profiles"
  WHERE ("profiles"."id" = "auth"."uid"())) = 'entrenador'::"text")));



CREATE POLICY "trainer_update" ON "public"."routines" FOR UPDATE USING ((("trainer_id" = "auth"."uid"()) AND (( SELECT "profiles"."role"
   FROM "public"."profiles"
  WHERE ("profiles"."id" = "auth"."uid"())) = 'entrenador'::"text")));



ALTER TABLE "public"."trainer_user_assignments" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."workout_log_entries" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."workout_logs" ENABLE ROW LEVEL SECURITY;




ALTER PUBLICATION "supabase_realtime" OWNER TO "postgres";


GRANT USAGE ON SCHEMA "public" TO "postgres";
GRANT USAGE ON SCHEMA "public" TO "anon";
GRANT USAGE ON SCHEMA "public" TO "authenticated";
GRANT USAGE ON SCHEMA "public" TO "service_role";

























































































































































GRANT ALL ON FUNCTION "public"."create_first_admin"() TO "anon";
GRANT ALL ON FUNCTION "public"."create_first_admin"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."create_first_admin"() TO "service_role";



GRANT ALL ON FUNCTION "public"."get_my_role"() TO "anon";
GRANT ALL ON FUNCTION "public"."get_my_role"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_my_role"() TO "service_role";



GRANT ALL ON FUNCTION "public"."handle_new_user"() TO "anon";
GRANT ALL ON FUNCTION "public"."handle_new_user"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."handle_new_user"() TO "service_role";



GRANT ALL ON FUNCTION "public"."handle_updated_at"() TO "anon";
GRANT ALL ON FUNCTION "public"."handle_updated_at"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."handle_updated_at"() TO "service_role";



GRANT ALL ON FUNCTION "public"."is_admin"() TO "anon";
GRANT ALL ON FUNCTION "public"."is_admin"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."is_admin"() TO "service_role";



GRANT ALL ON FUNCTION "public"."is_first_user"() TO "anon";
GRANT ALL ON FUNCTION "public"."is_first_user"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."is_first_user"() TO "service_role";



GRANT ALL ON FUNCTION "public"."is_routine_assigned_to_user"("routine_id_to_check" "uuid", "user_id_to_check" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."is_routine_assigned_to_user"("routine_id_to_check" "uuid", "user_id_to_check" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."is_routine_assigned_to_user"("routine_id_to_check" "uuid", "user_id_to_check" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."is_trainer"() TO "anon";
GRANT ALL ON FUNCTION "public"."is_trainer"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."is_trainer"() TO "service_role";



GRANT ALL ON FUNCTION "public"."sync_role_to_user_metadata"() TO "anon";
GRANT ALL ON FUNCTION "public"."sync_role_to_user_metadata"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."sync_role_to_user_metadata"() TO "service_role";


















GRANT ALL ON TABLE "public"."athlete_sports" TO "anon";
GRANT ALL ON TABLE "public"."athlete_sports" TO "authenticated";
GRANT ALL ON TABLE "public"."athlete_sports" TO "service_role";



GRANT ALL ON TABLE "public"."attendance" TO "anon";
GRANT ALL ON TABLE "public"."attendance" TO "authenticated";
GRANT ALL ON TABLE "public"."attendance" TO "service_role";



GRANT ALL ON TABLE "public"."exercise_catalog" TO "anon";
GRANT ALL ON TABLE "public"."exercise_catalog" TO "authenticated";
GRANT ALL ON TABLE "public"."exercise_catalog" TO "service_role";



GRANT ALL ON TABLE "public"."gym_classes" TO "anon";
GRANT ALL ON TABLE "public"."gym_classes" TO "authenticated";
GRANT ALL ON TABLE "public"."gym_classes" TO "service_role";



GRANT ALL ON TABLE "public"."profiles" TO "anon";
GRANT ALL ON TABLE "public"."profiles" TO "authenticated";
GRANT ALL ON TABLE "public"."profiles" TO "service_role";



GRANT ALL ON TABLE "public"."reservations" TO "anon";
GRANT ALL ON TABLE "public"."reservations" TO "authenticated";
GRANT ALL ON TABLE "public"."reservations" TO "service_role";



GRANT ALL ON TABLE "public"."routine_user_assignments" TO "anon";
GRANT ALL ON TABLE "public"."routine_user_assignments" TO "authenticated";
GRANT ALL ON TABLE "public"."routine_user_assignments" TO "service_role";



GRANT ALL ON TABLE "public"."routines" TO "anon";
GRANT ALL ON TABLE "public"."routines" TO "authenticated";
GRANT ALL ON TABLE "public"."routines" TO "service_role";



GRANT ALL ON TABLE "public"."sports" TO "anon";
GRANT ALL ON TABLE "public"."sports" TO "authenticated";
GRANT ALL ON TABLE "public"."sports" TO "service_role";



GRANT ALL ON TABLE "public"."trainer_user_assignments" TO "anon";
GRANT ALL ON TABLE "public"."trainer_user_assignments" TO "authenticated";
GRANT ALL ON TABLE "public"."trainer_user_assignments" TO "service_role";



GRANT ALL ON TABLE "public"."workout_log_entries" TO "anon";
GRANT ALL ON TABLE "public"."workout_log_entries" TO "authenticated";
GRANT ALL ON TABLE "public"."workout_log_entries" TO "service_role";



GRANT ALL ON TABLE "public"."workout_logs" TO "anon";
GRANT ALL ON TABLE "public"."workout_logs" TO "authenticated";
GRANT ALL ON TABLE "public"."workout_logs" TO "service_role";









ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "service_role";































