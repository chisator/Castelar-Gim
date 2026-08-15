CREATE TABLE IF NOT EXISTS "public"."routine_templates" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "trainer_id" "uuid" NOT NULL,
    "title" "text" NOT NULL,
    "description" "text",
    "exercises" "jsonb" DEFAULT '[]'::"jsonb" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "routine_templates_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "routine_templates_trainer_id_fkey" FOREIGN KEY ("trainer_id") REFERENCES "public"."profiles"("id") ON DELETE CASCADE
);

ALTER TABLE "public"."routine_templates" ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Trainers can manage own templates" ON "public"."routine_templates"
    FOR ALL USING (("auth"."uid"() = "trainer_id"));

CREATE POLICY "Admins can view all templates" ON "public"."routine_templates"
    FOR SELECT USING ((( SELECT "profiles"."role" FROM "public"."profiles" WHERE ("profiles"."id" = "auth"."uid"())) = 'administrador'::"text"));
