import { startServer } from './server.js';

const server = await startServer({ port: Number(process.env.PORT || 3001) });
console.log(`Play Store Miner API ready on ${server.url}`);
for (const signal of ['SIGINT', 'SIGTERM']) process.on(signal, async () => {
  await server.close();
  process.exit(0);
});
