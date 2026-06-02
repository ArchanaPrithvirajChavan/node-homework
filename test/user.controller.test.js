require("dotenv").config();
process.env.DATABASE_URL = process.env.TEST_DATABASE_URL;

const prisma = require("../../db/prisma");
const httpMocks = require("node-mocks-http");
const EventEmitter = require("events");
const cookie = require("cookie");
const jwt = require("jsonwebtoken");

const waitForRouteHandlerCompletion = require("./waitForRouteHandlerCompletion");

const {
  register,
  logon,
  logoff,
} = require("../controllers/userController");

const jwtMiddleware = require("../middleware/jwtMiddleware");

// globals
let saveRes = null;
let saveData = null;
let jwtCookie = null;
let lastReq = null;

function MockResponseWithCookies() {
  const res = httpMocks.createResponse({
    eventEmitter: EventEmitter,
  });

  res.cookie = (name, value, options = {}) => {
    const serialized = cookie.serialize(name, String(value), options);

    let currentHeader = res.getHeader("Set-Cookie");
    if (!currentHeader) currentHeader = [];

    currentHeader.push(serialized);
    res.setHeader("Set-Cookie", currentHeader);
  };

  return res;
}
beforeAll(async () => {
  await prisma.Task.deleteMany();
  await prisma.User.deleteMany();
});

afterAll(async () => {
  await prisma.$disconnect();
});
describe("testing logon, register, and logoff", () => {

  it("33.A user can be registered", async () => {
    const req = httpMocks.createRequest({
      method: "POST",
      body: {
        name: "Bob",
        email: "bob@sample.com",
        password: "Pa$$word20",
      },
    });

    saveRes = MockResponseWithCookies();

    await waitForRouteHandlerCompletion(register, req, saveRes);

    expect(saveRes.statusCode).toBe(201);
  });

  it("34. The user can logon", async () => {
    const req = httpMocks.createRequest({
      method: "POST",
      body: {
        email: "bob@sample.com",
        password: "Pa$$word20",
      },
    });

    saveRes = MockResponseWithCookies();

    await waitForRouteHandlerCompletion(logon, req, saveRes);

    expect(saveRes.statusCode).toBe(200);
  });

  it("35. Cookie contains jwt=", () => {
    const setCookieArray = saveRes.get("Set-Cookie");
    jwtCookie = setCookieArray.find(str => str.startsWith("jwt="));

    expect(jwtCookie).toBeDefined();
  });

  it("36. Cookie contains HttpOnly", () => {
    const setCookieArray = saveRes.get("Set-Cookie");
    jwtCookie = setCookieArray.find(str => str.startsWith("jwt="));

    expect(jwtCookie).toContain("HttpOnly");
  });

  it("37. Register returns correct name", () => {
    saveData = saveRes._getJSONData();
    expect(saveData.name).toBe("Bob");
  });

  it("38. Response contains csrfToken", () => {
    saveData = saveRes._getJSONData();
    expect(saveData.csrfToken).toBeDefined();
  });

  it("39. User can logoff", async () => {
    const req = httpMocks.createRequest({
      method: "POST",
    });

    saveRes = MockResponseWithCookies();

    await waitForRouteHandlerCompletion(logoff, req, saveRes);

    expect(saveRes.statusCode).toBe(200);
  });

  it("40. Logoff clears cookie", () => {
    const setCookieArray = saveRes.get("Set-Cookie");
    jwtCookie = setCookieArray.find(str => str.startsWith("jwt="));

    expect(jwtCookie).toContain("Jan 1970");
  });

  it("41. Bad password returns 401", async () => {
    const req = httpMocks.createRequest({
      method: "POST",
      body: {
        email: "bob@sample.com",
        password: "wrongpassword",
      },
    });

    saveRes = MockResponseWithCookies();

    await waitForRouteHandlerCompletion(logon, req, saveRes);

    expect(saveRes.statusCode).toBe(401);
  });

  it("42. Duplicate email registration fails", async () => {
    const req = httpMocks.createRequest({
      method: "POST",
      body: {
        name: "Bob",
        email: "bob@sample.com",
        password: "Pa$$word20",
      },
    });

    saveRes = MockResponseWithCookies();

    try {
      await waitForRouteHandlerCompletion(register, req, saveRes);
    } catch (e) {
      expect(e.name).toBe("PrismaClientKnownRequestError");
    }
  });
});
describe("Testing JWT middleware", () => {

  it("61. Returns 401 if JWT not present", async () => {
    const req = httpMocks.createRequest({
      method: "POST",
    });

    saveRes = MockResponseWithCookies();

    await waitForRouteHandlerCompletion(jwtMiddleware, req, saveRes);

    expect(saveRes.statusCode).toBe(401);
  });

  it("62. Returns 401 if JWT is invalid", async () => {
    const req = httpMocks.createRequest({
      method: "POST",
    });

    saveRes = MockResponseWithCookies();

    const badJwt = jwt.sign(
      { id: 5, csrfToken: "badToken" },
      "badSecret",
      { expiresIn: "1h" }
    );

    req.cookies = { jwt: badJwt };

    await waitForRouteHandlerCompletion(jwtMiddleware, req, saveRes);

    expect(saveRes.statusCode).toBe(401);
  });

  it("63. Returns 401 if CSRF token doesn't match", async () => {
    const req = httpMocks.createRequest({
      method: "POST",
    });

    saveRes = MockResponseWithCookies();

    const goodJwt = jwt.sign(
      { id: 5, csrfToken: "badToken" },
      process.env.JWT_SECRET,
      { expiresIn: "1h" }
    );

    req.cookies = { jwt: goodJwt };

    req.headers = {
      "X-CSRF-TOKEN": "goodtoken",
    };

    await waitForRouteHandlerCompletion(jwtMiddleware, req, saveRes);

    expect(saveRes.statusCode).toBe(401);
  });

  it("64. Calls next() if token and csrf are valid", async () => {
    const req = httpMocks.createRequest({
      method: "POST",
    });

    saveRes = MockResponseWithCookies();

    const goodToken = jwt.sign(
      { id: 5, csrfToken: "goodtoken" },
      process.env.JWT_SECRET,
      { expiresIn: "1h" }
    );

    req.cookies = { jwt: goodToken };

    req.headers = {
      "X-CSRF-TOKEN": "goodtoken",
    };

    const next = await waitForRouteHandlerCompletion(jwtMiddleware, req, saveRes);

    expect(next).toHaveBeenCalled();

    lastReq = req; // save for test 65
  });

  it("65. req.user.id is set correctly", () => {
    expect(lastReq.user.id).toBe(5);
  });

});