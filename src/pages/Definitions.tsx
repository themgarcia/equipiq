import { Layout } from '@/components/Layout';
import { 
  Accordion, 
  AccordionContent, 
  AccordionItem, 
  AccordionTrigger 
} from '@/components/ui/accordion';
import { BookOpen, Target, DollarSign, Clock, ArrowRight, Calculator, Scale, Shield, TrendingUp, Wallet, Percent } from 'lucide-react';

const definitions = [
  {
    id: 'core-philosophy',
    icon: Shield,
    title: 'Core Philosophy',
    content: `
**This app is built for planning and pricing discipline, not accounting.**

The assumptions here are designed to protect your margin and ensure equipment costs are recovered through jobs. Here's what that means:

**Defaults protect margin, not assume best-case behavior**
- We use conservative estimates so you're never caught short
- If equipment lasts longer or sells for more, that's profit upside
- If things go worse than expected, you're still covered

**Equipment should be mostly paid down through jobs**
- Your job pricing should recover the vast majority of equipment cost
- Don't depend on resale to make the numbers work
- Resale value above our defaults is treated as bonus profit

**Useful life means competitive life, not mechanical life**
- A machine that "still runs" isn't necessarily profitable
- We track how long equipment stays competitive and reliable
- When in doubt, we lean toward the longest defensible value

**When in doubt, useful life should lean toward the longest defensible value**
- This protects your pricing from being artificially inflated
- It assumes you'll maintain equipment well
- But it doesn't assume perfect conditions

**What this app is NOT:**
- Tax depreciation software
- Accounting or financial reporting
- A replacement for your accountant

**What this app IS:**
- A planning tool for equipment decisions
- A way to feed accurate data into your FMS
- A system for protecting your margins
    `.trim(),
  },
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

**Why this matters:** Your Field Management Software (FMS) needs this split to calculate accurate job rates. Getting it wrong means either:
- Underpricing jobs (losing money)
- Overpricing jobs (losing work)

Be honest with yourself about how equipment is actually used.
    `.trim(),
  },
  {
    id: 'fms-workflow',
    icon: ArrowRight,
    title: 'How This App Fits Into FMS Workflows',
    content: `
This app is designed to feed data into your **Field Management Software (FMS)**. Here's the workflow:

1. **Track all equipment here** — Keep one source of truth for your entire fleet

2. **Set allocations thoughtfully** — Decide COGS vs. Overhead percentages based on actual use

3. **Export to FMS** — Use the FMS Export view to get copy-ready data

4. **Paste into your FMS** — The export format matches what most FMS tools expect

**What this app does NOT do:**
- Calculate hourly equipment rates (that's your FMS's job)
- Create estimates or quotes
- Handle depreciation for tax purposes
- Replace your accountant

**What this app DOES do:**
- Keep your equipment data organized
- Make allocation decisions explicit and visible
- Speed up FMS data entry
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
  {
    id: 'buy-vs-rent',
    icon: Scale,
    title: 'Understanding the Buy vs. Rent Analysis',
    content: `
**The Buy vs. Rent calculator** helps you decide whether to purchase or rent equipment based on your expected usage.

**How it calculates ownership costs:**
- Depreciation = (Purchase Price - Resale Value) ÷ Useful Life
- Plus annual maintenance and insurance costs
- This gives your total annual cost of owning the equipment

**Why fuel/operating costs aren't included:**
- You pay fuel whether you buy or rent
- It doesn't change the comparison
- Same goes for operator labor

**How it calculates rental costs:**
- Daily rate × days used per year
- If weekly or monthly rates are provided, it finds the cheapest combination

**The break-even point** is the number of days per year where owning and renting cost the same. If you use equipment more than the break-even, buying saves money. Less than break-even, renting saves money.

**The 15% buffer zone:**
- If your usage is within 15% of break-even, you'll see "Close Call"
- This is because small changes in assumptions could flip the recommendation
- In close call situations, consider convenience, availability, and reliability

**What the calculator doesn't capture:**
- Availability (will rental equipment be available when you need it?)
- Convenience (is pickup/return time a factor?)
- Reliability (do you trust rental equipment quality?)
- Tax implications (depreciation benefits of ownership)
- Opportunity cost of capital tied up in equipment

Use the calculator as a starting point, then apply your judgment for factors the numbers can't capture.
    `.trim(),
  },
  {
    id: 'inflation-adjusted-replacement',
    icon: TrendingUp,
    title: 'Inflation-Adjusted Replacement Cost',
    content: `
**All replacement costs are automatically adjusted for inflation at 3% annually.**

This ensures your replacement cost estimates stay current without manual updates. Here's how it works:

**When you DON'T enter a replacement cost:**
- The system uses your total cost basis (purchase price + tax + freight + other)
- It inflates this amount from your purchase year to the current year
- Formula: Replacement Cost = Total Cost Basis × (1.03)^years

**When you DO enter a replacement cost:**
- Your entered value is treated as the baseline
- The system captures the date you entered it
- It inflates from that entry date to the current year
- This keeps manual entries current as time passes

**Example calculations (3% annual inflation):**

| Scenario | Base Value | From Year | Years | Today's Value |
|----------|------------|-----------|-------|---------------|
| Auto (no entry) | $50,000 | 2020 | 6 | $59,703 |
| Auto (no entry) | $12,000 | 2023 | 3 | $13,113 |
| Manual entry | $45,000 | Jan 2024 | 2 | $47,732 |
| Manual entry | $30,000 | Jan 2026 | 0 | $30,000 |

**Why 3%?**
- This is the historical average inflation rate for equipment
- It's conservative enough to avoid overestimating
- It's high enough to keep values realistic over time

**The benefit:** You never have to remember to update replacement costs. Whether you entered a value 3 years ago or the system calculated it from your purchase, it automatically stays current.
    `.trim(),
  },
  {
    id: 'financing-cashflow',
    icon: Wallet,
    title: 'Financing & Cashflow Analysis',
    content: `
**Financing information is for cashflow visibility only — it does NOT change equipment pricing.**

This is a critical distinction. Two identical machines will always price the same regardless of how they were financed. Here's why:

**Equipment pricing is based on:**
- Replacement value ÷ useful life = annual cost to recover
- This ensures you're pricing jobs to replace equipment when the time comes
- Financing structure doesn't change what the equipment is worth or how long it lasts

**What financing DOES affect:**
- How much cash leaves your business each month
- When you'll have fully paid off the equipment
- Your ability to manage multiple purchases simultaneously

**Financing Types:**
- **Owned**: Paid in full at purchase. No ongoing payments.
- **Financed**: Loan or financing agreement with monthly payments.
- **Leased**: Equipment lease, often with a buyout option at the end.

**Cashflow Analysis shows:**
- **Current Annual Recovery**: How much value you're recovering through job pricing right now
- **Current Annual Payments**: How much cash is currently leaving for loan/lease payments
- **Current Net Cashflow**: Whether recovery exceeds payments (surplus) or falls short (shortfall)

**Status Indicators:**
- **Green (Surplus)**: Pricing recovery exceeds payments by >10%
- **Yellow (Neutral)**: Recovery and payments are within 10% of each other
- **Red (Shortfall)**: Payments exceed recovery by >10%

**Important:** A shortfall status does NOT mean you made a bad decision. It means your cashflow is temporarily tighter than your recovery rate. This is normal for new equipment purchases — the payback timeline shows when you'll catch up.
    `.trim(),
  },
  {
    id: 'payback-timeline',
    icon: TrendingUp,
    title: 'Understanding the Payback Timeline',
    content: `
**The Payback Timeline shows when cumulative pricing recovery catches up to cumulative cash spent.**

This is purely informational — it does NOT recommend buying, selling, or refinancing.

**How it works:**
- **Cumulative Cash Outlay**: Deposit + all payments made to date
- **Cumulative Pricing Recovery**: How much value has been "recovered" through job pricing
- **Payback Point**: The month when recovery first exceeds outlay

**Example scenario:**

You buy a $60,000 machine with $10,000 down and $1,200/month for 48 months.
- Month 0: $10,000 cash out, $0 recovered
- Month 12: $24,400 cash out, maybe $10,000 recovered (depends on useful life)
- Month 36: $53,200 cash out, recovery catching up
- Payback might occur around month 42-48

**Why this matters:**
- Helps you understand the "cash pressure" period after a purchase
- Shows why you might feel cash-tight even when pricing is correct
- Reminds you that recovery happens over the useful life, not the loan term

**What it does NOT tell you:**
- Whether you should have financed differently
- Whether to refinance or pay off early
- Whether the purchase was a good decision

Those are business decisions that depend on factors beyond this calculation.
    `.trim(),
  },
  {
    id: 'annual-economic-recovery',
    icon: Calculator,
    title: 'Annual Economic Recovery',
    content: `
**Annual Economic Recovery = Replacement Value ÷ Useful Life**

This represents how much equipment value is "recovered" through job pricing each year.

**Example:**
- Replacement value: $60,000
- Useful life: 10 years
- Annual recovery: $6,000/year

**This is the same as the annual depreciation used in FMS pricing.**

When you compare this to your annual financing payments, you can see:
- If recovery > payments: You're pricing enough to cover cash outflow AND build equity
- If recovery < payments: Your cash outflow exceeds what you're recovering through pricing

**Why the difference happens:**
- Financing terms are often shorter than useful life (5-year loan vs 10-year life)
- Front-loaded payments mean cash pressure early, relief later
- Deposits are immediate cash out, but recovery spreads over years

**The key insight:** A temporary shortfall is normal. What matters is that over the full useful life, you recover the full replacement value through pricing.
    `.trim(),
  },
  {
    id: 'equity-ratio',
    icon: Percent,
    title: 'Equity Ratio',
    content: `
**Equity Ratio = (Total Cost Basis - Outstanding Debt) ÷ Total Cost Basis × 100**

This percentage shows how much of your equipment fleet you actually own versus how much you still owe.

**What the numbers mean:**

| Equity Ratio | Meaning |
|--------------|---------|
| 100% | You own everything outright — no debt |
| 75% | You own 3/4 of your fleet's value |
| 50% | Half your fleet value is still owed |
| 25% | Most of your fleet is financed |
| 0% | All equipment is fully leveraged |

**Why it matters:**

- **Financial Health Indicator** — Banks and lenders look at this when you apply for financing
- **Borrowing Power** — Higher equity means more capacity to finance new equipment
- **Risk Assessment** — Lower equity means more exposure if revenue drops
- **Exit Planning** — If you sold everything today, equity ratio shows what you'd keep after paying off debt

**Example calculation:**

- Total Cost Basis: $500,000
- Outstanding Debt: $150,000
- Equity Ratio: ($500,000 - $150,000) ÷ $500,000 = 70%

This means you own 70% of your fleet's value outright.

**Important notes:**

- This is based on cost basis, not current market value
- A low equity ratio isn't necessarily bad — it might mean you're investing in growth
- New equipment purchases temporarily lower equity ratio until payments are made
    `.trim(),
  },
];

