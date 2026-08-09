import { Public_Sans } from 'next/font/google';
import localFont from 'next/font/local';
import { headers } from 'next/headers';
import { ThemeProvider } from '@/components/app/theme-provider';
import { ThemeToggle } from '@/components/app/theme-toggle';
import { cn } from '@/lib/shadcn/utils';
import { getAppConfig, getStyles } from '@/lib/utils';
import '@/styles/globals.css';

const publicSans = Public_Sans({
  variable: '--font-public-sans',
  subsets: ['latin'],
});

const commitMono = localFont({
  display: 'swap',
  variable: '--font-commit-mono',
  src: [
    {
      path: '../fonts/CommitMono-400-Regular.otf',
      weight: '400',
      style: 'normal',
    },
    {
      path: '../fonts/CommitMono-700-Regular.otf',
      weight: '700',
      style: 'normal',
    },
    {
      path: '../fonts/CommitMono-400-Italic.otf',
      weight: '400',
      style: 'italic',
    },
    {
      path: '../fonts/CommitMono-700-Italic.otf',
      weight: '700',
      style: 'italic',
    },
  ],
});

interface RootLayoutProps {
  children: React.ReactNode;
}

export default async function RootLayout({ children }: RootLayoutProps) {
  const hdrs = await headers();
  const appConfig = await getAppConfig(hdrs);
  const styles = getStyles(appConfig);
  const { pageTitle, pageDescription, companyName } = appConfig;

  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={cn(
        publicSans.variable,
        commitMono.variable,
        'scroll-smooth font-sans antialiased'
      )}
    >
      <head>
        {styles && <style>{styles}</style>}
        <title>{pageTitle}</title>
        <meta name="description" content={pageDescription} />
        <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=5.0" />
      </head>
      <body
        className="bg-background text-foreground min-h-svh overflow-x-hidden"
        suppressHydrationWarning
      >
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <header className="border-border/40 bg-background/80 fixed top-0 left-0 z-50 flex w-full items-center justify-between border-b px-4 py-3 backdrop-blur-md md:px-8">
            {/* Brand Logo & Name */}
            <div className="flex items-center gap-3">
              <div className="flex size-9 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-500 shadow-sm ring-1 ring-emerald-500/20">
                <svg
                  className="size-5"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M13.5 21v-7.5a.75.75 0 01.75-.75h3a.75.75 0 01.75.75V21m-4.5 0H2.25A2.25 2.25 0 010 18.75V10.5M13.5 21h8.25A2.25 2.25 0 0024 18.75V10.5M12 3l9.75 5.25v2.25H2.25V8.25L12 3z"
                  />
                </svg>
              </div>
              <div className="flex flex-col">
                <span className="text-foreground text-base font-bold tracking-tight">
                  {companyName}
                </span>
                <span className="text-muted-foreground text-xs font-medium">
                  Local Commerce Assistant
                </span>
              </div>
            </div>

            {/* Navigation Links */}
            <nav className="hidden items-center gap-6 md:flex">
              <a
                href="#home"
                className="text-foreground/80 text-xs font-semibold transition-colors hover:text-emerald-500"
              >
                Home
              </a>
              <a
                href="#capabilities"
                className="text-foreground/80 text-xs font-semibold transition-colors hover:text-emerald-500"
              >
                What I Can Help With
              </a>
              <a
                href="#how-it-works"
                className="text-foreground/80 text-xs font-semibold transition-colors hover:text-emerald-500"
              >
                How It Works
              </a>
              <a
                href="#reliability"
                className="text-foreground/80 text-xs font-semibold transition-colors hover:text-emerald-500"
              >
                Guardrails & Trust
              </a>
            </nav>

            {/* Right Status & Badges */}
            <div className="flex items-center gap-3">
              <div className="border-border bg-muted/50 hidden items-center gap-1.5 rounded-full border px-3 py-1 text-[11px] font-medium sm:flex">
                <span className="size-1.5 animate-pulse rounded-full bg-emerald-500" />
                <span className="text-muted-foreground">EN • HI • Hinglish</span>
              </div>
              <ThemeToggle className="size-8" />
            </div>
          </header>

          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}
