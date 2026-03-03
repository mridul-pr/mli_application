import { useState, useRef, useEffect } from "react";
import logo from "./images/MLI logo.jpeg";

// ─── ENV helpers ────────────────────────────────────────────────────────────
// Parse branches from VITE_BRANCHES env var
// Format: "Label|City|Code,Label2|City2|Code2"
const parseBranches = () => {
  const raw = import.meta.env.VITE_BRANCHES || "";
  return raw
    .split(",")
    .map((b) => b.trim())
    .filter(Boolean)
    .map((b) => {
      const [label, city, code] = b.split("|");
      return { label: label?.trim(), city: city?.trim(), code: code?.trim() };
    });
};

// Parse credentials for a given branch code from VITE_CREDS_<CODE>
// Format: "user1,user2,user3|sharedPassword"
const getCredsForBranch = (code) => {
  const key = `VITE_CREDS_${code}`;
  const raw = import.meta.env[key] || "";
  const [usersPart, password] = raw.split("|");
  const usernames = usersPart
    ? usersPart
        .split(",")
        .map((u) => u.trim())
        .filter(Boolean)
    : [];
  return { usernames, password: password?.trim() };
};
// ────────────────────────────────────────────────────────────────────────────

const BRANCHES = parseBranches();

// ── UI Components ─────────────────────────────────────────────────────────
const Logo = () => (
  <div style={{ position: "fixed", top: "20px", left: "20px", zIndex: 1000 }}>
    <img
      src={logo}
      alt="MLI"
      style={{
        height: "80px",
        width: "80px",
        borderRadius: "12px",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    />
  </div>
);

const Watermark = ({ text }) => (
  <div
    style={{
      position: "fixed",
      bottom: "20px",
      right: "20px",
      opacity: 0.3,
      fontSize: "12px",
      color: "#666",
    }}
  >
    {text}
  </div>
);

const LoadingScreen = () => (
  <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
    <div className="text-center">
      <div className="animate-spin rounded-full h-20 w-20 border-b-4 border-indigo-600 mx-auto mb-4" />
      <h2 className="text-2xl font-bold text-gray-800 mb-2">Loading...</h2>
      <p className="text-gray-600">
        Please wait while we prepare your experience
      </p>
    </div>
  </div>
);

const LogoutButton = ({ onLogout }) => (
  <div style={{ position: "fixed", top: "20px", right: "20px", zIndex: 1000 }}>
    <button
      onClick={onLogout}
      className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg transition duration-200 flex items-center gap-2 shadow-md"
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="16"
        height="16"
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
      Logout
    </button>
  </div>
);

// ── Branch city accent colors (cycles if more branches added) ───────────────
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
      .branch-card:hover {
        transform: translateY(-6px) scale(1.02);
        box-shadow: 0 16px 40px rgba(0,0,0,0.13);
      }
      .branch-card .card-header {
        padding: 32px 28px 24px;
        display: flex;
        flex-direction: column;
        align-items: flex-start;
        gap: 14px;
      }
      .branch-card .card-footer {
        padding: 16px 28px;
        border-top: 1px solid rgba(0,0,0,0.06);
        display: flex;
        align-items: center;
        justify-content: space-between;
        font-size: 13px;
        font-weight: 600;
        letter-spacing: 0.02em;
      }
      .branch-icon-wrap {
        width: 52px; height: 52px;
        border-radius: 14px;
        display: flex; align-items: center; justify-content: center;
      }
      .branch-label { font-size: 22px; font-weight: 800; color: #1e1b4b; line-height: 1.2; }
      .branch-city  { font-size: 13px; font-weight: 500; color: #6b7280; margin-top: 2px; font-family: 'DM Sans', sans-serif; }
      .code-badge {
        font-size: 11px; font-weight: 700; letter-spacing: 0.08em;
        padding: 3px 10px; border-radius: 999px;
        text-transform: uppercase;
      }
      .branch-screen-bg {
        min-height: 100vh;
        background: #f8f7ff;
        background-image:
          radial-gradient(ellipse at 10% 20%, rgba(99,102,241,0.08) 0%, transparent 60%),
          radial-gradient(ellipse at 90% 80%, rgba(251,113,133,0.07) 0%, transparent 60%);
        display: flex; flex-direction: column; align-items: center; justify-content: center;
        padding: 40px 16px;
        font-family: 'Sora', sans-serif;
      }
      .branch-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
        gap: 20px;
        width: 100%;
        max-width: 800px;
      }
      .screen-title { font-size: 36px; font-weight: 800; color: #1e1b4b; text-align: center; margin-bottom: 6px; }
      .screen-sub   { font-size: 15px; color: #6b7280; text-align: center; margin-bottom: 40px; font-family: 'DM Sans', sans-serif; }
      .arrow-circle {
        width: 28px; height: 28px; border-radius: 50%;
        display: flex; align-items: center; justify-content: center;
      }
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
              {/* coloured top strip */}
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
                    width="26"
                    height="26"
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

// ── Main App ───────────────────────────────────────────────────────────────
function App() {
  const [step, setStep] = useState("branch"); // "branch" | "login" | "app"
  const [selectedBranch, setSelectedBranch] = useState(null);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(false);
  const [loginError, setLoginError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);

  // Products page state
  const [products, setProducts] = useState([]);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [fields, setFields] = useState([]);
  const [formValues, setFormValues] = useState({});
  const [calculation, setCalculation] = useState(null);
  const [loadingFields, setLoadingFields] = useState(false);
  const [calculating, setCalculating] = useState(false);
  const [calculationError, setCalculationError] = useState("");
  const resultRef = useRef(null);

  // Check for saved login on mount
  useEffect(() => {
    const savedAuth = localStorage.getItem("isAuthenticated");
    const savedBranchCode = localStorage.getItem("branchCode");

    if (savedAuth === "true" && savedBranchCode) {
      const branch = BRANCHES.find((b) => b.code === savedBranchCode);
      if (branch) {
        setSelectedBranch(branch);
        setStep("app");
        fetchProducts();
      }
    }

    const timer = setTimeout(() => setInitialLoading(false), 1500);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (calculation && resultRef.current) {
      resultRef.current.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }, [calculation]);

  const handleBranchSelect = (branch) => {
    setSelectedBranch(branch);
    setLoginError("");
    setEmail("");
    setPassword("");
    setStep("login");
  };

  const handleLogin = () => {
    setLoginError("");
    setIsLoading(true);

    setTimeout(() => {
      const { usernames, password: validPassword } = getCredsForBranch(
        selectedBranch.code,
      );
      const isValid =
        usernames.includes(email.trim()) && password === validPassword;

      if (isValid) {
        setStep("app");
        if (rememberMe) {
          localStorage.setItem("isAuthenticated", "true");
          localStorage.setItem("branchCode", selectedBranch.code);
        } else {
          localStorage.removeItem("isAuthenticated");
          localStorage.removeItem("branchCode");
        }
        fetchProducts();
      } else {
        setLoginError("Invalid username or password");
      }
      setIsLoading(false);
    }, 500);
  };

  const handleLogout = () => {
    setStep("branch");
    setSelectedBranch(null);
    setEmail("");
    setPassword("");
    setRememberMe(false);
    setSelectedProduct(null);
    setProducts([]);
    setFields([]);
    setFormValues({});
    setCalculation(null);
    localStorage.removeItem("isAuthenticated");
    localStorage.removeItem("branchCode");
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

    const values = {};
    fields.forEach((field) => {
      const value = formValues[field.field];
      values[field.field] =
        value === "" || value === null || value === undefined ? "0" : value;
    });

    try {
      const response = await fetch(
        "https://n8n.automate.ourdept.com/webhook-test/mli/banglore/product/price",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            product: selectedProduct["Products Name"],
            productCode: selectedProduct["Products Code"],
            sheetID: selectedProduct["Sheet ID"] ?? "",
            values: values,
          }),
        },
      );

      if (!response.ok)
        throw new Error(`HTTP error! status: ${response.status}`);
      const result = await response.json();
      setCalculation(result);
    } catch (error) {
      console.error("Error calculating price:", error);
      setCalculationError("Failed to calculate price. Please try again.");
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

  if (initialLoading) {
    return (
      <>
        <Logo />
        <LoadingScreen />
        <Watermark text="HRLabs" />
      </>
    );
  }

  if (step === "branch") {
    return <BranchSelectionScreen onSelectBranch={handleBranchSelect} />;
  }

  if (step === "login") {
    return (
      <>
        <Logo />
        <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-8">
            {/* Branch badge */}
            <div className="flex items-center justify-between mb-6">
              <button
                onClick={() => setStep("branch")}
                className="text-indigo-600 hover:text-indigo-700 flex items-center gap-1 text-sm"
              >
                ← Change Branch
              </button>
              <span className="bg-indigo-100 text-indigo-700 px-3 py-1 rounded-full text-sm font-semibold">
                📍 {selectedBranch?.label}
              </span>
            </div>

            <div className="text-center mb-8">
              <h1 className="text-3xl font-bold text-gray-800 mb-2">
                Welcome Back
              </h1>
              <p className="text-gray-600">Sign in to your account</p>
            </div>

            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Username
                </label>
                <input
                  type="text"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  onKeyPress={handleKeyPress}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition"
                  placeholder="e.g. blrsc1"
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
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition"
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
                className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-3 rounded-lg transition duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
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

  // ── App (Products / Calculation) ─────────────────────────────────────────
  if (!selectedProduct) {
    return (
      <>
        <Logo />
        <LogoutButton onLogout={handleLogout} />
        <div className="min-h-screen bg-gray-50 p-8">
          <div className="max-w-6xl mx-auto" style={{ marginTop: "60px" }}>
            <div className="mb-8 flex items-center justify-between">
              <div>
                <h1 className="text-4xl font-bold text-gray-800 mb-2">
                  Select a Product
                </h1>
                <p className="text-gray-600">
                  Choose a product to get a quotation
                </p>
              </div>
              <span className="bg-indigo-100 text-indigo-700 px-4 py-2 rounded-full font-semibold">
                📍 {selectedBranch?.label}
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {products.map((product) => (
                <div
                  key={product.row_number}
                  className="bg-white rounded-xl shadow-md hover:shadow-xl transition-all duration-300 cursor-pointer overflow-hidden border-2 border-transparent hover:border-indigo-500"
                  onClick={() => handleProductSelect(product)}
                >
                  <div className="p-6">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-xl font-bold text-gray-800">
                        {product["Products Name"]}
                      </h3>
                      <span className="bg-indigo-100 text-indigo-700 px-3 py-1 rounded-full text-sm font-semibold">
                        {product["Products Code"]}
                      </span>
                    </div>
                    <p className="text-gray-600 mb-4">{product.Description}</p>
                    <button className="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-2 rounded-lg transition">
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

  return (
    <>
      <Logo />
      <LogoutButton onLogout={handleLogout} />
      <div className="min-h-screen bg-gray-50 p-8">
        <div className="max-w-4xl mx-auto" style={{ marginTop: "60px" }}>
          <button
            onClick={handleBackToProducts}
            className="mb-6 text-indigo-600 hover:text-indigo-700 flex items-center gap-2"
          >
            ← Back to Products
          </button>

          <div className="bg-white rounded-xl shadow-lg p-8 mb-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-3xl font-bold text-gray-800">
                  {selectedProduct["Products Name"]}
                </h2>
                <p className="text-gray-600 mt-1">
                  {selectedProduct.Description}
                </p>
              </div>
              <span className="bg-indigo-100 text-indigo-700 px-4 py-2 rounded-full text-lg font-semibold">
                {selectedProduct["Products Code"]}
              </span>
            </div>

            {loadingFields ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto" />
                <p className="text-gray-600 mt-4">Loading fields...</p>
              </div>
            ) : (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                  {fields.map((field, index) => (
                    <div key={index}>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        {field.field}
                      </label>
                      {field.value && field.value.length > 0 ? (
                        <select
                          value={formValues[field.field] || ""}
                          onChange={(e) =>
                            handleFieldChange(field.field, e.target.value)
                          }
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none"
                        >
                          <option value="">Select {field.field}</option>
                          {field.value.map((option, optIndex) => (
                            <option key={optIndex} value={option}>
                              {option}
                            </option>
                          ))}
                        </select>
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
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none"
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
                  className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-3 rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {calculating ? (
                    <>
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white" />
                      Calculating...
                    </>
                  ) : (
                    "Calculate Price"
                  )}
                </button>
              </>
            )}
          </div>

          {calculation && (
            <div className="bg-white rounded-xl shadow-lg p-8" ref={resultRef}>
              <h3 className="text-2xl font-bold text-gray-800 mb-6">
                Quotation Result
              </h3>
              <div className="bg-indigo-50 border-2 border-indigo-200 rounded-lg p-6 mb-6">
                <div className="flex justify-between items-center">
                  <span className="text-xl font-semibold text-gray-700">
                    Net Total
                  </span>
                  <span className="text-3xl font-bold text-indigo-600">
                    ₹{calculation["Net Total"]?.toFixed(2)}
                  </span>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
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
                    <div key={key} className="border-b border-gray-200 py-2">
                      <span className="text-sm text-gray-600">{key}</span>
                      <p className="font-semibold text-gray-800">
                        {value || "0"}
                      </p>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>
      <Watermark text="HRLabs" />
    </>
  );
}

export default App;
