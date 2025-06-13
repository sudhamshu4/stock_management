const express = require("express");
const mysql = require("mysql2");
const cors = require("cors");
const bcrypt = require("bcrypt");
require("dotenv").config();

const app = express();
app.use(cors());
app.use(express.json());

// ✅ Database Connection
const db = mysql.createConnection({
  host: "localhost",
  user: "root",
  password: "12354",
  database: "inventory_db",
  port: 3307,
});

db.connect((err) => {
  if (err) {
    console.error("Database connection failed: " + err.stack);
    return;
  }
  console.log("✅ Connected to MariaDB");
});

/* ------------------- 🔐 AUTH ROUTES ------------------- */

// ✅ Signup
app.post("/signup", async (req, res) => {
  const { userid, username, password, role } = req.body;

  try {
    db.query(
      "SELECT userid FROM user_master WHERE userid = ?",
      [userid],
      async (err, results) => {
        if (err) return res.status(500).json({ error: "Database error" });
        if (results.length > 0)
          return res.status(400).json({ error: "User ID already exists" });

        const hashedPassword = await bcrypt.hash(password, 10);
        const insertQuery = `
        INSERT INTO user_master (userid, username, password, status, roles)
        VALUES (?, ?, ?, 'active', ?)`;

        db.query(
          insertQuery,
          [userid, username, hashedPassword, role],
          (err) => {
            if (err) return res.status(400).json({ error: err.sqlMessage });
            res.json({ message: "User registered successfully" });
          }
        );
      }
    );
  } catch {
    res.status(500).json({ error: "Server error" });
  }
});

app.post("/login", (req, res) => {
  const { username, password } = req.body;

  db.query(
    "SELECT * FROM user_master WHERE username = ?",
    [username],
    async (err, results) => {
      if (err || results.length === 0)
        return res.status(401).json({ error: "User not found" });

      const isMatch = await bcrypt.compare(password, results[0].password);
      if (!isMatch)
        return res.status(401).json({ error: "Incorrect password" });

      // ✅ Get role from user_master table and include it in response
      res.json({
        message: "Login successful",
        user: {
          userid: results[0].userid,
          username: results[0].username,
          role: results[0].roles, // ✅ This comes from database
        },
      });
    }
  );
});

/* ------------------- 🧾 PURCHASE INDENT ROUTES ------------------- */

// ✅ Companies
app.get("/api/companies", (req, res) => {
  db.query("SELECT compid, compname FROM company_master", (err, results) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(results);
  });
});

// ✅ SBUs by Company
app.get("/api/sbus/:companyId", (req, res) => {
  db.query(
    "SELECT sbuid, sbuname FROM sbu_master WHERE compid = ?",
    [req.params.companyId],
    (err, results) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json(results);
    }
  );
});

// ✅ Employees by Company and SBU
app.get("/api/employees/:companyId/:sbuId", (req, res) => {
  const { companyId, sbuId } = req.params;
  const query = `
    SELECT empid, empname 
    FROM employee_master 
    WHERE compid = ? AND sbuid = ?
  `;

  db.query(query, [companyId, sbuId], (err, results) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(results);
  });
});

// ✅ Employees by SBU
app.get("/api/employees/:sbuId", (req, res) => {
  const sbuId = req.params.sbuId;
  db.query(
    "SELECT empid, empname FROM employee_master WHERE sbuid = ? AND status = 'active'",
    [sbuId],
    (err, results) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json(results);
    }
  );
});

// ✅ Departments by SBU
app.get("/api/departments/:sbuId", (req, res) => {
  db.query(
    "SELECT deptid, deptname FROM department WHERE sbuid = ?",
    [req.params.sbuId],
    (err, results) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json(results);
    }
  );
});

// ✅ Items with "Other"
app.get("/api/items", (req, res) => {
  db.query("SELECT itemid, itemname FROM item_master", (err, results) => {
    if (err) return res.status(500).json({ error: err.message });
    results.push({ itemid: "other", itemname: "Other" });
    res.json(results);
  });
});

