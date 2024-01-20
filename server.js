const express = require("express");
const cors = require("cors");
const app = express();
const sqlite3 = require('sqlite3');
const path = require('path');

app.use(cors());
app.use(express.json());

app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', 'http://localhost:8000');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE');
  res.header('Access-Control-Allow-Headers', 'Content-Type');
  next();
});

// Specify the path to your SQLite database file
const dbPath = path.join(__dirname, 'Database', 'kir_absen.db');

let db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.log("Error Occurred - " + err.message);
  } else {
    console.log("Database Connected");
  }
});

app.post("/login/:Nama", (req, res) => {
  const { Nama } = req.params;

  if (!Nama || Nama.toLowerCase() === 'unidentified') {
    // If Nama is null or unidentified
    res.send("Tidak terdeteksi");
  } else {
    // Query the 'siswa' table to check if Nama is found
    db.get("SELECT Nama FROM siswa WHERE Nama = ?", [Nama], (err, row) => {
      if (err) {
        console.log("Error retrieving data - " + err.message);
        res.status(500).send("Internal Server Error");
      } else {
        if (row) {
          // Nama found, set login to true
          res.send("true");
        } else {
          // Nama not found
          res.send("false");
        }
      }
    });
  }
});

app.post("/siswa/absen/:Nama", (req, res) => {
  const { Nama } = req.params;

  // Get current time (hours and minutes)
  const currentTime = new Date();
  const hours = currentTime.getHours();
  const minutes = currentTime.getMinutes();
  const formattedTime = `${hours}:${minutes}`;

  // Update the 'Masuk' column to 'Yes' and set the 'Waktu' column to the current time
  db.run("UPDATE siswa SET Masuk = 'Yes', Waktu = ? WHERE Nama = ?", [formattedTime, Nama], (err) => {
    if (err) {
      console.log("Error updating data - " + err.message);
      res.status(500).send("Internal Server Error");
    } else {
      res.send(true);
    }
  });
});

app.get("/absen", (req, res) => {
  // Retrieve Nama, Masuk, and Waktu columns from the 'siswa' table
  db.all("SELECT Nama, Masuk, Waktu FROM siswa", (err, rows) => {
    if (err) {
      console.log("Error retrieving data - " + err.message);
      res.status(500).send("Internal Server Error");
    } else {
      // Send the data as JSON
      res.json(rows);
    }
  });
});

app.get("/check/:user", (req, res) => {
  const { user } = req.params;

  // Query the 'siswa' table to check Waktu and Masuk for the specified user
  db.get("SELECT Waktu, Masuk FROM siswa WHERE Nama = ?", [user], (err, row) => {
    if (err) {
      console.log("Error retrieving data - " + err.message);
      res.status(500).send("Internal Server Error");
    } else {
      if (row) {
        // Check if Waktu and Masuk are filled
        const isFilled = row.Waktu !== null && row.Masuk === 'Yes';
        res.send(isFilled);
      } else {
        // User not found
        res.send(false);
      }
    }
  });
});

app.post("/reset", (req, res) => {
  // Reset values of Waktu and Masuk to null for all rows in the 'siswa' table
  db.run("UPDATE siswa SET Waktu = null, Masuk = null", (err) => {
    if (err) {
      console.log("Error resetting data - " + err.message);
      res.status(500).send("Internal Server Error");
    } else {
      res.send("Values of Waktu and Masuk reset for all rows");
    }
  });
});

app.get("/timeline", (req, res) => {
  // Retrieve Waktu and Event columns from the 'timeline' table
  db.all("SELECT Id, Waktu, Event FROM timeline", (err, rows) => {
    if (err) {
      console.log("Error retrieving data - " + err.message);
      res.status(500).send("Internal Server Error");
    } else {
      // Send the data as pretty JSON
      res.json(rows);
    }
  });
});

app.listen(8000, () => {
  console.log(`Server is running on http://localhost:8000/`);
});
