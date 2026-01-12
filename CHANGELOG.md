# Changelog

All notable changes to EquipIQ will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

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
