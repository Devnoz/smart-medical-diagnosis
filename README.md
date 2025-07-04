# AI Doctor

AI Doctor is a modern web application that uses AI to analyze uploaded skin images and user-recorded symptoms, providing instant medical insights and solutions. Built with Next.js (frontend) and FastAPI (backend), it features a clean, responsive UI, drag-and-drop image upload, and audio playback for both user and AI responses.

## Features
- Upload a skin image for instant AI diagnosis
- Record and play back your symptoms (voice)
- Receive AI-generated solutions and audio responses
- Modern, medical-themed, responsive UI
- Fast, private, and easy to use

## Tech Stack
- **Frontend:** Next.js, React, Tailwind CSS
- **Backend:** FastAPI, Python

## Getting Started

### Prerequisites
- Node.js (v18+ recommended)
- Python 3.8+
- [pnpm](https://pnpm.io/) (for frontend)

### Backend Setup
1. Navigate to the backend directory:
   ```sh
   cd ai-doctor-2.0-voice-and-vision
   ```
2. Install Python dependencies:
   ```sh
   pip install -r requirements.txt
   ```
3. Start the FastAPI server:
   ```sh
   uvicorn main:app --reload
   ```

### Frontend Setup
1. Navigate to the frontend directory:
   ```sh
   cd ai-doctor-2.0-voice-and-vision/frontend
   ```
2. Install dependencies:
   ```sh
   pnpm install
   ```
3. Start the Next.js development server:
   ```sh
   pnpm dev
   ```
4. Open [http://localhost:3000](http://localhost:3000) in your browser.

## Usage
1. Click **Start Diagnosis**.
2. Upload a clear image of the affected skin area.
3. (Optional) Record your symptoms using the voice recorder.
4. Click **Get Diagnosis** to receive instant AI results and solutions.
5. Listen to both your recorded audio and the AI's audio response.

## Disclaimer
This AI diagnosis is for informational purposes only and does not replace professional medical advice. Always consult a healthcare professional for serious or urgent concerns.

## License
MIT License

---

© 2025 AI Doctor. All rights reserved.

# Project Setup Guide

This guide provides step-by-step instructions to set up your project environment, including the installation of FFmpeg and PortAudio across macOS, Linux, and Windows, as well as setting up a Python virtual environment using Pipenv, pip, or conda.

## Table of Contents

1. [Installing FFmpeg and PortAudio](#installing-ffmpeg-and-portaudio)
   - [macOS](#macos)
   - [Linux](#linux)
   - [Windows](#windows)
2. [Setting Up a Python Virtual Environment](#setting-up-a-python-virtual-environment)
   - [Using Pipenv](#using-pipenv)
   - [Using pip and venv](#using-pip-and-venv)
   - [Using Conda](#using-conda)
3. [Running the application](#project-phases-and-python-commands)

## Installing FFmpeg and PortAudio

### macOS

1. **Install Homebrew** (if not already installed):

   ```bash
   /bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
   ```

2. **Install FFmpeg and PortAudio:**

   ```bash
   brew install ffmpeg portaudio
   ```


### Linux
For Debian-based distributions (e.g., Ubuntu):

1. **Update the package list**

```
sudo apt update
```

2. **Install FFmpeg and PortAudio:**
```
sudo apt install ffmpeg portaudio19-dev
```

### Windows

#### Download FFmpeg:
1. Visit the official FFmpeg download page: [FFmpeg Downloads](https://ffmpeg.org/download.html)
2. Navigate to the Windows builds section and download the latest static build.

#### Extract and Set Up FFmpeg:
1. Extract the downloaded ZIP file to a folder (e.g., `C:\ffmpeg`).
2. Add the `bin` directory to your system's PATH:
   - Search for "Environment Variables" in the Start menu.
   - Click on "Edit the system environment variables."
   - In the System Properties window, click on "Environment Variables."
   - Under "System variables," select the "Path" variable and click "Edit."
   - Click "New" and add the path to the `bin` directory (e.g., `C:\ffmpeg\bin`).
   - Click "OK" to apply the changes.

#### Install PortAudio:
1. Download the PortAudio binaries from the official website: [PortAudio Downloads](http://www.portaudio.com/download.html)
2. Follow the installation instructions provided on the website.

---

## Setting Up a Python Virtual Environment

### Using Pipenv
1. **Install Pipenv (if not already installed):**  
```
pip install pipenv
```

2. **Install Dependencies with Pipenv:** 

```
pipenv install
```

3. **Activate the Virtual Environment:** 

```
pipenv shell
```

---

### Using `pip` and `venv`
#### Create a Virtual Environment:
```
python -m venv venv
```

#### Activate the Virtual Environment:
**macOS/Linux:**
```
source venv/bin/activate
```

**Windows:**
```
venv\Scripts\activate
```

#### Install Dependencies:
```
pip install -r requirements.txt
```

---

### Using Conda
#### Create a Conda Environment:
```
conda create --name myenv python=3.11
```

#### Activate the Conda Environment:
```
conda activate myenv
```

#### Install Dependencies:
```
pip install -r requirements.txt
```


# Project Phases and Python Commands

## Phase 1: Brain of the doctor
```
python brain_of_the_doctor.py
```

## Phase 2: Voice of the patient
```
python voice_of_the_patient.py
```

## Phase 3: Voice of the doctor
```
python voice_of_the_doctor.py
```

## Phase 4: Setup Gradio UI
```
python gradio_app.py
```

