FROM python:3.11-slim

# Install system dependencies and build tools for pyaudio
RUN apt-get update && apt-get install -y \
    portaudio19-dev \
    libportaudio2 \
    build-essential \
    ffmpeg && \
    apt-get clean && rm -rf /var/lib/apt/lists/*

# Create working directory
WORKDIR /app

# Copy backend files
COPY . .

# Create and activate virtual environment
RUN python -m venv /opt/venv
ENV PATH="/opt/venv/bin:$PATH"

# Install dependencies in the venv
RUN pip install --upgrade pip && pip install -r requirements.txt

# Expose port
EXPOSE 8000

# Start the FastAPI app using the venv's Python
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
