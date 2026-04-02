# Node.js Fundamentals

## What is Node.js?
Answer- Node is a runtine environment that allows you to run JavaScript outside the browser, typically on the server.
   Built on V8 engine.
   Used event-driven, non-blocking I/O
   Great for handling many requests efficiently

## How does Node.js differ from running JavaScript in the browser?
Answer-  
Enivironment - Browser JavaScript runs on  browsre.
               Node Js runs outside the browser.
API's         - DOM , Windows, Fetch  
               avialable to Browser.
               File systems, Os process avialable to NodeJs
Use Case       Browser JS Use to 
               develope frontend, UI
               NodeJs use to develope Backend , API's, Server


## What is the V8 engine, and how does Node use it?
Answer V* is Google's JavaScript engine use in chrome.
  Converts JavaDcript into machine code.
  Makes execution very fast.

## What are some key use cases for Node.js?
Answer Node.js is best for fast, scalable, real- time applications.
   *Web Server and API's(Express.js)
   *Real-time apps(chat apps, live    notifications)
   *Data-intensive apps.

## Explain the difference between CommonJS and ES Modules. Give a code example of each.


**CommonJS (default in Node.js):**
`maths.js``js
Default in older Node.js
Uses require and mdule.exports
Synchronous
  Function add(a,b){
    return a+b;
  }
  module.exports=add;
  //app.js
  const add=require(`./math`);
  console.log(add(2,3));
```

**ES Modules (supported in modern Node.js):**
   Uses import and export 
   Asynchronous
```js
// Answer here..
//math.js
     export function add(a,b){
        return a+b;
     }
     //app.js
     import {add}from './math.js;
     console.log(add(2,3));
     

``` 