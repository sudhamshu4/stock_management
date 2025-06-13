import { useState, useEffect } from "react";
import "./ReturnEntry.css";
import axios from "axios";

const ReturnEntry = () => {
  const [companies, setCompanies] = useState([]);
  const [sbus, setSbus] = useState([]);
  const [selectedCompany, setSelectedCompany] = useState("");
  const [selectedSbu, setSelectedSbu] = useState("");
  const [employees, setEmployees] = useState([]);
  const [selectedEmp, setSelectedEmp] = useState("");
  const [empStatus, setEmpStatus] = useState("Active");
  const [returnDate, setReturnDate] = useState("");
  const [showItems, setShowItems] = useState(false);
  const [items, setItems] = useState([]);

  const user = JSON.parse(localStorage.getItem("user")) || {};
  const userid = user.userid || "";

  useEffect(() => {
    axios
      .get("http://localhost:5000/api/companies")
      .then((res) => setCompanies(res.data))
      .catch((err) => console.error("Error loading companies:", err));
  }, []);

  useEffect(() => {
    if (selectedCompany) {
      axios
        .get(`http://localhost:5000/api/sbus/${selectedCompany}`)
        .then((res) => setSbus(res.data))
        .catch((err) => console.error("Error loading SBUs:", err));
    }
  }, [selectedCompany]);

  useEffect(() => {
    if (selectedCompany && selectedSbu) {
      axios
        .get(
          `http://localhost:5000/api/employees/${selectedCompany}/${selectedSbu}`
        )
        .then((res) => setEmployees(res.data))
        .catch((err) => console.error("Error loading employees:", err));
    }
  }, [selectedCompany, selectedSbu]);

  const handleAddItemsClick = () => {
    setShowItems(true);
    axios
      .get(`http://localhost:5000/api/issued-items/${selectedEmp}`)
      .then((res) => {
        const withMetadata = res.data.map((item) => ({
          ...item,
          returnQty: 0,
          remark: "",
          selected: false,
        }));
        setItems(withMetadata);
      })
      .catch((err) => console.error("Error loading issued items:", err));
  };

  const handleQtyChange = (index, value) => {
    const newItems = [...items];
    newItems[index].returnQty = Number(value);
    setItems(newItems);
  };

  const handleRemarkChange = (index, value) => {
    const newItems = [...items];
    newItems[index].remark = value;
    setItems(newItems);
  };

  const handleCheckboxChange = (index, checked) => {
    const newItems = [...items];
    newItems[index].selected = checked;
    setItems(newItems);
  };

  const handleSave = async () => {
    const selectedItems = items.filter(
      (item) => item.selected && item.returnQty > 0
    );

    if (!returnDate || !selectedEmp || selectedItems.length === 0) {
      alert("Please select items and enter required fields.");
      return;
    }

    try {
      const payload = {
        empid: selectedEmp,
        returnDate,
        status: empStatus,
        createdby: userid,
        items: selectedItems.map((item) => ({
          itemid: item.itemid,
          returnQty: item.returnQty,
          remark: item.remark,
        })),
      };

      await axios.post("http://localhost:5000/api/return-items", payload);
      alert("Return saved successfully!");
      setShowItems(false);
      setItems([]);
    } catch (error) {
      console.error("Error saving return:", error);
      alert("Error saving return.");
    }
  };

  return (
    <div className="return-container">
      <h2>Return Entry</h2>
      <div className="return-form">
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

        <div className="form-group">
          <label>Employee:</label>
          <select
            value={selectedEmp}
            onChange={(e) => setSelectedEmp(e.target.value)}
          >
            <option value="">Select Employee</option>
            {employees.map((e) => (
              <option key={e.empid} value={e.empid}>
                {e.empname}
              </option>
            ))}
          </select>
        </div>

        <div className="form-group">
          <label>Date:</label>
          <input
            type="date"
            value={returnDate}
            onChange={(e) => setReturnDate(e.target.value)}
          />
        </div>

        <div className="form-group">
          <label>Employee Status:</label>
          <select
            value={empStatus}
            onChange={(e) => setEmpStatus(e.target.value)}
          >
            <option value="Active">Active</option>
            <option value="Inactive">Inactive</option>
          </select>
        </div>

        <div className="form-group center-button">
          <button type="button" onClick={handleAddItemsClick}>
            Items
          </button>
        </div>
      </div>

      {showItems && (
        <table className="return-table">
          <thead>
            <tr>
              <th>Select</th>
              <th>Item</th>
              <th>Issue Quantity</th>
              <th>Return Quantity</th>
              <th>Remark</th>
            </tr>
          </thead>
          <tbody>
            {items.map((item, index) => (
              <tr key={item.itemid}>
                <td>
                  <input
                    type="checkbox"
                    checked={item.selected}
                    onChange={(e) =>
                      handleCheckboxChange(index, e.target.checked)
                    }
                  />
                </td>
                <td>{item.itemname}</td>
                <td>{item.issuedQty}</td>
                <td>
                  <input
                    type="number"
                    value={item.returnQty}
                    min="0"
                    max={item.issuedQty}
                    onChange={(e) => handleQtyChange(index, e.target.value)}
                  />
                </td>
                <td>
                  <input
                    type="text"
                    value={item.remark}
                    onChange={(e) => handleRemarkChange(index, e.target.value)}
                  />
                </td>
              </tr>
            ))}
            <tr>
              <td colSpan="5" style={{ textAlign: "center" }}>
                <button onClick={handleSave}>Save</button>
              </td>
            </tr>
          </tbody>
        </table>
      )}
    </div>
  );
};

export default ReturnEntry;
