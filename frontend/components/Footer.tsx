import React from 'react';
import Link from 'next/link';
import ThemeToggle from './ThemeToggle';

const aboutLinks = [
  { href: '/about', label: 'About' },
  { href: '/how-it-works', label: 'How It Works' },
  { href: '/faq', label: 'FAQ' },
  { href: '/dmca', label: 'DMCA' },
  { href: '/contact', label: 'Contact' },
  { href: '/tapers', label: 'Tapers' },
];

const legalLinks = [
  { href: '/privacy', label: 'Privacy Policy' },
  { href: '/cookie-policy', label: 'Cookie Policy' },
  { href: '/terms', label: 'Terms of Service' },
];

const linkClass =
  'text-sm text-[var(--text-subdued)] hover:text-[var(--secondary)] transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--secondary)] rounded';

const legalLinkClass =
  'text-xs text-[var(--text-subdued)] hover:text-[var(--secondary)] transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--secondary)] rounded';

export default function Footer() {
  return (
    <footer
      aria-label="Site footer"
      className="mb-[60px] md:mb-0"
    >
      <div className="max-w-[1200px] mx-auto pt-8 pb-6 px-4 md:px-8 text-center space-y-4">
        {/* Row 1: About Links */}
        <nav
          aria-label="About navigation"
          className="flex flex-wrap justify-center items-center gap-y-1"
        >
          {aboutLinks.map((link, i) => (
            <React.Fragment key={link.href}>
              {i > 0 && (
                <span aria-hidden="true" className="text-[var(--text-subdued)] mx-2">
                  ·
                </span>
              )}
              <Link href={link.href} className={linkClass}>
                {link.label}
              </Link>
            </React.Fragment>
          ))}
        </nav>

        {/* Row 2: Legal Links */}
        <div className="flex flex-wrap justify-center items-center gap-y-1">
          {legalLinks.map((link, i) => (
            <React.Fragment key={link.href}>
              {i > 0 && (
                <span aria-hidden="true" className="text-[var(--text-subdued)] mx-2">
                  ·
                </span>
              )}
              <Link href={link.href} className={legalLinkClass}>
                {link.label}
              </Link>
            </React.Fragment>
          ))}
        </div>

        {/* Row 3: Copyright */}
        <p className="text-xs text-[var(--text-subdued)]">
          Copyright © {new Date().getFullYear()} 8pm.me. All Rights Reserved.
        </p>

        {/* Row 4: Theme Toggle */}
        <div className="flex justify-center pt-2">
          <ThemeToggle iconSize={76} />
        </div>

        {/* Row 5: Powered by Archive.org */}
        <a
          href="https://archive.org"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex flex-col items-center gap-1.5 pt-2 group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--secondary)] rounded"
          aria-label="Powered by Archive.org (opens in new tab)"
        >
          <span className="text-[10px] uppercase tracking-[2px] text-[var(--text-subdued)] group-hover:text-[var(--secondary)] transition-colors duration-200">
            Powered by
          </span>
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 27 30"
            className="w-7 h-7 fill-[var(--text-subdued)] group-hover:fill-[var(--secondary)] transition-all duration-300 group-hover:drop-shadow-[0_0_8px_var(--secondary-muted)]"
            role="img"
            aria-label="Archive.org logo"
          >
            <g>
              <path d="M26.687,9.43c-0.134,0.022-3.375,0.558-6.465,1.049c-3.09,0.492-6.03,0.917-6.53,0.936c-0.716,0.033-0.934-0.082-1.141-0.669c-0.231-0.641-0.231-10.719,0-11.36c0.207-0.587,0.425-0.702,1.141-0.669c0.5,0.019,3.44,0.444,6.53,0.936c3.09,0.491,6.331,1.027,6.465,1.049c0.217,0.033,0.313,1.808,0.313,5.349C27,9.43,26.904,9.397,26.687,9.43z" />
              <path d="M11.812,9.652c-0.022,0.066-0.425,0.082-2.446,0.115c-2.021,0.033-6.465,0.115-9.865,0.164C0.425,9.931,0,9.948,0,9.652c0-0.099,0.045-0.807,0.089-1.578C0.179,6.627,0.29,4.95,0.335,4.77c0.089-0.279,0.201-0.312,2.825-0.608c1.545-0.181,4.856-0.525,7.375-0.79c2.519-0.263,4.611-0.459,4.667-0.443c0.134,0.05,0.313,0.755,0.38,1.578c0.045,0.525,0.089,1.282,0.112,1.693l0.022,0.74l-1.918,0.098c-1.053,0.066-2.042,0.148-2.197,0.214c-0.246,0.099-0.291,0.263-0.335,1.282C11.223,9.403,11.834,9.586,11.812,9.652z" />
              <path d="M11.812,20.348c0.022,0.066-0.589,0.249-0.547,1.118c0.045,1.019,0.089,1.183,0.335,1.282c0.156,0.066,1.145,0.148,2.197,0.214l1.918,0.098l-0.022,0.74c-0.022,0.411-0.067,1.168-0.112,1.693c-0.067,0.823-0.246,1.528-0.38,1.578c-0.056,0.016-2.148-0.181-4.667-0.443c-2.519-0.263-5.83-0.608-7.375-0.79c-2.624-0.296-2.736-0.329-2.825-0.608c-0.045-0.181-0.156-1.857-0.246-3.305C0.045,21.155,0,20.447,0,20.348c0-0.296,0.425-0.279,1.501-0.279c3.4,0.049,7.844,0.131,9.865,0.164C13.387,20.266,11.789,20.282,11.812,20.348z" />
              <path d="M26.687,20.57c-0.134-0.022-3.375-0.558-6.465-1.049s-6.03-0.917-6.53-0.936c-0.716-0.033-0.934,0.082-1.141,0.669c-0.231,0.641-0.231,10.719,0,11.36c0.207,0.587,0.425,0.702,1.141,0.669c0.5-0.019,3.44-0.444,6.53-0.936c3.09-0.491,6.331-1.027,6.465-1.049c0.217-0.033,0.313-1.808,0.313-5.349C27,20.57,26.904,20.603,26.687,20.57z" />
            </g>
          </svg>
        </a>
      </div>
    </footer>
  );
}
