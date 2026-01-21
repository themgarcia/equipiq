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
  Menu,
  Sparkles,
  ShieldCheck,
  Upload,
  Brain,
  FileCheck,
  HelpCircle,
  BarChart3,
  Calculator,
  AlertTriangle
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { EquipIQIcon } from '@/components/EquipIQIcon';
import { useAuth } from '@/contexts/AuthContext';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';

const painPoints = [
  "What's my total monthly equipment debt?",
  "When should I trade in the excavator?",
  "Are my insurance declarations current?",
  "Should I lease or buy the next skid steer?",
];

const benefits = [
  'Know your true cost of ownership',
  'See your monthly debt at a glance',
  'Track depreciation automatically',
  'Insurance and equipment in one place',
];

const howItWorksSteps = [
  {
    icon: Upload,
    step: '1',
    title: 'Drop Your Documents',
    description: 'Invoices, leases, insurance policies—any format. PDF or photo.',
  },
  {
    icon: Brain,
    step: '2',
    title: 'AI Extracts the Data',
    description: 'Make, model, pricing, financing terms, serial numbers. Done in seconds.',
  },
  {
    icon: BarChart3,
    step: '3',
    title: 'Get Answers',
    description: 'Total debt, depreciation, replacement timing, insurance gaps—all in one place.',
  },
];

const whatYoullKnow = [
  {
    question: "What's my total monthly payment across all equipment?",
    source: 'Cashflow Analysis',
    icon: Wallet,
  },
  {
    question: 'Which machines are depreciating faster than expected?',
    source: 'Dashboard metrics',
    icon: TrendingUp,
  },
  {
    question: 'What should I charge for this equipment on the job?',
    source: 'FMS Export',
    icon: FileSpreadsheet,
  },
  {
    question: 'Should I buy or rent the next piece?',
    source: 'Buy vs Rent tool',
    icon: Calculator,
  },
  {
    question: 'Is my scheduled equipment value accurate?',
    source: 'Insurance Control',
    icon: ShieldCheck,
  },
  {
    question: "What's coming off lease in the next 6 months?",
    source: 'Upcoming payoffs',
    icon: Clock,
  },
];

