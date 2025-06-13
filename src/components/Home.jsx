import { useState } from "react";
import { useNavigate } from "react-router-dom";
import PurchaseIndent from "./Purchase_indent";
import Approval from "./Approval_page";
import PurchaseOrderEntry from "./Purchase_order";
import InwardEntry from "./InwardEntry";
import userImage from "../assets/user.jpg";
import IssueEntry from "./IssueEntry";
import EmployeeAssetReport from "./EmployeeAssetReport";
import StockReport from "./StockReport";
import "./Home.css";
import SignUp from "./signup";

// ✅ Add new module imports here
import ReturnEntry from "./ReturnEntry";
//import EmployeeAssetReport from "./EmployeeAssetReport";

const Home = () => {
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem("user")) || {};
  const username = user.username || "User";
  const [selectedPage, setSelectedPage] = useState(null);
  const role = user.role || "";

  const handleLogout = () => {
    localStorage.removeItem("user");
    navigate("/");
  };

  const roleAccess = {
    Approver: ["Approval"],
    Purchase: ["PurchaseIndent", "PurchaseOrderEntry"],
    Inventory: ["InwardEntry", "IssueEntry"],
    Manager: [
      "PurchaseIndent",
      "Approval",
      "PurchaseOrderEntry",
      "InwardEntry",
      "IssueEntry",
      "ReturnEntry",
      "StockReport",
      "SignUp",
    ],
    SuperAdmin: [
      "PurchaseIndent",
      "Approval",
      "PurchaseOrderEntry",
      "InwardEntry",
      "IssueEntry",
      "ReturnEntry",
      "StockReport",
      "SignUp",
    ], // Masters can be added later
  };

  return (
    <div className="home-container">
      {/* Top Bar */}
      <div className="top-bar">
        <div className="profile-container">
          <img src={userImage} alt="User Profile" className="profile-pic" />
          <span className="profile-name">{username}</span>
        </div>
        <button className="logout-btn" onClick={handleLogout}>
          Logout
        </button>
      </div>

      {/* Side Menu */}
      <div className="side-menu">
        <h1>Menu</h1>
        <br />

        {roleAccess[role]?.includes("PurchaseIndent") && (
          <button onClick={() => setSelectedPage("PurchaseIndent")}>
            Purchase Indent
          </button>
        )}
        {roleAccess[role]?.includes("Approval") && (
          <button onClick={() => setSelectedPage("Approval")}>Approval</button>
        )}
        {roleAccess[role]?.includes("PurchaseOrderEntry") && (
          <button onClick={() => setSelectedPage("PurchaseOrderEntry")}>
            Purchase Order Entry
          </button>
        )}
        {roleAccess[role]?.includes("InwardEntry") && (
          <button onClick={() => setSelectedPage("InwardEntry")}>
            Inward Entry
          </button>
        )}
        {roleAccess[role]?.includes("IssueEntry") && (
          <button onClick={() => setSelectedPage("IssueEntry")}>
            Issue Entry
          </button>
        )}
        {roleAccess[role]?.includes("ReturnEntry") && (
          <button onClick={() => setSelectedPage("ReturnEntry")}>
            Return Entry
          </button>
        )}
        {roleAccess[role]?.includes("StockReport") && (
          <button onClick={() => setSelectedPage("StockReport")}>
            Stock Report
          </button>
        )}
        {roleAccess[role]?.includes("SignUp") && (
          <button onClick={() => setSelectedPage("SignUp")}>Signup</button>
        )}
      </div>

      {/* Dynamic Content */}
      <div className="content">
        {selectedPage === "PurchaseIndent" && <PurchaseIndent />}
        {selectedPage === "Approval" && <Approval />}
        {selectedPage === "PurchaseOrderEntry" && <PurchaseOrderEntry />}
        {selectedPage === "InwardEntry" && <InwardEntry />}
        {selectedPage === "ReturnEntry" && <ReturnEntry />}
        {selectedPage === "IssueEntry" && <IssueEntry />}
        {selectedPage === "StockReport" && <StockReport />}
        {selectedPage === "EmployeeAssetReport" && <EmployeeAssetReport />}
        {selectedPage === "SignUp" && <SignUp />}
      </div>
    </div>
  );
};

export default Home;
