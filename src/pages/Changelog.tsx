import { Layout } from "@/components/Layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { History, Plus, RefreshCw, Sparkles, Shield, Bug } from "lucide-react";
import changelogSource from "@/data/changelog.json";

interface ChangelogChange {
  type: "added" | "changed" | "improved" | "security" | "fixed";
  items: string[];
}

interface ChangelogEntry {
  version: string;
  changes: ChangelogChange[];
}

// Transform JSON source to display format (uses userFacing items only)
const changelogData: ChangelogEntry[] = changelogSource.entries.map((entry) => ({
  version: entry.version,
  changes: entry.changes.map((change) => ({
    type: change.type as ChangelogChange["type"],
    items: change.userFacing,
  })),
}));

const typeConfig = {
  added: {
    label: "Added",
    icon: Plus,
    className: "bg-success/10 text-success border-success/20",
  },
  changed: {
    label: "Changed",
    icon: RefreshCw,
    className: "bg-info/10 text-info border-info/20",
  },
  improved: {
    label: "Improved",
    icon: Sparkles,
    className: "bg-improved/10 text-improved border-improved/20",
  },
  security: {
    label: "Security",
    icon: Shield,
    className: "bg-warning/10 text-warning border-warning/20",
  },
  fixed: {
    label: "Fixed",
    icon: Bug,
    className: "bg-destructive/10 text-destructive border-destructive/20",
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
