import { useState } from "react";
import axios from "axios";
import "./EmployeeAssetReport.css";

const EmployeeAssetReport = () => {
  const [employeeId, setEmployeeId] = useState("");
  const [type, setType] = useState("all");
  const [reportData, setReportData] = useState([]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!employeeId) {
      alert("Please enter an employee ID");
      return;
    }

    try {
      const res = await axios.post(
        "http://localhost:5000/api/employee-assets",
        {
          empid: employeeId,
          type,
        }
      );
      setReportData(res.data);
    } catch (error) {
      console.error("Error fetching asset report:", error);
      alert("Failed to fetch asset report");
    }
  };

  return (
    <div className="report-container">
      <h2>Employee Asset Report</h2>

      <div className="form-wrapper">
        <form className="report-form" onSubmit={handleSubmit}>
          <input
            type="text"
            placeholder="Enter Employee ID"
            value={employeeId}
            onChange={(e) => setEmployeeId(e.target.value)}
          />
          <select
            value={type}
            onChange={(e) => {
              setType(e.target.value);
              setReportData([]);
            }}
          >
            <option value="all">All</option>
            <option value="active">Active</option>
          </select>
          <button type="submit">Get Report</button>
        </form>
      </div>

      {reportData.length > 0 && (
        <table className="report-table">
          <thead>
            <tr>
              <th>Item Name</th>
              <th>Quantity</th>
              {type === "all" && (
                <>
                  <th>Status</th>
                  <th>Date</th>
                </>
              )}
            </tr>
          </thead>
          <tbody>
            {reportData.map((item, index) => (
              <tr key={index}>
                <td>{item.itemname}</td>
                <td>{item.quantity}</td>
                {type === "all" && (
                  <>
                    <td>{item.status}</td>
                    <td>{new Date(item.date).toLocaleDateString()}</td>
                  </>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
};

export default EmployeeAssetReport;
