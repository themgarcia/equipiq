import { Layout } from "@/components/Layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { History, Plus, RefreshCw, Sparkles, Shield, Bug } from "lucide-react";

interface ChangelogEntry {
  version: string;
  changes: {
    type: "added" | "changed" | "improved" | "security" | "fixed";
    items: string[];
  }[];
}

const changelogData: ChangelogEntry[] = [
  {
    version: "1.3.1",
    changes: [
      {
        type: "added",
        items: ["In-app Change Log page accessible from sidebar under Reference section"],
      },
      {
        type: "changed",
        items: [
          "Cashflow projection chart now dynamically adjusts based on your equipment payoff dates",
          "Added 'Today' marker on cashflow chart for clearer timeline orientation",
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
    changes: [
      {
        type: "added",
        items: [
          "Version display in sidebar footer",
          "Change log documentation",
        ],
      },
      {
        type: "security",
        items: [
          "Enhanced account security protections",
        ],
      },
    ],
  },
  {
    version: "1.2.0",
    changes: [
      {
        type: "added",
        items: [
          "Insurance Control module with broker email integration",
          "Policy import with smart document parsing",
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
    changes: [
      {
        type: "added",
        items: [
          "Demo mode for exploring features before signing up",
          "Welcome email sent automatically on signup",
          "Password reset confirmation emails",
          "Document attachments with smart parsing",
          "Equipment document storage with file management",
          "Notification system with unread tracking",
        ],
      },
      {
        type: "changed",
        items: [
          "Improved mobile navigation",
          "Enhanced sidebar with collapsible state persistence",
        ],
      },
    ],
  },
  {
    version: "1.0.0",
    changes: [
      {
        type: "added",
        items: [
          "Complete equipment tracking and management",
          "Equipment attachments and parent-child relationships",
          "Category lifespan management with customizable defaults",
          "Buy vs Rent analysis tool with detailed calculations",
          "Cashflow analysis with interactive visualizations",
          "FMS (Fleet Management System) export functionality",
          "User authentication (signup, login, password reset)",
          "Profile management with company information",
          "Subscription management",
          "Dark/light theme support with system preference detection",
          "Mobile-responsive layout with adaptive navigation",
          "Dashboard with key metrics and equipment overview",
          "Definitions page for terminology reference",
        ],
      },
      {
        type: "security",
        items: [
          "Enterprise-grade data security for all user data",
          "Secure account verification",
          "Protected access to your data",
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
            <span className="text-xs font-medium text-muted-foreground">
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
                <CardTitle className="flex items-center gap-2">
                  <span className="text-lg font-semibold">v{entry.version}</span>
                  {index === 0 && (
                    <Badge variant="default" className="text-xs">
                      Latest
                    </Badge>
                  )}
                </CardTitle>
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
