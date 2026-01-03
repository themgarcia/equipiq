import { Layout } from '@/components/Layout';
import { 
  Accordion, 
  AccordionContent, 
  AccordionItem, 
  AccordionTrigger 
} from '@/components/ui/accordion';
import { BookOpen, Target, DollarSign, Clock, ArrowRight, Calculator } from 'lucide-react';

const definitions = [
  {
    id: 'cost-basis',
    icon: DollarSign,
    title: 'Cost Basis vs. Replacement Value',
    content: `
**Cost Basis** is what you actually paid for the equipment, including:
- Purchase price (pre-tax)
- Sales tax
- Freight and setup costs
- Any other capital expenditures (upgrades, attachments)

**Replacement Value** is what it would cost to buy the same (or equivalent) equipment new today. This is used for:
- Insurance purposes
- Future budget planning
- Calculating realistic recovery rates

**Why the distinction matters:** Your cost basis is historical — it's done. Replacement value helps you plan for the future and ensures you're recovering enough through job pricing to actually replace equipment when the time comes.
    `.trim(),
  },
  {
    id: 'useful-life',
    icon: Clock,
    title: 'Useful Life vs. Mechanical Life',
    content: `
**Useful Life** (what this app tracks) is the **competitive life** of your equipment — how long it helps you win jobs, stay efficient, and maintain your reputation.

**Mechanical Life** is how long the machine will physically run if you keep fixing it.

**Here's the key insight:** A 15-year-old mower might still run, but:
- It breaks down more often
- Parts are harder to find
- It's slower than newer models
- Clients notice when your equipment looks dated
- Your crew gets frustrated

We use useful life because that's what matters for profitability. The defaults in this app are based on industry experience, not manufacturer warranties.
    `.trim(),
  },
  {
    id: 'resale',
    icon: Target,
    title: 'Why Resale Defaults Are Conservative',
    content: `
The resale percentages in this app are intentionally **lower than what you might get** in a perfect sale. Here's why:

1. **Protect your planning** — If you plan on getting 40% back and only get 25%, you've got a problem. If you plan on 20% and get 30%, you're ahead.

2. **Real-world selling conditions** — Most equipment sales happen when:
   - You need to sell quickly
   - The market is saturated
   - Something is wrong (why else would you sell?)
   - Buyers have leverage

3. **The upside is yours** — Any resale above our defaults is a bonus. That's better than budgeting for money you might not get.

You can always override the default on individual items if you have a specific situation (like a known buyer, rare equipment, etc.).
    `.trim(),
  },
  {
    id: 'cogs-overhead',
    icon: Calculator,
    title: 'COGS vs. Overhead Allocation',
    content: `
**COGS (Cost of Goods Sold)** represents equipment costs that should be recovered through job pricing. This includes:
- Equipment used directly on job sites
- Anything that enables you to complete work

**Overhead** represents equipment costs that support your business but aren't directly billable:
- Shop equipment
- Office equipment
- Vehicles used for sales/admin

**The percentage split is your decision.** A work truck might be:
- 100% COGS if it's always on job sites
- 70/30 COGS/Overhead if it's sometimes used for estimates
- 50/50 if it serves dual purposes equally

**Why this matters:** LMN and other budgeting tools need this split to calculate accurate job rates. Getting it wrong means either:
- Underpricing jobs (losing money)
- Overpricing jobs (losing work)

Be honest with yourself about how equipment is actually used.
    `.trim(),
  },
  {
    id: 'lmn-workflow',
    icon: ArrowRight,
    title: 'How This App Fits Into LMN Workflows',
    content: `
This app is designed to feed data into LMN's **Owned Equipment Calculator**. Here's the workflow:

1. **Track all equipment here** — Keep one source of truth for your entire fleet

2. **Set allocations thoughtfully** — Decide COGS vs. Overhead percentages based on actual use

3. **Export to LMN** — Use the LMN Export view to get copy-ready data

4. **Paste into LMN** — The export format matches what LMN expects

**What this app does NOT do:**
- Calculate hourly equipment rates (that's LMN's job)
- Create estimates or quotes
- Handle depreciation for tax purposes
- Replace your accountant

**What this app DOES do:**
- Keep your equipment data organized
- Make allocation decisions explicit and visible
- Speed up LMN data entry
- Prevent spreadsheet errors
- Help you plan for replacement
    `.trim(),
  },
  {
    id: 'not-accounting',
    icon: BookOpen,
    title: 'This Is Not Accounting Software',
    content: `
**Important disclaimer:** This app helps you make business decisions. It does not:

- Calculate depreciation for tax purposes
- Track book value or accumulated depreciation
- Generate financial statements
- Replace QuickBooks, Xero, or your accountant
- Provide tax advice

**What we track is practical, not financial:**
- What did you pay? (Cost Basis)
- How do you use it? (COGS/Overhead split)
- When should you replace it? (Useful Life)
- What might you get if you sell? (Conservative Resale)

These are **operational planning numbers**, not accounting numbers. Your accountant handles the IRS. This app helps you run a profitable business.

**When in doubt:** Talk to your accountant about depreciation and taxes. Use this app to plan equipment purchases and understand your true costs.
    `.trim(),
  },
];

