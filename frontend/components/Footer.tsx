import React from 'react';
import Link from 'next/link';
import ThemeToggle from './ThemeToggle';

export default function Footer() {
  return (
    <footer
      aria-label="Site footer"
      className="border-t border-default/30 bg-[var(--bg)] mb-[60px] md:mb-0"
    >
      <div className="max-w-[1200px] mx-auto py-12 px-8 md:py-12 md:px-8 py-8 px-4">
        {/* 4-Column Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-8 mb-12">

          {/* Column 1: EXPLORE */}
          <nav aria-label="Explore navigation">
            <h3 className="text-xs uppercase tracking-[3px] text-[var(--text-subdued)] font-semibold mb-4">
              Explore
            </h3>
            <ul className="space-y-3">
              <li>
                <Link
                  href="/artists"
                  className="text-sm text-[var(--text-dim)] hover:text-[var(--secondary)] leading-relaxed transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--secondary)] rounded"
                >
                  Browse Artists
                </Link>
              </li>
              <li>
                <Link
                  href="/search"
                  className="text-sm text-[var(--text-dim)] hover:text-[var(--secondary)] leading-relaxed transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--secondary)] rounded"
                >
                  Search Shows
                </Link>
              </li>
              <li>
                <Link
                  href="/library"
                  className="text-sm text-[var(--text-dim)] hover:text-[var(--secondary)] leading-relaxed transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--secondary)] rounded"
                >
                  Your Library
                </Link>
              </li>
              <li>
                <Link
                  href="/playlists"
                  className="text-sm text-[var(--text-dim)] hover:text-[var(--secondary)] leading-relaxed transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--secondary)] rounded"
                >
                  Playlists
                </Link>
              </li>
            </ul>
          </nav>

          {/* Column 2: FEATURES */}
          <nav aria-label="Features navigation">
            <h3 className="text-xs uppercase tracking-[3px] text-[var(--text-subdued)] font-semibold mb-4">
              Features
            </h3>
            <ul className="space-y-3">
              <li>
                <Link
                  href="/library?tab=recent"
                  className="text-sm text-[var(--text-dim)] hover:text-[var(--secondary)] leading-relaxed transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--secondary)] rounded"
                >
                  Recently Played
                </Link>
              </li>
              <li>
                <Link
                  href="/library?tab=liked"
                  className="text-sm text-[var(--text-dim)] hover:text-[var(--secondary)] leading-relaxed transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--secondary)] rounded"
                >
                  Liked Songs
                </Link>
              </li>
              <li>
                <span className="text-sm text-[var(--text-subdued)] leading-relaxed">
                  Queue
                </span>
              </li>
              <li>
                <span className="text-sm text-[var(--text-subdued)] leading-relaxed">
                  Keyboard Shortcuts
                </span>
              </li>
            </ul>
          </nav>

          {/* Column 3: ACCOUNT */}
          <nav aria-label="Account navigation">
            <h3 className="text-xs uppercase tracking-[3px] text-[var(--text-subdued)] font-semibold mb-4">
              Account
            </h3>
            <ul className="space-y-3">
              <li>
                <Link
                  href="/account"
                  className="text-sm text-[var(--text-dim)] hover:text-[var(--secondary)] leading-relaxed transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--secondary)] rounded"
                >
                  Sign In / Profile
                </Link>
              </li>
              <li>
                <Link
                  href="/account/settings"
                  className="text-sm text-[var(--text-dim)] hover:text-[var(--secondary)] leading-relaxed transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--secondary)] rounded"
                >
                  Account Settings
                </Link>
              </li>
              <li>
                <Link
                  href="/account/orders"
                  className="text-sm text-[var(--text-dim)] hover:text-[var(--secondary)] leading-relaxed transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--secondary)] rounded"
                >
                  Orders
                </Link>
              </li>
            </ul>
          </nav>

          {/* Column 4: ABOUT */}
          <nav aria-label="About navigation">
            <h3 className="text-xs uppercase tracking-[3px] text-[var(--text-subdued)] font-semibold mb-4">
              About
            </h3>
            <ul className="space-y-3">
              <li>
                <Link
                  href="/about"
                  className="text-sm text-[var(--text-dim)] hover:text-[var(--secondary)] leading-relaxed transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--secondary)] rounded"
                >
                  About
                </Link>
              </li>
              <li>
                <Link
                  href="/how-it-works"
                  className="text-sm text-[var(--text-dim)] hover:text-[var(--secondary)] leading-relaxed transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--secondary)] rounded"
                >
                  How It Works
                </Link>
              </li>
              <li>
                <Link
                  href="/faq"
                  className="text-sm text-[var(--text-dim)] hover:text-[var(--secondary)] leading-relaxed transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--secondary)] rounded"
                >
                  FAQ
                </Link>
              </li>
              <li>
                <Link
                  href="/privacy"
                  className="text-sm text-[var(--text-dim)] hover:text-[var(--secondary)] leading-relaxed transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--secondary)] rounded"
                >
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link
                  href="/cookie-policy"
                  className="text-sm text-[var(--text-dim)] hover:text-[var(--secondary)] leading-relaxed transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--secondary)] rounded"
                >
                  Cookie Policy
                </Link>
              </li>
              <li>
                <Link
                  href="/terms"
                  className="text-sm text-[var(--text-dim)] hover:text-[var(--secondary)] leading-relaxed transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--secondary)] rounded"
                >
                  Terms of Service
                </Link>
              </li>
              <li>
                <Link
                  href="/dmca"
                  className="text-sm text-[var(--text-dim)] hover:text-[var(--secondary)] leading-relaxed transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--secondary)] rounded"
                >
                  DMCA Policy
                </Link>
              </li>
              <li>
                <Link
                  href="/contact"
                  className="text-sm text-[var(--text-dim)] hover:text-[var(--secondary)] leading-relaxed transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--secondary)] rounded"
                >
                  Contact
                </Link>
              </li>
              <li>
                <Link
                  href="/tapers"
                  className="text-sm text-[var(--text-dim)] hover:text-[var(--secondary)] leading-relaxed transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--secondary)] rounded"
                >
                  Tapers
                </Link>
              </li>
            </ul>
          </nav>
        </div>

        {/* Bottom Section */}
        <div className="border-t border-[var(--bg-elevated)]/20 pt-8 flex flex-col md:flex-row items-center justify-between gap-4">

          {/* Left: Ethos */}
          <div className="text-sm text-[var(--secondary)] font-medium tracking-wide">
            Please copy freely — never sell
          </div>

          {/* Center: Archive.org Logo */}
          <a
            href="https://archive.org"
            target="_blank"
            rel="noopener noreferrer"
            className="group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--secondary)] rounded"
            aria-label="Powered by Archive.org (opens in new tab)"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 27 30"
              className="w-8 h-8 fill-[var(--text-dim)] group-hover:fill-[var(--secondary)] transition-all duration-300 group-hover:drop-shadow-[0_0_8px_var(--secondary-muted)]"
              role="img"
              aria-label="Archive.org logo"
            >
              <g>
                <path d="M26.687,9.43c-0.134,0.022-3.375,0.558-6.465,1.049c-3.09,0.492-6.03,0.917-6.53,0.936
                  c-0.716,0.033-0.934-0.082-1.141-0.669c-0.231-0.641-0.231-10.719,0-11.36c0.207-0.587,0.425-0.702,1.141-0.669
                  c0.5,0.019,3.44,0.444,6.53,0.936c3.09,0.491,6.331,1.027,6.465,1.049c0.217,0.033,0.313,1.808,0.313,5.349
                  C27,9.43,26.904,9.397,26.687,9.43z"/>
                <path d="M11.812,9.652c-0.022,0.066-0.425,0.082-2.446,0.115c-2.021,0.033-6.465,0.115-9.865,0.164
                  C0.425,9.931,0,9.948,0,9.652c0-0.099,0.045-0.807,0.089-1.578C0.179,6.627,0.29,4.95,0.335,4.77
                  c0.089-0.279,0.201-0.312,2.825-0.608c1.545-0.181,4.856-0.525,7.375-0.79c2.519-0.263,4.611-0.459,4.667-0.443
                  c0.134,0.05,0.313,0.755,0.38,1.578c0.045,0.525,0.089,1.282,0.112,1.693l0.022,0.74l-1.918,0.098
                  c-1.053,0.066-2.042,0.148-2.197,0.214c-0.246,0.099-0.291,0.263-0.335,1.282C11.223,9.403,11.834,9.586,11.812,9.652z"/>
                <path d="M11.812,20.348c0.022,0.066-0.589,0.249-0.547,1.118c0.045,1.019,0.089,1.183,0.335,1.282
                  c0.156,0.066,1.145,0.148,2.197,0.214l1.918,0.098l-0.022,0.74c-0.022,0.411-0.067,1.168-0.112,1.693
                  c-0.067,0.823-0.246,1.528-0.38,1.578c-0.056,0.016-2.148-0.181-4.667-0.443c-2.519-0.263-5.83-0.608-7.375-0.79
                  c-2.624-0.296-2.736-0.329-2.825-0.608c-0.045-0.181-0.156-1.857-0.246-3.305C0.045,21.155,0,20.447,0,20.348
                  c0-0.296,0.425-0.279,1.501-0.279c3.4,0.049,7.844,0.131,9.865,0.164C13.387,20.266,11.789,20.282,11.812,20.348z"/>
                <path d="M26.687,20.57c-0.134-0.022-3.375-0.558-6.465-1.049s-6.03-0.917-6.53-0.936
                  c-0.716-0.033-0.934,0.082-1.141,0.669c-0.231,0.641-0.231,10.719,0,11.36c0.207,0.587,0.425,0.702,1.141,0.669
                  c0.5-0.019,3.44-0.444,6.53-0.936c3.09-0.491,6.331-1.027,6.465-1.049c0.217-0.033,0.313-1.808,0.313-5.349
                  C27,20.57,26.904,20.603,26.687,20.57z"/>
              </g>
            </svg>
          </a>

          {/* Right: Copyright */}
          <div className="text-xs text-[var(--text-subdued)] uppercase tracking-wider">
            © 2026 8pm.me
          </div>
        </div>

        {/* Theme Selector */}
        <div className="flex justify-center pt-6">
          <ThemeToggle iconSize={76} />
        </div>
      </div>
    </footer>
  );
}
