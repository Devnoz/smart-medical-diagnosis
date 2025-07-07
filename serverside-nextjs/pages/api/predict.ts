import type { NextApiRequest, NextApiResponse } from 'next';
import { uploadFile } from '../../utils/uploadFile';
import { analyzeImage } from '../../utils/analyzeImage';

const predict = async (req: NextApiRequest, res: NextApiResponse) => {
  if (req.method === 'POST') {
    try {
      const file = await uploadFile(req, res);
      const analysis = await analyzeImage(file);
      res.status(200).json({ analysis });
    } catch (error) {
      res.status(500).json({ error: 'Image analysis failed.' });
    }
  } else {
    res.status(405).json({ error: 'Method not allowed' });
  }
};

export default predict;
