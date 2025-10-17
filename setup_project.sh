#!/bin/bash

# Define the base directory
BASE_DIR="src"

# Define all subdirectories
DIRS=(
  "$BASE_DIR/config"
  "$BASE_DIR/controllers"
  "$BASE_DIR/services"
  "$BASE_DIR/models"
  "$BASE_DIR/validators"
  "$BASE_DIR/routes"
  "$BASE_DIR/middleware"
  "$BASE_DIR/utils"
  "$BASE_DIR/types"
  "$BASE_DIR/views"
)

# Define all files to create
FILES=(
  "$BASE_DIR/config/database.ts"
  "$BASE_DIR/config/email.ts"

  "$BASE_DIR/controllers/admin.controller.ts"
  "$BASE_DIR/controllers/client.controller.ts"

  "$BASE_DIR/services/admin.service.ts"
  "$BASE_DIR/services/client.service.ts"
  "$BASE_DIR/services/email.service.ts"

  "$BASE_DIR/models/index.ts"
  "$BASE_DIR/models/admin.model.ts"
  "$BASE_DIR/models/client.model.ts"
  "$BASE_DIR/models/otp.model.ts"

  "$BASE_DIR/validators/admin.validator.ts"
  "$BASE_DIR/validators/client.validator.ts"

  "$BASE_DIR/routes/index.ts"
  "$BASE_DIR/routes/admin.routes.ts"
  "$BASE_DIR/routes/client.routes.ts"

  "$BASE_DIR/middleware/auth.middleware.ts"
  "$BASE_DIR/middleware/error.middleware.ts"

  "$BASE_DIR/utils/response.util.ts"
  "$BASE_DIR/utils/jwt.util.ts"
  "$BASE_DIR/utils/bcrypt.util.ts"

  "$BASE_DIR/types/index.ts"

  "$BASE_DIR/views/login.ejs"
  "$BASE_DIR/views/signup.ejs"
  "$BASE_DIR/views/admin-login.ejs"

  "$BASE_DIR/app.ts"
)

# Create directories if they don’t exist
echo "Creating folder structure..."
for dir in "${DIRS[@]}"; do
  mkdir -p "$dir"
done

# Create files if they don’t exist
echo "Creating files..."
for file in "${FILES[@]}"; do
  if [ ! -f "$file" ]; then
    touch "$file"
    echo "// $file" > "$file"  # optional: put file path as a header comment
  fi
done

echo "✅ Project structure created successfully!"
