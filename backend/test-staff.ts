import prisma from './src/services/prisma';
import jwt from 'jsonwebtoken';

async function main() {
  const staffAccess = await prisma.tenantAccess.findFirst({
    where: { role: 'STAFF' },
    include: {
      user: true,
      staffRole: true,
      tenant: true
    }
  });
  
  if (staffAccess) {
      const store = {
        role: staffAccess.role,
        permissions: staffAccess.staffRole?.permissions || []
      };
      const token = jwt.sign(
        { id: staffAccess.user.id, role: store.role, phone: staffAccess.user.phone, tenantId: staffAccess.tenant.id, tenantSlug: staffAccess.tenant.slug, forcePasswordChange: staffAccess.user.forcePasswordChange, permissions: store.permissions },
        process.env.JWT_SECRET || 'fallback_secret',
        { expiresIn: '7d' }
      );
      console.log(token);
  }
}

main().finally(() => prisma.$disconnect());
