import { useState } from "react";
import { useNavigate } from "react-router-dom";
import PurchaseIndent from "./Purchase_indent";
import ApprovalPage from "./Approval_page";
import PurchaseOrderEntryPage from "./Purchase_order"; // ✅ Now Used Below
import InwardEntry from "./InwardEntry";
import userImage from "../assets/user.jpg";
import "./Home.css";

const Home = () => {
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem("user")) || {};
  const username = user.username || "User";
  const [selectedPage, setSelectedPage] = useState("PurchaseIndent"); // Default page

  const handleLogout = () => {
    localStorage.removeItem("user");
    navigate("/");
  };

  const renderContent = () => {
    switch (selectedPage) {
      case "PurchaseIndent":
        return <PurchaseIndent />;
      case "Approval":
        return <ApprovalPage />;
      case "PurchaseOrderEntry":
        return <PurchaseOrderEntryPage />; // ✅ Now Rendering Properly
      case "InwardEntry":
        return <InwardEntry />;
      case "IssueEntry":
        return <h2>Issue Entry Page</h2>;
      case "Report":
        return <h2>Report Page</h2>;
      default:
        return <h2>Welcome! Select an option from the menu.</h2>;
    }
  };

  return (
    <div className="home-container">
      <div className="top-bar">
        <div className="profile-container">
          <img src={userImage} alt="User Profile" className="profile-pic" />
          <span className="profile-name">{username}</span>
        </div>
        <button className="logout-btn" onClick={handleLogout}>
          Logout
        </button>
      </div>

      <div className="side-menu">
        <h3>Menu</h3>
        <button onClick={() => setSelectedPage("PurchaseIndent")}>
          Purchase Indent
        </button>
        <button onClick={() => setSelectedPage("Approval")}>Approval</button>
        <button onClick={() => setSelectedPage("PurchaseOrderEntry")}>
          Purchase Order Entry
        </button>
        <button onClick={() => setSelectedPage("InwardEntry")}>
          Inward Entry
        </button>
        <button onClick={() => setSelectedPage("IssueEntry")}>
          Issue Entry
        </button>
        <button onClick={() => setSelectedPage("Report")}>Report</button>
      </div>

      <div className="content">{renderContent()}</div>
    </div>
  );
};

export default Home;
