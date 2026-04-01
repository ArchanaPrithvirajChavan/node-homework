const os = require('os');
const path = require('path');
const fs = require('fs');
const fspromises =require('fs/promises')


// OS module
const platform = os.platform()
console.log("platform:",platform)
const cpuInfo = os.cpus()
console.log('CPU:',cpuInfo)
const memory=os.totalmem()
console.log('Memory:',memory)

// Path module
const sampleFilesDir = path.join(__dirname, 'sample-files');
if (!fs.existsSync(sampleFilesDir)) {
  fs.mkdirSync(sampleFilesDir, { recursive: true });
}
console.log('Joined path:',sampleFilesDir)
// fs.promises API

async function writeFiledemo(){
  try {
  const fileHandle=await fspromises.open("./demo.txt" ,'w') //file get created  
  await fileHandle.writeFile(" Hello from fs.promises!")
  const data = await fspromises.readFile("./demo.txt", "utf8");
  console.log("fs.promises read:",data)
  await fileHandle.close()

  }
  catch{
    console.error("file not found")
  }
}
writeFiledemo()


// Streams for large files- log first 40 chars of each chunk

async function largeFile() {
  try {
    const writeStream = fs.createWriteStream('./sample-files/largefile.txt', {
      encoding: 'utf8',
      highWaterMark: 1024
    });

    // Write chunks using a loop
    for (let i = 1; i <= 100; i++) {
  const canContinue = writeStream.write('Read chunk: This is a line in a large file...\n');

  if (!canContinue) {
    await new Promise(resolve => writeStream.once('drain', resolve));
  }
}
    
    writeStream.end();
  
    writeStream.on('finish', () => {
      console.log("Writing completed");

      const readStream = fs.createReadStream('./sample-files/largefile.txt', {
        encoding: 'utf8',
        highWaterMark: 2500
      });

      readStream.on('data', (chunk) => {
  console.log('Chunk size:', chunk.length, 'characters');
  // Log first 40 characters of each chunk as an example
  console.log('First 40 chars:', chunk.slice(0, 40));
});
      

      readStream.on('end', () => {
        console.log("Finished reading large file with streams.");
      });
    });

  } catch (err) {
    console.error(err.message);
  }
}

largeFile();