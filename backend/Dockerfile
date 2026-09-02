FROM python:3.11-slim

WORKDIR /app

# Install system build dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Install uv package manager
COPY --from=ghcr.io/astral-sh/uv:latest /uv /bin/uv

# Copy project files
COPY pyproject.toml .
COPY src/ src/
COPY data/ data/

# Install python dependencies and download prewarm models
RUN uv sync
RUN uv run python src/agent.py download-files

# Start 24/7 background agent worker
CMD ["uv", "run", "python", "src/agent.py", "start"]
