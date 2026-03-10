INSERT INTO storage.buckets (id, name, public) VALUES ('statements', 'statements', true) ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Public read access for statements" ON storage.objects FOR SELECT TO public USING (bucket_id = 'statements');

CREATE POLICY "Service role insert for statements" ON storage.objects FOR INSERT TO service_role WITH CHECK (bucket_id = 'statements');

CREATE POLICY "Service role delete for statements" ON storage.objects FOR DELETE TO service_role USING (bucket_id = 'statements');