export default function Definitions() {
  return (
    <Layout>
      <div className="p-4 sm:p-6 lg:p-8 animate-fade-in max-w-4xl">
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
                    // Helper function to parse inline bold formatting
                    const parseInlineFormatting = (text: string): React.ReactNode => {
                      if (!text.includes('**')) return text;
                      const parts = text.split('**');
                      return parts.map((part, idx) => 
                        idx % 2 === 1 ? <strong key={idx} className="text-foreground">{part}</strong> : part
                      );
                    };

                    // Detect markdown table (lines with | separators)
                    if (paragraph.includes('|') && paragraph.includes('|---')) {
                      const rows = paragraph.split('\n').filter(row => row.trim() && !row.includes('|---'));
                      if (rows.length > 0) {
                        const headerCells = rows[0].split('|').map(c => c.trim()).filter(c => c);
                        const dataRows = rows.slice(1);
                        
                        return (
                          <div key={i} className="mb-4 overflow-x-auto">
                            <table className="text-sm border-collapse w-full">
                              <thead>
                                <tr className="border-b border-border">
                                  {headerCells.map((h, j) => (
                                    <th key={j} className="px-3 py-2 text-left font-medium text-foreground">{h}</th>
                                  ))}
                                </tr>
                              </thead>
                              <tbody>
                                {dataRows.map((row, j) => {
                                  const cells = row.split('|').map(c => c.trim()).filter(c => c);
                                  return (
                                    <tr key={j} className="border-b border-muted">
                                      {cells.map((cell, k) => (
                                        <td key={k} className="px-3 py-2">{parseInlineFormatting(cell)}</td>
                                      ))}
                                    </tr>
                                  );
                                })}
                              </tbody>
                            </table>
                          </div>
                        );
                      }
                    }

                    // Check for content with indented sub-bullets
                    if (paragraph.includes('\n   - ') || paragraph.includes('\n  - ')) {
                      const lines = paragraph.split('\n');
                      return (
                        <div key={i} className="mb-3">
                          {lines.map((line, j) => {
                            // Indented sub-bullet (3 or 2 spaces before -)
                            if (line.match(/^   - /) || line.match(/^  - /)) {
                              return (
                                <div key={j} className="ml-6 flex items-start gap-2">
                                  <span className="text-muted-foreground">◦</span>
                                  <span>{parseInlineFormatting(line.replace(/^   - |^  - /, ''))}</span>
                                </div>
                              );
                            }
                            // Regular bullet
                            if (line.startsWith('- ')) {
                              return (
                                <div key={j} className="flex items-start gap-2">
                                  <span className="text-muted-foreground">•</span>
                                  <span>{parseInlineFormatting(line.replace('- ', ''))}</span>
                                </div>
                              );
                            }
                            // Numbered item
                            if (line.match(/^\d+\.\s/)) {
                              return (
                                <p key={j} className="font-medium text-foreground mb-1">
                                  {parseInlineFormatting(line)}
                                </p>
                              );
                            }
                            // Other text (headings, etc.)
                            if (line.trim()) {
                              return <p key={j} className="mb-1">{parseInlineFormatting(line)}</p>;
                            }
                            return null;
                          })}
                        </div>
                      );
                    }

                    // Check for mixed content: heading followed by bullets (but not if paragraph starts with bullet)
                    if (paragraph.includes('\n- ') && !paragraph.startsWith('- ')) {
                      const lines = paragraph.split('\n');
                      const headingLine = lines[0];
                      const bulletLines = lines.filter(line => line.startsWith('- '));
                      
                      return (
                        <div key={i} className="mb-3">
                          <p className="mb-2">{parseInlineFormatting(headingLine)}</p>
                          <ul className="list-disc list-inside space-y-1 ml-4">
                            {bulletLines.map((item, j) => (
                              <li key={j}>{parseInlineFormatting(item.replace('- ', ''))}</li>
                            ))}
                          </ul>
                        </div>
                      );
                    }
                    
                    // Pure bullet list (starts with -)
                    if (paragraph.startsWith('- ')) {
                      return (
                        <ul key={i} className="list-disc list-inside mb-3 space-y-1">
                          {paragraph.split('\n').map((item, j) => (
                            <li key={j}>{parseInlineFormatting(item.replace('- ', ''))}</li>
                          ))}
                        </ul>
                      );
                    }
                    
                    // Numbered list
                    if (paragraph.match(/^1\.\s/)) {
                      return (
                        <ol key={i} className="list-decimal list-inside mb-3 space-y-1">
                          {paragraph.split('\n').map((item, j) => (
                            <li key={j}>{parseInlineFormatting(item.replace(/^\d+\.\s/, ''))}</li>
                          ))}
                        </ol>
                      );
                    }
                    
                    // Regular paragraph with bold text parsing
                    if (paragraph.includes('**')) {
                      return (
                        <p key={i} className="mb-3">{parseInlineFormatting(paragraph)}</p>
                      );
                    }
                    
                    // Plain paragraph
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
