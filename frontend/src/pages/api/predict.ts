import type { NextApiRequest, NextApiResponse } from 'next';
import formidable from 'formidable';
import fs from 'fs';

// Disable Next.js default body parser for file uploads
export const config = {
  api: {
    bodyParser: false,
  },
};

const PYTHON_BACKEND_URL = 'http://localhost:8000/predict/'; // Update if your backend runs elsewhere

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  const form = new formidable.IncomingForm();
  form.parse(req, async (err, fields, files) => {
    if (err) {
      res.status(500).json({ error: 'Error parsing form data' });
      return;
    }
    let file = files.file as formidable.File | formidable.File[] | undefined;
    if (!file) {
      res.status(400).json({ error: 'No file uploaded' });
      return;
    }
    if (Array.isArray(file)) {
      file = file[0];
    }

    // Forward the file to your Python FastAPI backend
    const fetch = (await import('node-fetch')).default;
    const FormData = (await import('form-data')).default;
    const formData = new FormData();
    formData.append(
   'file',
   fs.createReadStream(file.filepath),
   file.originalFilename || 'upload.bin'
   );
    try {
      const response = await fetch(PYTHON_BACKEND_URL, {
        method: 'POST',
        body: formData,
      });
      const data = await response.json();
      res.status(200).json(data);
    } catch (e) {
      res.status(500).json({ error: 'Error calling backend', details: (e as Error).message });
    }
  });
}
