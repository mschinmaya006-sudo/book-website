
import { useEffect, useState } from "react";

const API_BASE = (
  import.meta.env.VITE_API_URL || "http://localhost:5000/api"
).replace(/\/+$/, "");

export default function AuthModal({ mode, onClose, onSuccess }) {
  const [formMode, setFormMode] = useState(mode);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setFormMode(mode);
    setError("");
  }, [mode]);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");
    setLoading(true);

    try {
      const endpoint =
        formMode === "signup"
          ? `${API_BASE}/auth/register`
          : `${API_BASE}/auth/login`;

      const payload =
        formMode === "signup"
          ? { name: name.trim(), email: email.trim(), password }
          : { email: email.trim(), password };

      const response = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Something went wrong.");
      }

      sessionStorage.setItem("folie-token", data.token);
      onSuccess(data.user);
    } catch (err) {
      setError(
        err.message === "Failed to fetch"
          ? "Cannot connect to FOLIÉ server. Please check whether the backend is running."
          : err.message
      );
    } finally {
      setLoading(false);
    }
  };

  const inputStyle = {
    width: "100%",
    padding: "13px",
    marginTop: "7px",
    marginBottom: "16px",
    border: "1px solid #d8c6ad",
    borderRadius: "5px",
    boxSizing: "border-box",
    fontSize: "15px",
    background: "#fffaf5",
    color: "#3d2929"
  };

  const buttonStyle = {
    width: "100%",
    padding: "14px",
    background: "#713b43",
    color: "white",
    border: "none",
    borderRadius: "5px",
    cursor: loading ? "wait" : "pointer",
    fontSize: "16px",
    marginTop: "8px"
  };

  return (
    <div
      onClick={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(15, 10, 15, 0.75)",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        padding: "20px",
        zIndex: 9999
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: "420px",
          background: "#f8f5f0",
          padding: "35px",
          borderRadius: "10px",
          boxShadow: "0 15px 50px #0005",
          position: "relative",
          boxSizing: "border-box",
          fontFamily: "Georgia, serif"
        }}
      >
        <button
          type="button"
          onClick={onClose}
          style={{
            position: "absolute",
            top: "12px",
            right: "15px",
            border: "none",
            background: "transparent",
            fontSize: "25px",
            cursor: "pointer",
            color: "#713b43"
          }}
        >
          ×
        </button>

        <p style={{
          color: "#b18a54",
          letterSpacing: "3px",
          fontSize: "13px",
          textAlign: "center"
        }}>
          THE FOLIÉ
        </p>

        <h2 style={{
          textAlign: "center",
          color: "#713b43",
          marginBottom: "8px"
        }}>
          {formMode === "signup" ? "Create Your Account" : "Welcome Back"}
        </h2>

        <p style={{
          textAlign: "center",
          color: "#806e64",
          fontSize: "14px",
          marginBottom: "25px"
        }}>
          {formMode === "signup"
            ? "Begin your journey into a world of stories."
            : "Your next favourite story awaits."}
        </p>

        <form onSubmit={handleSubmit}>
          {formMode === "signup" && (
            <>
              <label style={{ color: "#3d2929" }}>Full Name</label>
              <input
                style={inputStyle}
                type="text"
                placeholder="Enter your name"
                value={name}
                onChange={(event) => setName(event.target.value)}
                minLength={2}
                maxLength={60}
                required
              />
            </>
          )}

          <label style={{ color: "#3d2929" }}>Email Address</label>
          <input
            style={inputStyle}
            type="email"
            placeholder="Enter your email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            required
          />

          <label style={{ color: "#3d2929" }}>Password</label>
          <input
            style={inputStyle}
            type="password"
            placeholder="Enter your password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            minLength={8}
            maxLength={72}
            required
          />

          {error && (
            <p style={{
              color: "#b3261e",
              background: "#fce8e6",
              padding: "10px",
              borderRadius: "5px",
              fontSize: "13px"
            }}>
              {error}
            </p>
          )}

          <button type="submit" disabled={loading} style={buttonStyle}>
            {loading
              ? "Please wait..."
              : formMode === "signup"
                ? "Create Account"
                : "Login"}
          </button>
        </form>

        <p style={{
          textAlign: "center",
          marginTop: "22px",
          color: "#806e64",
          fontSize: "14px"
        }}>
          {formMode === "signup"
            ? "Already have an account? "
            : "New to FOLIÉ? "}
          <button
            type="button"
            onClick={() => {
              setFormMode(formMode === "signup" ? "login" : "signup");
              setError("");
            }}
            style={{
              border: "none",
              background: "transparent",
              color: "#9b7045",
              fontWeight: "bold",
              cursor: "pointer"
            }}
          >
            {formMode === "signup" ? "Login" : "Sign Up"}
          </button>
        </p>
      </div>
    </div>
  );
}
