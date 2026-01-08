import { Link } from 'react-router-dom';
import { 
  Package, 
  FileSpreadsheet, 
  Scale, 
  Wallet, 
  Clock, 
  TrendingUp,
  ArrowRight,
  CheckCircle2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { EquipIQIcon } from '@/components/EquipIQIcon';
import { useAuth } from '@/contexts/AuthContext';

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
          <div className="flex items-center gap-4">
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
                Get Started Free
                <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
            </Button>
            <Button size="lg" variant="outline" asChild className="text-lg px-8">
              <a href="#features">Learn More</a>
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
      <section className="container py-24">
        <div className="mx-auto max-w-3xl text-center">
          <h2 className="text-3xl font-bold text-foreground sm:text-4xl mb-4">
            Simple, Transparent Pricing
          </h2>
          <p className="text-lg text-muted-foreground mb-12">
            Get started for free and upgrade as your fleet grows.
          </p>
          <Card className="border-primary/50 bg-card">
            <CardContent className="pt-8 pb-8">
              <div className="text-5xl font-bold text-foreground mb-2">Free</div>
              <p className="text-muted-foreground mb-6">to get started</p>
              <ul className="text-left space-y-3 mb-8 max-w-sm mx-auto">
                <li className="flex items-center gap-3">
                  <CheckCircle2 className="h-5 w-5 text-primary flex-shrink-0" />
                  <span className="text-card-foreground">Unlimited equipment tracking</span>
                </li>
                <li className="flex items-center gap-3">
                  <CheckCircle2 className="h-5 w-5 text-primary flex-shrink-0" />
                  <span className="text-card-foreground">Full depreciation calculations</span>
                </li>
                <li className="flex items-center gap-3">
                  <CheckCircle2 className="h-5 w-5 text-primary flex-shrink-0" />
                  <span className="text-card-foreground">FMS export to LMN</span>
                </li>
                <li className="flex items-center gap-3">
                  <CheckCircle2 className="h-5 w-5 text-primary flex-shrink-0" />
                  <span className="text-card-foreground">Buy vs Rent analysis</span>
                </li>
                <li className="flex items-center gap-3">
                  <CheckCircle2 className="h-5 w-5 text-primary flex-shrink-0" />
                  <span className="text-card-foreground">Cashflow projections</span>
                </li>
              </ul>
              <Button size="lg" asChild className="text-lg px-8">
                <Link to="/auth">
                  Start Free Today
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Link>
              </Button>
            </CardContent>
          </Card>
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
