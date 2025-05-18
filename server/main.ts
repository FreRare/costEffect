import {start} from './main.server';

const main = async () => {
  start().catch(console.dir);
}

main().catch(console.error);
