import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Login from "./components/Login";
import SignUp from "./components/signup";
import Purchase_indent from "./components/Purchase_indent";
import Home from "./components/Home";

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/signup" element={<SignUp />} />
        <Route path="/home" element={<Home />} />
        <Route path="/Purchase_indent" element={<Purchase_indent />} />
      </Routes>
    </Router>
  );
}
export default App;
