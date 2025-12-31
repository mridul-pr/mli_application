import { useState, useRef, useEffect } from "react";
import logo from "./images/MLI logo.jpeg";
import Watermark from "./components/Watermark/Watermark";

// Logo Component
const Logo = () => (
  <div
    style={{
      position: "fixed",
      top: "20px",
      left: "20px",
      zIndex: 1000,
    }}
  >
    <img
      src={logo}
      alt="MLI Logo"
      style={{
        height: "100px",
        width: "auto",
        objectFit: "contain",
      }}
    />
  </div>
);

// Loading Screen Component
const LoadingScreen = () => (
  <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
    <div className="text-center">
      <div className="animate-spin rounded-full h-20 w-20 border-b-4 border-indigo-600 mx-auto mb-4"></div>
      <h2 className="text-2xl font-bold text-gray-800 mb-2">Loading...</h2>
      <p className="text-gray-600">
        Please wait while we prepare your experience
      </p>
    </div>
  </div>
);

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
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

  const validCredentials = [
    { email: "raksha@hrlabs.in", password: "password123" },
    { email: "vijay@hrlabs.in", password: "password123" },
  ];

  // Simulate initial loading
  useEffect(() => {
    const timer = setTimeout(() => {
      setInitialLoading(false);
    }, 1500);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (calculation && resultRef.current) {
      resultRef.current.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    }
  }, [calculation]);

  const handleLogin = () => {
    setLoginError("");
    setIsLoading(true);

    setTimeout(() => {
      const isValid = validCredentials.some(
        (cred) => cred.email === email && cred.password === password
      );

      if (isValid) {
        setIsAuthenticated(true);
        fetchProducts();
      } else {
        setLoginError("Invalid email or password");
      }
      setIsLoading(false);
    }, 500);
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter") {
      handleLogin();
    }
  };

  const fetchProducts = async () => {
    try {
      const response = await fetch(
        "https://n8n.automate.ourdept.com/webhook/products/list"
      );
      const result = await response.json();
      setProducts(result.data || []);
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
        "https://n8n.automate.ourdept.com/webhook/product/fields",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            product: product.Products,
            productCode: product["Product Code"],
          }),
        }
      );
      const result = await response.json();
      setFields(result.data || []);

      const initialValues = {};
      result.data.forEach((field) => {
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
    setFormValues((prev) => ({
      ...prev,
      [fieldName]: value,
    }));
  };

  const handleCalculatePrice = async () => {
    console.log("Calculate button clicked");
    setCalculating(true);
    setCalculationError("");
    setCalculation(null);

    const values = {};
    fields.forEach((field) => {
      const value = formValues[field.field];
      values[field.field] =
        value === "" || value === null || value === undefined ? 0 : value;
    });

    console.log("Sending calculation request:", {
      product: selectedProduct.Products,
      productCode: selectedProduct["Product Code"],
      values: values,
    });

    try {
      const response = await fetch(
        "https://n8n.automate.ourdept.com/webhook/quote/calculate/price",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            product: selectedProduct.Products,
            productCode: selectedProduct["Product Code"],
            values: values,
          }),
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      console.log("Calculation result:", result);
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

  // Show loading screen on initial load
  if (initialLoading) {
    return (
      <>
        <Logo />
        <LoadingScreen />
        <Watermark text="HRLabs" />
      </>
    );
  }

  // Login Screen
  if (!isAuthenticated) {
    return (
      <>
        <Logo />
        <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-8">
            <div className="text-center mb-8">
              <h1 className="text-3xl font-bold text-gray-800 mb-2">
                Welcome Back
              </h1>
              <p className="text-gray-600">Sign in to your account</p>
            </div>

            <div className="space-y-6">
              <div>
                <label
                  htmlFor="email"
                  className="block text-sm font-medium text-gray-700 mb-2"
                >
                  Email Address
                </label>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  onKeyPress={handleKeyPress}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition"
                  placeholder="you@example.com"
                />
              </div>

              <div>
                <label
                  htmlFor="password"
                  className="block text-sm font-medium text-gray-700 mb-2"
                >
                  Password
                </label>
                <input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  onKeyPress={handleKeyPress}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition"
                  placeholder="••••••••"
                />
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

  // Products Selection Screen
  if (!selectedProduct) {
    return (
      <>
        <Logo />
        <div className="min-h-screen bg-gray-50 p-8">
          <div className="max-w-6xl mx-auto" style={{ marginTop: "60px" }}>
            <div className="mb-8">
              <h1 className="text-4xl font-bold text-gray-800 mb-2">
                Select a Product
              </h1>
              <p className="text-gray-600">
                Choose a product to get a quotation
              </p>
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
                        {product.Products}
                      </h3>
                      <span className="bg-indigo-100 text-indigo-700 px-3 py-1 rounded-full text-sm font-semibold">
                        {product["Product Code"]}
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

  // Product Details & Calculation Screen
  return (
    <>
      <Logo />
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
                  {selectedProduct.Products}
                </h2>
                <p className="text-gray-600 mt-1">
                  {selectedProduct.Description}
                </p>
              </div>
              <span className="bg-indigo-100 text-indigo-700 px-4 py-2 rounded-full text-lg font-semibold">
                {selectedProduct["Product Code"]}
              </span>
            </div>

            {loadingFields ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
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
                          type="number"
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
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
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
                    key === "Net Total" ||
                    key === "Fields" ||
                    key === "values" ||
                    key === "ID" ||
                    key === "row_number"
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
