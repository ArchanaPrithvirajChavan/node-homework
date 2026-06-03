require('dotenv').config();
process.env.DATABASE_URL = process.env.TEST_DATABASE_URL;

const httpMocks = require('node-mocks-http');
const { register } = require('../controllers/userController');

async function run() {
  const req = httpMocks.createRequest({
    method: 'POST',
    body: { email: 'debug@sample.com', name: 'Debug', password: 'Pa$$word20' },
  });
  const res = httpMocks.createResponse();
  await register(req, res, (err) => {
    if (err) {
      console.error('REGISTER ERROR:', err);
    }
  });
  console.log('statusCode:', res.statusCode);
  try {
    console.log('body:', res._getJSONData());
  } catch (e) {
    console.log('no JSON body');
  }
  process.exit(0);
}

run();
