import { createInterface } from 'node:readline';
import { Writable } from 'node:stream';
import { pbkdf2Sync,randomBytes } from 'node:crypto';
const muted=new Writable({write(c,e,cb){cb();}});
const rl=createInterface({input:process.stdin,output:muted,terminal:true});
process.stdout.write('Enter password (hidden):\n');
rl.question('',password=>{const salt=randomBytes(16).toString('hex');const hash=pbkdf2Sync(password,salt,600000,32,'sha256').toString('hex');process.stdout.write(`pbkdf2$600000$${salt}$${hash}\n`);rl.close();});
