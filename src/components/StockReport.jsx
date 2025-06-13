import { useState, useEffect } from "react";
import axios from "axios";
import "./StockReport.css";

const StockReport = () => {
  const [companies, setCompanies] = useState([]);
  const [sbus, setSbus] = useState([]);
  const [selectedCompany, setSelectedCompany] = useState("");
  const [selectedSbu, setSelectedSbu] = useState("");
  const [asOnDate, setAsOnDate] = useState("");
  const [reportData, setReportData] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    axios
      .get("http://localhost:5000/api/companies")
      .then((res) => setCompanies(res.data))
      .catch(console.error);
  }, []);

  useEffect(() => {
    if (selectedCompany) {
      axios
        .get(`http://localhost:5000/api/sbus/${selectedCompany}`)
        .then((res) => setSbus(res.data))
        .catch(console.error);
    }
  }, [selectedCompany]);

  const handleGenerateReport = () => {
    if (!selectedCompany || !selectedSbu || !asOnDate) {
      alert("Please select all fields.");
      return;
    }
    setLoading(true);
    setReportData(null);

    axios
      .get("http://localhost:5000/api/stock-report", {
        params: { company: selectedCompany, sbu: selectedSbu, date: asOnDate },
      })
      .then((res) => setReportData(res.data))
      .catch((err) => {
        console.error("Error fetching report:", err);
        alert("Failed to load report");
      })
      .finally(() => setLoading(false));
  };

  return (
    <div className="stock-report-container">
      <h2>Stock Report</h2>
      <div className="form-row">
        {/* Company */}
        <div className="form-group">
          <label>Company:</label>
          <select
            value={selectedCompany}
            onChange={(e) => setSelectedCompany(e.target.value)}
          >
            <option value="">Select Company</option>
            {companies.map((c) => (
              <option key={c.compid} value={c.compid}>
                {c.compname}
              </option>
            ))}
          </select>
        </div>
        {/* SBU */}
        <div className="form-group">
          <label>SBU:</label>
          <select
            value={selectedSbu}
            onChange={(e) => setSelectedSbu(e.target.value)}
          >
            <option value="">Select SBU</option>
            {sbus.map((s) => (
              <option key={s.sbuid} value={s.sbuid}>
                {s.sbuname}
              </option>
            ))}
          </select>
        </div>
        {/* As on Date */}
        <div className="form-group">
          <label>As on Date:</label>
          <input
            type="date"
            value={asOnDate}
            onChange={(e) => setAsOnDate(e.target.value)}
          />
        </div>
      </div>

      <div className="center-button">
        <button onClick={handleGenerateReport}>Generate Report</button>
      </div>

      {loading && <p>Loading data...</p>}

      {!loading && reportData && reportData.length > 0 && (
        <table className="report-table">
          <thead>
            <tr>
              <th>Item</th>
              <th>Quantity</th>
            </tr>
          </thead>
          <tbody>
            {reportData.map((item, idx) => (
              <tr key={idx}>
                <td>{item.itemname}</td>
                <td>{item.quantity}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {!loading && reportData && reportData.length === 0 && (
        <p className="no-data-message">
          No stock data found for the selected filters.
        </p>
      )}
    </div>
  );
};

export default StockReport;
