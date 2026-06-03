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
