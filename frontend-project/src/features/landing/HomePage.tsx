import { useState } from "react";
import { Link } from "react-router";
import {
  Activity,
  ArrowRight,
  ArrowUpRight,
  Check,
  CheckCircle2,
  ChevronRight,
  LayoutGrid,
  ListChecks,
  Mail,
  Menu,
  MessageSquare,
  MoreHorizontal,
  Plus,
  Rocket,
  ShieldCheck,
  Sparkles,
  Star,
  Target,
  Users,
  X,
  Zap,
} from "lucide-react";

const navLinks = [
  { label: "Features", href: "#features" },
  { label: "How it works", href: "#workflow" },
  { label: "AI helper", href: "#ai" },
  { label: "For teams", href: "#teams" },
];

const values = [
  { icon: Zap, label: "Set up in minutes" },
  { icon: Users, label: "Built for teams of 3–10" },
  { icon: ShieldCheck, label: "Private workspaces" },
  { icon: Sparkles, label: "AI with human control" },
];

const problems = [
  {
    problem: "Tasks disappear in the group chat",
    solution: "Every task becomes a card on a shared board everyone can see.",
    icon: MessageSquare,
  },
  {
    problem: "Nobody knows who is doing what",
    solution: "Each card has one owner, a due date and a clear description.",
    icon: Target,
  },
  {
    problem: "Big goals feel impossible to start",
    solution: "The AI breaks a goal into up to 10 cards. You pick what to keep.",
    icon: Sparkles,
  },
];

const features = [
  {
    icon: LayoutGrid,
    tone: "bg-primary-soft text-primary",
    title: "Every project in one place",
    description:
      "Workspaces hold your boards, lists and cards, so the whole plan lives in one shared home instead of scattered notes.",
  },
  {
    icon: ListChecks,
    tone: "bg-[#efe4d8] text-[#7a4a2b]",
    title: "Boards that match your flow",
    description:
      "Start with To do, Doing and Done. Rename, reorder and add lists as your team finds the way it likes to work.",
  },
  {
    icon: Users,
    tone: "bg-accent-soft text-[#8a5527]",
    title: "Clear ownership",
    description:
      "Give every card one assignee and a due date. Open your board and see exactly who is responsible for what.",
  },
  {
    icon: Sparkles,
    tone: "bg-[#f2dfcb] text-[#a35c2c]",
    title: "AI task breakdown",
    description:
      "Describe a goal and get a suggested first plan in seconds. Nothing is added until your team chooses it.",
  },
  {
    icon: MessageSquare,
    tone: "bg-[#f7e7de] text-[#a5482f]",
    title: "Comments in context",
    description:
      "Discuss the task on the card itself. Decisions stay next to the work instead of getting lost in chat threads.",
  },
  {
    icon: Activity,
    tone: "bg-[#eee3d4] text-[#6f4a2c]",
    title: "A history you can trust",
    description:
      "Every created card, edit, move and comment is recorded automatically, so the team can always see what changed.",
  },
];

const steps = [
  {
    number: "01",
    title: "Create a workspace",
    description:
      "One home for your team, your boards and everyone working on the project. Invite teammates with a link or email.",
    icon: Users,
  },
  {
    number: "02",
    title: "Plan the work",
    description:
      "Add boards and lists, then let the AI helper turn a big goal into a first set of cards you can edit and approve.",
    icon: Sparkles,
  },
  {
    number: "03",
    title: "Move work to done",
    description:
      "Assign cards, set due dates and move them across the board as the project moves forward. Progress is always visible.",
    icon: CheckCircle2,
  },
];

const audiences = [
  {
    icon: Rocket,
    title: "Student teams",
    description:
      "Group projects stay organized from the first meeting to the final submission, without chasing people in chat.",
    tone: "bg-primary-soft text-primary",
  },
  {
    icon: LayoutGrid,
    title: "Small teams",
    description:
      "A lightweight shared board with the clarity of a real project tool, and none of the enterprise complexity.",
    tone: "bg-[#efe4d8] text-[#7a4a2b]",
  },
  {
    icon: Users,
    title: "Clubs & communities",
    description:
      "Coordinate volunteers, events and shared goals in one place that everyone can understand on day one.",
    tone: "bg-accent-soft text-[#8a5527]",
  },
];

