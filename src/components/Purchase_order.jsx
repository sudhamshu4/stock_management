import { useState, useEffect } from "react";

const PurchaseOrderEntryPage = () => {
  const [purchaseRequests, setPurchaseRequests] = useState([]);
  const [selectedItems, setSelectedItems] = useState([]);
  const [purchaseOrderNumber] = useState(`PO-${Date.now()}`); // Removed unused setter

  useEffect(() => {
    fetch("/api/approved-purchase-requests")
      .then((res) => res.json())
      .then((data) => setPurchaseRequests(data))
      .catch((err) => console.error("Error fetching requests:", err));
  }, []);

  const handleAddItem = (item) => {
    setSelectedItems((prev) => [...prev, { ...item, price: 0 }]);
  };

  return (
    <div>
      <h1>Purchase Order Entry</h1>
      <h2>PO Number: {purchaseOrderNumber}</h2>

      <table>
        <thead>
          <tr>
            <th>PR Number</th>
            <th>Item</th>
            <th>Quantity</th>
            <th>Action</th>
          </tr>
        </thead>
        <tbody>
          {purchaseRequests.map((req) => (
            <tr key={req.id}>
              <td>{req.prNumber}</td>
              <td>{req.item}</td>
              <td>{req.quantity}</td>
              <td>
                <button onClick={() => handleAddItem(req)}>Add</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <h2>Selected Items for Purchase Order</h2>
      <table>
        <thead>
          <tr>
            <th>Item</th>
            <th>Quantity</th>
            <th>Price</th>
          </tr>
        </thead>
        <tbody>
          {selectedItems.map((item, index) => (
            <tr key={index}>
              <td>{item.item}</td>
              <td>{item.quantity}</td>
              <td>
                <input
                  type="number"
                  value={item.price}
                  onChange={(e) => {
                    const updatedItems = [...selectedItems];
                    updatedItems[index].price = Number(e.target.value);
                    setSelectedItems(updatedItems);
                  }}
                />
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <h2>
        Total Amount:{" "}
        {selectedItems.reduce(
          (sum, item) => sum + item.quantity * item.price,
          0
        )}
      </h2>
    </div>
  );
};

export default PurchaseOrderEntryPage;
