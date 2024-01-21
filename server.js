const express = require("express");
const cors = require("cors");
const app = express();
const sqlite3 = require('sqlite3');
const path = require('path');
const bodyParser = require('body-parser');
require('dotenv').config();

app.use(cors());
app.use(express.json());
app.use(bodyParser.json());

const port = process.env.PORT || 3000;
// Specify the path to your SQLite database file
const dbPath = path.join(__dirname, 'Database', 'kir_absen.db');

let db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.log("Error Occurred - " + err.message);
  } else {
    console.log("Database Connected");
  }
});

app.post("/login/:Nama/:Password", (req, res) => {
  const { Nama, Password } = req.params;

  // Check if Nama is null or unidentified, and if Password is null or too short
  if (!Nama || Nama.toLowerCase() === 'unidentified' || !Password) {
    res.send("Tidak terdeteksi");
  } else {
    // Query the 'siswa' table to check if Nama and Password match
    db.get("SELECT Nama, Password FROM siswa WHERE Nama = ?", [Nama], (err, row) => {
      if (err) {
        console.log("Error retrieving data - " + err.message);
        res.status(500).send("Internal Server Error");
      } else {
        if (row) {
          // Check if the provided Password matches the stored Password
          const storedPassword = row.Password;

          if (Password === storedPassword) {
            // Passwords match, send "true"
            res.send("true");
          } else {
            // Passwords do not match, send "false"
            res.send("false");
          }
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
  var masukStatus = "";

  if(formattedTime >= '16:04' && formattedTime <= '16:21'){
    masukStatus = "Masuk";
  }else if(formattedTime >= '16:21' && formattedTime <= '17:00'){
    masukStatus = "telat";
  }else{
    masukStatus = "bolos";
  }
  // Update the 'Masuk' column to 'Yes' and set the 'Waktu' column to the current time
  if(formattedTime >= '16:00' && formattedTime <= '17:31'){
    db.run("UPDATE siswa SET Masuk = ?, Waktu = ? WHERE Nama = ?", [masukStatus,formattedTime, Nama], (err) => {
      if (err) {
        console.log("Error updating data - " + err.message);
        res.status(500).send("Internal Server Error");
      } else {
        res.send(true);
      }
    });
  }else{
    res.send("Tidak tersedia");
  }
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

app.delete("/timeline", (req, res) => {
  db.run("DELETE FROM timeline;", (err, rows) => {
    if (err) {
      console.log("Error retrieving data - " + err.message);
      res.status(500).send("Internal Server Error");
    } else {
      // Send the data as pretty JSON
      res.json(rows);
    }
  });
});

app.post("/timeline", (req, res) => {
  const Jadwal = req.body.jadwal;
  const Isi = req.body.isi;

  // Use placeholders in the SQL query to avoid SQL injection
  const query = "INSERT INTO timeline (Waktu, Event) VALUES (?, ?)";

  // Execute the query with the provided values
  db.run(query, [Jadwal, Isi], function (err) {
    if (err) {
      console.log("Error inserting data - " + err.message);
      console.log(Jadwal);
      console.log(Isi);
      res.status(500).send("Internal Server Error");
    } else {
      // Send a simple acknowledgment
      res.status(200).send("Data inserted successfully");
    }
  });
});

app.listen(port, () => {
  console.log(`http://localhost:${port}`);
});
