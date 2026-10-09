const express = require("express");
const { bootstrapAdmin } = require("../controllers/adminSetupController");

const router = express.Router();

router.post("/", bootstrapAdmin);

module.exports = router;

