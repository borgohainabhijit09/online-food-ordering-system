"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const multer_1 = __importDefault(require("multer"));
const product_controller_1 = require("../controllers/product.controller");
const auth_middleware_1 = require("../middlewares/auth.middleware");
const router = (0, express_1.Router)();
const upload = (0, multer_1.default)({ storage: multer_1.default.memoryStorage() });
router.get('/', product_controller_1.getProducts);
router.post('/bulk-delete', auth_middleware_1.authenticate, auth_middleware_1.requireAdmin, product_controller_1.bulkDeleteProducts);
router.post('/bulk-upload', auth_middleware_1.authenticate, auth_middleware_1.requireAdmin, upload.single('file'), product_controller_1.bulkUploadProducts);
router.post('/', auth_middleware_1.authenticate, auth_middleware_1.requireAdmin, product_controller_1.createProduct);
router.put('/:id', auth_middleware_1.authenticate, auth_middleware_1.requireAdmin, product_controller_1.updateProduct);
router.patch('/:id/status', auth_middleware_1.authenticate, auth_middleware_1.requireAdmin, product_controller_1.toggleProductStatus);
router.delete('/:id', auth_middleware_1.authenticate, auth_middleware_1.requireAdmin, product_controller_1.deleteProduct);
exports.default = router;
//# sourceMappingURL=product.routes.js.map