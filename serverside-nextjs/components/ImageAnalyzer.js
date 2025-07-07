import React from 'react';

const ImageAnalyzer = () => {
  const [image, setImage] = useState(null);
  const [analysis, setAnalysis] = useState(null);

  const handleAnalyze = async () => {
    const response = await fetch('/api/analyze', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ image }),
    });

    const data = await response.json();
    setAnalysis(data.analysis);
  };

  return (
    <div>
      <input type="file" onChange={(event) => setImage(event.target.files[0])} />
      <button onClick={handleAnalyze}>Analyze Image</button>
      {analysis && <p>Analysis: {analysis}</p>}
    </div>
  );
};

export default ImageAnalyzer;