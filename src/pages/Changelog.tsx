import { Layout } from "@/components/Layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { History, Plus, RefreshCw, Sparkles, Shield, Bug } from "lucide-react";

interface ChangelogEntry {
  version: string;
  date: string;
  changes: {
    type: "added" | "changed" | "improved" | "security" | "fixed";
    items: string[];
  }[];
}

const changelogData: ChangelogEntry[] = [
  {
    version: "1.3.1",
    date: "2026-01-15",
    changes: [
      {
        type: "added",
        items: ["In-app Change Log page accessible from sidebar under Reference section"],
      },
      {
        type: "changed",
        items: [
          "Cashflow projection chart now dynamically adjusts based on actual equipment payoff dates (ends 2 years after last payoff, minimum 3 years)",
          'Added "Today" marker on x-axis of cashflow projection chart for clearer timeline orientation',
        ],
      },
      {
        type: "improved",
        items: ["More relevant cashflow visualizations that only show years that matter for your portfolio"],
      },
    ],
  },
  {
    version: "1.3.0",
    date: "2026-01-12",
    changes: [
      {
        type: "added",
        items: [
          "Authentication rate limiting to prevent brute-force attacks",
          "Version display in sidebar footer",
          "Changelog documentation",
        ],
      },
      {
        type: "security",
        items: [
          "Rate limiting on login (5 attempts per 15 minutes)",
          "Rate limiting on signup (3 attempts per hour)",
          "Rate limiting on password reset (3 attempts per hour)",
          "Enhanced RLS policies for auth_rate_limits table",
        ],
      },
    ],
  },
  {
    version: "1.2.0",
    date: "Previous Release",
    changes: [
      {
        type: "added",
        items: [
          "Insurance Control module with full broker email integration",
          "Policy import with AI-powered document parsing",
          "Insured register with comprehensive change tracking",
          "Insurance metrics dashboard and renewal notifications",
          "Broker update email functionality with customizable templates",
          "Close the loop workflow for confirming insurance changes",
        ],
      },
      {
        type: "changed",
        items: [
          "Enhanced equipment form with insurance-specific fields",
          "Improved attachment management with insurance value tracking",
        ],
      },
    ],
  },
  {
    version: "1.1.0",
    date: "Earlier Release",
    changes: [
      {
        type: "added",
        items: [
          "Demo mode for showcasing features without requiring an account",
          "Admin dashboard for user and subscription management",
          "Welcome email sent automatically on signup",
          "Password reset confirmation emails",
          "Document attachments with AI-powered parsing",
          "Equipment document storage with file management",
          "Notification system with bell icon and unread tracking",
        ],
      },
      {
        type: "changed",
        items: [
          "Improved mobile navigation with sheet-based menu",
          "Enhanced sidebar with collapsible state persistence",
        ],
      },
    ],
  },
  {
    version: "1.0.0",
    date: "Initial Release",
    changes: [
      {
        type: "added",
        items: [
          "Equipment tracking with full CRUD operations",
          "Equipment attachments and parent-child relationships",
          "Category lifespan management with customizable defaults",
          "Buy vs Rent analysis tool with detailed calculations",
          "Cashflow analysis with interactive visualizations",
          "FMS (Fleet Management System) export functionality",
          "User authentication (signup, login, password reset)",
          "Profile management with company information",
          "Subscription management with Stripe integration",
          "Dark/light theme support with system preference detection",
          "Mobile-responsive layout with adaptive navigation",
          "Dashboard with key metrics and equipment overview",
          "Definitions page for terminology reference",
        ],
      },
      {
        type: "security",
        items: [
          "Row Level Security (RLS) on all user data tables",
          "Secure authentication flow with email verification",
          "Protected routes requiring authentication",
        ],
      },
    ],
  },
];

const typeConfig = {
  added: {
    label: "Added",
    icon: Plus,
    className: "bg-green-500/10 text-green-600 dark:text-green-400 border-green-500/20",
  },
  changed: {
    label: "Changed",
    icon: RefreshCw,
    className: "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20",
  },
  improved: {
    label: "Improved",
    icon: Sparkles,
    className: "bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20",
  },
  security: {
    label: "Security",
    icon: Shield,
    className: "bg-orange-500/10 text-orange-600 dark:text-orange-400 border-orange-500/20",
  },
  fixed: {
    label: "Fixed",
    icon: Bug,
    className: "bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20",
  },
};

export default function Changelog() {
  return (
    <Layout>
      <div className="flex flex-col gap-6 p-4 md:p-6 max-w-4xl mx-auto">
        {/* Header */}
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <div className="h-1 w-8 rounded-full bg-primary" />
            <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
              Reference
            </span>
          </div>
          <div className="flex items-center gap-3">
            <History className="h-6 w-6 text-primary" />
            <h1 className="text-2xl font-bold tracking-tight">Change Log</h1>
          </div>
          <p className="text-muted-foreground">
            Track updates, improvements, and new features in equipIQ
          </p>
        </div>

        {/* Changelog entries */}
        <div className="space-y-4">
          {changelogData.map((entry, index) => (
            <Card key={entry.version} className={index === 0 ? "border-primary/50" : ""}>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <span className="text-lg font-semibold">v{entry.version}</span>
                    {index === 0 && (
                      <Badge variant="default" className="text-xs">
                        Latest
                      </Badge>
                    )}
                  </CardTitle>
                  <span className="text-sm text-muted-foreground">{entry.date}</span>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {entry.changes.map((change) => {
                  const config = typeConfig[change.type];
                  const Icon = config.icon;
                  return (
                    <div key={change.type} className="space-y-2">
                      <Badge variant="outline" className={config.className}>
                        <Icon className="h-3 w-3 mr-1" />
                        {config.label}
                      </Badge>
                      <ul className="space-y-1 ml-4">
                        {change.items.map((item, itemIndex) => (
                          <li
                            key={itemIndex}
                            className="text-sm text-muted-foreground list-disc list-outside ml-2"
                          >
                            {item}
                          </li>
                        ))}
                      </ul>
                    </div>
                  );
                })}
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </Layout>
  );
}
