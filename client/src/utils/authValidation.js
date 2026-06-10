export const validateStudentLogin = (
  prn,
  email,
  password
) => {
  if (!prn) {
    return {
      success: false,
      message: "PRN is required",
    };
  }

  const expectedEmail =
    `${prn}@walchandsangli.ac.in`;

  if (
    email.trim().toLowerCase() !==
    expectedEmail.toLowerCase()
  ) {
    return {
      success: false,
      message:
        "Email must match PRN and use college domain",
    };
  }

  const last4 = prn.slice(-4);

  const expectedPassword = `Wce@${last4}`;

  if (password !== expectedPassword) {
    return {
      success: false,
      message: "Invalid Password",
    };
  }

  return {
    success: true,
  };
};

export const validateCoordinatorLogin = (
  email,
  password
) => {
  return (
    email ===
      "coordinator@walchandsangli.ac.in" &&
    password === "admin123"
  );
};