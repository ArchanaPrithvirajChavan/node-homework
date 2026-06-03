require("dotenv").config();

const request = require("supertest");
const prisma = require("../db/prisma");
const { app, server } = require("../app");

process.env.DATABASE_URL = process.env.TEST_DATABASE_URL;

let agent;

beforeAll(async () => {
  await prisma.Task.deleteMany();
  await prisma.User.deleteMany();

  agent = request.agent(app);
});

afterAll(async () => {
  await prisma.$disconnect();
  server.close();
});

describe("User Authentication Flow", () => {
  let saveRes;

  // ---------------- REGISTER ----------------
  it("creates a user (register)", async () => {
    const newUser = {
      name: "Bob",
      email: "bob@sample.com",
      password: "Pa$$word20",
    };

    saveRes = await agent
      .post("/api/users/register")
      .send(newUser);

    expect(saveRes.status).toBe(201);

  
    expect(saveRes.body.user).toBeDefined();
expect(saveRes.body.user.name).toBe("Bob");
  });

  // ---------------- LOGIN ----------------
  it("logs in successfully", async () => {
    const res = await agent
      .post("/api/users/logon")
      .send({
        email: "bob@sample.com",
        password: "Pa$$word20",
      });

    expect(res.status).toBe(200);
    expect(res.headers["set-cookie"]).toBeDefined();
  });

  // ---------------- COOKIE CHECK ----------------
  it("cookie contains jwt and HttpOnly", async () => {
    const res = await agent
      .post("/api/users/logon")
      .send({
        email: "bob@sample.com",
        password: "Pa$$word20",
      });

    const cookies = res.headers["set-cookie"];

    expect(cookies).toBeDefined();

    const jwtCookie = cookies.find(c => c.startsWith("jwt="));

    expect(jwtCookie).toBeDefined();
    expect(jwtCookie).toContain("HttpOnly");
  });
});