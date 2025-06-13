import { useState, useEffect } from "react";
import "./Approval_page.css";

const ApprovalPage = () => {
  const currentUser = JSON.parse(localStorage.getItem("user"))?.userid || null;

  const [requests, setRequests] = useState([]);
  const [updates, setUpdates] = useState({});
  const [approvedQuantities, setApprovedQuantities] = useState({});

  useEffect(() => {
    fetch("http://localhost:5000/api/approval-list")
      .then((res) => res.json())
      .then((data) => setRequests(data))
      .catch((err) => console.error("Error fetching requests:", err));
  }, []);

  const handleQuantityChange = (uniqueid, value) => {
    const intValue = value ? Math.max(1, parseInt(value, 10)) : "";
    setApprovedQuantities((prev) => ({
      ...prev,
      [uniqueid]: intValue,
    }));
  };

  const handleApproval = (uniqueid, status) => {
    if (status === "Approved" && !approvedQuantities[uniqueid]) {
      alert("Please enter an approved quantity before approving.");
      return;
    }

    const now = new Date().toISOString().slice(0, 19).replace("T", " "); // Correct format

    setUpdates((prev) => ({
      ...prev,
      [uniqueid]: {
        status,
        approvedBy: currentUser,
        approvedDate: now, // Proper format for MariaDB
        approvedQuantity:
          status === "Approved" ? approvedQuantities[uniqueid] : 0,
      },
    }));
  };

  const handleSave = () => {
    const updatesArray = Object.keys(updates).map((uniqueid) => ({
      uniqueid,
      ...updates[uniqueid],
    }));

    fetch("http://localhost:5000/api/update-purchase-requests", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(updatesArray),
    })
      .then((res) => res.json()) // Parse the response JSON
      .then((data) => {
        if (data.success) {
          alert("Updates saved successfully!");
          window.location.reload(); // Refresh the page to reflect changes
        } else {
          alert("Failed to update: " + data.error);
        }
      })
      .catch((err) => {
        console.error("Error saving updates:", err);
        alert("An error occurred while updating. Please try again.");
      });
  };

  return (
    <div className="approval-container">
      <h1 className="approval-heading">Pending Purchase Requests</h1>
      <div className="approval-table-container">
        <table className="approval-table">
          <thead>
            <tr>
              <th>PR Number</th>
              <th>Company</th>
              <th>SBU</th>
              <th>Department</th>
              <th>Item Name</th>
              <th>Requested Quantity</th>
              <th>Remark</th>
              <th>Stock Quantity</th>
              <th>Approved Quantity</th>
              <th></th> {/* Empty header for buttons */}
            </tr>
          </thead>
          <tbody>
            {requests.map((req) => (
              <tr key={req.uniqueid}>
                <td>{req.uniqueid}</td>
                <td>{req.company}</td>
                <td>{req.sbu}</td>
                <td>{req.department}</td>
                <td>{req.itemname || req.itemid}</td>
                <td>{req.requestedQuantity}</td>
                <td>{req.remark}</td>
                <td>{req.stockQuantity ?? "N/A"}</td>
                <td>
                  <input
                    type="number"
                    min="1"
                    required
                    value={approvedQuantities[req.uniqueid] ?? ""}
                    onChange={(e) =>
                      handleQuantityChange(req.uniqueid, e.target.value)
                    }
                    disabled={updates[req.uniqueid]?.status === "Rejected"}
                  />
                </td>
                <td className="action-buttons">
                  <button
                    onClick={() => handleApproval(req.uniqueid, "Approved")}
                    className={`approve-btn ${
                      updates[req.uniqueid]?.status === "Approved"
                        ? "selected"
                        : ""
                    }`}
                  >
                    {updates[req.uniqueid]?.status === "Approved"
                      ? "Approved"
                      : "Approve"}
                  </button>
                  <button
                    onClick={() => handleApproval(req.uniqueid, "Rejected")}
                    className={`decline-btn ${
                      updates[req.uniqueid]?.status === "Rejected"
                        ? "selected"
                        : ""
                    }`}
                  >
                    {updates[req.uniqueid]?.status === "Rejected"
                      ? "Declined"
                      : "Decline"}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="save-container">
        <button onClick={handleSave} className="save-btn">
          Save
        </button>
      </div>
    </div>
  );
};

export default ApprovalPage;
