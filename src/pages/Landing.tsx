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
  Menu,
  Sparkles,
  ShieldCheck,
  Upload,
  Brain,
  HelpCircle,
  Info,
  BarChart3,
  Calculator
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { EquipIQIcon } from '@/components/EquipIQIcon';
import { useAuth } from '@/contexts/AuthContext';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { Slider } from '@/components/ui/slider';
import { formatCurrency } from '@/lib/calculations';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

const painPoints = [
  "What's my total monthly equipment debt?",
  "Am I actually charging enough for equipment on this job?",
  "When should I trade in the excavator?",
  "Are my insurance declarations current?",
];

const benefits = [
  'Know your true cost of ownership',
  'Charge customers accurately for equipment',
  'Track depreciation automatically',
  'See your monthly debt at a glance',
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
    description: 'Total debt, replacement timing—plus exact costs to paste into your estimating software.',
  },
];

const whatYoullKnow = [
  {
    question: 'How much should I bill for equipment on this job?',
    source: 'FMS Export',
    icon: FileSpreadsheet,
  },
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
  
  // Cascade Revenue Loss Calculator state
  const [fleetValue, setFleetValue] = useState(250000);
  const [usefulLife, setUsefulLife] = useState(8);
  const [currentRecovery, setCurrentRecovery] = useState(50); // percentage
  const [ghostEquipment, setGhostEquipment] = useState(5);    // percentage  
  const [jobsPerYear, setJobsPerYear] = useState(50);

  // Constants
  const OVERHEAD_RATE = 0.25;    // 25% overhead recovery on depreciation
  const PROFIT_RATE = 0.10;      // 10% target profit margin
  const INSURANCE_RATE = 0.015;  // 1.5% average insurance cost

  // Full recovery calculations
  const annualDepreciation = fleetValue / usefulLife;
  const overheadRecovery = annualDepreciation * OVERHEAD_RATE;
  const profitMargin = (annualDepreciation + overheadRecovery) * PROFIT_RATE;
  const fullRecovery = annualDepreciation + overheadRecovery + profitMargin;

  // Gap calculations
  const recoveryGap = 1 - (currentRecovery / 100);
  const unbilledDepreciation = annualDepreciation * recoveryGap;
  const lostOverhead = overheadRecovery * recoveryGap;
  const lostProfit = profitMargin * recoveryGap;
  const insuranceWaste = fleetValue * (ghostEquipment / 100) * INSURANCE_RATE;

  // Totals
  const totalAnnualLoss = unbilledDepreciation + lostOverhead + lostProfit + insuranceWaste;
  const perJobLoss = totalAnnualLoss / jobsPerYear;

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
            You're losing money on your equipment.
            <span className="block text-primary">You just don't have the right rates yet.</span>
          </h1>
          <p className="mt-6 text-lg text-muted-foreground md:text-xl max-w-3xl mx-auto">
            Stop guessing. EquipIQ calculates the true cost of your fleet and gives you the exact rates to plug into your FMS for 100% equipment recovery.
          </p>
          <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
            <Button 
              size="lg" 
              className="text-lg px-8"
              onClick={() => document.getElementById('calculator')?.scrollIntoView({ behavior: 'smooth' })}
            >
              Calculate Your Annual Loss
              <ArrowRight className="ml-2 h-5 w-5" />
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

      {/* Calculator Section */}
      <section id="calculator" className="container py-16 bg-muted/30">
        <div className="mx-auto max-w-4xl">
          <div className="text-center mb-8">
            <h2 className="text-2xl font-bold text-foreground sm:text-3xl mb-4">
              How Much Are You Leaving on the Table?
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Most contractors don't charge for equipment—or they guess. That's money left on the table every single job.
            </p>
          </div>
          
          <div className="bg-background rounded-lg p-6 border border-border">
            <div className="grid md:grid-cols-2 gap-8">
              {/* Left Column - Inputs */}
              <div className="space-y-5">
                {/* Fleet Value Slider */}
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <div className="flex items-center gap-1.5">
                      <label className="text-muted-foreground">Fleet Value</label>
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Info className="h-3.5 w-3.5 text-muted-foreground/60 cursor-help" />
                          </TooltipTrigger>
                          <TooltipContent side="top" className="max-w-[220px]">
                            <p className="text-xs">Total current value of all equipment you own or lease.</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </div>
                    <span className="font-mono font-medium text-foreground">{formatCurrency(fleetValue)}</span>
                  </div>
                  <Slider 
                    value={[fleetValue]} 
                    onValueChange={([v]) => setFleetValue(v)}
                    min={50000} 
                    max={2000000} 
                    step={25000}
                  />
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>$50K</span>
                    <span>$2M</span>
                  </div>
                </div>
                
                {/* Useful Life Slider */}
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <div className="flex items-center gap-1.5">
                      <label className="text-muted-foreground">Average Useful Life</label>
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Info className="h-3.5 w-3.5 text-muted-foreground/60 cursor-help" />
                          </TooltipTrigger>
                          <TooltipContent side="top" className="max-w-[220px]">
                            <p className="text-xs">How many years you expect equipment to last before replacement. This determines your annual depreciation.</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </div>
                    <span className="font-mono font-medium text-foreground">{usefulLife} years</span>
                  </div>
                  <Slider 
                    value={[usefulLife]} 
                    onValueChange={([v]) => setUsefulLife(v)}
                    min={5} 
                    max={15} 
                    step={1}
                  />
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>5 yrs</span>
                    <span>15 yrs</span>
                  </div>
                </div>
                
                {/* Current Recovery Slider */}
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <div className="flex items-center gap-1.5">
                      <label className="text-muted-foreground">Current Recovery</label>
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Info className="h-3.5 w-3.5 text-muted-foreground/60 cursor-help" />
                          </TooltipTrigger>
                          <TooltipContent side="top" className="max-w-[220px]">
                            <p className="text-xs">What percentage of your equipment ownership costs (depreciation, overhead, margin) are you currently billing to jobs?</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </div>
                    <span className="font-mono font-medium text-foreground">{currentRecovery}%</span>
                  </div>
                  <Slider 
                    value={[currentRecovery]} 
                    onValueChange={([v]) => setCurrentRecovery(v)}
                    min={0} 
                    max={100} 
                    step={5}
                  />
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>0% (none)</span>
                    <span>100% (full)</span>
                  </div>
                </div>
                
                {/* Ghost Equipment Slider */}
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <div className="flex items-center gap-1.5">
                      <label className="text-muted-foreground">Ghost Equipment</label>
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Info className="h-3.5 w-3.5 text-muted-foreground/60 cursor-help" />
                          </TooltipTrigger>
                          <TooltipContent side="top" className="max-w-[220px]">
                            <p className="text-xs">Equipment you've sold or retired but is still on your insurance policy. Common oversight that wastes overhead dollars.</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </div>
                    <span className="font-mono font-medium text-foreground">{ghostEquipment}%</span>
                  </div>
                  <Slider 
                    value={[ghostEquipment]} 
                    onValueChange={([v]) => setGhostEquipment(v)}
                    min={0} 
                    max={15} 
                    step={1}
                  />
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>0%</span>
                    <span>15%</span>
                  </div>
                </div>
                
                {/* Jobs Per Year Slider */}
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <div className="flex items-center gap-1.5">
                      <label className="text-muted-foreground">Jobs Per Year</label>
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Info className="h-3.5 w-3.5 text-muted-foreground/60 cursor-help" />
                          </TooltipTrigger>
                          <TooltipContent side="top" className="max-w-[220px]">
                            <p className="text-xs">How many jobs you complete annually. Used to calculate per-job loss.</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </div>
                    <span className="font-mono font-medium text-foreground">{jobsPerYear}</span>
                  </div>
                  <Slider 
                    value={[jobsPerYear]} 
                    onValueChange={([v]) => setJobsPerYear(v)}
                    min={10} 
                    max={200} 
                    step={5}
                  />
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>10</span>
                    <span>200</span>
                  </div>
                </div>
              </div>
              
              {/* Right Column - Results */}
              <div className="space-y-4">
                {/* Full Recovery Target */}
                <div className="p-4 bg-muted/50 rounded-lg border border-border">
                  <p className="text-xs font-medium text-muted-foreground mb-2">Full Recovery Target</p>
                  <div className="space-y-1 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Depreciation (COGS)</span>
                      <span className="font-mono text-foreground">{formatCurrency(annualDepreciation)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Overhead (25%)</span>
                      <span className="font-mono text-foreground">{formatCurrency(overheadRecovery)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Profit (10%)</span>
                      <span className="font-mono text-foreground">{formatCurrency(profitMargin)}</span>
                    </div>
                    <div className="flex justify-between pt-2 border-t border-border font-medium">
                      <span className="text-foreground">Target/Year</span>
                      <span className="font-mono text-primary">{formatCurrency(fullRecovery)}</span>
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground mt-2 pt-2 border-t border-border">
                    Recovery methodology: Depreciation + gross profit + net profit
                  </p>
                </div>
                
                {/* The Gap Breakdown */}
                <div className="p-4 bg-destructive/10 rounded-lg border border-destructive/20">
                  <p className="text-xs font-medium text-destructive mb-2">Unrecovered Costs + Margin</p>
                  <div className="space-y-1 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Depreciation Not Billed</span>
                      <span className="font-mono text-destructive">{formatCurrency(unbilledDepreciation)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Overhead Not Recovered</span>
                      <span className="font-mono text-destructive">{formatCurrency(lostOverhead)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Margin Not Captured</span>
                      <span className="font-mono text-destructive">{formatCurrency(lostProfit)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Insurance Overpayment</span>
                      <span className="font-mono text-destructive">{formatCurrency(insuranceWaste)}</span>
                    </div>
                  </div>
                </div>
                
                {/* Total Loss */}
                <div className="text-center p-4 bg-destructive/15 rounded-lg border border-destructive/30">
                  <p className="text-sm text-muted-foreground mb-1">
                    Total Annual Loss
                  </p>
                  <p className="text-3xl font-bold text-destructive font-mono">
                    {formatCurrency(totalAnnualLoss)}
                  </p>
                  <p className="text-sm text-muted-foreground mt-2">
                    <span className="font-medium text-foreground">{formatCurrency(perJobLoss)}</span> per job (est.)
                  </p>
                  <p className="text-xs text-muted-foreground/70 mt-3">
                    Estimates based on your inputs. Actual recovery depends on your costing methods and billing practices.
                  </p>
                </div>
              </div>
            </div>
          </div>
          
          <div className="text-center mt-8">
            <Button size="lg" asChild>
              <Link to="/auth">
                Start Charging What You're Owed
                <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Pain Points Section */}
      <section className="container py-16 bg-muted/30">
        <div className="mx-auto max-w-4xl text-center">
          <div className="flex items-center justify-center gap-2 mb-8">
            <HelpCircle className="h-5 w-5 text-muted-foreground" />
            <span className="text-sm font-medium text-muted-foreground">Sound Familiar?</span>
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
      <section id="features" className="container py-24 bg-muted/30">
        <div className="mx-auto max-w-6xl">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-foreground sm:text-4xl">
              Everything You Need to Manage Equipment
            </h2>
            <p className="mt-4 text-lg text-muted-foreground max-w-2xl mx-auto">
              Built for construction. Not a generic asset tracker.
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
        <div className="mx-auto max-w-3xl">
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
                <li className="flex items-center gap-3">
                  <FileSpreadsheet className="h-5 w-5 text-primary flex-shrink-0" />
                  <span>FMS-ready costs to charge customers accurately</span>
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
