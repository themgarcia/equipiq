import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  Package,
  FileSpreadsheet, 
  Scale, 
  Wallet, 
  Clock, 
  TrendingUp,
  ArrowRight,
  ArrowUp,
  CheckCircle2,
  Menu,
  Sparkles,
  ShieldCheck,
  Upload,
  Brain,
  HelpCircle,
  Info,
  BarChart3,
  Calculator,
  Trees,
  Shovel,
  Construction,
  Drill,
  Hammer,
  User
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import founderHeadshot from '@/assets/founder-headshot.png';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { EquipIQIcon } from '@/components/EquipIQIcon';
import { useAuth } from '@/contexts/AuthContext';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { Slider } from '@/components/ui/slider';
import { formatCurrency } from '@/lib/calculations';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

const painPoints = [
  {
    icon: FileSpreadsheet,
    title: "The Spreadsheet Spiral",
    description: "You spend hours updating equipment costs, and they're still wrong by the time the job starts.",
  },
  {
    icon: Wallet,
    title: "Leaving Money on the Table",
    description: "You're billing for labor and materials, but equipment? That's coming out of your profit.",
  },
  {
    icon: Clock,
    title: "Replacement Blindspots",
    description: "You don't know which machines need replacing until something breaks or the dealer lowballs your trade-in.",
  },
  {
    icon: ShieldCheck,
    title: "Insurance Guesswork",
    description: "You're either over-insured and overpaying, or under-insured and exposed.",
  },
];

const benefits = [
  'Know exactly what your iron costs you',
  'Bill customers for every hour of equipment use',
  'Stop doing depreciation math by hand',
  'See your total monthly nut at a glance',
];

const howItWorksSteps = [
  {
    icon: Upload,
    step: '1',
    title: 'Upload Your Paperwork',
    description: 'Snap a photo of that invoice on your dash, or drop in the PDF from the dealer. Leases, purchases, insurance docs—we take it all.',
  },
  {
    icon: Brain,
    step: '2',
    title: 'AI Does the Data Entry',
    description: 'Make, model, year, price, terms, serial numbers—extracted in seconds. No more hunting through file cabinets or email chains.',
  },
  {
    icon: BarChart3,
    step: '3',
    title: 'Get Your Numbers',
    description: 'See your total monthly nut, know which machines are due for replacement, and get the exact hourly/daily rates to plug into your bids.',
  },
];

const whatYoullKnow = [
  {
    question: 'What should I charge for equipment on this bid?',
    source: 'FMS Export',
    icon: FileSpreadsheet,
  },
  {
    question: "What's my total monthly nut across all my iron?",
    source: 'Cashflow Analysis',
    icon: Wallet,
  },
  {
    question: 'Which machines are eating me alive on depreciation?',
    source: 'Dashboard metrics',
    icon: TrendingUp,
  },
  {
    question: 'Should I buy or rent the next machine?',
    source: 'Buy vs Rent tool',
    icon: Calculator,
  },
  {
    question: 'Am I over-insured or under-insured on my equipment?',
    source: 'Insurance Control',
    icon: ShieldCheck,
  },
  {
    question: "What's coming off lease before the end of the year?",
    source: 'Upcoming payoffs',
    icon: Clock,
  },
];

const whoItsFor = [
  {
    icon: Trees,
    title: 'Landscaping & Design',
    examples: 'Skid steers, mini-excavators, trucks, and specialized attachments.',
    isFounderIndustry: true,
  },
  {
    icon: Shovel,
    title: 'Civil & Excavation',
    examples: 'Dozers, loaders, and articulated trucks.',
    isFounderIndustry: false,
  },
  {
    icon: Construction,
    title: 'Paving & Asphalt',
    examples: 'Pavers, rollers, and milling equipment.',
    isFounderIndustry: false,
  },
  {
    icon: Drill,
    title: 'Utility & Underground',
    examples: 'Vacuum trucks, drills, and trenchers.',
    isFounderIndustry: false,
  },
  {
    icon: Hammer,
    title: 'Demolition & Forestry',
    examples: 'High-reaches, mulchers, and chippers.',
    isFounderIndustry: false,
  },
  {
    icon: Package,
    title: "Don't See Your Trade?",
    examples: 'If you own or lease equipment, equipIQ works for you.',
    isFounderIndustry: false,
    isOpenInvite: true,
  },
];

