"C:\Program Files\Git\cmd\git.exe" add .
"C:\Program Files\Git\cmd\git.exe" commit -m "fix(build): resolve all TS strict unused variables and import paths"

echo "Switching to main branch to push to Vercel..."
"C:\Program Files\Git\cmd\git.exe" checkout main

echo "Merging fixes..."
"C:\Program Files\Git\cmd\git.exe" merge s6-2-ci-validation

echo "Pushing main to GitHub to trigger Vercel..."
"C:\Program Files\Git\cmd\git.exe" push origin main

echo "Switching back to working branch..."
"C:\Program Files\Git\cmd\git.exe" checkout s6-2-ci-validation

pause
