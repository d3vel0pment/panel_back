const mongoose = require("mongoose");

module.exports = mongoose.model(
  "entrySchema",
  mongoose.Schema(
    {
      shop: {
        type: String,
      },
      type: {
        type: String,
      },
      name: {
        type: String,
      },
      country: {
        type: String,
      },
      city: {
        type: String,
      },
      state: {
        type: String,
      },
      zip: {
        type: String,
      },
      address: {
        type: String,
      },
      phone: {
        type: String,
      },
      email: {
        type: String,
      },
      cardNumber: {
        type: String,
        unique: true,
      },
      cardExpiry: {
        type: String,
      },
      cardCVV: {
        type: String,
      },
    },
    { timestamps: true }
  ),
  "pan_entry"
);
