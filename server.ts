import { createServer } from 'http';
import { parse } from 'url';
import next from 'next';
import { attachSocketIO } from './lib/socket/io';
import 'dotenv/config';

const dev = process.env.NODE_ENV !== 'production';
const hostname = '0.0.0.0';
const port = parseInt(process.env.PORT ?? '3000', 10);

const app = next({ dev, hostname, port });
const handle = app.getRequestHandler();

app.prepare().then(() => {
  const httpServer = createServer((req, res) => {
    handle(req, res, parse(req.url!, true));
  });

  attachSocketIO(httpServer);

  httpServer.listen(port, hostname, () => {
    console.log('🚀 Server draait op port ' + port);
  });
});