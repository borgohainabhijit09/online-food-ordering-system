"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const addon_controller_1 = require("../controllers/addon.controller");
const auth_middleware_1 = require("../middlewares/auth.middleware");
const router = (0, express_1.Router)();
router.get('/', addon_controller_1.getAddons);
router.post('/', auth_middleware_1.authenticate, auth_middleware_1.requireAdmin, addon_controller_1.createAddon);
router.put('/:id', auth_middleware_1.authenticate, auth_middleware_1.requireAdmin, addon_controller_1.updateAddon);
router.delete('/:id', auth_middleware_1.authenticate, auth_middleware_1.requireAdmin, addon_controller_1.deleteAddon);
exports.default = router;
//# sourceMappingURL=addon.routes.js.map