const features = [
  {
    icon: Package,
    title: 'Equipment Tracking',
    description: 'Track your entire fleet with cost basis, financing terms, and real-time depreciation.',
  },
  {
    icon: ShieldCheck,
    title: 'Insurance Control',
    description: 'Manage insured equipment, track scheduled values, email broker updates with one click.',
  },
  {
    icon: Scale,
    title: 'Buy vs Rent Analysis',
    description: 'Make data-driven decisions on equipment acquisition with detailed cost comparisons.',
  },
  {
    icon: Wallet,
    title: 'Cashflow Analysis',
    description: 'Understand your monthly payments, payment schedules, and upcoming buyouts.',
  },
  {
    icon: Clock,
    title: 'Replacement Planning',
    description: 'Know when equipment needs replacing and budget accordingly.',
  },
  {
    icon: FileSpreadsheet,
    title: 'FMS Export',
    description: 'Copy equipment costs into your estimating software—stop giving away equipment for free.',
  },
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
            <a href="#how-it-works" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
              How It Works
            </a>
            <a href="#what-youll-know" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
              What You'll Know
            </a>
            <a href="#features" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
              Features
            </a>
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
                  <Link to="/auth">Try equipIQ Free</Link>
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
                <a href="#how-it-works" className="text-lg font-medium hover:text-primary transition-colors">
                  How It Works
                </a>
                <a href="#what-youll-know" className="text-lg font-medium hover:text-primary transition-colors">
                  What You'll Know
                </a>
                <a href="#features" className="text-lg font-medium hover:text-primary transition-colors">
                  Features
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
                      <Link to="/auth">Try equipIQ Free</Link>
                    </Button>
                  </>
                )}
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </header>

      {/* Hero Section - Cost Visibility Focused */}
      <section className="container py-24 md:py-32">
        <div className="mx-auto max-w-4xl text-center">
          <h1 className="text-4xl font-bold tracking-tight text-foreground sm:text-5xl md:text-6xl">
            Know What Your Equipment
            <span className="block text-primary">Really Costs.</span>
          </h1>
          <p className="mt-6 text-lg text-muted-foreground md:text-xl max-w-2xl mx-auto">
            Most contractors track equipment in spreadsheets—but can't answer basic questions: 
            What's my monthly debt load? When should I replace the backhoe? Am I over-insured or under?
          </p>
          <p className="mt-4 text-lg text-foreground font-medium">
            equipIQ gives you real answers. Just drop in your documents.
          </p>
          <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
            <Button size="lg" asChild className="text-lg px-8">
              <Link to="/auth">
                Try equipIQ Free
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

          {/* Trust Indicator */}
          <div className="mt-16 pt-8 border-t border-border">
            <div className="flex items-center justify-center gap-2 text-muted-foreground">
              <Package className="h-4 w-4" />
              <span className="text-sm font-medium">Built for contractors managing heavy equipment fleets</span>
            </div>
          </div>
        </div>
      </section>

      {/* Pain Points Section */}
      <section className="container py-16 bg-muted/30">
        <div className="mx-auto max-w-4xl text-center">
          <div className="flex items-center justify-center gap-2 mb-8">
            <HelpCircle className="h-5 w-5 text-muted-foreground" />
            <span className="text-sm font-medium text-muted-foreground uppercase tracking-wide">Sound familiar?</span>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            {painPoints.map((question) => (
              <div 
                key={question} 
                className="bg-background border border-border rounded-lg px-6 py-4 text-left"
              >
                <p className="text-foreground font-medium italic">"{question}"</p>
              </div>
            ))}
          </div>
          <p className="mt-8 text-muted-foreground">
            If your answer is "let me check the spreadsheet"—you're not alone.
          </p>
        </div>
      </section>

      {/* How It Works Section */}
      <section id="how-it-works" className="container py-24">
        <div className="mx-auto max-w-6xl">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-foreground sm:text-4xl">
              How equipIQ Works
            </h2>
            <p className="mt-4 text-lg text-muted-foreground max-w-2xl mx-auto">
              Zero manual entry. Get answers in minutes, not hours.
            </p>
          </div>
          
          <div className="grid gap-8 md:grid-cols-3">
            {howItWorksSteps.map((step) => (
              <div key={step.step} className="relative text-center">
                <div className="flex flex-col items-center">
                  <div className="relative mb-6">
                    <div className="flex h-20 w-20 items-center justify-center rounded-full bg-primary/10">
                      <step.icon className="h-10 w-10 text-primary" />
                    </div>
                    <span className="absolute -top-2 -right-2 flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground font-bold text-sm">
                      {step.step}
                    </span>
                  </div>
                  <h3 className="text-xl font-semibold text-foreground mb-2">
                    {step.title}
                  </h3>
                  <p className="text-muted-foreground">
                    {step.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
          
          <div className="mt-12 text-center">
            <p className="text-sm text-muted-foreground bg-muted/50 rounded-lg px-6 py-3 inline-block">
              <span className="font-medium text-foreground">Works with:</span> Invoices, lease agreements, purchase orders, insurance declarations
            </p>
          </div>
        </div>
      </section>

      {/* What You'll Know Section */}
      <section id="what-youll-know" className="container py-24 bg-muted/30">
        <div className="mx-auto max-w-6xl">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-foreground sm:text-4xl">
              What You'll Know
            </h2>
            <p className="mt-4 text-lg text-muted-foreground max-w-2xl mx-auto">
              Real questions. Real answers. No more guessing.
            </p>
          </div>

          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {whatYoullKnow.map((item) => (
              <Card key={item.question} className="border-border bg-card">
                <CardContent className="pt-6">
                  <div className="flex items-start gap-4">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 flex-shrink-0">
                      <item.icon className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <p className="text-foreground font-medium mb-1">
                        {item.question}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        → {item.source}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="container py-24">
        <div className="mx-auto max-w-6xl">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-foreground sm:text-4xl">
              Built for Contractors
            </h2>
            <p className="mt-4 text-lg text-muted-foreground max-w-2xl mx-auto">
              Not a generic asset tracker. equipIQ understands construction equipment, financing, and the decisions you actually make.
            </p>
          </div>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {features.map((feature) => (
              <Card 
                key={feature.title} 
                className="border-border bg-card hover:shadow-lg transition-shadow"
              >
                <CardContent className="pt-6">
                  <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10 mb-4">
                    <feature.icon className="h-6 w-6 text-primary" />
                  </div>
                  <h3 className="text-lg font-semibold text-card-foreground mb-2">
                    {feature.title}
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    {feature.description}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Beta CTA Section */}
      <section className="container py-24 bg-muted/30">
        <div className="mx-auto max-w-2xl">
          <Card className="border-primary bg-card shadow-lg">
            <CardHeader className="text-center pb-4">
              <CardTitle className="text-2xl">Full Access. No Cost. No Credit Card.</CardTitle>
              <p className="text-muted-foreground mt-2">
                Get started in minutes.
              </p>
            </CardHeader>
            <CardContent className="space-y-6">
              <ul className="space-y-3">
                <li className="flex items-center gap-3">
                  <Sparkles className="h-5 w-5 text-primary flex-shrink-0" />
                  <span><strong>Zero manual entry</strong> – just upload your documents</span>
                </li>
                <li className="flex items-center gap-3">
                  <BarChart3 className="h-5 w-5 text-primary flex-shrink-0" />
                  <span>Full cost visibility across your entire fleet</span>
                </li>
                <li className="flex items-center gap-3">
                  <ShieldCheck className="h-5 w-5 text-primary flex-shrink-0" />
                  <span>Insurance tracking with broker email integration</span>
                </li>
                <li className="flex items-center gap-3">
                  <CheckCircle2 className="h-5 w-5 text-primary flex-shrink-0" />
                  <span>Buy vs Rent and Cashflow analysis included</span>
                </li>
              </ul>
              
              <Button className="w-full" size="lg" asChild>
                <Link to="/auth">
                  Try equipIQ Free
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Link>
              </Button>
              
              <p className="text-center text-sm text-muted-foreground">
                Pricing introduced after beta—early users may receive grandfathered rates.
              </p>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Final CTA Section */}
      <section className="container py-24">
        <div className="mx-auto max-w-3xl text-center">
          <h2 className="text-3xl font-bold text-foreground sm:text-4xl mb-4">
            Stop Guessing. Start Knowing.
          </h2>
          <p className="text-lg text-muted-foreground mb-8">
            Know your true equipment costs. AI handles the busywork.
          </p>
          <Button size="lg" asChild className="text-lg px-8">
            <Link to="/auth">
              Try equipIQ Free
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
              <a href="#how-it-works" className="hover:text-foreground transition-colors">How It Works</a>
              <a href="#what-youll-know" className="hover:text-foreground transition-colors">What You'll Know</a>
              <a href="#features" className="hover:text-foreground transition-colors">Features</a>
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
