
# RADOS AGI OS Docker Configuration
# © 2025 Ervin Remus Radosavlevici - All Rights Reserved

FROM python:3.11-slim

WORKDIR /app

# Copy project files
COPY . .

# Expose port
EXPOSE 8080

# Run the application
CMD ["python", "-m", "http.server", "8080"]

# Owner: Ervin Remus Radosavlevici
# Email: radosavlevici210@gmail.com
# Repository: https://replit.com/@radosavlevici21/replitagios
