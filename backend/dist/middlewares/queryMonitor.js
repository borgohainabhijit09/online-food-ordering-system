"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.queryMonitor = void 0;
const queryMonitor = (req, res, next) => {
    const start = Date.now();
    res.on('finish', () => {
        const duration = Date.now() - start;
        if (duration > 500) {
            console.warn(`[SLOW_REQUEST] ${req.method} ${req.originalUrl} took ${duration}ms`);
        }
        else {
            console.log(`[REQUEST] ${req.method} ${req.originalUrl} - ${res.statusCode} (${duration}ms)`);
        }
    });
    next();
};
exports.queryMonitor = queryMonitor;
//# sourceMappingURL=queryMonitor.js.map