import { useState } from "react";
import "./InwardEntry.css"; // Optional CSS file for styling

const InwardEntry = () => {
  const [formData, setFormData] = useState({
    item: "",
    purchaseOrder: "",
    quantity: "",
    billNo: "",
    billDate: "",
    vendor: "",
  });

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    console.log("Submitted Data:", formData);
    alert("Inward Entry Submitted Successfully!");

    // You can send this data to an API if needed
    // fetch('/api/inward-entry', { method: 'POST', body: JSON.stringify(formData) })

    // Clear form after submission
    setFormData({
      item: "",
      purchaseOrder: "",
      quantity: "",
      billNo: "",
      billDate: "",
      vendor: "",
    });
  };

  return (
    <div className="inward-entry-container">
      <h2>Inward Entry</h2>
      <form onSubmit={handleSubmit} className="inward-form">
        <label>Item Name:</label>
        <input
          type="text"
          name="item"
          value={formData.item}
          onChange={handleChange}
          required
        />

        <label>Purchase Order Number:</label>
        <input
          type="text"
          name="purchaseOrder"
          value={formData.purchaseOrder}
          onChange={handleChange}
          required
        />

        <label>Quantity:</label>
        <input
          type="number"
          name="quantity"
          value={formData.quantity}
          onChange={handleChange}
          required
        />

        <label>Bill Number:</label>
        <input
          type="text"
          name="billNo"
          value={formData.billNo}
          onChange={handleChange}
          required
        />

        <label>Bill Date:</label>
        <input
          type="date"
          name="billDate"
          value={formData.billDate}
          onChange={handleChange}
          required
        />

        <label>Vendor:</label>
        <input
          type="text"
          name="vendor"
          value={formData.vendor}
          onChange={handleChange}
          required
        />

        <button type="submit">Submit</button>
      </form>
    </div>
  );
};

export default InwardEntry;
