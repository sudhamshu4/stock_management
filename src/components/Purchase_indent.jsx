import { useState, useEffect } from "react";
import { useRef } from "react";
import axios from "axios";
import "./Purchase_indent.css";
import "./Purchase_order.css";

const Purchase_indent = () => {
  const [showOtherItemForm, setShowOtherItemForm] = useState(false);
  const [newOtherItem, setNewOtherItem] = useState({
    name: "",
    subcategory: "",
  });
  const [subcategories, setSubcategories] = useState([]);

  const [company, setCompany] = useState("");
  const [sbu, setSbu] = useState("");
  const [department, setDepartment] = useState("");
  const [itemEntry, setItemEntry] = useState({
    item: "",
    qty: "",
    remark: "",
    customItem: "",
  });
  const [items, setItems] = useState([]);

  const [companies, setCompanies] = useState([]);
  const [sbus, setSbus] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [itemList, setItemList] = useState([]);

  useEffect(() => {
    axios
      .get(`http://localhost:5000/api/companies`)
      .then((res) => setCompanies(res.data))
      .catch((err) => console.error("Error fetching companies:", err));

    axios
      .get("http://localhost:5000/api/items")
      .then((res) =>
        setItemList([...res.data, { itemid: "other", itemname: "Other" }])
      )
      .catch((err) => console.error("Error fetching items:", err));
  }, []);

  useEffect(() => {
    if (company) {
      axios
        .get(`http://localhost:5000/api/sbus/${company}`)
        .then((res) => setSbus(res.data))
        .catch((err) => console.error("Error fetching SBUs:", err));

      setSbu("");
      setDepartments([]);
      setDepartment("");
    } else {
      setSbus([]);
      setDepartments([]);
    }
  }, [company]);

  useEffect(() => {
    if (sbu) {
      axios
        .get(`http://localhost:5000/api/departments/${sbu}`)
        .then((res) => setDepartments(res.data))
        .catch((err) => console.error("Error fetching Departments:", err));

      setDepartment("");
    } else {
      setDepartments([]);
    }
  }, [sbu]);

  const indexRef = useRef(0); // Persistent index for "Other" items

  useEffect(() => {
    axios
      .get("http://localhost:5000/api/subcategories")
      .then((res) => setSubcategories(res.data))
      .catch((err) => console.error("Error fetching subcategories:", err));
  }, []);

  const handleAddItem = async () => {
    if (!itemEntry.item || !itemEntry.qty) {
      alert("Please select an item and enter a quantity.");
      return;
    }

    const selectedItem = itemList.find(
      (it) => String(it.itemid) === String(itemEntry.item)
    );

    const newItem = {
      item: itemEntry.item === "other" ? itemEntry.customItem : itemEntry.item,
      itemName:
        itemEntry.item === "other"
          ? itemEntry.customItem
          : selectedItem?.itemname || "Unknown",
      qty: itemEntry.qty,
      remark: itemEntry.remark,
    };

    if (itemEntry.item === "other") {
      try {
        const response = await fetch(
          "http://localhost:5000/api/get-max-itemid"
        );
        const data = await response.json();

        if (response.ok) {
          const { maxItemMaster, maxItemDetail } = data;

          // Calculate the new unique itemid
          const lastItemId = Math.max(maxItemMaster, maxItemDetail) + 1;

          // Increment first to ensure unique itemid per "Other" item
          indexRef.current++;
          newItem.itemid = lastItemId + indexRef.current;

          console.log(
            `ℹItem: ${newItem.itemName}, Storing itemid: ${newItem.itemid}`
          );
        } else {
          console.error("error fetching max item IDs:", data.error);
          newItem.itemid = 1001; // Fallback if error occurs
        }
      } catch (error) {
        console.error("Fetch error:", error);
        newItem.itemid = 1001; // Fallback if error occurs
      }
    }

    setItems([...items, newItem]); // Add new item to list
  };

  const handleDeleteItem = (index) => {
    setItems(items.filter((_, i) => i !== index));
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

    // ✅ Get logged-in user ID from localStorage
    const loggedInUser = JSON.parse(localStorage.getItem("user"));
    if (!loggedInUser || !loggedInUser.userid) {
      alert("User not logged in. Please log in again.");
      return;
    }

    // ✅ Ensure itemname is included before sending
    const prData = {
      compid: company,
      sbuid: sbu,
      deptid: department,
      createdby: loggedInUser.userid, // ✅ Dynamically get user ID
      items: items.map((it) => ({
        item: it.item, // itemid or "other"
        itemName: it.itemName, // item name for display
        qty: it.qty,
        remark: it.remark,
      })),
    };

    try {
      await axios.post("http://localhost:5000/api/save-pr", prData);
      alert("Purchase Request Saved Successfully");
      setItems([]);
    } catch (error) {
      console.error("Error saving PR:", error);
      alert("Error saving PR");
    }
  };

  return (
    <div className="dashboard">
      <h2>Purchase Request Entry</h2>

      {/* Dropdown Section*/}
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
        <select
          value={sbu}
          onChange={(e) => setSbu(e.target.value)}
          disabled={!company}
        >
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
          disabled={!sbu}
        >
          <option value="">Select Department</option>
          {departments.map((dept) => (
            <option key={dept.deptid} value={dept.deptid}>
              {dept.deptname}
            </option>
          ))}
        </select>
      </div>

      {/* Item Entry Section */}
      <div className="item-entry">
        <label>Item:</label>
        <select
          value={itemEntry.item}
          onChange={(e) =>
            setItemEntry({
              ...itemEntry,
              item: e.target.value,
              itemName:
                itemList.find((it) => it.itemid === e.target.value)?.itemname ||
                "",
              customItem: "",
            })
          }
        >
          <option value="">Select Item</option>
          {itemList.map((it) => (
            <option key={it.itemid} value={it.itemid}>
              {it.itemname}
            </option>
          ))}
        </select>

        {itemEntry.item === "other" && (
          <>
            <button onClick={() => setShowOtherItemForm(true)}>
              Enter New Item
            </button>
            {showOtherItemForm && (
              <div className="modal">
                <h4>Add New Item</h4>
                <label>Item Name:</label>
                <input
                  type="text"
                  value={newOtherItem.name}
                  onChange={(e) =>
                    setNewOtherItem({ ...newOtherItem, name: e.target.value })
                  }
                />

                <label>Subcategory:</label>
                <select
                  value={newOtherItem.subcategory}
                  onChange={(e) =>
                    setNewOtherItem({
                      ...newOtherItem,
                      subcategory: e.target.value,
                    })
                  }
                >
                  <option value="">Select Subcategory</option>
                  {subcategories.map((sub) => (
                    <option key={sub.subcategoryid} value={sub.subcategoryid}>
                      {sub.subcategoryname}
                    </option>
                  ))}
                </select>

                <button
                  onClick={async () => {
                    if (!newOtherItem.name || !newOtherItem.subcategory) {
                      alert("Please enter all details.");
                      return;
                    }

                    try {
                      const res = await axios.post(
                        "http://localhost:5000/api/add-other-item",
                        {
                          itemname: newOtherItem.name,
                          subcategoryid: newOtherItem.subcategory,
                        }
                      );

                      // Add the new item to the itemList
                      const newItem = {
                        itemid: res.data.itemid,
                        itemname: res.data.itemname,
                      };
                      setItemList((prev) => [...prev, newItem]);

                      setItemEntry({ ...itemEntry, item: newItem.itemid });
                      setShowOtherItemForm(false);
                    } catch (err) {
                      console.error("Error adding item:", err);
                      alert("Failed to add item.");
                    }
                  }}
                >
                  Add Item
                </button>
              </div>
            )}
          </>
        )}

        <label>Qty:</label>
        <input
          type="number"
          value={itemEntry.qty}
          onChange={(e) => {
            const value = Math.max(0, Number(e.target.value)); //ensures non negative
            setItemEntry({ ...itemEntry, qty: value });
          }}
        />

        <label>Remark:</label>
        <input
          type="text"
          value={itemEntry.remark}
          onChange={(e) =>
            setItemEntry({ ...itemEntry, remark: e.target.value })
          }
        />

        <button onClick={handleAddItem}>Add Item</button>
      </div>

      {/* Items Table */}
      <table>
        <thead>
          <tr>
            <th>Item Name</th>
            <th>Qty</th>
            <th>Remark</th>
            <th>Action</th>
          </tr>
        </thead>
        <tbody>
          {items.map((it, index) => (
            <tr key={index}>
              <td>{it.itemName}</td>
              <td>{it.qty}</td>
              <td>{it.remark}</td>
              <td>
                <button onClick={() => handleDeleteItem(index)}>Delete</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Save Button*/}
      <button onClick={handleSavePR}>Save</button>
    </div>
  );
};

export default Purchase_indent;
