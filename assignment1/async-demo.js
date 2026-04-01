

const fs = require('fs')
const fsPromises = require('fs/promises'); 
// const path = require('path');


// Write a sample file for demonstration

// 1. Callback style

    fs.readFile('./sample-files/sample.txt','utf8',(err,data)=>{
    if(err){
      console.error(err)
      return;
    }
    console.log("Callback read",data)
  })


  // Callback hell example (test and leave it in comments):


/*fs.readFile('./sample-files/sample.txt', 'utf8', (err, data) => {
  if (err) {
    console.error(err);
    return;
  }

  console.log("Callback read", data);

  fs.writeFile('./sample-files/sample.txt', data.toUpperCase(), (err) => {
    if (err) {
      console.error(err);
      return;
    }

    console.log("File written in UPPERCASE");

    fs.writeFile('./sample-files/sample.txt', data.toLowerCase(), (err) => {
      if (err) {
        console.error(err);
        return;
      }

      console.log("File written in lowercase");

      fs.readFile('./sample-files/sample.txt', 'utf8', (err, data3) => {
        if (err) {
          console.error(err);
          return;
        }

        console.log("Final read:", data3);
      });
    });
  });
});*/
  // 2. Promise style
     fsPromises.readFile('./sample-files/sample.txt','utf8')
       .then((data) => {
      console.log("promise read:",data)
     })
     .catch((err)=>{
      console.error("Error:",err)
     })




      // 3. Async/Await style
      async function getData(){
        try{
        const data = await fsPromises.readFile('./sample-files/sample.txt','utf8');

        console.log('Async/await:',data)
        }
        catch(err){
        console.error(err)
      }
    }
      getData();
