import { useState, useEffect } from "react";
import "./InwardEntry.css";
import axios from "axios";

const InwardEntry = () => {
  const [companies, setCompanies] = useState([]);
  const [sbus, setSbus] = useState([]);
  const [selectedCompany, setSelectedCompany] = useState("");
  const [selectedSbu, setSelectedSbu] = useState("");
  const [vendor, setVendor] = useState("");
  const [poNumber, setPoNumber] = useState("");
  const [poDate, setPoDate] = useState("");
  const [inwardItems, setInwardItems] = useState([]);
  const [itemsFromPO, setItemsFromPO] = useState([]);
  const [poList, setPoList] = useState([]); // All PO IDs

  useEffect(() => {
    axios
      .get("http://localhost:5000/api/po-list")
      .then((res) => setPoList(res.data))
      .catch((err) => console.error("❌ Error fetching PO list:", err));
  }, []);

  useEffect(() => {
    axios
      .get("http://localhost:5000/api/companies")
      .then((res) => setCompanies(res.data))
      .catch((err) => console.error("❌ Error fetching companies:", err));
  }, []);

  useEffect(() => {
    if (selectedCompany) {
      axios
        .get(`http://localhost:5000/api/sbus/${selectedCompany}`)
        .then((res) => setSbus(res.data))
        .catch((err) => console.error("❌ Error fetching SBUs:", err));
    } else {
      setSbus([]);
      setSelectedSbu("");
    }
  }, [selectedCompany]);

  // Fetch PO Data (vendor + items)
  useEffect(() => {
    if (poNumber.trim() !== "") {
      axios
        .get(`http://localhost:5000/api/po/${poNumber}`)
        .then((res) => {
          setVendor(res.data.vendor); // vendor from PO main
          setItemsFromPO(res.data.items); // store available PO items
          setInwardItems([]); // clear previous added items
        })
        .catch((err) => console.error("❌ Error fetching PO details:", err));
    }
  }, [poNumber]);

  const handleAddItemClick = () => {
    setInwardItems([
      ...inwardItems,
      {
        itemid: "",
        quantity: 0,
        paidAmount: 0,
        receivedQuantity: 0,
        currentlyReceiving: 0,
        currentlyPaying: 0,
      },
    ]);
  };
  const handleItemChange = async (index, field, value) => {
    const updatedItems = [...inwardItems];

    if (field === "itemid") {
      const selected = itemsFromPO.find((i) => i.itemid === parseInt(value));
      const itemid = selected.itemid;

      try {
        const response = await axios.get(
          "http://localhost:5000/api/inward/received-quantity",
          {
            params: { poid: poNumber, itemid },
          }
        );

        updatedItems[index] = {
          ...updatedItems[index],
          itemid,
          quantity: selected.quantity,
          paidAmount: selected.amount,
          receivedQuantity: response.data.receivedQuantity || 0,
          amountPaid: response.data.amountPaid || 0, // ✅ added
        };
      } catch (error) {
        console.error("❌ Error fetching inward details:", error);
        updatedItems[index] = {
          ...updatedItems[index],
          itemid,
          quantity: selected.quantity,
          paidAmount: selected.amount,
          receivedQuantity: 0,
          amountPaid: 0,
        };
      }
    } else {
      updatedItems[index][field] = field === "itemid" ? parseInt(value) : value;
    }

    setInwardItems(updatedItems);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const payload = {
      compid: selectedCompany,
      sbuid: selectedSbu,
      vendor,
      poNumber,
      poDate,
      items: inwardItems.map((item) => ({
        itemid: item.itemid,
        currentlyReceiving: item.currentlyReceiving,
        currentlyPaying: item.currentlyPaying,
      })),
    };

    try {
      const response = await axios.post(
        "http://localhost:5000/api/inward/save",
        payload
      );
      console.log("✅ Server response:", response.data);

      alert("✅ Inward entry submitted successfully!");
      console.log("📤 Submitted Inward Entry:", payload);

      // ✅ Clear table
      setInwardItems([]);
    } catch (err) {
      console.error("❌ Error submitting inward entry:", err);
      alert("Error submitting inward entry");
    }
  };

  return (
    <div className="inward-entry-container">
      <h2 className="inward-title">Inward Entry</h2>
      <form className="inward-form" onSubmit={handleSubmit}>
        <div className="inward-grid">
          <div className="inward-field">
            <label>Company:</label>
            <select
              value={selectedCompany}
              onChange={(e) => setSelectedCompany(e.target.value)}
            >
              <option value="">Select Company</option>
              {companies.map((company) => (
                <option key={company.compid} value={company.compid}>
                  {company.compname}
                </option>
              ))}
            </select>
          </div>

          {selectedCompany && (
            <div className="inward-field">
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

          <div className="inward-field">
            <label>PO No:</label>
            <select
              value={poNumber}
              onChange={(e) => setPoNumber(e.target.value)}
            >
              <option value="">Select PO Number</option>
              {poList.map((po) => (
                <option key={po.poid} value={po.poid}>
                  {po.ponumber}
                </option>
              ))}
            </select>
          </div>

          <div className="inward-field">
            <label>Vendor:</label>
            <input type="text" value={vendor} readOnly />
          </div>

          <div className="inward-field">
            <label>PO Date:</label>
            <input
              type="date"
              value={poDate}
              onChange={(e) => setPoDate(e.target.value)}
            />
          </div>
        </div>

        <div className="inward-actions">
          <button type="button" onClick={handleAddItemClick}>
            Add Item
          </button>
        </div>

        {inwardItems.length > 0 && (
          <table className="inward-table">
            <thead>
              <tr>
                <th>Item</th>
                <th>Quantity</th>
                <th>Qouted Amount</th>
                <th>Received Quantity</th>
                <th>Amount Paid</th>
                <th>Currently Receiving</th>
                <th>Currently Paying</th>
              </tr>
            </thead>

            <tbody>
              {inwardItems.map((item, index) => (
                <tr key={index}>
                  <td>
                    <select
                      value={item.itemid}
                      onChange={(e) =>
                        handleItemChange(index, "itemid", e.target.value)
                      }
                    >
                      <option value="">Select Item</option>
                      {itemsFromPO.map((itm) => (
                        <option key={itm.itemid} value={itm.itemid}>
                          {itm.itemname}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td>
                    <input type="number" value={item.quantity} readOnly />
                  </td>
                  <td>
                    <input type="number" value={item.paidAmount} readOnly />
                  </td>
                  <td>
                    <input
                      type="number"
                      value={item.receivedQuantity}
                      readOnly
                    />
                  </td>
                  <td>
                    <input
                      type="number"
                      value={item.amountPaid || 0}
                      readOnly
                    />
                  </td>

                  <td>
                    <input
                      type="number"
                      value={item.currentlyReceiving}
                      onFocus={(e) => {
                        if (e.target.value === "0") {
                          const updatedItems = [...inwardItems];
                          updatedItems[index].currentlyReceiving = "";
                          setInwardItems(updatedItems);
                        }
                      }}
                      onChange={(e) =>
                        handleItemChange(
                          index,
                          "currentlyReceiving",
                          Number(e.target.value)
                        )
                      }
                    />
                  </td>
                  <td>
                    <input
                      type="number"
                      value={item.currentlyPaying}
                      onFocus={(e) => {
                        if (e.target.value === "0") {
                          const updatedItems = [...inwardItems];
                          updatedItems[index].currentlyPaying = "";
                          setInwardItems(updatedItems);
                        }
                      }}
                      onChange={(e) =>
                        handleItemChange(
                          index,
                          "currentlyPaying",
                          Number(e.target.value)
                        )
                      }
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}

        <div className="inward-actions" style={{ marginTop: "1rem" }}>
          <button type="submit">Save Inward</button>
        </div>
      </form>
    </div>
  );
};

export default InwardEntry;
