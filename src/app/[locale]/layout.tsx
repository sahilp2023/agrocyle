import { notFound } from 'next/navigation';

const locales = ['hi', 'en'];

export function generateStaticParams() {
    return locales.map((locale) => ({ locale }));
}

export default async function LocaleLayout({
    children,
    params,
}: {
    children: React.ReactNode;
    params: Promise<{ locale: string }>;
}) {
    const { locale } = await params;

    if (!locales.includes(locale)) {
        notFound();
    }

    return (
        <div className="min-h-screen-safe" lang={locale}>
            {children}
        </div>
    );
}