app.post("/api/add-other-item", (req, res) => {
  const { itemname, subcategoryid } = req.body;

  if (!itemname || !subcategoryid) {
    return res
      .status(400)
      .json({ error: "Missing item name or subcategory ID" });
  }

  const insertQuery = `
    INSERT INTO item_master (subcategoryid, itemname, quantity)
    VALUES (?, ?, 0)
  `;

  db.query(insertQuery, [subcategoryid, itemname], (err, result) => {
    if (err) {
      console.error("Error inserting other item:", err);
      return res.status(500).json({ error: "Database insert error" });
    }

    // Return the newly inserted itemid for further use
    res.json({ itemid: result.insertId, itemname });
  });
});

app.get("/api/subcategories", (req, res) => {
  db.query(
    "SELECT subcategoryid, subcategoryname FROM item_subcategory",
    (err, results) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json(results);
    }
  );
});

// ✅ Get Max Item ID from both tables
app.get("/api/get-max-itemid", (req, res) => {
  const masterSql = "SELECT MAX(itemid) AS maxItemMaster FROM item_master";
  const detailSql =
    "SELECT MAX(itemid) AS maxItemDetail FROM purchase_request_detail";

  db.query(masterSql, (err, masterResult) => {
    if (err)
      return res.status(500).json({ error: "DB error", details: err.message });
    const maxItemMaster = parseInt(masterResult[0].maxItemMaster) || 1000;

    db.query(detailSql, (err, detailResult) => {
      if (err)
        return res
          .status(500)
          .json({ error: "DB error", details: err.message });
      const maxItemDetail = parseInt(detailResult[0].maxItemDetail) || 0;

      res.json({ maxItemMaster, maxItemDetail });
    });
  });
});

// ✅ Save PR (Main + Detail)
app.post("/api/save-pr", (req, res) => {
  const { compid, sbuid, deptid, createdby, items } = req.body;

  if (!compid || !sbuid || !deptid || !items.length) {
    return res.status(400).json({ error: "Missing required fields" });
  }

  const insertMainSql = `
    INSERT INTO purchase_request_main (compid, sbuid, deptid, prdate, createdby)
    VALUES (?, ?, ?, CURDATE(), ?)`;

  db.query(insertMainSql, [compid, sbuid, deptid, createdby], (err, result) => {
    if (err)
      return res
        .status(500)
        .json({ error: "Insert error", details: err.message });

    const prId = result.insertId;
    const maxSql = `
      SELECT 
        (SELECT MAX(itemid) FROM item_master) AS maxItemMaster,
        (SELECT MAX(itemid) FROM purchase_request_detail) AS maxItemDetail`;

    db.query(maxSql, (err, maxResult) => {
      if (err)
        return res
          .status(500)
          .json({ error: "Max ID error", details: err.message });

      let newItemId =
        Math.max(
          parseInt(maxResult[0].maxItemMaster || 1000),
          parseInt(maxResult[0].maxItemDetail || 0)
        ) + 1;

      const values = items.map((item) => {
        const itemid =
          item.item === "other" || isNaN(Number(item.item))
            ? newItemId++
            : Number(item.item);
        return [prId, itemid, item.itemName, item.qty, item.remark];
      });

      const insertDetailSql = `
        INSERT INTO purchase_request_detail (prnumber, itemid, itemname, quantity, remark)
        VALUES ?`;

      db.query(insertDetailSql, [values], (err) => {
        if (err)
          return res
            .status(500)
            .json({ error: "Detail insert error", details: err.message });
        res.json({ message: "Purchase request saved successfully" });
      });
    });
  });
});

