import { useState } from 'react';
import { Link } from 'react-router-dom';
import { 
  Package, 
  FileSpreadsheet, 
  Scale, 
  Wallet, 
  Clock, 
  TrendingUp,
  ArrowRight,
  CheckCircle2,
  X,
  Zap,
  Users,
  Mail,
  Headphones,
  Menu
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { EquipIQIcon } from '@/components/EquipIQIcon';
import { useAuth } from '@/contexts/AuthContext';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';

const features = [
  {
    icon: Package,
    title: 'Equipment Tracking',
    description: 'Track your entire fleet with cost basis, financing terms, and real-time depreciation calculations.',
  },
  {
    icon: FileSpreadsheet,
    title: 'FMS Export',
    description: 'Export equipment data directly to LMN for seamless financial management system integration.',
  },
  {
    icon: Scale,
    title: 'Buy vs Rent Analysis',
    description: 'Make data-driven decisions on equipment acquisition with detailed cost comparisons.',
  },
  {
    icon: Wallet,
    title: 'Cashflow Analysis',
    description: 'Understand your monthly obligations, payment schedules, and upcoming buyouts.',
  },
  {
    icon: Clock,
    title: 'Category Lifespans',
    description: 'Industry-standard useful life defaults for accurate depreciation across equipment categories.',
  },
  {
    icon: TrendingUp,
    title: 'Replacement Planning',
    description: 'Know when equipment needs replacing and budget accordingly with projected end values.',
  },
];

const benefits = [
  'No accounting expertise required',
  'Built specifically for contractors',
  'Real-time depreciation calculations',
  'LMN FMS integration ready',
];

interface PlanFeature {
  name: string;
  free: boolean | string;
  professional: boolean | string;
  business: boolean | string;
}

const planFeatures: PlanFeature[] = [
  { name: 'Equipment + Attachments', free: '5 items', professional: '50 items', business: 'Unlimited' },
  { name: 'FMS Export', free: true, professional: true, business: true },
  { name: 'Buy vs Rent Analysis', free: 'Demo only', professional: true, business: true },
  { name: 'Cashflow Analysis', free: false, professional: true, business: true },
  { name: 'Document Storage', free: '100 MB', professional: '2 GB', business: 'Unlimited' },
  { name: 'Email Alerts', free: false, professional: true, business: true },
  { name: 'AI Document Parsing', free: false, professional: 'Included', business: 'Included' },
  { name: 'Support', free: 'Docs', professional: 'Email', business: 'Priority' },
];

export default function Landing() {
  const { user } = useAuth();
  const [isAnnual, setIsAnnual] = useState(true);

  const professionalPrice = isAnnual ? 349 : 39;
  const businessPrice = isAnnual ? 799 : 89;
  const professionalMonthly = isAnnual ? Math.round(349 / 12) : 39;
  const businessMonthly = isAnnual ? Math.round(799 / 12) : 89;

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 w-full border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-16 items-center justify-between">
          <div className="flex items-center gap-3">
            <EquipIQIcon size="lg" />
            <span className="text-xl font-bold text-foreground">equipIQ</span>
          </div>
          
          {/* Desktop navigation */}
          <div className="hidden md:flex items-center gap-4">
            {user ? (
              <Button asChild>
                <Link to="/dashboard">Go to Dashboard</Link>
              </Button>
            ) : (
              <>
                <Button variant="ghost" asChild>
                  <Link to="/auth">Log In</Link>
                </Button>
                <Button asChild>
                  <Link to="/auth">Get Started</Link>
                </Button>
              </>
            )}
          </div>
          
          {/* Mobile hamburger menu */}
          <Sheet>
            <SheetTrigger asChild className="md:hidden">
              <Button variant="ghost" size="icon">
                <Menu className="h-5 w-5" />
                <span className="sr-only">Open menu</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-64">
              <div className="flex flex-col gap-4 pt-8">
                <a href="#features" className="text-lg font-medium hover:text-primary transition-colors">
                  Features
                </a>
                <a href="#pricing" className="text-lg font-medium hover:text-primary transition-colors">
                  Pricing
                </a>
                <hr className="border-border" />
                {user ? (
                  <Button asChild>
                    <Link to="/dashboard">Go to Dashboard</Link>
                  </Button>
                ) : (
                  <>
                    <Button variant="ghost" asChild className="justify-start">
                      <Link to="/auth">Log In</Link>
                    </Button>
                    <Button asChild>
                      <Link to="/auth">Get Started</Link>
                    </Button>
                  </>
                )}
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </header>

      {/* Hero Section */}
      <section className="container py-24 md:py-32">
        <div className="mx-auto max-w-4xl text-center">
          <h1 className="text-4xl font-bold tracking-tight text-foreground sm:text-5xl md:text-6xl">
            Equipment Intelligence
            <span className="block text-primary">for Contractors</span>
          </h1>
          <p className="mt-6 text-lg text-muted-foreground md:text-xl max-w-2xl mx-auto">
            Track equipment costs, calculate depreciation, analyze buy vs rent decisions, 
            and export directly to your FMS—all without needing accounting expertise.
          </p>
          <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
            <Button size="lg" asChild className="text-lg px-8">
              <Link to="/auth">
                Start Free
                <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
            </Button>
            <Button size="lg" variant="outline" asChild className="text-lg px-8">
              <a href="#pricing">View Pricing</a>
            </Button>
          </div>
          <div className="mt-12 flex flex-wrap items-center justify-center gap-x-8 gap-y-4">
            {benefits.map((benefit) => (
              <div key={benefit} className="flex items-center gap-2 text-muted-foreground">
                <CheckCircle2 className="h-5 w-5 text-primary" />
                <span>{benefit}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="container py-24 bg-muted/30">
        <div className="mx-auto max-w-6xl">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-foreground sm:text-4xl">
              Everything You Need to Manage Equipment Costs
            </h2>
            <p className="mt-4 text-lg text-muted-foreground max-w-2xl mx-auto">
              Purpose-built tools for contractors who want to understand their true equipment costs.
            </p>
          </div>
          <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
            {features.map((feature) => (
              <Card key={feature.title} className="border-border bg-card hover:shadow-lg transition-shadow">
                <CardContent className="pt-6">
                  <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10 mb-4">
                    <feature.icon className="h-6 w-6 text-primary" />
                  </div>
                  <h3 className="text-xl font-semibold text-card-foreground mb-2">
                    {feature.title}
                  </h3>
                  <p className="text-muted-foreground">
                    {feature.description}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="container py-24">
        <div className="mx-auto max-w-6xl">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-foreground sm:text-4xl mb-4">
              Simple, Transparent Pricing
            </h2>
            <p className="text-lg text-muted-foreground mb-8">
              Start free and upgrade as your fleet grows.
            </p>
            
            {/* Billing Toggle */}
            <div className="flex items-center justify-center gap-4">
              <Label htmlFor="billing-toggle" className={cn(
                "text-sm font-medium transition-colors",
                !isAnnual ? "text-foreground" : "text-muted-foreground"
              )}>
                Monthly
              </Label>
              <Switch
                id="billing-toggle"
                checked={isAnnual}
                onCheckedChange={setIsAnnual}
              />
              <Label htmlFor="billing-toggle" className={cn(
                "text-sm font-medium transition-colors",
                isAnnual ? "text-foreground" : "text-muted-foreground"
              )}>
                Annual
              </Label>
              {isAnnual && (
                <span className="ml-2 rounded-full bg-green-500/10 px-3 py-1 text-xs font-medium text-green-600 dark:text-green-400">
                  Save up to 25%
                </span>
              )}
            </div>
          </div>

          {/* Pricing Cards */}
          <div className="grid gap-8 md:grid-cols-3 items-start">
            {/* Free Plan */}
            <Card className="border-border bg-card relative">
              <CardHeader className="pb-4">
                <CardTitle className="text-xl">Free</CardTitle>
                <div className="mt-4">
                  <span className="text-4xl font-bold text-foreground">$0</span>
                  <span className="text-muted-foreground">/forever</span>
                </div>
                <p className="text-sm text-muted-foreground mt-2">
                  Perfect for getting started
                </p>
              </CardHeader>
              <CardContent className="space-y-4">
                <ul className="space-y-3">
                  <li className="flex items-center gap-3 text-sm">
                    <CheckCircle2 className="h-4 w-4 text-primary flex-shrink-0" />
                    <span>5 equipment + attachments</span>
                  </li>
                  <li className="flex items-center gap-3 text-sm">
                    <CheckCircle2 className="h-4 w-4 text-primary flex-shrink-0" />
                    <span>Full FMS export</span>
                  </li>
                  <li className="flex items-center gap-3 text-sm">
                    <CheckCircle2 className="h-4 w-4 text-primary flex-shrink-0" />
                    <span>Buy vs Rent demo</span>
                  </li>
                  <li className="flex items-center gap-3 text-sm">
                    <CheckCircle2 className="h-4 w-4 text-primary flex-shrink-0" />
                    <span>100 MB document storage</span>
                  </li>
                  <li className="flex items-center gap-3 text-sm text-muted-foreground">
                    <X className="h-4 w-4 flex-shrink-0" />
                    <span>Cashflow analysis</span>
                  </li>
                  <li className="flex items-center gap-3 text-sm text-muted-foreground">
                    <X className="h-4 w-4 flex-shrink-0" />
                    <span>Email alerts</span>
                  </li>
                </ul>
                <Button variant="outline" className="w-full" asChild>
                  <Link to="/auth">Get Started</Link>
                </Button>
              </CardContent>
            </Card>

            {/* Professional Plan */}
            <Card className="border-primary bg-card relative shadow-lg scale-105">
              <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                <span className="rounded-full bg-primary px-4 py-1 text-xs font-medium text-primary-foreground">
                  Most Popular
                </span>
              </div>
              <CardHeader className="pb-4 pt-8">
                <CardTitle className="text-xl flex items-center gap-2">
                  <Zap className="h-5 w-5 text-primary" />
                  Professional
                </CardTitle>
                <div className="mt-4">
                  <span className="text-4xl font-bold text-foreground">${professionalMonthly}</span>
                  <span className="text-muted-foreground">/month</span>
                  {isAnnual && (
                    <p className="text-sm text-muted-foreground mt-1">
                      Billed ${professionalPrice}/year
                    </p>
                  )}
                </div>
                <p className="text-sm text-muted-foreground mt-2">
                  For growing contractors
                </p>
              </CardHeader>
              <CardContent className="space-y-4">
                <ul className="space-y-3">
                  <li className="flex items-center gap-3 text-sm">
                    <CheckCircle2 className="h-4 w-4 text-primary flex-shrink-0" />
                    <span className="font-medium">50 equipment + attachments</span>
                  </li>
                  <li className="flex items-center gap-3 text-sm">
                    <CheckCircle2 className="h-4 w-4 text-primary flex-shrink-0" />
                    <span>Full Buy vs Rent analysis</span>
                  </li>
                  <li className="flex items-center gap-3 text-sm">
                    <CheckCircle2 className="h-4 w-4 text-primary flex-shrink-0" />
                    <span>Cashflow analysis</span>
                  </li>
                  <li className="flex items-center gap-3 text-sm">
                    <CheckCircle2 className="h-4 w-4 text-primary flex-shrink-0" />
                    <span>2 GB document storage</span>
                  </li>
                  <li className="flex items-center gap-3 text-sm">
                    <CheckCircle2 className="h-4 w-4 text-primary flex-shrink-0" />
                    <span>AI document parsing included</span>
                  </li>
                  <li className="flex items-center gap-3 text-sm">
                    <Mail className="h-4 w-4 text-primary flex-shrink-0" />
                    <span>Email alerts & support</span>
                  </li>
                </ul>
                <Button className="w-full" asChild>
                  <Link to="/auth">
                    Start Free Trial
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
              </CardContent>
            </Card>

            {/* Business Plan */}
            <Card className="border-border bg-card relative">
              <CardHeader className="pb-4">
                <CardTitle className="text-xl flex items-center gap-2">
                  <Users className="h-5 w-5 text-primary" />
                  Business
                </CardTitle>
                <div className="mt-4">
                  <span className="text-4xl font-bold text-foreground">${businessMonthly}</span>
                  <span className="text-muted-foreground">/month</span>
                  {isAnnual && (
                    <p className="text-sm text-muted-foreground mt-1">
                      Billed ${businessPrice}/year
                    </p>
                  )}
                </div>
                <p className="text-sm text-muted-foreground mt-2">
                  For large fleets
                </p>
              </CardHeader>
              <CardContent className="space-y-4">
                <ul className="space-y-3">
                  <li className="flex items-center gap-3 text-sm">
                    <CheckCircle2 className="h-4 w-4 text-primary flex-shrink-0" />
                    <span className="font-medium">Unlimited equipment</span>
                  </li>
                  <li className="flex items-center gap-3 text-sm">
                    <CheckCircle2 className="h-4 w-4 text-primary flex-shrink-0" />
                    <span>Everything in Professional</span>
                  </li>
                  <li className="flex items-center gap-3 text-sm">
                    <CheckCircle2 className="h-4 w-4 text-primary flex-shrink-0" />
                    <span>Unlimited document storage</span>
                  </li>
                  <li className="flex items-center gap-3 text-sm">
                    <Headphones className="h-4 w-4 text-primary flex-shrink-0" />
                    <span>Priority support</span>
                  </li>
                </ul>
                <Button variant="outline" className="w-full" asChild>
                  <Link to="/auth">
                    Start Free Trial
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* Feature Comparison Table */}
          <div className="mt-16 overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left py-4 px-4 font-medium text-foreground">Features</th>
                  <th className="text-center py-4 px-4 font-medium text-foreground">Free</th>
                  <th className="text-center py-4 px-4 font-medium text-foreground bg-primary/5">Professional</th>
                  <th className="text-center py-4 px-4 font-medium text-foreground">Business</th>
                </tr>
              </thead>
              <tbody>
                {planFeatures.map((feature, index) => (
                  <tr key={feature.name} className={cn(
                    "border-b border-border",
                    index % 2 === 0 && "bg-muted/20"
                  )}>
                    <td className="py-3 px-4 text-sm text-foreground">{feature.name}</td>
                    <td className="py-3 px-4 text-center text-sm">
                      {typeof feature.free === 'boolean' ? (
                        feature.free ? (
                          <CheckCircle2 className="h-5 w-5 text-primary mx-auto" />
                        ) : (
                          <X className="h-5 w-5 text-muted-foreground mx-auto" />
                        )
                      ) : (
                        <span className="text-muted-foreground">{feature.free}</span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-center text-sm bg-primary/5">
                      {typeof feature.professional === 'boolean' ? (
                        feature.professional ? (
                          <CheckCircle2 className="h-5 w-5 text-primary mx-auto" />
                        ) : (
                          <X className="h-5 w-5 text-muted-foreground mx-auto" />
                        )
                      ) : (
                        <span className="font-medium text-foreground">{feature.professional}</span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-center text-sm">
                      {typeof feature.business === 'boolean' ? (
                        feature.business ? (
                          <CheckCircle2 className="h-5 w-5 text-primary mx-auto" />
                        ) : (
                          <X className="h-5 w-5 text-muted-foreground mx-auto" />
                        )
                      ) : (
                        <span className="font-medium text-foreground">{feature.business}</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="container py-24 bg-primary/5">
        <div className="mx-auto max-w-3xl text-center">
          <h2 className="text-3xl font-bold text-foreground sm:text-4xl mb-4">
            Ready to Take Control of Your Equipment Costs?
          </h2>
          <p className="text-lg text-muted-foreground mb-8">
            Join contractors who are making smarter equipment decisions with equipIQ.
          </p>
          <Button size="lg" asChild className="text-lg px-8">
            <Link to="/auth">
              Get Started Free
              <ArrowRight className="ml-2 h-5 w-5" />
            </Link>
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border bg-background">
        <div className="container py-12">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-3">
              <EquipIQIcon size="md" />
              <span className="font-semibold text-foreground">equipIQ</span>
            </div>
            <div className="flex items-center gap-6 text-sm text-muted-foreground">
              <Link to="/terms" className="hover:text-foreground transition-colors">
                Terms of Service
              </Link>
              <Link to="/privacy" className="hover:text-foreground transition-colors">
                Privacy Policy
              </Link>
            </div>
            <p className="text-sm text-muted-foreground">
              © {new Date().getFullYear()} equipIQ. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
