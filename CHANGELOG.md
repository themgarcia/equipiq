# Changelog

All notable changes to EquipIQ will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.3.7] - 2026-02-16

### Added
- CashGapSummary component computing from raw calculatedEquipment
- Restructured CostComparisonTooltip with per-item breakdowns
- Inline recovery method toggle with AlertDialog for multi-item categories
- New Definitions accordion entry with #lease-recovery anchor and auto-open on hash navigation

### Improved
- Updated EquipmentFormContent radio labels with descriptive text and "Which should I choose?" link to /definitions#lease-recovery
- isPaymentComplete helper excludes finished leases from CashGapSummary and both tooltip variants

## [1.3.6] - 2026-02-11

### Added
- BenchmarkType (hours | miles | calendar) and benchmarkRange fields on CategoryDefaults
- benchmarkUtils.ts with formatBenchmarkRange() including mi-to-km conversion
- lmn_recovery_method column on equipment table (owned | leased)
- lmnRecoveryMethod field on EquipmentCalculated type
- LmnRecoveryMethod type and recovery method grouping in rollup engine
- leasedItemCount, leasedItemMonthlyPayment, leasedItemDepositTotal, leasedItemAvgTermMonths fields on RollupLine
- CostComparisonTooltip component with deposit amortization logic
- LeasedRollupSection component for lease pass-through sub-tables
- Split RollupResult into fieldOwnedLines, fieldLeasedLines, overheadOwnedLines, overheadLeasedLines with corresponding totals
- Canadian province detection triggers automatic distance_unit = km on signup via database trigger

### Improved
- Rollup engine groups by category + recovery method (not just category)
- rollupToCSV exports separate Owned and Leased sections for both Field and Overhead
- FMS Export uses table-fixed layout with absolute-positioned copy buttons for vertical alignment
- Tooltip wording updated from saves/Saving to more competitive/cheaper
- Category taxonomy bumped to v6 (93 categories) with benchmark metadata

### Fixed
- Renamed Construction -- Loader -- Mini Skid Steer to Construction -- Loader -- Stand-On in taxonomy and database migration

## [1.3.5] - 2026-02-08

### Improved
- Redesigned EquipmentDetailsView into a compact financial snapshot (cost basis, COGS/overhead split, financing status)
- Removed granular sections (Identification, Purchase Breakdown, Lifecycle, Sale Info) from read-only view — data remains in edit form
- Added getFinancingStatus helper calculating payments remaining from financing start date and term

## [1.3.4] - 2026-01-23

### Added
- Get Started page (/get-started) with 7-step onboarding checklist
- WelcomeModal component shown to new users on Dashboard
- OnboardingSidebarLink with progress badge (completedCount/totalSteps)
- OnboardingContext with auto-completion for equipment/insurance steps
- Confetti animation via canvas-confetti when all steps completed
- onboarding_progress database table for persistence
- Password strength indicator with progress bar (weak/medium/strong)
- Show/hide password toggle using Eye/EyeOff icons
- 'Remember me' checkbox with 30-day session persistence via localStorage/sessionStorage

### Changed
- Dashboard reduced to 4 MetricCards (Fleet Investment, Monthly Payments, Outstanding Debt, Aging Alert)
- Replacement Forecast card with timeline summary (1yr/2yr/3yr) and Items Needing Attention list
- Upcoming Payoffs card with payoff dates and months remaining
- FMS Export page with multi-platform tabs (LMN active, SynkedUp/DynaManage/Aspire as Coming Soon)
- ComingSoonTab component for future FMS integrations with external links

### Improved
- FMS Export per-cell copy buttons with feedback animation
- MobileTabSelect for responsive FMS platform navigation
- Sortable columns with visual indicators (ArrowUp/ArrowDown/ArrowUpDown)
- Mobile card view with Sheet for equipment details
- Email format validation checkmark on login form
- Email existence check during signup Step 1 with 'Sign in here' shortcut link

## [1.3.3] - 2026-01-21

### Fixed
- Fixed NotificationBell using incorrect sidebar color tokens in content area

### Improved
- Semantic color coding for financial values - green/red indicators now only apply to performance-based metrics

## [1.3.2] - 2026-01-20

### Improved
- Unified typography across all pages for consistent styling
- Updated section headers in equipment forms and detail views to match dashboard styling

## [1.3.1] - 2026-01-15

### Added
- In-app Change Log page accessible from sidebar under Reference section

### Changed
- Cashflow projection chart now dynamically adjusts based on actual equipment payoff dates (ends 2 years after last payoff, minimum 3 years)
- Added "Today" marker on x-axis of cashflow projection chart for clearer timeline orientation

### Improved
- More relevant cashflow visualizations that only show years that matter for your portfolio

## [1.3.0] - 2026-01-12

### Added
- Authentication rate limiting to prevent brute-force attacks
- Version display in sidebar footer
- Changelog documentation

### Security
- Rate limiting on login (5 attempts per 15 minutes)
- Rate limiting on signup (3 attempts per hour)
- Rate limiting on password reset (3 attempts per hour)
- Enhanced RLS policies for auth_rate_limits table

## [1.2.0] - Previous Release

### Added
- Insurance Control module with full broker email integration
- Policy import with AI-powered document parsing
- Insured register with comprehensive change tracking
- Insurance metrics dashboard and renewal notifications
- Broker update email functionality with customizable templates
- Close the loop workflow for confirming insurance changes

### Changed
- Enhanced equipment form with insurance-specific fields
- Improved attachment management with insurance value tracking

## [1.1.0] - Earlier Release

### Added
- Demo mode for showcasing features without requiring an account
- Admin dashboard for user and subscription management
- Welcome email sent automatically on signup
- Password reset confirmation emails
- Document attachments with AI-powered parsing
- Equipment document storage with file management
- Notification system with bell icon and unread tracking

### Changed
- Improved mobile navigation with sheet-based menu
- Enhanced sidebar with collapsible state persistence

## [1.0.0] - Initial Release

### Added
- Equipment tracking with full CRUD operations
- Equipment attachments and parent-child relationships
- Category lifespan management with customizable defaults
- Buy vs Rent analysis tool with detailed calculations
- Cashflow analysis with interactive visualizations
- FMS (Fleet Management System) export functionality
- User authentication (signup, login, password reset)
- Profile management with company information
- Subscription management with Stripe integration
- Dark/light theme support with system preference detection
- Mobile-responsive layout with adaptive navigation
- Dashboard with key metrics and equipment overview
- Definitions page for terminology reference

### Security
- Row Level Security (RLS) on all user data tables
- Secure authentication flow with email verification
- Protected routes requiring authentication
