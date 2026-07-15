const { Router } = require("express");
const { createdimension } = require("../controllers/algodimension");

const router = Router();

router.post("/createdimensions", createdimension);

module.exports = router;