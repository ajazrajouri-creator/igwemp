"C:\Program Files\Git\cmd\git.exe" add supabase/migrations/*
"C:\Program Files\Git\cmd\git.exe" add supabase/tests/database/*
"C:\Program Files\Git\cmd\git.exe" commit -m "fix: S6.2 RLS architecture hardening for child tables"
"C:\Program Files\Git\cmd\git.exe" push -u origin s6-2-ci-validation
