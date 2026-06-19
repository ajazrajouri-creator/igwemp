with open('d:/Downloads/Anti Gravity Projects/Edu Deptt Zone Peeri/igwemp/supabase/tests/database/00_test_seed.sql', 'a') as f:
    f.write("""
-- 7. Mock Data for Child-Table RLS Testing
INSERT INTO public.documents (id, tenant_id, title) VALUES 
('80000000-0000-4000-a000-000000000001', '00000000-0000-4000-a000-000000000001', 'SED Document'),
('80000000-0000-4000-a000-000000000002', '00000000-0000-4000-a000-000000000002', 'Health Document')
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.document_versions (id, document_id, version_number, storage_path) VALUES 
('90000000-0000-4000-a000-000000000001', '80000000-0000-4000-a000-000000000001', 1, 'path/sed'),
('90000000-0000-4000-a000-000000000002', '80000000-0000-4000-a000-000000000002', 1, 'path/health')
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.workflow_definitions (id, tenant_id, code, name, category) VALUES 
('a0000000-0000-4000-a000-000000000001', '00000000-0000-4000-a000-000000000001', 'SED_WF', 'SED Workflow', 'HR'),
('a0000000-0000-4000-a000-000000000002', '00000000-0000-4000-a000-000000000002', 'HEALTH_WF', 'Health Workflow', 'HR')
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.workflow_versions (id, workflow_id, version_number, status) VALUES 
('b0000000-0000-4000-a000-000000000001', 'a0000000-0000-4000-a000-000000000001', 1, 'PUBLISHED'),
('b0000000-0000-4000-a000-000000000002', 'a0000000-0000-4000-a000-000000000002', 1, 'PUBLISHED')
ON CONFLICT (id) DO NOTHING;
""")
