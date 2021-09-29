const mongoose = require("mongoose");

module.exports = mongoose.model(
  "profileSchema",
  mongoose.Schema(
    {
      token: {
        type: String,
        unique: true,
      },
      logs: {
        type: String,
      },
    },
    { timestamps: true }
  ),
  "pan_access"
);