app.get("/api/approval-list", (req, res) => {
  const sql = `
    SELECT 
    prd.uniqueid,  
    c.compname AS company, 
    s.sbuname AS sbu, 
    d.deptname AS department, 
    prd.itemid, 
    prd.itemname, 
    prd.quantity AS requestedQuantity, 
    prd.remark, 
    COALESCE((SELECT quantity FROM item_master WHERE itemid = prd.itemid), 0) AS stockQuantity
FROM purchase_request_detail prd
JOIN purchase_request_main prm ON prd.prnumber = prm.prnumber
JOIN company_master c ON prm.compid = c.compid
JOIN sbu_master s ON prm.sbuid = s.sbuid
JOIN department d ON prm.deptid = d.deptid
WHERE prd.status = 'Pending'`;

  db.query(sql, (err, results) => {
    if (err) {
      console.error("❌ Error fetching approval list:", err.message);
      return res
        .status(500)
        .json({ error: "Database error", details: err.message });
    }
    res.json(results);
  });
});

// ✅ Update PR (status, approval)

app.post("/api/update-purchase-requests", async (req, res) => {
  const updates = req.body;

  if (!Array.isArray(updates) || updates.length === 0) {
    return res.status(400).json({ error: "No updates provided" });
  }

  const updatePromises = updates.map(
    ({ uniqueid, status, approvedBy, approvedDate, approvedQuantity }) => {
      return new Promise((resolve, reject) => {
        // 1️⃣ Update purchase_request_detail (status & approved_quantity)
        const sqlDetail = `
        UPDATE purchase_request_detail
        SET status = ?, approved_quantity = ?
        WHERE uniqueid = ?
      `;

        db.query(
          sqlDetail,
          [status, approvedQuantity, uniqueid],
          (err, result) => {
            if (err) {
              reject(err);
            } else {
              // 2️⃣ Update purchase_request_main (approvedby & approveddate)
              const sqlMain = `
            UPDATE purchase_request_main
            SET approvedby = ?, approveddate = ?
            WHERE prnumber = (SELECT prnumber FROM purchase_request_detail WHERE uniqueid = ?)
          `;

              db.query(
                sqlMain,
                [approvedBy, approvedDate, uniqueid],
                (err, result) => {
                  if (err) {
                    reject(err);
                  } else {
                    resolve(result);
                  }
                }
              );
            }
          }
        );
      });
    }
  );

  Promise.all(updatePromises)
    .then(() =>
      res.json({
        success: true,
        message: "Purchase requests updated successfully",
      })
    )
    .catch((err) =>
      res.status(500).json({ error: "Update error", details: err.message })
    );
});

/* ------------------- 📦 PURCHASE ORDER ROUTES ------------------- */

// ✅ Get Approved Items
app.get("/api/approved-items/:compid/:sbuid", (req, res) => {
  const { compid, sbuid } = req.params;

  const query = `
  SELECT 
  d.uniqueid,
  d.itemid,
  d.itemname,
  d.approved_quantity,
  d.prnumber,
  m.approvedby,
  u.username AS approved_by_name,
  m.createdby,
  cu.username AS created_by_name
FROM purchase_request_detail d
JOIN purchase_request_main m ON d.prnumber = m.prnumber
LEFT JOIN user_master u ON m.approvedby = u.userid
LEFT JOIN user_master cu ON m.createdby = cu.userid
WHERE m.compid = ? 
  AND m.sbuid = ? 
  AND d.status = 'Approved'
 
  `;

  db.query(query, [compid, sbuid], (err, results) => {
    if (err) {
      console.error("❌ Error fetching approved items:", err);
      return res.status(500).json({ error: "Internal Server Error" });
    }
    res.json(results);
  });
});