export default function Definitions() {
  return (
    <Layout>
      <div className="p-8 animate-fade-in max-w-4xl">
        {/* Header */}
        <div className="mb-8">
          <div className="accent-line mb-4" />
          <h1 className="text-3xl font-bold">Definitions & Reference</h1>
          <p className="text-muted-foreground mt-1">
            Understand the concepts and logic behind equipment tracking
          </p>
        </div>

        {/* Introduction */}
        <div className="bg-card border rounded-lg p-6 mb-8">
          <div className="flex items-start gap-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
              <BookOpen className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h2 className="font-semibold mb-2">Built for Contractors, Not Accountants</h2>
              <p className="text-muted-foreground">
                This app uses plain language and practical concepts. No accounting jargon, no complex formulas. 
                The goal is simple: help you understand what your equipment really costs, so you can price jobs 
                correctly and plan replacements before breakdowns hurt your business.
              </p>
            </div>
          </div>
        </div>

        {/* Accordion */}
        <Accordion type="single" collapsible className="space-y-4">
          {definitions.map(def => (
            <AccordionItem 
              key={def.id} 
              value={def.id}
              className="bg-card border rounded-lg px-6 data-[state=open]:shadow-sm"
            >
              <AccordionTrigger className="hover:no-underline py-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-muted">
                    <def.icon className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <span className="font-semibold text-left">{def.title}</span>
                </div>
              </AccordionTrigger>
              <AccordionContent className="pb-6">
                <div className="prose prose-sm max-w-none text-muted-foreground pl-11">
                  {def.content.split('\n\n').map((paragraph, i) => {
                    if (paragraph.startsWith('**') && paragraph.includes('**')) {
                      const parts = paragraph.split('**');
                      return (
                        <p key={i} className="mb-3">
                          {parts.map((part, j) => 
                            j % 2 === 1 ? <strong key={j} className="text-foreground">{part}</strong> : part
                          )}
                        </p>
                      );
                    }
                    if (paragraph.startsWith('- ')) {
                      return (
                        <ul key={i} className="list-disc list-inside mb-3 space-y-1">
                          {paragraph.split('\n').map((item, j) => (
                            <li key={j}>{item.replace('- ', '')}</li>
                          ))}
                        </ul>
                      );
                    }
                    if (paragraph.startsWith('1. ')) {
                      return (
                        <ol key={i} className="list-decimal list-inside mb-3 space-y-1">
                          {paragraph.split('\n').map((item, j) => (
                            <li key={j}>{item.replace(/^\d+\. /, '')}</li>
                          ))}
                        </ol>
                      );
                    }
                    return <p key={i} className="mb-3">{paragraph}</p>;
                  })}
                </div>
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>

        {/* Footer */}
        <div className="mt-8 text-sm text-muted-foreground">
          <p>
            Questions about how this app works? Check the specific definition above, 
            or review the Category Lifespans page for notes on individual equipment types.
          </p>
        </div>
      </div>
    </Layout>
  );
}
