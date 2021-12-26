import express from "express";

const app = express();

// Set template rendering engine
app.set("view engine", "pug");
app.set("views", __dirname + "/views" );

// Static file serving
app.use('/public', express.static(__dirname+ "/public"));

app.get('/', (req, res) => res.render("home"));
app.listen("3000")
