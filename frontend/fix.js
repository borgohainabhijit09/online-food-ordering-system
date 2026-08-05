const fs = require('fs');
const file = 'c:/Users/320301827/Documents/WORKSPACE/01_CLIENTS/Active/eCommerce-website/frontend/src/app/admin/subscription-billing/page.tsx';
let content = fs.readFileSync(file, 'utf8');

content = content.replace(/\\\/api\/subscription\/invoices\\/g, "`/api/subscription/invoices`");
content = content.replace(/\\Bearer \\\\/g, "`Bearer ${token}`");
content = content.replace(/\\\/api\/subscription\/invoices\\\/\\\/pay\\/g, "`/api/subscription/invoices/${invoice.id}/pay`");
content = content.replace(/\\Payment for Invoice #\\\\/g, "`Payment for Invoice #${invoice.id}`");
content = content.replace(/\\\/api\/subscription\/verify-payment\\/g, "`/api/subscription/verify-payment`");
content = content.replace(/\\Payment failed: \\\\/g, "`Payment failed: ${response.error.description}`");

fs.writeFileSync(file, content);
console.log('Fixed syntax errors');
