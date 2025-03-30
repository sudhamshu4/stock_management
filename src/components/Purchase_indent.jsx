import { useState, useEffect } from "react";
import axios from "axios";
import "./Purchase_indent.css";

const Purchase_indent = () => {
  const [prNumber, setPrNumber] = useState(""); // ✅ Added state for PR number
  const [company, setCompany] = useState("");
  const [sbu, setSbu] = useState("");
  const [department, setDepartment] = useState("");
  const [itemEntry, setItemEntry] = useState({ item: "", qty: "", remark: "" });
  const [items, setItems] = useState([]);

  const [companies, setCompanies] = useState([]);
  const [sbus, setSbus] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [itemList, setItemList] = useState([]);

  useEffect(() => {
    // ✅ Fetch PR Number
    axios
      .get("http://localhost:5000/api/get-pr-number")
      .then((res) => setPrNumber(res.data.prNumber))
      .catch((err) => console.log(err));

    axios
      .get("http://localhost:5000/api/companies")
      .then((res) => setCompanies(res.data))
      .catch((err) => console.log(err));

    axios
      .get("http://localhost:5000/api/items")
      .then((res) => setItemList(res.data))
      .catch((err) => console.log(err));
  }, []);

  useEffect(() => {
    if (company) {
      axios
        .get(`http://localhost:5000/api/sbus/${company}`)
        .then((res) => setSbus(res.data))
        .catch((err) => console.log(err));
    }
  }, [company]);

  useEffect(() => {
    if (sbu) {
      axios
        .get(`http://localhost:5000/api/departments/${sbu}`)
        .then((res) => setDepartments(res.data))
        .catch((err) => console.log(err));
    }
  }, [sbu]);

  const handleAddItem = () => {
    if (!itemEntry.item || !itemEntry.qty) {
      alert("Please select an item and enter a quantity.");
      return;
    }
    setItems([...items, itemEntry]);
    setItemEntry({ item: "", qty: "", remark: "" });
  };

  const handleDeleteItem = (index) => {
    const updatedItems = [...items];
    updatedItems.splice(index, 1);
    setItems(updatedItems);
  };

  const handleSavePR = async () => {
    if (!company || !sbu || !department) {
      alert("Please select Company, SBU, and Department.");
      return;
    }
    if (items.length === 0) {
      alert("Please add at least one item before saving.");
      return;
    }

    const prData = {
      compid: company,
      sbuid: sbu,
      deptid: department,
      items: items,
    };

    try {
      const response = await axios.post(
        "http://localhost:5000/api/save-pr",
        prData
      );
      console.log(response.data);
      alert("PR Saved Successfully");
      setItems([]);
    } catch (error) {
      console.error(error);
      alert("Error saving PR");
    }
  };

  return (
    <div className="dashboard">
      <h2>Purchase Request Entry</h2>

      {/* ✅ Display PR Number */}
      <div className="form-section">
        <label>PR Number:</label> {prNumber}
      </div>

      <div className="form-section">
        <label>Company:</label>
        <select value={company} onChange={(e) => setCompany(e.target.value)}>
          <option value="">Select Company</option>
          {companies.map((comp) => (
            <option key={comp.compid} value={comp.compid}>
              {comp.compname}
            </option>
          ))}
        </select>

        <label>SBU:</label>
        <select value={sbu} onChange={(e) => setSbu(e.target.value)}>
          <option value="">Select SBU</option>
          {sbus.map((sb) => (
            <option key={sb.sbuid} value={sb.sbuid}>
              {sb.sbuname}
            </option>
          ))}
        </select>

        <label>Department:</label>
        <select
          value={department}
          onChange={(e) => setDepartment(e.target.value)}
        >
          <option value="">Select Department</option>
          {departments.map((dept) => (
            <option key={dept.deptid} value={dept.deptid}>
              {dept.deptname}
            </option>
          ))}
        </select>
      </div>

      <div className="item-entry">
        <label>Item:</label>
        <select
          value={itemEntry.item}
          onChange={(e) => setItemEntry({ ...itemEntry, item: e.target.value })}
        >
          <option value="">Select Item</option>
          {itemList.map((it) => (
            <option key={it.itemid} value={it.itemid}>
              {it.itemname}
            </option>
          ))}
        </select>

        <label>Qty:</label>
        <input
          type="number"
          value={itemEntry.qty}
          onChange={(e) => setItemEntry({ ...itemEntry, qty: e.target.value })}
        />

        <label>Remark:</label>
        <input
          type="text"
          value={itemEntry.remark}
          onChange={(e) =>
            setItemEntry({ ...itemEntry, remark: e.target.value })
          }
        />

        <button onClick={handleAddItem}>Add</button>
      </div>

      <table>
        <thead>
          <tr>
            <th>Item</th>
            <th>Qty</th>
            <th>Remark</th>
            <th>Action</th>
          </tr>
        </thead>
        <tbody>
          {items.map((it, index) => (
            <tr key={index}>
              <td>
                {itemList.find((i) => i.itemid === parseInt(it.item))?.itemname}
              </td>
              <td>{it.qty}</td>
              <td>{it.remark}</td>
              <td>
                <button onClick={() => handleDeleteItem(index)}>Delete</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <button onClick={handleSavePR}>Save</button>
    </div>
  );
};

export default Purchase_indent;
