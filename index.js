import readline from 'readline'
import path from 'path'
import os from 'os'
import fs from 'fs'
import crypto from 'crypto'
import zlib from 'zlib'

let username = 'some_user'
const args = process.argv.slice(2);

if(args[0] && args[0].startsWith('--username=')){
    username = args[0].split('=').at(-1)
}

console.log(`Welcome to the File Manager, ${username}!`);

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

let currentDir = os.homedir();
console.log(`You are currently in ${currentDir}`);



rl.on('line', async (input) => {

  if (input === '.exit') {
    console.log(`Thank you for using File Manager, ${username}, goodbye!`);
    rl.close();
  } else {
    const [command, ...args] = input.trim().split(' ');
    switch (command) {
      case 'up':
        if (args.length !== 0) {
          console.log('Invalid input');
          break;
        }
        
        try {
          const targetDir = path.join(currentDir, '..');
          const stats = fs.statSync(targetDir);
          if (!stats.isDirectory()) {
            console.log('Operation failed');
            break;
          }
          if (path.resolve(targetDir) === path.parse(targetDir).root) {
            console.log('Cannot go above root directory');
            break;
          }
          currentDir = targetDir;
          console.log(`You are currently in ${currentDir}`);
        } catch (err) {
          console.log('Operation failed');
        }
        break;
      case 'cd':
        if (args.length !== 1) {
          console.log('Invalid input');
          break;
        }
        if(args[0] == '..' || !args[0].includes(':\\')){
          const targetDir = path.join(currentDir, args[0]);
          try {
            const stats = fs.statSync(targetDir);
            if (!stats.isDirectory()) {
              console.log('Operation failed');
              break;
            }
            if (path.resolve(targetDir) === path.parse(targetDir).root) {
              console.log('Cannot go above root directory');
              break;
            }
            currentDir = targetDir;
            console.log(`You are currently in ${currentDir}`);
          } catch (err) {
            console.log('Operation failed');
          }
          break;
        }else{
          const targetDir = path.resolve(args[0]);
        try {
          const stats = fs.statSync(targetDir);
          if (!stats.isDirectory()) {
            console.log('Operation failed');
            break;
          }
          if (path.resolve(targetDir) === path.parse(targetDir).root) {
            console.log('Cannot go above root directory');
            break;
          }
          
          currentDir = targetDir;
          console.log(`You are currently in ${currentDir}`);
        } catch (err) {
          console.log('Operation failed');
        }
        break;
        }
        
      case 'ls':
        if (args.length !== 0) {
          console.log('Invalid input');
          break;
        }
        try {
          const files = fs.readdirSync(currentDir);
          const fileData = files.map( (file) => {
            const filePath = path.join(currentDir, file);
            const stats = fs.statSync(filePath);
            return {
              name: file,
              type: stats.isDirectory() ? 'directory' : 'file',
              extension: stats.isDirectory() ? '' : path.extname(file)
            };
          });
          const sortedData = fileData.sort((a, b) => {
            if (a.type === b.type) {
              return a.name.localeCompare(b.name);
            } else {
              return a.type === 'directory' ? -1 : 1;
            }
          });
          const output = sortedData.map((item) => {
            const type = item.type === 'directory' ? 'DIR' : 'FILE';
            return `${type.padEnd(4)} ${item.name}${item.extension}`;
          }).join('\n');
          console.log(output);
        } catch (err) {
          console.log('Operation failed');
        }
        break;
      case 'mkdir':
        if (args.length !== 1) {
          console.log('Invalid input');
          break;
        }
        const newDir = path.join(currentDir, args[0]);
        try {
          fs.mkdirSync(newDir);
          console.log(`Created directory ${newDir}`);
        } catch (err) {
          console.log('Operation failed');
        }
        break;
      case 'cat':
        if (args.length !== 1) {
          console.log('Invalid input');
          break;
        }
        const fileContent = fs.createReadStream(args[0]);
        fileContent.on('data', (data) => {
          console.log(data.toString());
        });
        fileContent.on('error', (err) => {
          console.log('Operation failed');
        });
        break;
      case 'add':
        if (args.length !== 1) {
          console.log('Invalid input');
          break;
        }
        console.log(currentDir, args[0]);
        const newFile = path.join(currentDir, args[0]);
        rl.question('Enter file content: ', (content) => {
          fs.writeFile(newFile, content, (err) => {
          if (err) {
          console.log('Operation failed');
          } else {
          console.log(`Created file ${newFile}`);
          }
          });
          });
          break;
      case 'rm':
        if (args.length !== 1) {
            console.log('Invalid input');
            break;
        }
          const targetFile = path.join(currentDir, args[0]);
        try {
          const stats = fs.statSync(targetFile);
          if (stats.isDirectory()) {
          console.log('Operation failed: cannot remove a directory using "rm" command. Use "rmdir" instead.');
          break;
          }
          fs.unlinkSync(targetFile);
          console.log(`Removed file ${targetFile}`);
        } catch (err) {
          console.log('Operation failed');
        }
        break;
      case 'rmdir':
        if (args.length !== 1) {
          console.log('Invalid input');
          break;
        }
          const targetDirectory = path.join(currentDir, args[0]);
        try {
          const stats = fs.statSync(targetDirectory);
          if (!stats.isDirectory()) {
            console.log('Operation failed: specified path is not a directory');
            break;
          }
          fs.rmdirSync(targetDirectory);
          console.log(`Removed directory ${targetDirectory}`);
        } catch (err) {
          console.log('Operation failed');
        }
          break;
      case 'rn':
        if (args.length !== 2) {
          console.log('Invalid input');
          break;
        }else{
          const sourceFile = path.join(currentDir, args[0]);
          const newFilename = args[1];
          try {
            fs.renameSync(sourceFile, path.join(currentDir, newFilename));
            console.log(`Renamed file ${args[0]} to ${newFilename}`);
          } catch (err) {
            console.log('Operation failed');
          }
          break;
        }
        
      case 'mv':
        if (args.length !== 2) {
          console.log('Invalid input');
          break;
        }
        const sourceFile = path.join(currentDir, args[0]);
        const targetDir = path.join(currentDir, args[1]);
        try {
          const stats = fs.statSync(sourceFile);
          if (!stats.isFile()) {
            console.log('Operation failed: source is not a file');
            break;
          }
          const fileName = path.basename(sourceFile);
          const targetFile = path.join(targetDir, fileName);
          fs.access(targetDir, (err) => {
            if (err) {
              console.log('Operation failed: target directory does not exist');
              return;
            }
            const readable = fs.createReadStream(sourceFile);
            const writable = fs.createWriteStream(targetFile);
            readable.pipe(writable);
            writable.on('finish', async () => {
              fs.unlinkSync(sourceFile);
              console.log(`Moved ${fileName} to ${targetDir}`);
            });
          });
        } catch (err) {
          console.log('Operation failed');
        }
        break;
      

      case 'os':
        if (args.length !== 1) {
          console.log('Invalid input');
          break;
        }
        switch (args[0]) {

          case '--EOL':
            const eol = os.EOL;
            console.log(`Default End-Of-Line (EOL) character: "${JSON.stringify(eol)}"`);
            break;

          case '--CPUS':
            const cpus = os.cpus();
            console.log(`Overal amount of CPU: ${cpus.length}, model: ${cpus[0].model}, clock rate: ${Number(cpus[0].speed)/1000}GHz`);
            break;

          case '--homedir':
            const homedir = os.homedir();
            console.log(`${homedir}`);
            break; 

          case '--username':
            const username = os.userInfo().username;
            console.log(`system username: ${username}`);
            break;
            
            case '--architecture':
              const architecture = os.arch();
              console.log(`architecture: ${architecture}`);
              break; 
          default:
            console.log('Invalid input');
            break;
        }
      break;
        
      case 'hash':
        if (args.length !== 1) {
          console.log('Invalid input');
          break;
        }
        const filePath = path.join(currentDir, args[0]);
        try {
          const fileData = fs.readFileSync(filePath);
          const hash = crypto.createHash('sha256').update(fileData).digest('hex');
          console.log(`Hash of file "${args[0]}": ${hash}`);
        } catch (err) {
          console.log('Operation failed');
        }
      break;

      case 'compress':
        if (args.length !== 2) {
          console.log('Invalid input');
          break;
        }
        const sourcePath = path.join(currentDir, args[0]);
        const destinationPath = path.join(currentDir, args[1]);
        const readStream = fs.createReadStream(sourcePath);
        const writeStream = fs.createWriteStream(destinationPath);
        const compressStream = zlib.createBrotliCompress();
        readStream.pipe(compressStream).pipe(writeStream);
        writeStream.on('finish', () => {
          console.log(`File "${args[0]}" compressed to "${args[1]}"`);
        });
      break;

      case 'decompress':
        if (args.length !== 2) {
          console.log('Invalid input');
          break;
        }
        const sourcePath2 = path.join(currentDir, args[0]);
        const destinationPath2 = path.join(currentDir, args[1]);
        const readStream2 = fs.createReadStream(sourcePath2);
        const writeStream2 = fs.createWriteStream(destinationPath2);
        const decompressStream = zlib.createBrotliDecompress();
        readStream2.pipe(decompressStream).pipe(writeStream2);
        writeStream2.on('finish', () => {
          console.log(`File "${args[0]}" decompressed to "${args[1]}"`);
        });
      break;
        
      default:
        console.log('Invalid input');
        break;
    }
    console.log(`You are currently in ${currentDir}`);
  }
  

});


rl.on('SIGINT', () => {
  console.log(`Thank you for using File Manager, ${username}, goodbye!`);
  rl.close();
});

