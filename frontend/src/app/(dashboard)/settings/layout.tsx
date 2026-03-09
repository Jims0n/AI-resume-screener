'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import clsx from 'clsx';

const tabs = [
    { href: '/settings/profile', label: 'Profile' },
    { href: '/settings/organization', label: 'Organization' },
    { href: '/settings/team', label: 'Team' },
    { href: '/settings/email-templates', label: 'Email Templates' },
    { href: '/settings/scoring', label: 'Scoring Defaults' },
];

export default function SettingsLayout({ children }: { children: React.ReactNode }) {
    const pathname = usePathname();

    return (
        <div className="animate-fade-in max-w-5xl">
            <h1 className="font-serif tracking-tight text-3xl text-sh-text mb-6">Settings</h1>

            {/* Tab navigation */}
            <div className="border-b border-sh-border mb-8">
                <nav className="flex gap-2 overflow-x-auto -mb-px">
                    {tabs.map((tab) => {
                        const isActive = pathname === tab.href;
                        return (
                            <Link
                                key={tab.href}
                                href={tab.href}
                                className={clsx(
                                    'whitespace-nowrap px-4 py-3 text-sm font-medium border-b-2 transition-colors',
                                    isActive
                                        ? 'border-sh-accent text-sh-accent'
                                        : 'border-transparent text-sh-text2 hover:text-sh-text hover:border-sh-borderHover'
                                )}
                            >
                                {tab.label}
                            </Link>
                        );
                    })}
                </nav>
            </div>

            {children}
        </div>
    );
}