app.post("/api/save-purchase-order", (req, res) => {
  const {
    ponumber,
    podate,
    createdby,
    vendor,
    status = "Pending",
    additional_expense = 0,
    remark = null,
    items,
  } = req.body;
  console.log("📦 Incoming PO Payload:", JSON.stringify(req.body, null, 2));

  if (
    !ponumber ||
    !podate ||
    !createdby ||
    !vendor ||
    !items ||
    items.length === 0
  ) {
    return res.status(400).json({ error: "Missing required fields" });
  }

  const insertMainQuery = `
    INSERT INTO purchase_order_main 
    (ponumber, podate, status, createdby, additional_expense, vendor, remark)
    VALUES (?, ?, ?, ?, ?, ?, ?)`;

  db.query(
    insertMainQuery,
    [ponumber, podate, status, createdby, additional_expense, vendor, remark],
    (err, mainResult) => {
      if (err)
        return res
          .status(500)
          .json({ error: "Insert main error", details: err.message });

      const poid = mainResult.insertId;

      const insertDetailQuery = `
        INSERT INTO purchase_order_detail (poid, itemid, quantity, amount, prnumber)
        VALUES ?`;

      const detailValues = items.map((item) => [
        poid,
        item.itemid,
        item.quantity,
        item.amount || 0,
        item.prnumber || null,
      ]);

      db.query(insertDetailQuery, [detailValues], (err) => {
        if (err)
          return res
            .status(500)
            .json({ error: "Insert detail error", details: err.message });

        console.log("🧪 Updating PR statuses for items:", items);

        // ✅ Now update purchase_request_detail status to "Ordered"
        const updateQueries = items
          .filter((item) => {
            if (!item.prnumber || !item.itemid) {
              console.warn("⚠️ Skipping invalid item:", item);
              return false;
            }
            return true;
          })
          // ensure prnumber is present
          .map((item) => {
            console.log(`Updating PR ${item.prnumber}, item ${item.itemid}`);
            return new Promise((resolve, reject) => {
              db.query(
                `UPDATE purchase_request_detail
                 SET status = 'Ordered'
                 WHERE prnumber = ? AND itemid = ?`,
                [item.prnumber, item.itemid],
                (err) => {
                  if (err) {
                    console.error(
                      "❌ Update failed for",
                      item.prnumber,
                      item.itemid,
                      err
                    );
                    return reject(err);
                  }
                  resolve();
                }
              );
            });
          });

        Promise.all(updateQueries)
          .then(() => {
            res.json({ message: "Purchase Order saved and PR updated", poid });
          })
          .catch((err) => {
            console.error("❌ Failed to update PR detail:", err); // See exact SQL error
            res.status(500).json({
              error: "Failed to update purchase_request_detail status",
              details: err.message,
            });
          });
      });
    }
  );
});

app.get("/api/po-list", (req, res) => {
  const query = `
    SELECT DISTINCT pom.poid, pom.ponumber
    FROM purchase_order_main pom
    JOIN purchase_order_detail pod ON pom.poid = pod.poid
    WHERE pod.status IN ('Partially Received', 'Pending')
  `;

  db.query(query, (err, result) => {
    if (err) {
      console.error("Error fetching PO list:", err);
      return res.status(500).json({ error: "Database error" });
    }
    res.json(result);
  });
});

app.get("/api/po/:poid", (req, res) => {
  const poid = req.params.poid;

  const vendorQuery = "SELECT vendor FROM purchase_order_main WHERE poid = ?";
  const itemsQuery = `
  SELECT pod.itemid, im.itemname, pod.quantity, pod.amount
  FROM purchase_order_detail pod
  JOIN item_master im ON pod.itemid = im.itemid
  WHERE pod.poid = ? AND pod.status IN ('Pending', 'Partially Received')
`;

  db.query(vendorQuery, [poid], (err, vendorResult) => {
    if (err || vendorResult.length === 0) {
      console.error("Error fetching vendor:", err);
      return res.status(500).json({ error: "Vendor not found" });
    }

    db.query(itemsQuery, [poid], (err2, itemsResult) => {
      if (err2) {
        console.error("Error fetching PO items:", err2);
        return res.status(500).json({ error: "Item fetch failed" });
      }

      res.json({
        vendor: vendorResult[0].vendor,
        items: itemsResult,
      });
    });
  });
});

app.get("/api/inward/received-quantity", (req, res) => {
  const { poid, itemid } = req.query;

  const query = `
    SELECT 
      COALESCE(SUM(received_quantity), 0) AS receivedQuantity,
      COALESCE(SUM(paid_amount), 0) AS amountPaid
    FROM inward
    WHERE poid = ? AND itemid = ?
  `;

  db.query(query, [poid, itemid], (err, results) => {
    if (err) {
      console.error("❌ Error fetching inward data:", err);
      return res.status(500).json({ error: "Database error" });
    }

    const data = results[0] || { receivedQuantity: 0, amountPaid: 0 };
    res.json(data);
  });
});

