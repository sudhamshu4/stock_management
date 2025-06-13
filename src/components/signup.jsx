import { useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import Logo from "../assets/logo.png";

import "./signup.css";

const SignUp = () => {
  const [formData, setFormData] = useState({
    userid: "",
    username: "",
    password: "",
    repeatPassword: "",
    role: "Approver",
  });
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const handleChange = (e) =>
    setFormData({ ...formData, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (formData.password !== formData.repeatPassword)
      return setError("Passwords do not match!");

    try {
      await axios.post("http://localhost:5000/signup", formData);
      navigate("/"); // ✅ Redirects to Login after successful signup
    } catch (error) {
      setError(
        error.response?.data?.error || "Signup failed! Please try again."
      );
    }
  };

  return (
    <div className="signup-main">
      <div className="signup-left"></div>
      <div className="signup-right">
        <div className="signup-container">
          <div className="signup-logo">
            <img src={Logo} alt="Logo" />
          </div>

          <div className="signup-center">
            <h2>Create Account</h2>
            <p>Please fill the details to sign up</p>
            {error && <p className="error">{error}</p>}

            <form onSubmit={handleSubmit}>
              <input
                type="text"
                name="userid"
                placeholder="User ID"
                onChange={handleChange}
                required
              />
              <input
                type="text"
                name="username"
                placeholder="Username"
                onChange={handleChange}
                required
              />
              <input
                type="password"
                name="password"
                placeholder="Password"
                onChange={handleChange}
                required
              />
              <input
                type="password"
                name="repeatPassword"
                placeholder="Repeat Password"
                onChange={handleChange}
                required
              />

              <select
                name="role"
                onChange={handleChange}
                value={formData.role}
                className="signup-select"
              >
                <option value="Approver">Approver</option>
                <option value="Purchase">Purchase</option>
                <option value="Inventory">Inventory</option>
                <option value="Manager">Manager</option>
                <option value="Superadmin">Superadmin</option>
              </select>

              <button type="submit">Sign Up</button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SignUp;
