#!/bin/bash
# Fix all Navbar imports
find . -name "*.tsx" -o -name "*.ts" | xargs sed -i "" "s|@/components/Navbar|@/components/layout/Navbar|g"
find . -name "*.tsx" -o -name "*.ts" | xargs sed -i "" "s|@/components/layout/Navbar|@/components/layout/Navbar|g"
echo "✅ All Navbar imports updated!"

