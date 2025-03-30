import { useState, useEffect } from "react";
import Button from "./ui/button";

const ApprovalPage = () => {
  const [requests, setRequests] = useState([]);
  const [updates, setUpdates] = useState({});

  useEffect(() => {
    // Fetch purchase requests from backend
    fetch("/api/purchase-requests")
      .then((res) => res.json())
      .then((data) => setRequests(data))
      .catch((err) => console.error("Error fetching requests:", err));
  }, []);

  const handleApproval = (id, status) => {
    setUpdates((prev) => ({
      ...prev,
      [id]: {
        status,
        approvedBy: "Admin",
        approvedDate: new Date().toISOString(),
      },
    }));
  };

  const handleSave = () => {
    const updatesArray = Object.keys(updates).map((id) => ({
      id,
      ...updates[id],
    }));

    fetch("/api/update-purchase-requests", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(updatesArray),
    })
      .then((res) => res.json())
      .then(() => alert("Updates saved successfully!"))
      .catch((err) => console.error("Error saving updates:", err));
  };

  return (
    <div className="p-6 max-w-4xl mx-auto bg-white shadow-lg rounded-lg">
      <h1 className="text-xl font-bold mb-4">Purchase Request Approvals</h1>
      <table className="w-full border-collapse border border-gray-200">
        <thead>
          <tr className="bg-gray-100">
            <th className="border px-4 py-2">PR Number</th>
            <th className="border px-4 py-2">Item</th>
            <th className="border px-4 py-2">Quantity</th>
            <th className="border px-4 py-2">Status</th>
            <th className="border px-4 py-2">Action</th>
          </tr>
        </thead>
        <tbody>
          {requests.map((req) => (
            <tr key={req.id} className="text-center">
              <td className="border px-4 py-2">{req.prNumber}</td>
              <td className="border px-4 py-2">{req.item}</td>
              <td className="border px-4 py-2">{req.quantity}</td>
              <td className="border px-4 py-2">
                {updates[req.id]?.status || req.status}
              </td>
              <td className="border px-4 py-2 space-x-2">
                <Button
                  onClick={() => handleApproval(req.id, "Approved")}
                  className="bg-green-500 hover:bg-green-600"
                >
                  Approve
                </Button>
                <Button
                  onClick={() => handleApproval(req.id, "Declined")}
                  className="bg-red-500 hover:bg-red-600"
                >
                  Decline
                </Button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <div className="mt-4 text-center">
        <Button onClick={handleSave} className="bg-blue-500 hover:bg-blue-600">
          Save
        </Button>
      </div>
    </div>
  );
};

export default ApprovalPage;