app.post("/api/inward/save", (req, res) => {
  const { poNumber, poDate, items } = req.body;

  const checkInward = `
    SELECT * FROM inward WHERE poid = ? AND itemid = ?
  `;

  const updateInward = `
    UPDATE inward 
    SET received_quantity = received_quantity + ?, 
        paid_amount = paid_amount + ?, 
        inward_date = ?
    WHERE poid = ? AND itemid = ?
  `;

  const insertInward = `
    INSERT INTO inward (poid, inward_date, itemid, received_quantity, paid_amount)
    VALUES (?, ?, ?, ?, ?)
  `;

  const updateItemMaster = `
    UPDATE item_master 
    SET quantity = quantity + ? 
    WHERE itemid = ?
  `;

  const updateStatus = `
  UPDATE purchase_order_detail
  SET status = CASE
    WHEN (SELECT received_quantity FROM inward WHERE poid = ? AND itemid = ?) >= 
         (SELECT quantity FROM purchase_order_detail WHERE poid = ? AND itemid = ?)
    THEN 'Completed'
    ELSE 'Partially Received'
  END
  WHERE poid = ? AND itemid = ?
`;

  db.beginTransaction((err) => {
    if (err) return res.status(500).json({ error: "Transaction error" });

    const promises = items.map((item) => {
      return new Promise((resolve, reject) => {
        // 1. Check if record already exists
        db.query(checkInward, [poNumber, item.itemid], (err, results) => {
          if (err) return reject(err);

          const recordExists = results.length > 0;

          const handleAfterItemMasterUpdate = () => {
            // ✅ 3. Update PO detail status
            db.query(
              updateStatus,
              [
                poNumber,
                item.itemid,
                poNumber,
                item.itemid,
                poNumber,
                item.itemid,
              ],
              (err4) => {
                if (err4) return reject(err4);
                resolve(); // ✅ Finally resolve after all 3 steps
              }
            );
          };

          if (recordExists) {
            // 2a. Update existing inward entry
            db.query(
              updateInward,
              [
                item.currentlyReceiving,
                item.currentlyPaying,
                poDate,
                poNumber,
                item.itemid,
              ],
              (err2) => {
                if (err2) return reject(err2);

                // 2a.1 Update item_master
                db.query(
                  updateItemMaster,
                  [item.currentlyReceiving, item.itemid],
                  (err3) => {
                    if (err3) return reject(err3);
                    handleAfterItemMasterUpdate(); // 🔁 status check
                  }
                );
              }
            );
          } else {
            // 2b. Insert new inward entry
            db.query(
              insertInward,
              [
                poNumber,
                poDate,
                item.itemid,
                item.currentlyReceiving,
                item.currentlyPaying,
              ],
              (err2) => {
                if (err2) return reject(err2);

                // 2b.1 Update item_master
                db.query(
                  updateItemMaster,
                  [item.currentlyReceiving, item.itemid],
                  (err3) => {
                    if (err3) return reject(err3);
                    handleAfterItemMasterUpdate(); // 🔁 status check
                  }
                );
              }
            );
          }
        });
      });
    });

    Promise.all(promises)
      .then(() => {
        db.commit((err) => {
          if (err) {
            db.rollback(() => {
              res.status(500).json({ error: "Commit error" });
            });
          } else {
            res.json({ message: "Inward entries saved successfully" });
          }
        });
      })
      .catch((error) => {
        console.error("❌ DB Error:", error);
        db.rollback(() => {
          res.status(500).json({ error: "Failed to save inward entry" });
        });
      });
  });
});

// ✅ Get available quantity for an item
app.get("/api/item-quantity/:itemid", (req, res) => {
  const itemid = req.params.itemid;
  db.query(
    "SELECT quantity FROM item_master WHERE itemid = ?",
    [itemid],
    (err, results) => {
      if (err) return res.status(500).json({ error: err.message });
      if (results.length === 0)
        return res.status(404).json({ error: "Item not found" });
      res.json({ quantity: results[0].quantity });
    }
  );
});

