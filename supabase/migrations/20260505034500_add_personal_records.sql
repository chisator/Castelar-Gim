-- Create the personal_records table
CREATE TABLE IF NOT EXISTS public.personal_records (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    exercise_id UUID NOT NULL REFERENCES public.exercise_catalog(id) ON DELETE CASCADE,
    weight NUMERIC NOT NULL,
    reps INTEGER NOT NULL,
    one_rm NUMERIC NOT NULL,
    date DATE NOT NULL DEFAULT CURRENT_DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Set up Row Level Security (RLS)
ALTER TABLE public.personal_records ENABLE ROW LEVEL SECURITY;

-- Create Policies
CREATE POLICY "Users can insert their own personal records."
    ON public.personal_records FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view their own personal records."
    ON public.personal_records FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own personal records."
    ON public.personal_records FOR UPDATE
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own personal records."
    ON public.personal_records FOR DELETE
    USING (auth.uid() = user_id);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_personal_records_user_id ON public.personal_records(user_id);
CREATE INDEX IF NOT EXISTS idx_personal_records_exercise_id ON public.personal_records(exercise_id);
