const express = require("express");
const router = express.Router();
const productController = require("../controllers/productController");
const { verifyToken } = require("../auth");

router.get("/products", verifyToken, productController.getProducts);
router.get("/getAllProducts", verifyToken, productController.getAllProducts);
router.get("/products/:id", verifyToken, productController.getProductById);
router.post("/products", verifyToken, productController.addProduct);
router.put("/products/:id", verifyToken, productController.updateProduct);
router.delete("/products/:id", verifyToken, productController.dropProduct);
router.post("/products/:id", verifyToken, productController.upProduct);

module.exports = router;