const footerLinks = [
  {
    title: "Product",
    links: [
      { label: "Features", href: "#features" },
      { label: "How it works", href: "#workflow" },
      { label: "AI helper", href: "#ai" },
      { label: "For teams", href: "#teams" },
    ],
  },
  {
    title: "Company",
    links: [
      { label: "Our story", href: "#story" },
      { label: "Contact", href: "mailto:hello@teamboard.app" },
      { label: "Get started", href: "#get-started" },
    ],
  },
  {
    title: "Support",
    links: [
      { label: "Guide", href: "#workflow" },
      { label: "Email us", href: "mailto:hello@teamboard.app" },
      { label: "Back to top", href: "#top" },
    ],
  },
];

function StatPill({
  icon: Icon,
  value,
  label,
}: {
  icon: typeof Zap;
  value: string;
  label: string;
}) {
  return (
    <div className="flex items-center gap-3 rounded-2xl border border-line bg-white/70 px-4 py-3">
      <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary-soft text-primary">
        <Icon className="h-4 w-4" />
      </span>
      <div>
        <p className="text-lg font-bold leading-none text-ink">{value}</p>
        <p className="mt-1 text-[11px] font-medium text-ink/55">{label}</p>
      </div>
    </div>
  );
}

function Header() {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 border-b border-line/70 bg-cream/85 backdrop-blur-xl">
      <div className="mx-auto flex h-20 max-w-7xl items-center gap-3 px-4 sm:px-6 lg:px-8">
        <a href="#top" className="flex items-center gap-2.5">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-forest text-white shadow-sm shadow-primary/30">
            <LayoutGrid className="h-5 w-5" />
          </span>
          <span className="text-lg font-extrabold tracking-tight text-ink">TeamBoard</span>
        </a>

        <nav aria-label="Main" className="hidden items-center gap-8 pl-8 md:flex">
          {navLinks.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className="text-sm font-semibold text-ink/60 transition-colors hover:text-ink"
            >
              {link.label}
            </a>
          ))}
        </nav>

        <div className="ml-auto hidden items-center gap-2 md:flex">
          <a
            href="#ai"
            className="rounded-xl px-4 py-2.5 text-sm font-semibold text-ink/70 transition-colors hover:text-ink"
          >
            Explore the AI
          </a>
          <Link
            to="/login"
            className="rounded-xl px-4 py-2.5 text-sm font-semibold text-ink/70 transition-colors hover:text-ink"
          >
            Sign in
          </Link>
          <Link
            to="/signup"
            className="inline-flex items-center gap-1.5 rounded-xl bg-forest px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-forest-dark"
          >
            Get started
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>

        <button
          type="button"
          onClick={() => setMenuOpen((open) => !open)}
          aria-label={menuOpen ? "Close menu" : "Open menu"}
          aria-expanded={menuOpen}
          className="ml-auto rounded-xl p-2 text-ink/70 hover:bg-sand md:hidden"
        >
          {menuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      {menuOpen && (
        <div className="border-t border-line bg-cream px-4 pb-5 pt-3 md:hidden">
          <nav aria-label="Mobile" className="flex flex-col gap-1">
            {navLinks.map((link) => (
              <a
                key={link.href}
                href={link.href}
                onClick={() => setMenuOpen(false)}
                className="rounded-xl px-3 py-2.5 text-sm font-semibold text-ink/70 hover:bg-sand"
              >
                {link.label}
              </a>
            ))}
          </nav>
          <Link
            to="/login"
            onClick={() => setMenuOpen(false)}
            className="mt-3 flex items-center justify-center rounded-xl border border-line bg-white px-4 py-3 text-sm font-semibold text-ink"
          >
            Sign in
          </Link>
          <Link
            to="/signup"
            onClick={() => setMenuOpen(false)}
            className="mt-2 flex items-center justify-center gap-1.5 rounded-xl bg-forest px-4 py-3 text-sm font-semibold text-white"
          >
            Get started
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      )}
    </header>
  );
}