// POST: Issue Entry and Asset Insertion
// POST: Issue Entry and Asset Insertion
// POST: Issue Entry and Asset Insertion
app.post("/api/issue-entry", (req, res) => {
  const { compid, sbuid, empid, date, items, createdBy } = req.body;
  console.log("Received payload:", req.body);

  // Validate required fields
  if (
    !compid ||
    !sbuid ||
    !empid ||
    !date ||
    !Array.isArray(items) ||
    items.length === 0 ||
    !createdBy
  ) {
    return res.status(400).json({ error: "Missing required fields" });
  }

  // Process each item: Insert into asset and update item_master
  const insertQueries = items.map((item) => {
    return new Promise((resolve, reject) => {
      const { itemid, quantity, remarks } = item;

      // First insert into asset
      const insertSql = `
        INSERT INTO asset (empid, itemid, item_quantity, asset_date, remark, createdby)
        VALUES (?, ?, ?, ?, ?, ?)
      `;

      db.query(
        insertSql,
        [empid, itemid, quantity, date, remarks, createdBy],
        (err, result) => {
          if (err) {
            console.error("❌ DB Insert Error:", err);
            return reject(err);
          }

          // Then update item_master quantity
          const updateSql = `
            UPDATE item_master
            SET quantity = quantity - ?
            WHERE itemid = ? AND quantity >= ?
          `;

          db.query(updateSql, [quantity, itemid, quantity], (err2, result2) => {
            if (err2) {
              console.error("❌ Failed to update item quantity:", err2);
              return reject(err2);
            }

            if (result2.affectedRows === 0) {
              console.warn(`❌ Not enough stock for itemid ${itemid}`);
              return reject(new Error(`Not enough stock for itemid ${itemid}`));
            }

            resolve(result2);
          });
        }
      );
    });
  });

  Promise.all(insertQueries)
    .then(() =>
      res.json({ message: "✅ Issue entry and assets saved successfully." })
    )
    .catch((err) => {
      console.error("❌ Issue entry failed:", err.message);
      res.status(500).json({ error: err.message });
    });
});

//////////////////////////////////////////////////////
//Return Entry
app.get("/api/issued-items/:empid", (req, res) => {
  const empid = req.params.empid;
  const query = `
    SELECT 
      a.itemid,
      im.itemname,
      IFNULL(SUM(CASE WHEN a.status = 'issue' THEN a.item_quantity ELSE 0 END), 0) AS issuedQty,
      IFNULL(SUM(CASE WHEN a.status = 'return' THEN a.item_quantity ELSE 0 END), 0) AS returnedQty
    FROM asset a
    JOIN item_master im ON a.itemid = im.itemid
    WHERE a.empid = ?
    GROUP BY a.itemid
    HAVING issuedQty - returnedQty > 0
  `;

  db.query(query, [empid], (err, rows) => {
    if (err) {
      console.error("SQL error details:", err.message);
      return res.status(500).json({ error: "Failed to fetch issued items" });
    }

    const result = rows.map((row) => ({
      itemid: row.itemid,
      itemname: row.itemname,
      issuedQty: row.issuedQty - row.returnedQty,
      returnQty: 0,
    }));

    res.json(result);
  });
});

