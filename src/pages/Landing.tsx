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
  FileText,
  Truck,
  DollarSign,
  Calendar,
  Users,
  Wrench
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { EquipIQIcon } from '@/components/EquipIQIcon';
import { useAuth } from '@/contexts/AuthContext';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';

const features = [
  {
    icon: Sparkles,
    title: 'AI Document Import',
    description: 'Upload invoices, POs, or financing docs. AI extracts make, model, pricing, financing terms, and auto-categorizes—no manual entry required.',
    featured: true,
  },
  {
    icon: ShieldCheck,
    title: 'Insurance Control',
    description: 'Manage insured equipment, import policies with AI, track changes, and email broker updates with one click.',
    featured: true,
  },
  {
    icon: Package,
    title: 'Equipment Tracking',
    description: 'Track your entire fleet with cost basis, financing terms, and real-time depreciation calculations.',
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
    icon: FileSpreadsheet,
    title: 'FMS Export',
    description: 'Export equipment data directly to your Field Management Software for seamless integration.',
  },
  {
    icon: Clock,
    title: 'Category Lifespans',
    description: 'Industry-standard useful life defaults for accurate depreciation across 18 equipment categories.',
  },
  {
    icon: TrendingUp,
    title: 'Replacement Planning',
    description: 'Know when equipment needs replacing and budget accordingly with projected end values.',
  },
];

const benefits = [
  'AI extracts equipment data automatically',
  'Upload invoices, leases, or policies',
  'No manual data entry required',
  'Insurance tracking built-in',
];

const howItWorksSteps = [
  {
    icon: Upload,
    step: '1',
    title: 'Drop Your Document',
    description: 'Upload purchase orders, invoices, financing agreements, or insurance policies. PDF or photo—both work great.',
  },
  {
    icon: Brain,
    step: '2',
    title: 'AI Does the Work',
    description: 'Our AI reads the document and extracts make, model, year, pricing, financing terms, serial numbers—even auto-categorizes equipment type.',
  },
  {
    icon: FileCheck,
    step: '3',
    title: 'Review & Confirm',
    description: 'See everything laid out clearly, make any edits, and add to your fleet in one click.',
  },
];

const equipmentDataPoints = [
  { icon: Truck, text: 'Make, Model, Year' },
  { icon: FileText, text: 'Serial/VIN Number' },
  { icon: DollarSign, text: 'Purchase Price & Taxes' },
  { icon: Wallet, text: 'Monthly Payment & Term' },
  { icon: Package, text: 'Equipment Category' },
  { icon: Wrench, text: 'Attachments Detected' },
];

