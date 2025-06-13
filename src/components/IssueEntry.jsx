import { useEffect, useState } from "react";
import axios from "axios";
import "./IssueEntry.css";

const IssueEntry = () => {
  const [companies, setCompanies] = useState([]);
  const [sbus, setSbus] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [itemsList, setItemsList] = useState([]);

  const [selectedCompany, setSelectedCompany] = useState("");
  const [selectedSbu, setSelectedSbu] = useState("");
  const [selectedEmployee, setSelectedEmployee] = useState("");
  const [issueDate, setIssueDate] = useState("");

  const [item, setItem] = useState("");
  const [quantity, setQuantity] = useState("");
  const [remarks, setRemarks] = useState("");

  const [issueItems, setIssueItems] = useState([]);

  // Fetch companies and items on mount
  useEffect(() => {
    axios
      .get("http://localhost:5000/api/companies")
      .then((res) => setCompanies(res.data))
      .catch((err) => console.error("❌ Error fetching companies:", err));

    axios
      .get("http://localhost:5000/api/items")
      .then((res) => setItemsList(res.data))
      .catch((err) => console.error("❌ Error fetching items:", err));
  }, []);

  // Fetch SBUs
  useEffect(() => {
    if (selectedCompany) {
      axios
        .get(`http://localhost:5000/api/sbus/${selectedCompany}`)
        .then((res) => setSbus(res.data))
        .catch((err) => console.error("❌ Error fetching SBUs:", err));
    } else {
      setSbus([]);
    }
  }, [selectedCompany]);

  // Fetch employees
  useEffect(() => {
    if (selectedSbu) {
      axios
        .get(`http://localhost:5000/api/employees/${selectedSbu}`)
        .then((res) => setEmployees(res.data))
        .catch((err) => console.error("❌ Error fetching employees:", err));
    } else {
      setEmployees([]);
    }
  }, [selectedSbu]);

  const handleAddItem = async () => {
    if (item && quantity && remarks) {
      const selectedItem = itemsList.find((i) => i.itemid === parseInt(item));

      try {
        const res = await axios.get(
          `http://localhost:5000/api/item-quantity/${item}`
        );
        const availableQuantity = res.data.quantity;

        if (parseInt(quantity) > availableQuantity) {
          alert(
            `❌ Quantity exceeds available stock (${availableQuantity} available)`
          );
          return;
        }

        const newItem = {
          itemid: selectedItem.itemid,
          itemname: selectedItem.itemname,
          quantity,
          remarks,
        };

        setIssueItems([...issueItems, newItem]);
      } catch (err) {
        console.error("❌ Error fetching item quantity:", err);
        alert("Error checking item quantity");
      }
    } else {
      alert("Please fill all item fields before adding.");
    }
  };

  const handleDeleteItem = (index) => {
    const updatedItems = [...issueItems];
    updatedItems.splice(index, 1);
    setIssueItems(updatedItems);
  };
  const handleSubmit = (e) => {
    e.preventDefault();

    const userId = localStorage.getItem("userid");

    if (!userId) {
      alert("User not logged in. Please login first.");
      return;
    }

    const payload = {
      compid: selectedCompany,
      sbuid: selectedSbu,
      empid: selectedEmployee,
      date: issueDate,
      items: issueItems,
      createdBy: parseInt(userId), // make sure it's a number
    };

    console.log("Payload being sent:", payload);

    axios
      .post("http://localhost:5000/api/issue-entry", payload)
      .then(() => {
        alert("✅ Issue entry saved");
        setSelectedCompany("");
        setSelectedSbu("");
        setSelectedEmployee("");
        setIssueDate("");
        setItem("");
        setQuantity("");
        setRemarks("");
        setIssueItems([]);
      })
      .catch((err) => {
        console.error("❌ Error submitting issue entry:", err);
        alert("Failed to save issue entry");
      });
  };

  return (
    <div className="issue-entry-container">
      <h2>Issue Entry</h2>
      <form onSubmit={handleSubmit} className="issue-form">
        <div className="issue-grid">
          <div className="issue-field">
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

          {selectedCompany && (
            <div className="issue-field">
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
          )}

          {selectedSbu && (
            <>
              <div className="issue-field">
                <label>Employee:</label>
                <select
                  value={selectedEmployee}
                  onChange={(e) => setSelectedEmployee(e.target.value)}
                >
                  <option value="">Select Employee</option>
                  {employees.map((e) => (
                    <option key={e.empid} value={e.empid}>
                      {e.empname}
                    </option>
                  ))}
                </select>
              </div>

              <div className="issue-field">
                <label>Date:</label>
                <input
                  type="date"
                  value={issueDate}
                  onChange={(e) => setIssueDate(e.target.value)}
                />
              </div>

              <div className="item-section">
                <h3>Add Item</h3>
                <div className="item-row">
                  <select
                    value={item}
                    onChange={(e) => setItem(e.target.value)}
                  >
                    <option value="">Select Item</option>
                    {itemsList.map((itm) => (
                      <option key={itm.itemid} value={itm.itemid}>
                        {itm.itemname}
                      </option>
                    ))}
                  </select>
                  <input
                    type="number"
                    placeholder="Quantity"
                    value={quantity}
                    onChange={(e) => setQuantity(e.target.value)}
                  />
                  <input
                    type="text"
                    placeholder="Remarks"
                    value={remarks}
                    onChange={(e) => setRemarks(e.target.value)}
                  />
                  <button type="button" onClick={handleAddItem}>
                    Add
                  </button>
                </div>
              </div>

              {issueItems.length > 0 && (
                <table className="issue-table">
                  <thead>
                    <tr>
                      <th>Item</th>
                      <th>Quantity</th>
                      <th>Remarks</th>
                      <th>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {issueItems.map((row, i) => (
                      <tr key={i}>
                        <td>{row.itemname}</td>
                        <td>{row.quantity}</td>
                        <td>{row.remarks}</td>
                        <td>
                          <button
                            type="button"
                            onClick={() => handleDeleteItem(i)}
                          >
                            Delete
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
              <div className="submit-button-container">
                <button type="submit">Save Issue Entry</button>
              </div>
            </>
          )}
        </div>
      </form>
    </div>
  );
};

export default IssueEntry;
