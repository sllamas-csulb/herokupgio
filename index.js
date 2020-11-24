// Add required packages
const express = require("express");
const app = express();
const fileUpload = require("express-fileupload");
app.use(fileUpload());
const multer = require("multer");
const upload = multer();

// Add database package and connection string (can remove ssl)
const { Pool } = require('pg');
const pool = new Pool({
  user: process.env.PSQL_USER,
  host: process.env.PSQL_HOST,
  database: process.env.PSQL_DATABASE,
  password: process.env.PSQL_PASSWORD, 
  port: process.env.PSQL_PORT
});

console.log("Successful connection to the database");

const sql_create = `DROP TABLE IF EXISTS PRODUCT; CREATE TABLE IF NOT EXISTS PRODUCT (
  prod_id    	SERIAL PRIMARY KEY,
  prod_name  	VARCHAR(20) NOT NULL,
  prod_desc 	VARCHAR(50),
  prod_price  NUMERIC
);`;

pool.query(sql_create, [], (err, result) => {
  if (err) {
    return console.error(err.message);
  }
  console.log("Successful creation of the 'Product' table");

  // Database seeding
  const sql_insert = `INSERT INTO PRODUCT (prod_id, prod_name, prod_desc, prod_price)
  VALUES 
   ('101', 'Pen', 'Black Ink', '0.99'),
   ('102', 'Pencil', 'Yellow No. 2', '0.35'),
   ('103', 'Paper', 'College Rule', '1.10'),
   ('104', 'Eraser', 'Pink', '0.75'),
   ('105', 'Calculator', 'Scientific', '99.99'),
   ('106', 'Camera', 'Desktop 720p', '39.99'),
   ('107', 'Ruler', '12"', '4.75'),
   ('108', 'Stamps', 'Dozen', '6.60'),
   ('109', 'Notepad', '8.5 by 11', '2.95'),
   ('110', 'Charger', 'USB', '22.50');`;
  pool.query(sql_insert, [], (err, result) => {
    if (err) {
      return console.error(err.message);
    }
  });
});

// Set up EJS
app.set("view engine", "ejs");


// Start listener
app.listen(process.env.PORT || 3000, () => {
    console.log("Server started (http://localhost:3000/) !");
});

// Setup routes
app.get("/", (req, res) => {
  //res.send ("Hello world...");
  const sql = "SELECT * FROM PRODUCT ORDER BY PROD_ID";
  pool.query(sql, [], (err, result) => {
      var message = "";
      var model = {};
      if(err) {
          message = `Error - ${err.message}`;
      } else {
          message = "success";
          model = result.rows;
      };
      res.render("index", {
          message: message,
          model : model
      });
  });
});

app.get("/input", (req, res) => {
  res.render("input");
});

app.post("/input", (req, res) => {
   if(!req.files || Object.keys(req.files).length === 0) {
       message = "Error: Import file not uploaded";
       return res.send(message);
   };
   //Read file line by line, inserting records
   const fn = req.files.filename;
   const buffer = fn.data;
   const lines = buffer.toString().split(/\r?\n/);

   lines.forEach(line => {
        //console.log(line);
        product = line.split(",");
        //console.log(product);
        const sql = "INSERT INTO PRODUCT(prod_id, prod_name, prod_desc, prod_price) VALUES ($1, $2, $3, $4)";
        pool.query(sql, product, (err, result) => {
            if (err) {
                console.log(`Insert Error.  Error message: ${err.message}`);
            } else {
                console.log(`Inserted successfully`);
            }
       });
   });
   message = `Processing Complete - Processed ${lines.length} records`;
   res.send(message);
}); 

app.get("/output", (req, res) => {
  var message = "";
  res.render("output",{ message: message });
 });
 
 
 app.post("/output", (req, res) => {
     const sql = "SELECT * FROM PRODUCT ORDER BY PROD_ID";
     pool.query(sql, [], (err, result) => {
         var message = "";
         if(err) {
             message = `Error - ${err.message}`;
             res.render("output", { message: message })
         } else {
             var output = "";
             result.rows.forEach(product => {
                 output += `${product.prod_id},${product.prod_name},${product.prod_desc},${product.prod_price}\r\n`;
             });
             res.header("Content-Type", "text/csv");
             res.attachment("export.csv");
             return res.send(output);
         };
     });
 });