function Hero() {
  return (
    <section className="relative overflow-hidden bg-cream">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -left-40 -top-40 h-[30rem] w-[30rem] rounded-full bg-primary/10 blur-3xl" />
        <div className="absolute -right-24 top-10 h-96 w-96 rounded-full bg-accent/15 blur-3xl" />
        <div
          className="absolute inset-0 opacity-40"
          style={{
            backgroundImage:
              "radial-gradient(circle at 1px 1px, rgba(10,31,26,0.12) 1px, transparent 0)",
            backgroundSize: "30px 30px",
          }}
        />
      </div>

      <div className="relative mx-auto max-w-4xl px-4 pb-24 pt-16 text-center sm:px-6 lg:px-8 lg:pb-32 lg:pt-24">
        <div>
          <a
            href="#ai"
            className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-white px-3.5 py-1.5 text-xs font-bold text-primary shadow-sm"
          >
            <Sparkles className="h-3.5 w-3.5" />
            New: AI task breakdown
            <ChevronRight className="h-3.5 w-3.5" />
          </a>

          <h1 className="mx-auto mt-6 max-w-3xl text-4xl font-extrabold leading-[1.04] tracking-tight text-ink sm:text-6xl lg:text-7xl">
            Turn a big goal into a plan your team can{" "}
            <span className="relative inline-block text-primary">
              finish.
              <svg
                className="absolute -bottom-2 left-0 w-full text-accent"
                viewBox="0 0 200 12"
                fill="none"
                preserveAspectRatio="none"
                aria-hidden="true"
              >
                <path
                  d="M2 9C55 3 145 3 198 7"
                  stroke="currentColor"
                  strokeWidth="6"
                  strokeLinecap="round"
                />
              </svg>
            </span>
          </h1>

          <p className="mx-auto mt-6 max-w-2xl text-base leading-relaxed text-ink/60 sm:text-lg">
            TeamBoard is a shared board for student teams and small teams. Plan work in lists and
            cards, assign every task, follow progress at a glance, and let the AI helper break a
            big goal into your first set of cards.
          </p>

          <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Link
              to="/signup"
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-forest px-6 py-3.5 text-sm font-bold text-white shadow-lg shadow-forest/20 transition-colors hover:bg-forest-dark"
            >
              Get started — it&apos;s free
              <ArrowRight className="h-4 w-4" />
            </Link>
            <a
              href="#workflow"
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-line bg-white px-6 py-3.5 text-sm font-bold text-ink transition-colors hover:border-primary hover:text-primary"
            >
              See how it works
              <ArrowUpRight className="h-4 w-4" />
            </a>
          </div>

          <div className="mx-auto mt-9 grid max-w-xl grid-cols-2 gap-3 text-left sm:grid-cols-3">
            <StatPill icon={ListChecks} value="3" label="lists to start" />
            <StatPill icon={Sparkles} value="10" label="AI cards per goal" />
            <StatPill icon={Users} value="1" label="shared source of truth" />
          </div>
        </div>
      </div>
    </section>
  );
}

function ValueStrip() {
  return (
    <section className="border-y border-line bg-white">
      <div className="mx-auto grid max-w-7xl gap-5 px-4 py-6 sm:grid-cols-2 sm:px-6 lg:grid-cols-4 lg:px-8">
        {values.map((value) => (
          <div key={value.label} className="flex items-center gap-3">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary-soft text-primary">
              <value.icon className="h-4 w-4" />
            </span>
            <span className="text-sm font-semibold text-ink/70">{value.label}</span>
          </div>
        ))}
      </div>
    </section>
  );
}

