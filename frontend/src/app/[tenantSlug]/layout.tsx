import type { Metadata, ResolvingMetadata } from 'next';

type Props = {
  params: Promise<{ tenantSlug: string }>;
  children: React.ReactNode;
};

export async function generateMetadata(
  { params }: Props,
  parent: ResolvingMetadata
): Promise<Metadata> {
  const resolvedParams = await params;
  return {
    manifest: `/api/manifest?tenant=${resolvedParams.tenantSlug}`,
    appleWebApp: {
      capable: true,
      statusBarStyle: 'default',
      title: 'Restaurant',
    },
    formatDetection: {
      telephone: false,
    },
  };
}

export default function TenantLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
