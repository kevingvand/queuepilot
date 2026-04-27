import { runCli } from './cli.js';
import { runMcpServer } from './server.js';

const isCli = process.argv.length > 2;
if (isCli) {
  runCli(process.argv.slice(2));
} else {
  runMcpServer();
}