const insuranceDataPoints = [
  { icon: Users, text: 'Broker Contact Info' },
  { icon: FileText, text: 'Policy Number' },
  { icon: Calendar, text: 'Renewal Dates' },
  { icon: Package, text: 'Scheduled Equipment' },
  { icon: DollarSign, text: 'Declared Values' },
  { icon: CheckCircle2, text: 'Fleet Matching' },
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
            <a href="#features" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
              Features
            </a>
            <a href="#open-beta" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
              Open Beta
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
                <a href="#how-it-works" className="text-lg font-medium hover:text-primary transition-colors">
                  How It Works
                </a>
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

      {/* Hero Section - AI Focused */}
      <section className="container py-24 md:py-32">
        <div className="mx-auto max-w-4xl text-center">
          <span className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-4 py-1.5 text-sm font-medium text-primary mb-6">
            <Sparkles className="h-4 w-4" />
            AI-Powered Import
          </span>
          <h1 className="text-4xl font-bold tracking-tight text-foreground sm:text-5xl md:text-6xl">
            Upload a Document.
            <span className="block text-primary">Watch AI Do the Rest.</span>
          </h1>
          <p className="mt-6 text-lg text-muted-foreground md:text-xl max-w-2xl mx-auto">
            Stop manually entering equipment data. Drop in your invoices, financing agreements, 
            or insurance policies—our AI extracts everything in seconds.
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

      {/* How It Works Section */}
      <section id="how-it-works" className="container py-24 bg-muted/30">
        <div className="mx-auto max-w-6xl">
          <div className="text-center mb-16">
            <span className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-4 py-1.5 text-sm font-medium text-primary mb-6">
              <Sparkles className="h-4 w-4" />
              Simple as 1-2-3
            </span>
            <h2 className="text-3xl font-bold text-foreground sm:text-4xl">
              How AI Import Works
            </h2>
            <p className="mt-4 text-lg text-muted-foreground max-w-2xl mx-auto">
              Skip the data entry. Let our AI handle the heavy lifting.
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
              <span className="font-medium text-foreground">Works with:</span> Invoices, lease agreements, purchase orders, insurance declarations, and equipment schedules
            </p>
          </div>
        </div>
      </section>

      {/* What Our AI Reads Section */}
      <section className="container py-24">
        <div className="mx-auto max-w-6xl">
          <div className="text-center mb-16">
            <span className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-4 py-1.5 text-sm font-medium text-primary mb-6">
              <Brain className="h-4 w-4" />
              Intelligent Extraction
            </span>
            <h2 className="text-3xl font-bold text-foreground sm:text-4xl">
              What Our AI Reads
            </h2>
            <p className="mt-4 text-lg text-muted-foreground max-w-2xl mx-auto">
              Upload once, get everything. Our AI knows exactly what contractors need.
            </p>
          </div>

          <div className="grid gap-8 md:grid-cols-2">
            {/* Equipment Documents Card */}
            <Card className="border-border bg-card overflow-hidden">
              <CardHeader className="bg-gradient-to-r from-primary/5 to-primary/10 border-b border-border">
                <CardTitle className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                    <FileText className="h-5 w-5 text-primary" />
                  </div>
                  Equipment Documents
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-6">
                <div className="grid grid-cols-2 gap-4">
                  {equipmentDataPoints.map((point) => (
                    <div key={point.text} className="flex items-center gap-3">
                      <point.icon className="h-5 w-5 text-primary flex-shrink-0" />
                      <span className="text-sm text-foreground">{point.text}</span>
                    </div>
                  ))}
                </div>
                <p className="mt-6 text-sm text-muted-foreground border-t border-border pt-4">
                  Plus: New vs Used detection, financing type, freight charges, and more.
                </p>
              </CardContent>
            </Card>

            {/* Insurance Policies Card */}
            <Card className="border-border bg-card overflow-hidden">
              <CardHeader className="bg-gradient-to-r from-primary/5 to-primary/10 border-b border-border">
                <CardTitle className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                    <ShieldCheck className="h-5 w-5 text-primary" />
                  </div>
                  Insurance Policies
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-6">
                <div className="grid grid-cols-2 gap-4">
                  {insuranceDataPoints.map((point) => (
                    <div key={point.text} className="flex items-center gap-3">
                      <point.icon className="h-5 w-5 text-primary flex-shrink-0" />
                      <span className="text-sm text-foreground">{point.text}</span>
                    </div>
                  ))}
                </div>
                <p className="mt-6 text-sm text-muted-foreground border-t border-border pt-4">
                  Automatically matches scheduled equipment to your existing fleet.
                </p>
              </CardContent>
            </Card>
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
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            {features.map((feature) => (
              <Card 
                key={feature.title} 
                className={`border-border bg-card hover:shadow-lg transition-shadow ${
                  feature.featured ? 'ring-2 ring-primary/20 bg-gradient-to-br from-card to-primary/5' : ''
                }`}
              >
                <CardContent className="pt-6">
                  <div className={`flex h-12 w-12 items-center justify-center rounded-lg mb-4 ${
                    feature.featured ? 'bg-primary text-primary-foreground' : 'bg-primary/10'
                  }`}>
                    <feature.icon className={`h-6 w-6 ${feature.featured ? '' : 'text-primary'}`} />
                  </div>
                  {feature.featured && (
                    <span className="inline-flex items-center gap-1 text-xs font-medium text-primary mb-2">
                      <Sparkles className="h-3 w-3" />
                      AI-Powered
                    </span>
                  )}
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
                  <Sparkles className="h-5 w-5 text-primary flex-shrink-0" />
                  <span><strong>AI-powered import</strong> – just upload your documents</span>
                </li>
                <li className="flex items-center gap-3">
                  <ShieldCheck className="h-5 w-5 text-primary flex-shrink-0" />
                  <span>Insurance tracking with broker email integration</span>
                </li>
                <li className="flex items-center gap-3">
                  <CheckCircle2 className="h-5 w-5 text-primary flex-shrink-0" />
                  <span>Full Buy vs Rent and Cashflow analysis</span>
                </li>
                <li className="flex items-center gap-3">
                  <CheckCircle2 className="h-5 w-5 text-primary flex-shrink-0" />
                  <span>FMS export and replacement planning</span>
                </li>
                <li className="flex items-center gap-3">
                  <CheckCircle2 className="h-5 w-5 text-primary flex-shrink-0" />
                  <span>Free during beta—get started in minutes</span>
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
            Ready to Stop Manual Data Entry?
          </h2>
          <p className="text-lg text-muted-foreground mb-8">
            Join the open beta and let AI handle your equipment tracking.
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
              <a href="#how-it-works" className="hover:text-foreground transition-colors">How It Works</a>
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
