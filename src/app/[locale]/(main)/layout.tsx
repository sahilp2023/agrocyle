import { BottomNav } from '@/components/ui';

export default async function MainLayout({
    children,
    params,
}: {
    children: React.ReactNode;
    params: Promise<{ locale: string }>;
}) {
    const { locale } = await params;

    return (
        <div className="min-h-screen-safe pb-20 bg-gray-50">
            <main>{children}</main>
            <BottomNav locale={locale as 'hi' | 'en'} />
        </div>
    );
}
