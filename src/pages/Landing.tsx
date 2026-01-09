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
  Menu
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { EquipIQIcon } from '@/components/EquipIQIcon';
import { useAuth } from '@/contexts/AuthContext';
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

export default function Landing() {
  const { user } = useAuth();

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
                <a href="#open-beta" className="text-lg font-medium hover:text-primary transition-colors">
                  Open Beta
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
          <span className="inline-block rounded-full bg-primary/10 px-4 py-1.5 text-sm font-medium text-primary mb-6">
            Open Beta
          </span>
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
                Get Open Beta Access
                <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
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

      {/* Open Beta Section */}
      <section id="open-beta" className="container py-24">
        <div className="mx-auto max-w-4xl">
          <div className="text-center mb-12">
            <span className="inline-block rounded-full bg-primary/10 px-4 py-1.5 text-sm font-medium text-primary mb-6">
              Open Beta
            </span>
            <h2 className="text-3xl font-bold text-foreground sm:text-4xl mb-4">
              Join the equipIQ Open Beta
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              We're working closely with contractors to build the equipment management 
              tool this industry actually needs. Get full access while we refine the 
              platform together.
            </p>
          </div>

          {/* Single Beta Access Card */}
          <Card className="border-primary bg-card max-w-lg mx-auto shadow-lg">
            <CardHeader className="text-center pb-4">
              <CardTitle className="text-2xl">Full Access – No Cost</CardTitle>
              <p className="text-muted-foreground mt-2">
                During the open beta period
              </p>
            </CardHeader>
            <CardContent className="space-y-6">
              <ul className="space-y-3">
                <li className="flex items-center gap-3">
                  <CheckCircle2 className="h-5 w-5 text-primary flex-shrink-0" />
                  <span>Track your entire equipment fleet</span>
                </li>
                <li className="flex items-center gap-3">
                  <CheckCircle2 className="h-5 w-5 text-primary flex-shrink-0" />
                  <span>Full Buy vs Rent analysis</span>
                </li>
                <li className="flex items-center gap-3">
                  <CheckCircle2 className="h-5 w-5 text-primary flex-shrink-0" />
                  <span>Cashflow analysis and projections</span>
                </li>
                <li className="flex items-center gap-3">
                  <CheckCircle2 className="h-5 w-5 text-primary flex-shrink-0" />
                  <span>Export directly to LMN FMS</span>
                </li>
                <li className="flex items-center gap-3">
                  <CheckCircle2 className="h-5 w-5 text-primary flex-shrink-0" />
                  <span>Document storage and AI parsing</span>
                </li>
              </ul>
              
              <Button className="w-full" size="lg" asChild>
                <Link to="/auth">
                  Get Open Beta Access
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Link>
              </Button>
              
              {/* Reassurance notes */}
              <div className="text-center space-y-1 pt-2">
                <p className="text-sm text-muted-foreground">
                  No credit card required
                </p>
                <p className="text-sm text-muted-foreground">
                  Pricing will be introduced after the beta period
                </p>
              </div>
            </CardContent>
          </Card>
          
          {/* Why Beta explanation */}
          <div className="mt-12 text-center max-w-2xl mx-auto">
            <h3 className="text-lg font-semibold text-foreground mb-3">
              Why Open Beta?
            </h3>
            <p className="text-muted-foreground">
              We believe the best tools are built with real feedback from the people 
              who use them. During this beta period, we're focused on learning from 
              contractors like you to make equipIQ genuinely useful for your 
              day-to-day equipment decisions.
            </p>
          </div>
        </div>
      </section>

      {/* Final CTA Section */}
      <section className="container py-24 bg-muted/30">
        <div className="mx-auto max-w-3xl text-center">
          <h2 className="text-3xl font-bold text-foreground sm:text-4xl mb-4">
            Ready to Take Control of Your Equipment Costs?
          </h2>
          <p className="text-lg text-muted-foreground mb-8">
            Join the open beta and start making smarter equipment decisions today.
          </p>
          <Button size="lg" asChild className="text-lg px-8">
            <Link to="/auth">
              Join the Open Beta
              <ArrowRight className="ml-2 h-5 w-5" />
            </Link>
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border">
        <div className="container py-12">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-3">
              <EquipIQIcon />
              <span className="font-semibold text-foreground">equipIQ</span>
            </div>
            <div className="flex flex-wrap items-center justify-center gap-6 text-sm text-muted-foreground">
              <a href="#features" className="hover:text-foreground transition-colors">Features</a>
              <a href="#open-beta" className="hover:text-foreground transition-colors">Open Beta</a>
              <Link to="/terms" className="hover:text-foreground transition-colors">Terms</Link>
              <Link to="/privacy" className="hover:text-foreground transition-colors">Privacy</Link>
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
