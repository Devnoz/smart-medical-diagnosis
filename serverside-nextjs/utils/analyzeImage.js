import * as tf from '@tensorflow/tfjs';

const model = await tf.loadLayersModel('https://storage.googleapis.com/tfjs-models/tfjs/mobilenet_v1_1.0_224/model.json');

export const analyzeImage = async (file) => {
  const img = await tf.browser.fromPixels(file);
  const resizedImg = tf.image.resizeBilinear(img, [224, 224]);
  const batchedImg = resizedImg.expandDims(0);
  const predictions = await model.predict(batchedImg);
  const results = await predictions.data();
  return results;
};