function WhySection() {
  return (
    <section id="why" className="scroll-mt-28 bg-cream py-24 sm:py-32">
      <div className="mx-auto grid max-w-7xl items-start gap-14 px-4 sm:px-6 lg:grid-cols-[0.95fr_1.05fr] lg:gap-20 lg:px-8">
        <div className="lg:sticky lg:top-28">
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-primary">Why TeamBoard</p>
          <h2 className="mt-4 text-3xl font-extrabold leading-[1.1] tracking-tight text-ink sm:text-5xl">
            Group projects should not live in a group chat.
          </h2>
          <p className="mt-5 max-w-lg text-base leading-relaxed text-ink/60">
            Most teams do not fail because people do not care. They fail because the plan is
            invisible: tasks are buried in messages, ownership is unclear, and starting feels
            overwhelming. TeamBoard gives every project one clear, shared home.
          </p>

          <div className="mt-8 rounded-2xl border border-primary/15 bg-primary-soft/60 p-5">
            <p className="flex items-center gap-2 text-sm font-bold text-primary">
              <ShieldCheck className="h-4 w-4" />
              One simple flow, from idea to done
            </p>
            <p className="mt-2 text-sm leading-relaxed text-ink/60">
              Workspace → Board → List → Card → Comment. Everything your team needs, in a shape
              everyone understands on day one.
            </p>
          </div>
        </div>

        <div className="space-y-4">
          {problems.map((item, index) => (
            <article
              key={item.problem}
              className="group rounded-3xl border border-line bg-white p-6 transition-all hover:-translate-y-0.5 hover:border-primary/30 hover:shadow-xl hover:shadow-forest/5 sm:p-8"
            >
              <div className="flex items-start gap-4">
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-sand text-ink/60">
                  <item.icon className="h-5 w-5" />
                </span>
                <div>
                  <div className="flex items-center gap-3">
                    <span className="text-xs font-bold text-ink/30">
                      0{index + 1}
                    </span>
                    <h3 className="text-base font-bold text-ink sm:text-lg">{item.problem}</h3>
                  </div>
                  <p className="mt-2 text-sm leading-relaxed text-ink/60">{item.solution}</p>
                </div>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

function Features() {
  return (
    <section id="features" className="scroll-mt-28 bg-white py-24 sm:py-32">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-3xl text-center">
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-primary">Features</p>
          <h2 className="mt-4 text-3xl font-extrabold leading-[1.1] tracking-tight text-ink sm:text-5xl">
            Everything your team needs to ship
          </h2>
          <p className="mt-5 text-base leading-relaxed text-ink/60 sm:text-lg">
            A shared board with the right amount of structure. Plan the work, see the progress,
            and keep everyone moving in the same direction.
          </p>
        </div>

        <div className="mt-14 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {features.map((feature) => (
            <article
              key={feature.title}
              className="group rounded-3xl border border-line bg-cream/50 p-7 transition-all hover:-translate-y-1 hover:border-primary/30 hover:bg-white hover:shadow-xl hover:shadow-forest/5"
            >
              <span
                className={`flex h-12 w-12 items-center justify-center rounded-2xl ${feature.tone}`}
              >
                <feature.icon className="h-5 w-5" />
              </span>
              <h3 className="mt-6 text-lg font-bold text-ink">{feature.title}</h3>
              <p className="mt-2.5 text-sm leading-relaxed text-ink/60">{feature.description}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

function Workflow() {
  return (
    <section id="workflow" className="scroll-mt-28 bg-cream py-24 sm:py-32">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid items-end gap-6 lg:grid-cols-[1fr_auto]">
          <div className="max-w-2xl">
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-primary">
              How it works
            </p>
            <h2 className="mt-4 text-3xl font-extrabold leading-[1.1] tracking-tight text-ink sm:text-5xl">
              From big goal to done, in three steps
            </h2>
          </div>
          <Link
            to="/signup"
            className="inline-flex w-fit items-center gap-2 rounded-xl border border-line bg-white px-5 py-3 text-sm font-bold text-ink transition-colors hover:border-primary hover:text-primary"
          >
            Start planning
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>

        <div className="mt-14 grid gap-5 lg:grid-cols-3">
          {steps.map((step) => (
            <article
              key={step.number}
              className="relative overflow-hidden rounded-3xl border border-line bg-white p-8 transition-all hover:-translate-y-1 hover:shadow-xl hover:shadow-forest/5"
            >
              <div className="absolute right-6 top-5 text-6xl font-extrabold tracking-tight text-sand">
                {step.number}
              </div>
              <span className="relative flex h-12 w-12 items-center justify-center rounded-2xl bg-forest text-white">
                <step.icon className="h-5 w-5" />
              </span>
              <h3 className="relative mt-6 text-lg font-bold text-ink">{step.title}</h3>
              <p className="relative mt-2.5 text-sm leading-relaxed text-ink/60">
                {step.description}
              </p>
            </article>
          ))}
        </div>

        <div className="mt-6 rounded-3xl border border-line bg-gradient-to-br from-white to-sand/60 p-6 sm:p-10">
          <div className="grid items-center gap-10 lg:grid-cols-2">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-primary">
                On every board
              </p>
              <h3 className="mt-3 text-2xl font-extrabold tracking-tight text-ink sm:text-3xl">
                See the whole project in one glance
              </h3>
              <p className="mt-3 text-sm leading-relaxed text-ink/60">
                Cards move through the lists you define. Owners, due dates and comments sit right
                on the work, so the board answers the question everyone asks: what is next?
              </p>
              <ul className="mt-6 space-y-3">
                {[
                  "Assign one owner and a due date to every card",
                  "Move work between lists as it progresses",
                  "Keep decisions in comments beside the task",
                  "See exactly what changed in the activity history",
                ].map((item) => (
                  <li key={item} className="flex items-start gap-2.5 text-sm text-ink/70">
                    <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>

            <div className="rounded-3xl border border-line bg-white p-5 shadow-xl shadow-forest/5">
              <div className="flex items-center justify-between border-b border-line/70 pb-4">
                <div>
                  <p className="text-xs font-medium text-ink/50">Workspace</p>
                  <p className="text-sm font-bold text-ink">Group 8 projects</p>
                </div>
                <span className="flex items-center gap-1 rounded-full bg-primary-soft px-2.5 py-1 text-[10px] font-bold text-primary">
                  <CheckCircle2 className="h-3 w-3" />
                  On track
                </span>
              </div>

              <div className="mt-4 space-y-3">
                {[
                  { name: "Launch the school website", cards: 12, done: 7, color: "bg-primary" },
                  { name: "Science fair booth", cards: 8, done: 5, color: "bg-[#a35c2c]" },
                  { name: "Team presentation", cards: 6, done: 2, color: "bg-accent" },
                ].map((board) => (
                  <div
                    key={board.name}
                    className="rounded-2xl border border-line bg-cream/60 p-4"
                  >
                    <div className="flex items-center gap-2">
                      <span className={`h-2.5 w-2.5 rounded-full ${board.color}`} />
                      <p className="text-sm font-bold text-ink">{board.name}</p>
                      <MoreHorizontal className="ml-auto h-4 w-4 text-ink/30" />
                    </div>
                    <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-sand">
                      <div
                        className={`h-full rounded-full ${board.color}`}
                        style={{ width: `${(board.done / board.cards) * 100}%` }}
                      />
                    </div>
                    <div className="mt-2 flex items-center justify-between text-[10px] font-semibold text-ink/45">
                      <span>
                        {board.done} of {board.cards} cards done
                      </span>
                      <span>{Math.round((board.done / board.cards) * 100)}%</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function AiSection() {
  return (
    <section id="ai" className="scroll-mt-28 bg-white py-24 sm:py-32">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div
          className="relative overflow-hidden rounded-[2rem] bg-forest px-6 py-14 sm:px-10 lg:px-16 lg:py-20"
          style={{
            backgroundImage:
              "radial-gradient(circle at 15% 15%, rgba(139, 90, 52, 0.5), transparent 45%), radial-gradient(circle at 85% 85%, rgba(201, 138, 75, 0.24), transparent 45%)",
          }}
        >
          <div
            className="pointer-events-none absolute inset-0 opacity-[0.06]"
            style={{
              backgroundImage:
                "linear-gradient(to right, white 1px, transparent 1px), linear-gradient(to bottom, white 1px, transparent 1px)",
              backgroundSize: "48px 48px",
            }}
          />

          <div className="relative grid items-center gap-12 lg:grid-cols-2 lg:gap-16">
            <div>
              <span className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3.5 py-1.5 text-xs font-bold text-[#f2dfcb] ring-1 ring-white/15">
                <Sparkles className="h-3.5 w-3.5" />
                AI task breakdown
              </span>
              <h2 className="mt-6 text-3xl font-extrabold leading-[1.1] tracking-tight text-white sm:text-5xl">
                Stuck at the start? Ask TeamBoard.
              </h2>
              <p className="mt-5 max-w-lg text-base leading-relaxed text-white/70">
                Type a goal and the AI suggests a first set of cards in seconds. Nothing is added
                until your team picks it, so the board always stays under human control.
              </p>

              <ul className="mt-8 space-y-3.5">
                {[
                  "Up to ten suggested cards per goal",
                  "Every suggestion is checked before it is shown",
                  "Edit titles and due dates before adding",
                  "The AI never assigns work to people",
                ].map((item) => (
                  <li key={item} className="flex items-start gap-3 text-sm text-white/80">
                    <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-[#e0b98c]" />
                    {item}
                  </li>
                ))}
              </ul>

              <Link
                to="/signup"
                className="mt-9 inline-flex items-center gap-2 rounded-xl bg-white px-5 py-3 text-sm font-bold text-forest transition-colors hover:bg-[#fbf2e8]"
              >
                Try the AI helper
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>

            <div className="rounded-3xl border border-white/15 bg-white/5 p-4 shadow-2xl backdrop-blur sm:p-5">
              <div className="flex items-center gap-2 border-b border-white/10 pb-3">
                <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-br from-[#c98a4b] to-accent text-forest">
                  <Sparkles className="h-4 w-4" />
                </span>
                <p className="text-xs font-bold text-white">Break down a goal</p>
                <span className="ml-auto h-2 w-2 rounded-full bg-[#c98a4b]" />
              </div>

              <div className="mt-4 rounded-2xl bg-white/10 p-4 ring-1 ring-white/10">
                <p className="text-[10px] font-bold uppercase tracking-wide text-[#e6c6a0]">
                  You
                </p>
                <p className="mt-1.5 text-sm font-medium text-white">
                  &ldquo;Launch the school website by the end of the month&rdquo;
                </p>
              </div>

              <div className="mt-3 rounded-2xl bg-white p-4 text-ink shadow-xl">
                <div className="flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-[#a35c2c]" />
                  <p className="text-xs font-bold">Suggested cards</p>
                  <span className="ml-auto rounded-full bg-[#f2dfcb] px-2 py-0.5 text-[10px] font-bold text-[#a35c2c]">
                    5 ideas
                  </span>
                </div>
                <div className="mt-3 space-y-2">
                  {[
                    { title: "Collect content for the homepage", tag: "To do" },
                    { title: "Design the page layout", tag: "To do" },
                    { title: "Build the navigation", tag: "Doing" },
                  ].map((card) => (
                    <div
                      key={card.title}
                      className="flex items-center gap-3 rounded-xl border border-line px-3 py-2.5"
                    >
                      <span className="flex h-5 w-5 items-center justify-center rounded border border-line bg-white text-primary">
                        <Check className="h-3 w-3" />
                      </span>
                      <p className="truncate text-xs font-semibold text-ink/70">{card.title}</p>
                      <span className="ml-auto shrink-0 rounded bg-sand px-1.5 py-0.5 text-[9px] font-bold text-ink/50">
                        {card.tag}
                      </span>
                    </div>
                  ))}
                </div>
                <button
                  type="button"
                  className="mt-3 flex w-full items-center justify-center gap-1.5 rounded-lg bg-forest px-3 py-2.5 text-xs font-bold text-white"
                >
                  <Plus className="h-3.5 w-3.5" />
                  Add 3 cards to board
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function Teams() {
  return (
    <section id="teams" className="scroll-mt-28 bg-cream py-24 sm:py-32">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-3xl text-center">
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-primary">For teams</p>
          <h2 className="mt-4 text-3xl font-extrabold leading-[1.1] tracking-tight text-ink sm:text-5xl">
            Made for the people doing the work
          </h2>
          <p className="mt-5 text-base leading-relaxed text-ink/60 sm:text-lg">
            TeamBoard is built for small groups that need clarity, not another complicated tool.
          </p>
        </div>

        <div className="mt-14 grid gap-5 lg:grid-cols-3">
          {audiences.map((audience) => (
            <article
              key={audience.title}
              className="rounded-3xl border border-line bg-white p-8 transition-all hover:-translate-y-1 hover:border-primary/30 hover:shadow-xl hover:shadow-forest/5"
            >
              <span
                className={`flex h-12 w-12 items-center justify-center rounded-2xl ${audience.tone}`}
              >
                <audience.icon className="h-5 w-5" />
              </span>
              <h3 className="mt-6 text-lg font-bold text-ink">{audience.title}</h3>
              <p className="mt-2.5 text-sm leading-relaxed text-ink/60">{audience.description}</p>
            </article>
          ))}
        </div>

        <div className="mt-6 flex flex-col items-start justify-between gap-4 rounded-3xl border border-primary/15 bg-primary-soft/50 p-6 sm:flex-row sm:items-center sm:p-8">
          <div className="flex items-start gap-3">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white text-primary">
              <ShieldCheck className="h-5 w-5" />
            </span>
            <div>
              <p className="text-sm font-bold text-ink">The right people stay in control</p>
              <p className="mt-1 text-sm leading-relaxed text-ink/60">
                Owners invite members and manage the workspace. Members move work forward. Admins
                keep the platform healthy — never read your boards.
              </p>
            </div>
          </div>
          <Link
            to="/signup"
            className="inline-flex shrink-0 items-center gap-2 rounded-xl bg-forest px-5 py-3 text-sm font-bold text-white transition-colors hover:bg-forest-dark"
          >
            Create a workspace
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </div>
    </section>
  );
}

function Testimonial() {
  return (
    <section id="story" className="scroll-mt-28 bg-white py-24 sm:py-32">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid gap-12 lg:grid-cols-[1fr_1.15fr] lg:items-center lg:gap-20">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-primary">Stories</p>
            <h2 className="mt-4 text-3xl font-extrabold leading-[1.1] tracking-tight text-ink sm:text-5xl">
              Less chasing, more finishing
            </h2>
            <p className="mt-5 max-w-md text-base leading-relaxed text-ink/60">
              When the plan lives on one board, the whole team can see what is next. Here is what
              that looks like for a small group project.
            </p>

            <div className="mt-10 grid grid-cols-3 gap-4">
              {[
                { value: "1", label: "Shared source of truth" },
                { value: "10", label: "AI cards per goal" },
                { value: "3", label: "Steps to begin" },
              ].map((stat) => (
                <div key={stat.label} className="rounded-2xl border border-line bg-cream p-4">
                  <p className="text-2xl font-extrabold text-primary">{stat.value}</p>
                  <p className="mt-1 text-[11px] font-semibold leading-snug text-ink/50">
                    {stat.label}
                  </p>
                </div>
              ))}
            </div>
          </div>

          <figure className="rounded-[2rem] border border-line bg-cream p-8 shadow-xl shadow-forest/5 sm:p-10">
            <div className="flex items-center gap-1 text-accent">
              {[0, 1, 2, 3, 4].map((star) => (
                <Star key={star} className="h-4 w-4 fill-current" />
              ))}
            </div>
            <blockquote className="mt-6 text-lg font-semibold leading-relaxed text-ink sm:text-xl">
              &ldquo;We stopped losing tasks in the group chat. Everything lives on one board now,
              and the AI breakdown got us moving on day one.&rdquo;
            </blockquote>
            <figcaption className="mt-8 flex items-center gap-3 border-t border-line pt-6">
              <span className="flex h-11 w-11 items-center justify-center rounded-full bg-gradient-to-br from-primary to-forest text-sm font-bold text-white">
                AM
              </span>
              <div>
                <p className="text-sm font-bold text-ink">Aline M.</p>
                <p className="text-xs text-ink/50">Student project lead</p>
              </div>
            </figcaption>
          </figure>
        </div>
      </div>
    </section>
  );
}

function CallToAction() {
  return (
    <section id="get-started" className="scroll-mt-28 bg-cream pb-24 sm:pb-32">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="relative overflow-hidden rounded-[2rem] bg-gradient-to-br from-forest via-primary-dark to-primary px-6 py-16 text-center shadow-2xl shadow-forest/20 sm:px-12 sm:py-20">
          <div className="pointer-events-none absolute -left-20 -top-24 h-72 w-72 rounded-full bg-white/10 blur-2xl" />
          <div className="pointer-events-none absolute -bottom-24 -right-16 h-80 w-80 rounded-full bg-accent/20 blur-3xl" />

          <div className="relative mx-auto max-w-2xl">
            <span className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3.5 py-1.5 text-xs font-bold text-[#f7ecdf] ring-1 ring-white/20">
              <Rocket className="h-3.5 w-3.5" />
              Start your next project
            </span>
            <h2 className="mt-6 text-3xl font-extrabold leading-[1.1] tracking-tight text-white sm:text-5xl">
              Your next project starts on one clear board
            </h2>
            <p className="mt-5 text-base leading-relaxed text-[#f7ecdf]/80">
              Turn a big goal into a plan your whole team can see, own and finish. TeamBoard is
              free for small teams and ready in minutes.
            </p>

            <div className="mt-9 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <Link
                to="/signup"
                className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-white px-6 py-3.5 text-sm font-bold text-forest shadow-lg transition-colors hover:bg-[#fbf2e8] sm:w-auto"
              >
                Get started free
                <ArrowRight className="h-4 w-4" />
              </Link>
              <a
                href="#features"
                className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-white/35 px-6 py-3.5 text-sm font-bold text-white transition-colors hover:bg-white/10 sm:w-auto"
              >
                Explore features
              </a>
            </div>

            <p className="mt-5 text-xs font-medium text-[#f7ecdf]/70">
              No credit card required · Free for teams of 3–10
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}

function Footer() {
  return (
    <footer className="bg-forest-dark text-white/70">
      <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="grid gap-12 md:grid-cols-[1.5fr_1fr_1fr_1fr]">
          <div>
            <a href="#top" className="flex items-center gap-2.5">
              <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-[#c98a4b] text-white">
                <LayoutGrid className="h-5 w-5" />
              </span>
              <span className="text-lg font-extrabold tracking-tight text-white">TeamBoard</span>
            </a>
            <p className="mt-5 max-w-xs text-sm leading-relaxed text-white/55">
              A shared board for small teams, with an AI helper that turns big goals into a
              starting plan.
            </p>
            <a
              href="mailto:hello@teamboard.app"
              className="mt-6 inline-flex items-center gap-2 text-sm font-semibold text-white/70 transition-colors hover:text-white"
            >
              <Mail className="h-4 w-4" />
              hello@teamboard.app
            </a>
          </div>

          {footerLinks.map((column) => (
            <div key={column.title}>
              <h3 className="text-xs font-bold uppercase tracking-[0.18em] text-white/35">
                {column.title}
              </h3>
              <ul className="mt-4 space-y-2.5">
                {column.links.map((link) => (
                  <li key={link.label}>
                    <a
                      href={link.href}
                      className="text-sm text-white/55 transition-colors hover:text-white"
                    >
                      {link.label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-14 flex flex-col items-center justify-between gap-3 border-t border-white/10 pt-6 text-xs text-white/40 sm:flex-row">
          <p>&copy; {new Date().getFullYear()} TeamBoard. All rights reserved.</p>
          <a href="#top" className="transition-colors hover:text-white/70">
            Back to top
          </a>
        </div>
      </div>
    </footer>
  );
}

function HomePage() {
  return (
    <div id="top" className="bg-cream text-ink">
      <Header />
      <main>
        <Hero />
        <ValueStrip />
        <WhySection />
        <Features />
        <Workflow />
        <AiSection />
        <Teams />
        <Testimonial />
        <CallToAction />
      </main>
      <Footer />
    </div>
  );
}

export default HomePage;
