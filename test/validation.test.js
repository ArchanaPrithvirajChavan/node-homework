const { taskSchema, patchTaskSchema } = require("../validation/taskSchema");
const { userSchema } = require("../validation/userSchema");

describe("user object validation tests", () => {

  it("1. doesn't permit a trivial password", () => {
    const { error } = userSchema.validate(
      { name: "Bobi", email: "bobi@sample.com", password: "Password" },
      { abortEarly: false }
    );

    expect(error.details.some(d => d.path.includes("password"))).toBe(true);
  });

  it("2. user schema requires that an email be specified", () => {
    const { error } = userSchema.validate(
      { name: "Bob", password: "#SStrongPassword123" },
      { abortEarly: false }
    );

    expect(error.details.some(d => d.path.includes("email"))).toBe(true);
  });

  it("3. should not accept invalid email", () => {
    const { error } = userSchema.validate(
      { name: "Bob", email: "bob.com", password: "#SStrongPassword123" },
      { abortEarly: false }
    );

    expect(error.details.some(d => d.path.includes("email"))).toBe(true);
  });

  it("4. user schema requires password", () => {
    const { error } = userSchema.validate(
      { name: "Bob", email: "bob@sample.com" },
      { abortEarly: false }
    );

    expect(error.details.some(d => d.path.includes("password"))).toBe(true);
  });

  it("5. user schema requires name", () => {
    const { error } = userSchema.validate(
      { email: "bob@sample.com", password: "#SStrongPassword123" },
      { abortEarly: false }
    );

    expect(error.details.some(d => d.path.includes("name"))).toBe(true);
  });

  it("6. name should be between 3 and 30 characters", () => {
  const { error } = userSchema.validate(
    {
      name: "a",
      password: "Simee24#Lime",
      email: "bob@sample.com",
    },
    { abortEarly: false }
  );

  expect(error.details.some(d => d.path[0] === "name")).toBe(true);
});

  it("7. should pass validation for a valid user object", () => {
    const { error } = userSchema.validate(
      {
        name: "Bob33",
        email: "bob33@gmail.com",
        password: "#SStrongPassword123",
      },
      { abortEarly: false }
    );

    expect(error).toBeFalsy();
  });

});
describe("task object validation test",()=>{
  it("8.taskSchema Should require title",()=>{
    const {error}=taskSchema.validate(
      {
      isCompleted: true,

       priority:"low",
      },
      {abortEarly:false}
    );
    expect(
      error.details.find(d => d.path.includes("title"))
    ).toBeDefined();
  });
   it("9.isCompleted value it must be valid.",()=>{
    const {error}=taskSchema.validate(
      {
        title:"create task",
      isCompleted: "invalid-value",
       priority:"low",
      },
      {abortEarly:false}
    );
    expect(
      error.details.find(d => d.path.includes("isCompleted"))
    ).toBeDefined();
  });
  it("10a. should not throw error when isCompleted is missing", () => {
  const { error } = taskSchema.validate(
    { title: "create task", priority: "high" },
    { abortEarly: false }
  );

  expect(error).toBeUndefined();
});
it("10b. should set default isCompleted to false", () => {
  const { value } = taskSchema.validate(
    { title: "create task", priority: "high" },
    { abortEarly: false }
  );

  expect(value.isCompleted).toBe(false);
});
     it("11a. should not throw error when isCompleted is true", () => {
  const { error } = taskSchema.validate(
    { title: "create task", isCompleted: true, priority: "high" },
    { abortEarly: false }
  );

  expect(error).toBeUndefined();
});
it("11b. should preserve isCompleted true value", () => {
  const { value } = taskSchema.validate(
    { title: "create task", isCompleted: true, priority: "high" },
    { abortEarly: false }
  );

  expect(value.isCompleted).toBe(true);
});

})
describe("patchTaskSchema validation tests", () => {

it("12. should allow object without title field", () => {
    const { error } = patchTaskSchema.validate(
      {
        isCompleted: true,
        priority: "low",
      },
      { abortEarly: false }
    );

    expect(error).toBeUndefined();
  });

  it("13a. should not throw error for valid patch task", () => {
  const { error } = patchTaskSchema.validate(
    { title: "create task", priority: "high" },
    { abortEarly: false }
  );

  expect(error).toBeUndefined();
});
it("13b. isCompleted should remain undefined if not provided", () => {
  const { value } = patchTaskSchema.validate(
    { title: "create task", priority: "high" },
    { abortEarly: false }
  );

  expect(value.isCompleted).toBeUndefined();
});
});