const features = [
  {
    icon: Package,
    title: 'Equipment Tracking',
    description: "See your whole fleet in one place—what you paid, what you owe, and what it's worth today.",
  },
  {
    icon: ShieldCheck,
    title: 'Insurance Control',
    description: 'Keep your scheduled values current and email your broker when things change. One click.',
  },
  {
    icon: Scale,
    title: 'Buy vs Rent Analysis',
    description: 'Run the numbers before you pull the trigger on a new piece. No more gut decisions.',
  },
  {
    icon: Wallet,
    title: 'Cashflow Analysis',
    description: "Know your total monthly payments, when things pay off, and what's coming due.",
  },
  {
    icon: Clock,
    title: 'Replacement Planning',
    description: 'Know which machines are due for trade-in before the dealer does.',
  },
  {
    icon: FileSpreadsheet,
    title: 'FMS Export',
    description: 'Get the exact hourly and daily rates to plug into your bids. Stop working for free.',
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
  const totalLifetimeLoss = totalAnnualLoss * usefulLife;
  const perJobLoss = totalAnnualLoss / jobsPerYear;

  // Mobile menu state
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  
  // Back to top button visibility
  const [showBackToTop, setShowBackToTop] = useState(false);
  
  useEffect(() => {
    const handleScroll = () => {
      // Show button after scrolling past ~500px (roughly past the hero)
      setShowBackToTop(window.scrollY > 500);
    };
    
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToSection = (sectionId: string) => {
    const element = document.getElementById(sectionId);
    if (element) {
      const headerOffset = 80;
      const elementPosition = element.getBoundingClientRect().top;
      const offsetPosition = elementPosition + window.pageYOffset - headerOffset;
      
      window.scrollTo({
        top: offsetPosition,
        behavior: 'smooth'
      });
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 w-full border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-16 items-center justify-between">
          <button 
            onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
            className="flex items-center gap-3 group cursor-pointer"
          >
            <EquipIQIcon size="lg" className="transition-transform group-hover:scale-105" />
            <span className="text-xl font-bold text-foreground group-hover:text-primary transition-colors">equipIQ</span>
          </button>
          
          {/* Desktop navigation */}
          <div className="hidden md:flex items-center gap-4">
              <button onClick={() => scrollToSection('who-its-for')} className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
                Who It's For
              </button>
              <button onClick={() => scrollToSection('how-it-works')} className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
                How It Works
              </button>
              <button onClick={() => scrollToSection('what-youll-know')} className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
                What You'll Know
              </button>
              <button onClick={() => scrollToSection('features')} className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
                Features
              </button>
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
              <button 
                onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
                className="flex items-center gap-2 mt-4 group"
              >
                <EquipIQIcon size="sm" className="transition-transform group-hover:scale-105" />
                <span className="font-bold group-hover:text-primary transition-colors">equipIQ</span>
              </button>
              <div className="flex flex-col gap-4 pt-4">
                  <button onClick={() => { scrollToSection('who-its-for'); setMobileMenuOpen(false); }} className="text-lg font-medium hover:text-primary transition-colors text-left">
                    Who It's For
                  </button>
                  <button onClick={() => { scrollToSection('how-it-works'); setMobileMenuOpen(false); }} className="text-lg font-medium hover:text-primary transition-colors text-left">
                    How It Works
                  </button>
                  <button onClick={() => { scrollToSection('what-youll-know'); setMobileMenuOpen(false); }} className="text-lg font-medium hover:text-primary transition-colors text-left">
                    What You'll Know
                  </button>
                  <button onClick={() => { scrollToSection('features'); setMobileMenuOpen(false); }} className="text-lg font-medium hover:text-primary transition-colors text-left">
                    Features
                  </button>
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
            Your equipment's losing money.
            <span className="block text-primary">You just need the right numbers.</span>
          </h1>
          <p className="mt-6 text-lg text-muted-foreground md:text-xl max-w-3xl mx-auto">
            EquipIQ crunches the numbers on your fleet and gives you the exact rates to plug into your estimating software—so you stop giving equipment away for free.
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
      <section id="calculator" className="container py-20 bg-muted/30">
        <div className="mx-auto max-w-4xl">
          <div className="text-center mb-12">
            <h2 className="text-2xl font-bold text-foreground sm:text-3xl mb-4">
              How Much Are You Giving Away?
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Most contractors either skip charging for equipment or pull a number out of thin air. Either way, that's cash walking off the jobsite.
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
                
                {/* Total Annual Loss */}
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
                </div>

                {/* Total Lifetime Loss */}
                <div className="text-center p-4 bg-destructive/10 rounded-lg border border-destructive/20">
                  <p className="text-sm text-muted-foreground mb-1">
                    Total Loss Over {usefulLife} Years
                  </p>
                  <p className="text-3xl font-bold text-destructive font-mono">
                    {formatCurrency(totalLifetimeLoss)}
                  </p>
                  <p className="text-sm text-muted-foreground mt-2">
                    That's {usefulLife} years of unrecovered costs eating into your profit.
                  </p>
                </div>

                <p className="text-xs text-muted-foreground/70 text-center">
                  Estimates based on your inputs. Actual recovery depends on your costing methods and billing practices.
                </p>
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
      <section className="container py-20">
        <div className="mx-auto max-w-4xl text-center">
          <h2 className="text-3xl font-bold text-foreground sm:text-4xl mb-4">
            You Know the Feeling
          </h2>
          <p className="text-lg text-muted-foreground mb-12 max-w-2xl mx-auto">
            Every contractor hits these walls. The difference is whether you keep hitting them.
          </p>
          
          <div className="grid gap-6 sm:grid-cols-2">
            {painPoints.map((point) => (
              <Card key={point.title} className="text-left border-destructive/20 bg-destructive/5">
                <CardHeader className="pb-2">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-destructive/10">
                      <point.icon className="h-5 w-5 text-destructive" />
                    </div>
                    <CardTitle className="text-lg">{point.title}</CardTitle>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">{point.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
          
          <p className="mt-10 text-lg font-medium text-foreground">
            These aren't questions. They're profit leaks.
          </p>
          
          <div className="mt-8">
            <Button size="lg" asChild>
              <Link to="/auth">
                Plug the Leaks
                <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Who It's For Section */}
      <section id="who-its-for" className="container py-20 bg-muted/30">
        <div className="mx-auto max-w-6xl">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-foreground sm:text-4xl">
              Built for Contractors Who Run Equipment
            </h2>
            <p className="mt-4 text-lg text-muted-foreground max-w-2xl mx-auto">
              If you've got iron on the jobsite, this is for you.
            </p>
          </div>
          
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {whoItsFor.map((trade) => (
              <div 
                key={trade.title} 
                className={`relative flex items-start gap-4 p-4 rounded-lg border bg-background ${
                  trade.isFounderIndustry 
                    ? 'border-amber-500/50 ring-1 ring-amber-500/20' 
                    : trade.isOpenInvite
                    ? 'border-dashed border-primary/40'
                    : 'border-border'
                }`}
              >
                {/* Founder's Industry Badge */}
                {trade.isFounderIndustry && (
                  <span className="absolute -top-2.5 right-4 px-2 py-0.5 text-xs font-medium bg-amber-500/10 text-amber-600 dark:text-amber-400 rounded-full border border-amber-500/30">
                    Founder's Industry
                  </span>
                )}
                <div className={`flex h-10 w-10 items-center justify-center rounded-lg flex-shrink-0 ${
                  trade.isFounderIndustry 
                    ? 'bg-amber-500/10' 
                    : trade.isOpenInvite
                    ? 'bg-primary/5'
                    : 'bg-primary/10'
                }`}>
                  <trade.icon className={`h-5 w-5 ${
                    trade.isFounderIndustry 
                      ? 'text-amber-600 dark:text-amber-400' 
                      : 'text-primary'
                  }`} />
                </div>
                <div>
                  <h3 className="font-semibold text-foreground">
                    {trade.title}
                  </h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    {trade.examples}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Founder's Story Section */}
      <section className="container py-20">
        <div className="mx-auto max-w-5xl">
          <h2 className="text-3xl font-bold text-foreground sm:text-4xl text-center mb-12">
            Built by a Contractor, for Contractors
          </h2>
          
          <div className="grid gap-12 md:grid-cols-[280px_1fr] items-center">
            {/* Founder Headshot */}
            <div className="flex justify-center">
              <img 
                src={founderHeadshot} 
                alt="Michael, Founder of equipIQ" 
                className="w-56 h-56 md:w-64 md:h-64 rounded-2xl object-cover border-2 border-border shadow-lg"
              />
            </div>
            
            {/* Story Copy */}
            <div className="space-y-4">
              <p className="text-lg leading-relaxed text-muted-foreground">
                I spent 12 years running a landscaping business. We were doing the work, but I couldn't understand why our profit didn't match our effort.
              </p>
              <p className="text-lg leading-relaxed text-muted-foreground">
                I realized we were guessing our equipment rates and leaving thousands of dollars on the job site every month.
              </p>
              <p className="text-lg leading-relaxed text-muted-foreground">
                I built equipIQ to solve that problem for my own fleet—to provide the financial intelligence I wish I had from day one.
              </p>
              <p className="text-lg leading-relaxed text-foreground font-medium">
                Now, we're helping contractors across the trades stop the guessing game and start recovering every dollar of overhead.
              </p>
              
              <div className="mt-6">
                <Button size="lg" asChild>
                  <Link to="/auth">
                    See What You're Missing
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Link>
                </Button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section id="how-it-works" className="container py-20 bg-muted/30">
        <div className="mx-auto max-w-6xl">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-foreground sm:text-4xl">
              How equipIQ Works
            </h2>
            <p className="mt-4 text-lg text-muted-foreground max-w-2xl mx-auto">
              Zero manual entry. Get answers in minutes, not hours.
            </p>
          </div>
          
          <div className="grid gap-6 md:grid-cols-3 relative">
            {howItWorksSteps.map((step, index) => (
              <div key={step.step} className="relative text-center">
                {/* Connector line - visible on md+ screens, not after last item */}
                {index < howItWorksSteps.length - 1 && (
                  <div className="hidden md:block absolute top-10 left-[60%] w-[80%] h-[2px]">
                    <div className="w-full h-full bg-gradient-to-r from-primary/40 via-primary/20 to-transparent" />
                    <ArrowRight className="absolute -right-1 top-1/2 -translate-y-1/2 h-4 w-4 text-primary/40" />
                  </div>
                )}
                <div className="flex flex-col items-center">
                  <div className="relative mb-6">
                    <div className="flex h-20 w-20 items-center justify-center rounded-full bg-primary/10 border-2 border-primary/20">
                      <step.icon className="h-10 w-10 text-primary" />
                    </div>
                    <span className="absolute -top-2 -right-2 flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground font-bold text-sm shadow-md">
                      {step.step}
                    </span>
                  </div>
                  <h3 className="text-xl font-semibold text-foreground mb-3">
                    {step.title}
                  </h3>
                  <p className="text-muted-foreground leading-relaxed">
                    {step.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
          
          <div className="mt-12 text-center space-y-6">
            <p className="text-sm text-muted-foreground bg-muted/50 rounded-lg px-6 py-3 inline-block">
              <span className="font-medium text-foreground">Works with:</span> Invoices, lease agreements, purchase orders, insurance declarations
            </p>
            <div>
              <Button size="lg" asChild>
                <Link to="/auth">
                  Upload Your First Document
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* What You'll Know Section */}
      <section id="what-youll-know" className="container py-20">
        <div className="mx-auto max-w-6xl">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-foreground sm:text-4xl">
              The Answers You've Been Digging For
            </h2>
            <p className="mt-4 text-lg text-muted-foreground max-w-2xl mx-auto">
              Real questions every contractor asks. Real answers in seconds.
            </p>
          </div>

          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
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
          
          <div className="mt-12 text-center">
            <Button size="lg" asChild>
              <Link to="/auth">
                Get These Answers Now
                <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="container py-20 bg-muted/30">
        <div className="mx-auto max-w-6xl">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-foreground sm:text-4xl">
              Built for the Trades, Not the Boardroom
            </h2>
            <p className="mt-4 text-lg text-muted-foreground max-w-2xl mx-auto">
              This isn't some generic asset tracker. It's built for people who run equipment.
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
      <section className="container py-20">
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
                  <span><strong>No data entry</strong> – just drop in your paperwork</span>
                </li>
                <li className="flex items-center gap-3">
                  <BarChart3 className="h-5 w-5 text-primary flex-shrink-0" />
                  <span>See what your whole fleet is actually costing you</span>
                </li>
                <li className="flex items-center gap-3">
                  <ShieldCheck className="h-5 w-5 text-primary flex-shrink-0" />
                  <span>Keep your broker in the loop without the phone tag</span>
                </li>
                <li className="flex items-center gap-3">
                  <CheckCircle2 className="h-5 w-5 text-primary flex-shrink-0" />
                  <span>Run the numbers on buying vs renting before you decide</span>
                </li>
                <li className="flex items-center gap-3">
                  <FileSpreadsheet className="h-5 w-5 text-primary flex-shrink-0" />
                  <span>Get the exact rates to plug into your estimates</span>
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
      <section className="container py-20 bg-muted/30">
        <div className="mx-auto max-w-3xl text-center">
          <h2 className="text-3xl font-bold text-foreground sm:text-4xl mb-4">
            Know Your Numbers. Bill Accordingly.
          </h2>
          <p className="text-lg text-muted-foreground mb-8">
            Let the software do the math so you can get back to the jobsite.
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
              <a href="#who-its-for" className="hover:text-foreground transition-colors">Who It's For</a>
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
      
      {/* Floating Back to Top Button */}
      <button
        onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
        className={`fixed bottom-6 right-6 z-50 p-3 rounded-full bg-primary text-primary-foreground shadow-lg hover:bg-primary/90 transition-all duration-300 ${
          showBackToTop ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4 pointer-events-none'
        }`}
        aria-label="Back to top"
      >
        <ArrowUp className="h-5 w-5" />
      </button>
    </div>
  );
}
