import { useState } from "react";
import api from "../../api/axios";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const validateCollegeEmail = (email) => {
    return email.endsWith("@walchandsangli.ac.in");
  };

  const handleLogin = async (e) => {
    e.preventDefault();

    if (!validateCollegeEmail(email)) {
      alert(
        "Only Walchand College email IDs are allowed"
      );
      return;
    }

    try {
      const response = await api.post(
        "/auth/student/login",
        {
          email,
          password,
        }
      );

      localStorage.setItem(
        "token",
        response.data.token
      );

      alert("Login Successful");
    } catch (err) {
      alert("Invalid Credentials");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-100">
      <form
        onSubmit={handleLogin}
        className="bg-white p-8 rounded-lg shadow w-96"
      >
        <h2 className="text-2xl font-bold mb-6">
          Student Login
        </h2>

        <input
          type="email"
          placeholder="College Email"
          className="w-full border p-3 rounded mb-4"
          value={email}
          onChange={(e) =>
            setEmail(e.target.value)
          }
        />

        <input
          type="password"
          placeholder="Password"
          className="w-full border p-3 rounded mb-4"
          value={password}
          onChange={(e) =>
            setPassword(e.target.value)
          }
        />

        <button
          className="bg-blue-600 text-white w-full p-3 rounded"
        >
          Login
        </button>
      </form>
    </div>
  );
}