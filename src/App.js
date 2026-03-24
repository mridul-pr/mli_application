import { useState, useEffect } from "react";
import logo from "./images/MLI logo.jpeg";

// ─── Hardcoded Config ──────────────────────────────────────
const BRANCHES = [{ label: "Bangalore", city: "Bengaluru", code: "BLR" }];

// ── Utility: SHA-256 hash ──────────────────────────────────
async function sha256(message) {
  const msgBuffer = new TextEncoder().encode(message);
  const hashBuffer = await crypto.subtle.digest("SHA-256", msgBuffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
}

// ── Utility: generate a persistent UUID v4 device token ───
function generateDeviceToken() {
  const stored = localStorage.getItem("device_token");
  if (stored) return stored;
  const uuid = "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
  localStorage.setItem("device_token", uuid);
  return uuid;
}

// ── UI Components ─────────────────────────────────────────────────────────
const Logo = () => (
  <div style={{ position: "fixed", top: "12px", left: "12px", zIndex: 1000 }}>
    <img
      src={logo}
      alt="MLI"
      style={{
        height: "60px",
        width: "80px",
        borderRadius: "12px",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        objectFit: "cover",
      }}
    />
  </div>
);

const Watermark = ({ text }) => (
  <div
    style={{
      position: "fixed",
      bottom: "10px",
      left: "50%",
      transform: "translateX(-50%)",
      opacity: 0.3,
      fontSize: "11px",
      color: "#666",
      whiteSpace: "nowrap",
    }}
  >
    {text}
  </div>
);

const LoadingScreen = () => (
  <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
    <div className="text-center px-4">
      <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-indigo-600 mx-auto mb-4" />
      <h2 className="text-xl font-bold text-gray-800 mb-2">Loading...</h2>
      <p className="text-gray-600 text-sm">
        Please wait while we prepare your experience
      </p>
    </div>
  </div>
);

const LogoutButton = ({ onLogout }) => (
  <div style={{ position: "fixed", top: "12px", right: "12px", zIndex: 1000 }}>
    <button
      onClick={onLogout}
      className="bg-red-500 hover:bg-red-600 text-white px-3 py-2 rounded-lg transition duration-200 flex items-center gap-1 shadow-md text-sm"
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="14"
        height="14"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
        <polyline points="16 17 21 12 16 7" />
        <line x1="21" y1="12" x2="9" y2="12" />
      </svg>
      <span className="hidden sm:inline">Logout</span>
    </button>
  </div>
);

// ── Branch accent colors ────────────────────────────────────────────────────
const BRANCH_ACCENTS = [
  {
    bg: "from-orange-400 to-rose-500",
    light: "#fff7ed",
    border: "#fb923c",
    text: "#c2410c",
    icon: "#ea580c",
  },
  {
    bg: "from-cyan-500 to-blue-600",
    light: "#ecfeff",
    border: "#22d3ee",
    text: "#0e7490",
    icon: "#0891b2",
  },
  {
    bg: "from-emerald-400 to-teal-600",
    light: "#ecfdf5",
    border: "#34d399",
    text: "#065f46",
    icon: "#059669",
  },
  {
    bg: "from-violet-500 to-purple-700",
    light: "#f5f3ff",
    border: "#a78bfa",
    text: "#5b21b6",
    icon: "#7c3aed",
  },
];

// ── Branch Selection Screen ────────────────────────────────────────────────
const BranchSelectionScreen = ({ onSelectBranch }) => (
  <>
    <Logo />
    <style>{`
      @import url('https://fonts.googleapis.com/css2?family=Sora:wght@400;600;700;800&family=DM+Sans:wght@400;500&display=swap');
      .branch-card {
        font-family: 'Sora', sans-serif;
        cursor: pointer;
        border-radius: 20px;
        overflow: hidden;
        border: 2px solid transparent;
        background: white;
        box-shadow: 0 4px 20px rgba(0,0,0,0.07);
        transition: transform 0.22s cubic-bezier(.34,1.56,.64,1), box-shadow 0.22s ease, border-color 0.18s ease;
        position: relative;
      }
      @media (hover: hover) {
        .branch-card:hover { transform: translateY(-6px) scale(1.02); box-shadow: 0 16px 40px rgba(0,0,0,0.13); }
      }
      .branch-card .card-header { padding: 24px 20px 18px; display: flex; flex-direction: column; align-items: flex-start; gap: 12px; }
      .branch-card .card-footer { padding: 14px 20px; border-top: 1px solid rgba(0,0,0,0.06); display: flex; align-items: center; justify-content: space-between; font-size: 13px; font-weight: 600; letter-spacing: 0.02em; }
      .branch-icon-wrap { width: 48px; height: 48px; border-radius: 14px; display: flex; align-items: center; justify-content: center; }
      .branch-label { font-size: 20px; font-weight: 800; color: #1e1b4b; line-height: 1.2; }
      .branch-city { font-size: 12px; font-weight: 500; color: #6b7280; margin-top: 2px; font-family: 'DM Sans', sans-serif; }
      .code-badge { font-size: 11px; font-weight: 700; letter-spacing: 0.08em; padding: 3px 10px; border-radius: 999px; text-transform: uppercase; }
      .branch-screen-bg {
        min-height: 100vh;
        background: #f8f7ff;
        background-image: radial-gradient(ellipse at 10% 20%, rgba(99,102,241,0.08) 0%, transparent 60%), radial-gradient(ellipse at 90% 80%, rgba(251,113,133,0.07) 0%, transparent 60%);
        display: flex; flex-direction: column; align-items: center; justify-content: center;
        padding: 80px 16px 40px; font-family: 'Sora', sans-serif;
      }
      .branch-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 16px; width: 100%; max-width: 800px; }
      @media (max-width: 480px) { .branch-grid { grid-template-columns: 1fr; } }
      .screen-title { font-size: 28px; font-weight: 800; color: #1e1b4b; text-align: center; margin-bottom: 6px; }
      .screen-sub { font-size: 14px; color: #6b7280; text-align: center; margin-bottom: 32px; font-family: 'DM Sans', sans-serif; }
      @media (min-width: 640px) {
        .screen-title { font-size: 36px; }
        .screen-sub { font-size: 15px; }
        .branch-card .card-header { padding: 32px 28px 24px; gap: 14px; }
        .branch-card .card-footer { padding: 16px 28px; }
      }
      .arrow-circle { width: 28px; height: 28px; border-radius: 50%; display: flex; align-items: center; justify-content: center; }
      /* OTP input */
      .otp-input {
        width: 48px; height: 56px; text-align: center; font-size: 22px; font-weight: 700;
        border: 2px solid #d1d5db; border-radius: 10px; outline: none;
        transition: border-color 0.15s, box-shadow 0.15s; background: #fff; color: #1e1b4b;
      }
      .otp-input:focus { border-color: #6366f1; box-shadow: 0 0 0 3px rgba(99,102,241,0.15); }
      @media (max-width: 380px) { .otp-input { width: 38px; height: 48px; font-size: 18px; } }
    `}</style>
    <div className="branch-screen-bg">
      <p className="screen-title">Choose Your Branch</p>
      <p className="screen-sub">Select the branch you're signing into</p>
      <div className="branch-grid">
        {BRANCHES.map((branch, i) => {
          const accent = BRANCH_ACCENTS[i % BRANCH_ACCENTS.length];
          return (
            <div
              key={branch.code}
              className="branch-card"
              style={{ borderColor: "transparent" }}
              onMouseEnter={(e) =>
                (e.currentTarget.style.borderColor = accent.border)
              }
              onMouseLeave={(e) =>
                (e.currentTarget.style.borderColor = "transparent")
              }
              onClick={() => onSelectBranch(branch)}
            >
              <div
                className={`bg-gradient-to-r ${accent.bg}`}
                style={{ height: 6 }}
              />
              <div className="card-header">
                <div
                  className="branch-icon-wrap"
                  style={{ background: accent.light }}
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="24"
                    height="24"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke={accent.icon}
                    strokeWidth="2.2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                    <circle cx="12" cy="10" r="3" />
                  </svg>
                </div>
                <div>
                  <div className="branch-label">{branch.label}</div>
                  <div className="branch-city">{branch.city}</div>
                </div>
              </div>
              <div className="card-footer" style={{ color: accent.text }}>
                <span
                  className="code-badge"
                  style={{ background: accent.light, color: accent.text }}
                >
                  {branch.code}
                </span>
                <div
                  className="arrow-circle"
                  style={{ background: accent.light }}
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="14"
                    height="14"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke={accent.icon}
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <polyline points="9 18 15 12 9 6" />
                  </svg>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
    <Watermark text="HRLabs" />
  </>
);

// ── OTP Input Component ────────────────────────────────────────────────────
const OtpInput = ({ value, onChange, length = 6 }) => {
  const digits = value
    .split("")
    .concat(Array(length).fill(""))
    .slice(0, length);

  const handleChange = (index, e) => {
    const val = e.target.value.replace(/\D/g, "").slice(-1);
    const newDigits = [...digits];
    newDigits[index] = val;
    onChange(newDigits.join(""));
    if (val && index < length - 1) {
      document.getElementById(`otp-${index + 1}`)?.focus();
    }
  };

  const handleKeyDown = (index, e) => {
    if (e.key === "Backspace" && !digits[index] && index > 0) {
      document.getElementById(`otp-${index - 1}`)?.focus();
    }
    if (e.key === "ArrowLeft" && index > 0)
      document.getElementById(`otp-${index - 1}`)?.focus();
    if (e.key === "ArrowRight" && index < length - 1)
      document.getElementById(`otp-${index + 1}`)?.focus();
  };

  const handlePaste = (e) => {
    e.preventDefault();
    const pasted = e.clipboardData
      .getData("text")
      .replace(/\D/g, "")
      .slice(0, length);
    onChange(pasted.padEnd(length, "").slice(0, length));
    document
      .getElementById(`otp-${Math.min(pasted.length, length - 1)}`)
      ?.focus();
  };

  return (
    <div style={{ display: "flex", gap: "8px", justifyContent: "center" }}>
      {digits.map((digit, i) => (
        <input
          key={i}
          id={`otp-${i}`}
          className="otp-input"
          type="text"
          inputMode="numeric"
          maxLength={1}
          value={digit}
          onChange={(e) => handleChange(i, e)}
          onKeyDown={(e) => handleKeyDown(i, e)}
          onPaste={handlePaste}
          autoComplete="one-time-code"
          autoFocus={i === 0}
        />
      ))}
    </div>
  );
};

// ── Main App ───────────────────────────────────────────────────────────────
function App() {
  // step: "branch" | "login" | "otp" | "app"
  const [step, setStep] = useState("branch");
  const [selectedBranch, setSelectedBranch] = useState(null);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(false);
  const [loginError, setLoginError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [loggedInUser, setLoggedInUser] = useState("");
  // eslint-disable-next-line
  const [jwtToken, setJwtToken] = useState("");

  // OTP state
  const [otpValue, setOtpValue] = useState("");
  const [otpError, setOtpError] = useState("");
  const [otpMessage, setOtpMessage] = useState("");
  const [isVerifyingOtp, setIsVerifyingOtp] = useState(false);
  const [pendingUsername, setPendingUsername] = useState("");

  const [products, setProducts] = useState([]);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [fields, setFields] = useState([]);
  const [formValues, setFormValues] = useState({});
  const [calculation, setCalculation] = useState(null);
  const [loadingFields, setLoadingFields] = useState(false);
  const [calculating, setCalculating] = useState(false);
  const [calculationError, setCalculationError] = useState("");

  useEffect(() => {
    const savedAuth = localStorage.getItem("isAuthenticated");
    const savedBranchCode = localStorage.getItem("branchCode");
    const savedToken = localStorage.getItem("jwt_token");
    const savedUser = localStorage.getItem("loggedInUser");

    if (savedAuth === "true" && savedBranchCode && savedToken) {
      const branch = BRANCHES.find((b) => b.code === savedBranchCode);
      if (branch) {
        setSelectedBranch(branch);
        setJwtToken(savedToken);
        setLoggedInUser(savedUser || "");
        setStep("app");
        fetchProducts();
      }
    }

    const timer = setTimeout(() => setInitialLoading(false), 1500);
    return () => clearTimeout(timer);
  }, []);

  const handleBranchSelect = (branch) => {
    setSelectedBranch(branch);
    setLoginError("");
    setEmail("");
    setPassword("");
    setStep("login");
  };

  // ── Step 1: POST /login ────────────────────────────────────────────────
  const handleLogin = async () => {
    setLoginError("");
    setIsLoading(true);

    try {
      const passwordHash = await sha256(password);
      const deviceToken = generateDeviceToken();

      const response = await fetch(
        "https://n8n.automate.ourdept.com/webhook/mli/bangalore/login",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            username: email.trim(),
            password_hash: passwordHash,
            device_token: deviceToken,
          }),
        },
      );

      const result = await response.json();
      const token =
        response.headers.get("Jwt_token") ||
        response.headers.get("jwt_token") ||
        "";

      if (result.status === "success" && token) {
        // Trusted device — skip OTP
        finalizeLogin(email.trim(), token);
      } else if (result.status === "otp_required") {
        // Need OTP verification
        setPendingUsername(email.trim());
        setOtpMessage(
          result.message ||
            "A one-time code has been sent to your administrator. Please enter it to continue.",
        );
        setOtpValue("");
        setOtpError("");
        setStep("otp");
      } else {
        setLoginError(result.message || "Invalid username or password.");
      }
    } catch (err) {
      console.error("Login error:", err);
      setLoginError("Network error. Please check your connection.");
    } finally {
      setIsLoading(false);
    }
  };

  // ── Step 2: POST /verify-otp ───────────────────────────────────────────
  const handleVerifyOtp = async () => {
    if (otpValue.replace(/\s/g, "").length < 6) {
      setOtpError("Please enter the complete 6-digit code.");
      return;
    }

    setOtpError("");
    setIsVerifyingOtp(true);

    try {
      const response = await fetch(
        "https://n8n.automate.ourdept.com/webhook/mli/bangalore/verify-otp",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            username: pendingUsername,
            otp_code: otpValue,
          }),
        },
      );

      const result = await response.json();
      const token =
        response.headers.get("Jwt_token") ||
        response.headers.get("jwt_token") ||
        "";

      if ((result.status === "success" || response.ok) && token) {
        finalizeLogin(pendingUsername, token);
      } else {
        setOtpError(result.message || "Invalid OTP. Please try again.");
      }
    } catch (err) {
      console.error("OTP verification error:", err);
      setOtpError("Network error. Please check your connection.");
    } finally {
      setIsVerifyingOtp(false);
    }
  };

  const finalizeLogin = (username, token) => {
    setLoggedInUser(username);
    setJwtToken(token);
    setStep("app");

    if (rememberMe) {
      localStorage.setItem("isAuthenticated", "true");
      localStorage.setItem("branchCode", selectedBranch.code);
      localStorage.setItem("jwt_token", token);
      localStorage.setItem("loggedInUser", username);
    } else {
      localStorage.removeItem("isAuthenticated");
      localStorage.removeItem("branchCode");
      localStorage.removeItem("jwt_token");
      localStorage.removeItem("loggedInUser");
    }

    fetchProducts();
  };

  const handleLogout = () => {
    setStep("branch");
    setSelectedBranch(null);
    setEmail("");
    setPassword("");
    setRememberMe(false);
    setLoggedInUser("");
    setJwtToken("");
    setPendingUsername("");
    setOtpValue("");
    setOtpError("");
    setOtpMessage("");
    setSelectedProduct(null);
    setProducts([]);
    setFields([]);
    setFormValues({});
    setCalculation(null);
    localStorage.removeItem("isAuthenticated");
    localStorage.removeItem("branchCode");
    localStorage.removeItem("jwt_token");
    localStorage.removeItem("loggedInUser");
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter") handleLogin();
  };

  const fetchProducts = async () => {
    try {
      const response = await fetch(
        "https://n8n.automate.ourdept.com/webhook/mli/banglore/products/list",
        { cache: "no-store" },
      );
      const result = await response.json();
      setProducts(result[0]?.data || []);
    } catch (error) {
      console.error("Error fetching products:", error);
    }
  };

  const handleProductSelect = async (product) => {
    setSelectedProduct(product);
    setLoadingFields(true);
    setFields([]);
    setFormValues({});
    setCalculation(null);
    setCalculationError("");

    try {
      const response = await fetch(
        "https://n8n.automate.ourdept.com/webhook/mli/banglore/product/fields",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            product: product["Products Name"],
            productCode: product["Products Code"],
            sheetId: product["Sheet ID"] ?? "",
          }),
        },
      );
      const result = await response.json();
      setFields(result.data || []);
      const initialValues = {};
      (result.data || []).forEach((field) => {
        initialValues[field.field] = "";
      });
      setFormValues(initialValues);
    } catch (error) {
      console.error("Error fetching fields:", error);
    } finally {
      setLoadingFields(false);
    }
  };

  const handleFieldChange = (fieldName, value) => {
    setFormValues((prev) => ({ ...prev, [fieldName]: value }));
  };

  const handleCalculatePrice = async () => {
    setCalculating(true);
    setCalculationError("");
    setCalculation(null);

    try {
      const userIdMatch = loggedInUser.match(/\d+$/);
      const userId = userIdMatch ? userIdMatch[0] : "1";

      const values = {};
      fields.forEach((field) => {
        if (field.field === "ID") {
          values["ID"] = userId;
        } else {
          const value = formValues[field.field];
          values[field.field] =
            value === "" || value === null || value === undefined ? "0" : value;
        }
      });
      values["ID"] = userId;

      const response = await fetch(
        "https://n8n.automate.ourdept.com/webhook/mli/banglore/product/price",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            product: selectedProduct["Products Name"],
            productCode: selectedProduct["Products Code"],
            sheetID: selectedProduct["Sheet ID"] ?? "",
            values,
          }),
        },
      );

      if (!response.ok) {
        const text = await response.text();
        throw new Error(`Server error (${response.status}): ${text}`);
      }

      const result = await response.json();

      if (!result || typeof result !== "object")
        throw new Error("Invalid response from server");
      if (!result["Net Total"])
        throw new Error("Calculation failed: Net Total missing");

      setCalculation(result);
    } catch (error) {
      console.error("Calculation error:", error);
      if (error.message.includes("required"))
        setCalculationError(error.message);
      else if (error.message.includes("Failed to fetch"))
        setCalculationError("Network error. Check your connection.");
      else if (error.message.includes("Server error"))
        setCalculationError("Server issue. Please try again later.");
      else setCalculationError("Something went wrong. Please try again.");
    } finally {
      setCalculating(false);
    }
  };

  const handleBackToProducts = () => {
    setSelectedProduct(null);
    setFields([]);
    setFormValues({});
    setCalculation(null);
    setCalculationError("");
  };

  // ── Render ───────────────────────────────────────────────────────────────

  if (initialLoading)
    return (
      <>
        <Logo />
        <LoadingScreen />
        <Watermark text="HRLabs" />
      </>
    );
  if (step === "branch")
    return <BranchSelectionScreen onSelectBranch={handleBranchSelect} />;

  // ── Login Screen ──────────────────────────────────────────────────────────
  if (step === "login") {
    return (
      <>
        <Logo />
        <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6 sm:p-8 mt-16 sm:mt-0">
            <div className="flex items-center justify-between mb-6">
              <button
                onClick={() => setStep("branch")}
                className="text-indigo-600 hover:text-indigo-700 flex items-center gap-1 text-sm"
              >
                ← Change Branch
              </button>
              <span className="bg-indigo-100 text-indigo-700 px-3 py-1 rounded-full text-xs sm:text-sm font-semibold">
                📍 {selectedBranch?.label}
              </span>
            </div>
            <div className="text-center mb-6 sm:mb-8">
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-800 mb-2">
                Welcome Back
              </h1>
              <p className="text-gray-600 text-sm">Sign in to your account</p>
            </div>
            <div className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Username
                </label>
                <input
                  type="text"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  onKeyPress={handleKeyPress}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition text-sm"
                  placeholder="Enter your username"
                  autoComplete="username"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Password
                </label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  onKeyPress={handleKeyPress}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition text-sm"
                  placeholder="••••••••"
                  autoComplete="current-password"
                />
              </div>
              <div className="flex items-center">
                <input
                  id="rememberMe"
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded cursor-pointer"
                />
                <label
                  htmlFor="rememberMe"
                  className="ml-2 block text-sm text-gray-700 cursor-pointer"
                >
                  Remember me
                </label>
              </div>
              {loginError && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
                  {loginError}
                </div>
              )}
              <button
                onClick={handleLogin}
                disabled={isLoading}
                className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-3 rounded-lg transition duration-200 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
              >
                {isLoading ? "Signing in..." : "Sign In"}
              </button>
            </div>
          </div>
        </div>
        <Watermark text="HRLabs" />
      </>
    );
  }

  // ── OTP Verification Screen ───────────────────────────────────────────────
  if (step === "otp") {
    return (
      <>
        <Logo />
        <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6 sm:p-8 mt-16 sm:mt-0">
            <div className="flex items-center justify-between mb-6">
              <button
                onClick={() => {
                  setStep("login");
                  setOtpValue("");
                  setOtpError("");
                }}
                className="text-indigo-600 hover:text-indigo-700 flex items-center gap-1 text-sm"
              >
                ← Back to Login
              </button>
              <span className="bg-indigo-100 text-indigo-700 px-3 py-1 rounded-full text-xs sm:text-sm font-semibold">
                📍 {selectedBranch?.label}
              </span>
            </div>

            <div className="text-center mb-8">
              <div className="w-16 h-16 bg-indigo-50 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="30"
                  height="30"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="#6366f1"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                  <polyline points="9 12 11 14 15 10" />
                </svg>
              </div>
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-800 mb-2">
                Verify Your Identity
              </h1>
              <p className="text-gray-500 text-sm max-w-xs mx-auto">
                {otpMessage}
              </p>
            </div>

            <div className="space-y-6">
              <OtpInput value={otpValue} onChange={setOtpValue} length={6} />

              {otpError && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm text-center">
                  {otpError}
                </div>
              )}

              <button
                onClick={handleVerifyOtp}
                disabled={isVerifyingOtp || otpValue.length < 6}
                className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-3 rounded-lg transition duration-200 disabled:opacity-50 disabled:cursor-not-allowed text-sm flex items-center justify-center gap-2"
              >
                {isVerifyingOtp ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
                    Verifying...
                  </>
                ) : (
                  "Verify & Sign In"
                )}
              </button>

              <p className="text-center text-xs text-gray-400">
                Didn't receive a code?{" "}
                <button
                  onClick={handleLogin}
                  className="text-indigo-500 hover:text-indigo-700 font-medium underline underline-offset-2"
                >
                  Resend
                </button>
              </p>
            </div>
          </div>
        </div>
        <Watermark text="HRLabs" />
      </>
    );
  }

  // ── Products List ─────────────────────────────────────────────────────────
  if (!selectedProduct) {
    return (
      <>
        <Logo />
        <LogoutButton onLogout={handleLogout} />
        <div className="min-h-screen bg-gray-50 px-4 py-6 sm:p-8">
          <div className="max-w-6xl mx-auto" style={{ marginTop: "72px" }}>
            <div className="mb-6 sm:mb-8">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div>
                  <h1 className="text-2xl sm:text-4xl font-bold text-gray-800 mb-1">
                    Select a Product
                  </h1>
                  <p className="text-gray-600 text-sm sm:text-base">
                    Choose a product to get a quotation
                  </p>
                </div>
                <span className="bg-indigo-100 text-indigo-700 px-3 py-1.5 rounded-full font-semibold text-sm self-start sm:self-auto">
                  📍 {selectedBranch?.label}
                </span>
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
              {products.map((product) => (
                <div
                  key={product.row_number}
                  className="bg-white rounded-xl shadow-md hover:shadow-xl transition-all duration-300 cursor-pointer overflow-hidden border-2 border-transparent hover:border-indigo-500"
                  onClick={() => handleProductSelect(product)}
                >
                  <div className="p-5 sm:p-6">
                    <div className="flex items-start justify-between mb-3 gap-2">
                      <h3 className="text-lg sm:text-xl font-bold text-gray-800 leading-tight">
                        {product["Products Name"]}
                      </h3>
                      <span className="bg-indigo-100 text-indigo-700 px-2.5 py-1 rounded-full text-xs font-semibold whitespace-nowrap flex-shrink-0">
                        {product["Products Code"]}
                      </span>
                    </div>
                    <p className="text-gray-600 mb-4 text-sm">
                      {product.Description}
                    </p>
                    <button className="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-2 rounded-lg transition text-sm font-medium">
                      Select Product
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
        <Watermark text="HRLabs" />
      </>
    );
  }

  // ── Product Form + Quotation ───────────────────────────────────────────────
  return (
    <>
      <Logo />
      <LogoutButton onLogout={handleLogout} />
      <div className="min-h-screen bg-gray-50 px-4 py-6 sm:p-8">
        <div className="max-w-7xl mx-auto" style={{ marginTop: "72px" }}>
          <button
            onClick={handleBackToProducts}
            className="mb-5 text-indigo-600 hover:text-indigo-700 flex items-center gap-2 text-sm"
          >
            ← Back to Products
          </button>
          <div className="flex flex-col lg:flex-row gap-5 lg:gap-6 items-start">
            {/* LEFT: Form */}
            <div className="bg-white rounded-xl shadow-lg p-5 sm:p-8 w-full lg:flex-1 min-w-0">
              <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 mb-5 sm:mb-6">
                <div>
                  <h2 className="text-xl sm:text-3xl font-bold text-gray-800">
                    {selectedProduct["Products Name"]}
                  </h2>
                  <p className="text-gray-600 mt-1 text-sm">
                    {selectedProduct.Description}
                  </p>
                </div>
                <span className="bg-indigo-100 text-indigo-700 px-3 py-1.5 rounded-full text-sm font-semibold whitespace-nowrap self-start">
                  {selectedProduct["Products Code"]}
                </span>
              </div>
              {loadingFields ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-600 mx-auto" />
                  <p className="text-gray-600 mt-4 text-sm">
                    Loading fields...
                  </p>
                </div>
              ) : (
                <>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
                    {fields.map((field, index) => (
                      <div key={index}>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          {field.field}
                        </label>
                        {field.value && field.value.length > 0 ? (
                          <div className="flex flex-wrap gap-2">
                            {field.value.map((option, optIndex) => (
                              <button
                                key={optIndex}
                                type="button"
                                onClick={() =>
                                  handleFieldChange(
                                    field.field,
                                    formValues[field.field] === option
                                      ? ""
                                      : option,
                                  )
                                }
                                className={`px-3 py-2 rounded-lg text-sm font-medium border transition-all duration-150
                                  ${
                                    formValues[field.field] === option
                                      ? "bg-indigo-600 border-indigo-600 text-white"
                                      : "bg-white border-gray-300 text-gray-700 hover:bg-gray-50"
                                  }`}
                              >
                                {option}
                              </button>
                            ))}
                          </div>
                        ) : (
                          <input
                            type={
                              field.field.toLowerCase() === "misc"
                                ? "text"
                                : "number"
                            }
                            value={formValues[field.field] || ""}
                            onChange={(e) =>
                              handleFieldChange(field.field, e.target.value)
                            }
                            placeholder={`Enter ${field.field}`}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none text-sm"
                          />
                        )}
                      </div>
                    ))}
                  </div>
                  {calculationError && (
                    <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm mb-4">
                      {calculationError}
                    </div>
                  )}
                  <button
                    onClick={handleCalculatePrice}
                    disabled={calculating}
                    className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-3 rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 text-sm"
                  >
                    {calculating ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
                        Calculating...
                      </>
                    ) : (
                      "Calculate Price"
                    )}
                  </button>
                </>
              )}
            </div>

            {/* RIGHT: Quotation Result */}
            <div className="w-full lg:w-80 lg:flex-shrink-0">
              {calculation ? (
                <div className="bg-white rounded-xl shadow-lg p-5 sm:p-6 lg:sticky lg:top-24">
                  <h3 className="text-lg font-bold text-gray-800 mb-4">
                    Quotation Result
                  </h3>
                  <div className="bg-indigo-50 border-2 border-indigo-200 rounded-lg p-4 mb-5">
                    <p className="text-sm font-medium text-gray-500 mb-1">
                      Net Total
                    </p>
                    <p className="text-2xl sm:text-3xl font-bold text-indigo-600">
                      ₹{calculation["Net Total"]?.toFixed(2)}
                    </p>
                  </div>
                  <div className="space-y-2">
                    {Object.entries(calculation).map(([key, value]) => {
                      if (
                        [
                          "Net Total",
                          "Fields",
                          "values",
                          "ID",
                          "row_number",
                        ].includes(key)
                      )
                        return null;
                      return (
                        <div
                          key={key}
                          className="flex justify-between items-center border-b border-gray-100 py-2"
                        >
                          <span className="text-sm text-gray-500">{key}</span>
                          <span className="text-sm font-semibold text-gray-800">
                            {value || "0"}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ) : (
                <div className="bg-white rounded-xl shadow-lg p-5 sm:p-6 lg:sticky lg:top-24 border-2 border-dashed border-gray-200">
                  <div className="text-center py-6">
                    <div className="w-12 h-12 bg-indigo-50 rounded-full flex items-center justify-center mx-auto mb-3">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="22"
                        height="22"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="#6366f1"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <line x1="12" y1="1" x2="12" y2="23" />
                        <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
                      </svg>
                    </div>
                    <p className="text-gray-400 text-sm">
                      Fill in the form and click{" "}
                      <span className="font-semibold text-indigo-500">
                        Calculate Price
                      </span>{" "}
                      to see your quotation here.
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
      <Watermark text="HRLabs" />
    </>
  );
}

export default App;