app.post("/api/return-items", (req, res) => {
  const { empid, returnDate, status, createdby, items } = req.body;

  if (!empid || !returnDate || !items || items.length === 0) {
    return res.status(400).json({ error: "Missing required fields" });
  }

  const values = items.map((item) => [
    empid,
    item.itemid,
    item.returnQty,
    returnDate,
    "return",
    item.remark,
    createdby,
  ]);

  const insertQuery = `
  INSERT INTO asset 
  (empid, itemid, item_quantity, asset_date, status, remark, createdby)
  VALUES ?
`;

  db.query(insertQuery, [values], (err, result) => {
    if (err) {
      console.error("Insert error:", err.message);
      return res.status(500).json({ error: "Insert failed" });
    }

    // ✅ Update item_master quantities one by one
    const updatePromises = items.map((item) => {
      return new Promise((resolve, reject) => {
        db.query(
          `UPDATE item_master SET quantity = quantity + ? WHERE itemid = ?`,
          [item.returnQty, item.itemid],
          (err2) => {
            if (err2) {
              console.error("Item master update error:", err2.message);
              reject("Item master update failed");
            } else {
              resolve();
            }
          }
        );
      });
    });

    Promise.all(updatePromises)
      .then(() => {
        if (status.toLowerCase() === "inactive") {
          db.query(
            `UPDATE employee_master SET status = 'inactive' WHERE empid = ?`,
            [empid],
            (err3) => {
              if (err3) {
                console.error("Employee update error:", err3.message);
                return res
                  .status(500)
                  .json({ error: "Employee status update failed" });
              }
              return res.json({ success: true });
            }
          );
        } else {
          return res.json({ success: true });
        }
      })
      .catch((err) => {
        return res.status(500).json({ error: err });
      });
  });
});

//////////////////////////////////////////////////////////////////
//Stock report

app.get("/api/stock-report", (req, res) => {
  const { company, sbu, date } = req.query;

  if (!company || !sbu || !date) {
    return res.status(400).json({ error: "Missing required parameters" });
  }

  const query = `
    SELECT 
      im.itemname,
      im.itemid,
      SUM(IFNULL(issue_qty, 0)) - SUM(IFNULL(return_qty, 0)) AS quantity
    FROM (
      SELECT 
        a.itemid,
        CASE WHEN a.status = 'issue' AND a.asset_date <= ? THEN a.item_quantity ELSE 0 END AS issue_qty,
        CASE WHEN a.status = 'return' AND a.asset_date <= ? THEN a.item_quantity ELSE 0 END AS return_qty
      FROM asset a
      JOIN employee_master e ON a.empid = e.empid
      WHERE e.compid = ? AND e.sbuid = ?
    ) AS sub
    JOIN item_master im ON sub.itemid = im.itemid
    GROUP BY im.itemid, im.itemname
    HAVING quantity > 0
  `;

  db.query(query, [date, date, company, sbu], (err, rows) => {
    if (err) {
      console.error("❌ Error fetching stock report:", err.message);
      return res.status(500).json({ error: "Failed to generate stock report" });
    }
    res.json(rows);
  });
});

app.post("/api/employee-assets", (req, res) => {
  const { empid, type } = req.body;

  if (!empid || !type) {
    return res.status(400).json({ error: "Missing employee ID or type" });
  }

  let query = "";
  let queryParams = [];

  if (type === "all") {
    query = `
      SELECT im.itemname, a.item_quantity AS quantity, a.status, a.asset_date AS date
      FROM asset a
      JOIN item_master im ON a.itemid = im.itemid
      WHERE a.empid = ?
      ORDER BY a.asset_date DESC
    `;
    queryParams = [empid];
  } else if (type === "active") {
    query = `
    SELECT 
    im.itemname,
    im.itemid,
    SUM(CASE WHEN a.status = 'issue' THEN a.item_quantity ELSE 0 END) -
    SUM(CASE WHEN a.status = 'return' THEN a.item_quantity ELSE 0 END) AS quantity
  FROM asset a
  JOIN item_master im ON a.itemid = im.itemid
  WHERE a.empid = ? 
  GROUP BY im.itemid, im.itemname
  HAVING quantity > 0
  
    `;
    queryParams = [empid];
  } else {
    return res.status(400).json({ error: "Invalid type" });
  }

  db.query(query, queryParams, (err, results) => {
    if (err) {
      console.error("❌ Error fetching employee asset report:", err);
      return res.status(500).json({ error: "Internal server error" });
    }

    res.json(results);
  });
});
/* ------------------- 🚀 START SERVER ------------------- */

const PORT = 5000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});
