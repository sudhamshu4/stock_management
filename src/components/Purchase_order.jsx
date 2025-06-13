import { useState, useEffect } from "react";
import axios from "axios";
import "./Purchase_order.css"; // ✅ Import your CSS file

const PurchaseOrderEntry = () => {
  const [companies, setCompanies] = useState([]);
  const [sbus, setSbus] = useState([]);
  const [selectedCompany, setSelectedCompany] = useState("");
  const [selectedSbu, setSelectedSbu] = useState("");
  const [poItems, setPoItems] = useState([]);
  const [additionalCharge, setAdditionalCharge] = useState("");
  const [selectedVendor, setSelectedVendor] = useState("");
  const [poNumber, setPoNumber] = useState("");
  const [poDate, setPoDate] = useState("");
  const [remarks, setRemarks] = useState("");

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

  const handleAddItemClick = () => {
    if (!selectedCompany || !selectedSbu) {
      alert("Please select both Company and SBU");
      return;
    }

    axios
      .get(
        `http://localhost:5000/api/approved-items/${selectedCompany}/${selectedSbu}`
      )
      .then((res) => {
        console.log("✅ API Response:", res.data);

        const items = res.data.map((item) => ({
          ...item,
          poqty: item.approved_quantity,
          amount: 0,
          selected: false,
          prnumber: item.prnumber,
          // `createdby` and `created_by_name` already come from the backend
        }));

        setPoItems(items);
      })
      .catch((err) => {
        console.error("Error fetching PO items:", err);
        alert("Failed to fetch approved items.");
      });
  };

  const handleItemChange = (index, field, value) => {
    const updatedItems = [...poItems];
    updatedItems[index][field] = value;
    setPoItems(updatedItems);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const selectedItems = poItems.filter((item) => item.selected);

    if (!poNumber || !poDate || !selectedVendor || selectedItems.length === 0) {
      alert("Please fill all required fields and select at least one item.");
      return;
    }

    const createdBy = localStorage.getItem("userid"); // ✅ Correct source

    const poMainPayload = {
      ponumber: poNumber,
      podate: poDate,
      vendor: selectedVendor,
      status: "Ordered",
      remark: remarks,
      additional_expense: additionalCharge,
      createdby: createdBy,
      items: selectedItems.map((item) => ({
        itemid: item.itemid,
        quantity: item.poqty,
        amount: item.amount,
        prnumber: item.prnumber, // ✅ include this in each item
      })),
    };

    console.log("Submitting PO Payload:", poMainPayload);
    console.log(
      "🔍 Payload before submit:",
      JSON.stringify(poMainPayload, null, 2)
    );

    try {
      await axios.post(
        "http://localhost:5000/api/save-purchase-order",
        poMainPayload
      );
      alert("PO Entry saved successfully!");

      // Reset form
      setPoNumber("");
      setPoDate("");
      setSelectedVendor("");
      setRemarks("");
      setAdditionalCharge("");
      setPoItems([]);
    } catch (err) {
      console.error("Error saving PO Entry:", err);
      alert("Failed to save PO Entry");
    }
  };

  return (
    <div className="purchase-order-container">
      <h2 className="po-title">PO Entry Screen</h2>
      <form className="po-form" onSubmit={handleSubmit}>
        {/* ... your existing PO entry form fields here ... */}
        <div className="po-grid">
          {/* same as your current fields */}
          <div className="po-field">
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
          <div className="po-field">
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
          <div className="po-field">
            <label>PO No:</label>
            <input
              type="number"
              value={poNumber}
              onChange={(e) => setPoNumber(e.target.value)}
            />
          </div>
          <div className="po-field">
            <label>PO Date:</label>
            <input
              type="date"
              value={poDate}
              onChange={(e) => setPoDate(e.target.value)}
            />
          </div>
          <div className="po-field">
            <label>Vendor:</label>
            <input
              type="text"
              value={selectedVendor}
              onChange={(e) => setSelectedVendor(e.target.value)}
            />
          </div>
          <div className="po-field">
            <label>Remarks:</label>
            <textarea
              value={remarks}
              onChange={(e) => setRemarks(e.target.value)}
            />
          </div>
        </div>

        <div className="po-actions">
          <button type="button" onClick={handleAddItemClick}>
            Add Item
          </button>
        </div>

        {poItems.length > 0 && (
          <>
            <table className="po-table">
              <thead>
                <tr>
                  <th>Select</th>
                  <th>PR No</th>
                  <th>Created By</th> {/* ✅ Shows username */}
                  <th>Approved By</th>
                  <th>Item</th>
                  <th>Approved Qty</th>
                  <th>PO Qty</th>
                  <th>Amount</th>
                </tr>
              </thead>
              <tbody>
                {poItems.map((item, index) => (
                  <tr key={`${item.prnumber}_${item.itemid}`}>
                    <td>
                      <input
                        type="checkbox"
                        checked={item.selected}
                        onChange={(e) =>
                          handleItemChange(index, "selected", e.target.checked)
                        }
                      />
                    </td>
                    <td>{item.prnumber || "N/A"}</td>
                    <td>{item.created_by_name || "N/A"}</td> {/* ✅ Changed */}
                    <td>{item.approved_by_name || "N/A"}</td>
                    <td>{item.itemname}</td>
                    <td>{item.approved_quantity}</td>
                    <td>
                      <input
                        type="number"
                        value={item.poqty}
                        min="1"
                        max={item.approved_quantity}
                        onChange={(e) =>
                          handleItemChange(
                            index,
                            "poqty",
                            Number(e.target.value)
                          )
                        }
                      />
                    </td>
                    <td>
                      <input
                        type="number"
                        value={item.amount}
                        min="0"
                        onChange={(e) =>
                          handleItemChange(index, "amount", e.target.value)
                        }
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            <div className="po-field" style={{ marginTop: "1rem" }}>
              <label>Additional Charges:</label>
              <input
                type="number"
                value={additionalCharge}
                onChange={(e) => setAdditionalCharge(e.target.value)}
              />
            </div>
          </>
        )}

        <div className="po-actions" style={{ marginBottom: "4rem" }}>
          <button type="submit">Save PO</button>
        </div>
      </form>
    </div>
  );
};

export default PurchaseOrderEntry;
