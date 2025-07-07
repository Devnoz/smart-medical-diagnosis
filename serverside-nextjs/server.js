import next from 'next';
import DiseaseService from './services/DiseaseService';

const dev = process.env.NODE_ENV !== 'production';
const app = next({ dev });
const handle = app.getRequestHandler();

app.prepare()
  .then(() => {
    const server = new DiseaseService();

    server.get('/api/diseases', (req, res) => {
      server.getDiseases().then((diseases) => {
        res.json(diseases);
      });
    });

    server.post('/api/diagnose', (req, res) => {
      server.diagnoseDisease(req.body.symptoms).then((diseases) => {
        res.json(diseases);
      });
    });

    server.get('*', (req, res) => {
      return handle(req, res);
    });

    server.listen(3000, (err) => {
      if (err) throw err;
      console.log('> Ready on http://localhost:3000');
    });
  });