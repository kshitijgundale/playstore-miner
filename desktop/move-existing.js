import { homedir } from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { desktopPaths, moveDatabase } from './data.js';

if (process.platform !== 'darwin') throw new Error('Desktop data migration is supported on macOS only');
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const source = path.resolve(process.argv[2] || path.join(root, 'server', 'data', 'miner.sqlite'));
const userData = path.join(homedir(), 'Library', 'Application Support', 'Play Store Miner');
const { database } = desktopPaths(userData);
const counts = await moveDatabase(source, database);
console.log(`Moved research database to ${database}`);
console.log(`Verified ${counts.apps} apps, ${counts.discoveryRuns} discovery runs, ${counts.reviews} reviews, and ${counts.shortlisted} shortlisted apps.`);
