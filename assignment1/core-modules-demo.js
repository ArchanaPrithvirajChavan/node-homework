const os = require('os');
const path = require('path');
const fs = require('fs');
const fspromises =require('fs/promises')


// OS module
const platform = os.platform()
console.log("Platform:", platform)
const cpuInfo = os.cpus()
console.log('CPU:',cpuInfo)
const memory=os.totalmem()
console.log("Total Memory:", memory)

// Path module
const sampleFilesDir = path.join(__dirname, 'sample-files');
if (!fs.existsSync(sampleFilesDir)) {
  fs.mkdirSync(sampleFilesDir, { recursive: true });
}
console.log('Joined path:',sampleFilesDir)
// fs.promises API

async function writeFiledemo(){
  const demoFilePath = path.join(sampleFilesDir, 'demo.txt');

  try {
  const fileHandle=await fspromises.open(demoFilePath ,'w') //file get created  
  await fileHandle.writeFile(" Hello from fs.promises!")
  const data = await fspromises.readFile(demoFilePath, "utf8");
  console.log("fs.promises read:",data)
  await fileHandle.close()

  }
  catch{
    console.error("file not found")
  }
}



// Streams for large file

async function largeFile() {
  const largeFilePath = path.join(sampleFilesDir, 'largefile.txt');

  return new Promise((resolve, reject) => {
    try {
      const writeStream = fs.createWriteStream(largeFilePath, {
        encoding: 'utf8',
        highWaterMark: 1024
      });

      for (let i = 1; i <= 100; i++) {
        const canContinue = writeStream.write(
          'Read chunk: This is a line in a large file...\n'
        );

        if (!canContinue) {
          writeStream.once('drain', () => {});
        }
      }

      writeStream.end();

      writeStream.on('finish', () => {
        console.log("Writing completed");

        const readStream = fs.createReadStream(largeFilePath, {
          encoding: 'utf8',
          highWaterMark: 2500
        });

        readStream.on('data', (chunk) => {
          console.log('Chunk size:', chunk.length, 'characters');
          console.log('Read chunk:', chunk.slice(0, 40));
        });

        readStream.on('end', () => {
          console.log("Finished reading large file with streams");
          resolve(); 
        });

        readStream.on('error', reject);
      });

      writeStream.on('error', reject);

    } catch (err) {
      reject(err);
    }
  });
}
async function main() {
  await writeFiledemo();
  await largeFile();
}

main().catch(console.error);