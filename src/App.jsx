import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Login from "./components/Login";
import SignUp from "./components/signup.jsx";
//import Purchase_indent from './components/Purchase_indent';
import Home from "./components/Home";

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/signup" element={<SignUp />} />
        <Route path="/home" element={<Home />} />
      </Routes>
    </Router>
  );
}
export default App;

// <Route path="/Purchase_indent" element={<Purchase_indent />} />

/*
to restrict refresh of page  or localhost/home wont get
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { useEffect, useState } from "react";
import Login from "./components/Login";
import SignUp from "./components/SignUp";
import PurchaseIndent from "./components/Purchase_indent";
import Home from "./components/Home";

const App = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    // Check if user is logged in (based on token)
    const token = localStorage.getItem("token");
    setIsAuthenticated(!!token);
  }, []);

  return (
    <Router>
      <Routes>
        {/* Allow Login and SignUp always }
        <Route path="/" element={<Login />} />
        <Route path="/signup" element={<SignUp />} />

        {/* Protected Routes: Redirect if not authenticated }
        <Route 
          path="/home" 
          element={isAuthenticated ? <Home /> : <Navigate to="/" replace />} 
        />
        <Route 
          path="/Purchase_indent" 
          element={isAuthenticated ? <PurchaseIndent /> : <Navigate to="/" replace />} 
        />
      </Routes>
    </Router>
  );
};

export default App;
*/
