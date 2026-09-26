const currencies = [
  "NGN ₦", "GHS ₵", "KES KSh", "ZAR R", "EGP E£", "XOF CFA",
  "TZS TSh", "UGX USh", "MAD DH", "RWF RF", "ETB Br", "XAF CFA",
];

const steps = {
  buyer: [
    {
      title: "Find and verify a seller",
      body: "See a seller's verification status and completed-order history before you commit to anything.",
    },
    {
      title: "Pay in your own currency",
      body: "Prices convert to your local currency automatically. You pay the way you already pay.",
    },
    {
      title: "Track the order",
      body: "Watch the order move from paid to shipped to delivered, with proof at each step.",
    },
    {
      title: "Confirm or open a dispute",
      body: "Release payment once you're satisfied, or open a dispute if the order isn't right.",
    },
  ],
  seller: [
    {
      title: "Create a cross-border order",
      body: "List what you're selling and who it's for. TradeBridge handles the currency conversion.",
    },
    {
      title: "See your earnings, locally",
      body: "Know exactly what lands in your account, in your own currency, before you ship.",
    },
    {
      title: "Ship and provide proof",
      body: "Upload shipping and delivery evidence so the buyer — and TradeBridge — can see it move.",
    },
    {
      title: "Get paid",
      body: "Funds release to you once the transaction completes, backed by a verified reputation.",
    },
  ],
};

const features = [
  {
    title: "Seller verification",
    body: "Every seller on TradeBridge builds a reputation from completed, evidenced transactions — not a star rating you have to take on faith.",
    tone: "large" as const,
  },
  {
    title: "Local-currency payment",
    body: "Buyers pay in their own currency. Sellers see earnings in theirs. No separate FX app, no guessing the rate.",
    tone: "small" as const,
  },
  {
    title: "Delivery evidence",
    body: "Shipping and delivery proof is attached to the order, not left to a WhatsApp thread.",
    tone: "small" as const,
  },
  {
    title: "Dispute resolution",
    body: "If something goes wrong, both sides already have the evidence. Disputes resolve on what happened, not who shouts louder.",
    tone: "small" as const,
  },
];

export default function Home() {
  return (
    <main className="bg-[var(--paper)] text-[var(--ink)]">
      {/* Nav */}
      <header className="sticky top-0 z-40 border-b border-[var(--sand-border)] bg-[var(--paper)]/90 backdrop-blur">
        <div className="container-page flex h-16 items-center justify-between">
          <a href="#" className="text-lg font-medium" style={{ fontFamily: "var(--font-heading)" }}>
            TradeBridge
          </a>
          <nav className="hidden items-center gap-8 text-sm font-medium text-[var(--ink-muted)] md:flex">
            <a href="#how-it-works" className="hover:text-[var(--ink)]">How it works</a>
            <a href="#trust" className="hover:text-[var(--ink)]">Trust</a>
            <a href="#sellers" className="hover:text-[var(--ink)]">For sellers</a>
            <a href="#countries" className="hover:text-[var(--ink)]">Countries</a>
          </nav>
          <div className="flex items-center gap-3">
            <a href="/login" className="hidden text-sm font-medium text-[var(--ink-muted)] hover:text-[var(--ink)] sm:block">
              Log in
            </a>
            <a href="/get-started" className="btn btn-primary text-sm">Get started</a>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="relative overflow-hidden bg-[var(--ink)] text-[var(--paper)]">
        <div className="container-page grid gap-14 py-20 md:grid-cols-2 md:items-center md:py-28">
          <div>
            <h1 className="text-[2.6rem] leading-[1.05] sm:text-6xl">
              Buy and sell across Africa without the guesswork.
            </h1>
            <p className="mt-9 max-w-md text-lg text-[var(--paper-muted)]">
              TradeBridge brings seller verification, local-currency payment, delivery
              protection, and disputes into one transaction — so crossing a border
              stops feeling like a risk.
            </p>
            <div className="mt-9 flex flex-wrap items-center gap-4">
              <a href="/get-started" className="btn btn-primary">Start a trade</a>
              <a href="#how-it-works" className="btn btn-outline">See how it works</a>
            </div>
            <dl className="mt-14 grid max-w-md grid-cols-3 gap-6 border-t border-[var(--ink-border)] pt-8">
              <div>
                <dt className="text-sm text-[var(--paper-muted)]">Countries</dt>
                <dd className="tnum mt-1 text-2xl" style={{ fontFamily: "var(--font-heading)" }}>12+</dd>
              </div>
              <div>
                <dt className="text-sm text-[var(--paper-muted)]">Verified sellers</dt>
                <dd className="tnum mt-1 text-2xl" style={{ fontFamily: "var(--font-heading)" }}>3,400+</dd>
              </div>
              <div>
                <dt className="text-sm text-[var(--paper-muted)]">Held in protection</dt>
                <dd className="tnum mt-1 text-2xl" style={{ fontFamily: "var(--font-heading)" }}>₦210M+</dd>
              </div>
            </dl>
          </div>

          {/* Trade ticket mockup */}
          <div className="rise-in relative mx-auto w-full max-w-sm">
            <div className="ticket-notch relative rounded-[28px] bg-[var(--paper)] p-7 text-[var(--ink)] shadow-[0_30px_60px_-20px_rgba(0,0,0,0.5)]">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-[var(--ink-muted)]">Order #TB-2291</span>
                <span className="rounded-full bg-[var(--leaf)]/10 px-3 py-1 text-xs font-semibold text-[var(--leaf)]">
                  In transit
                </span>
              </div>

              <div className="mt-5 flex items-center justify-between text-sm font-medium">
                <span>Lagos, Nigeria</span>
                <span aria-hidden className="text-[var(--ink-muted)]">→</span>
                <span>Accra, Ghana</span>
              </div>

              <p className="mt-4 text-base">40 yards of Ankara fabric</p>

              <div className="ticket-divider my-5" />

              <div className="space-y-3 text-sm">
                <div className="flex items-center justify-between">
                  <span className="text-[var(--ink-muted)]">Seller earns</span>
                  <span className="tnum font-semibold">₦150,000</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[var(--ink-muted)]">Buyer pays</span>
                  <span className="tnum font-semibold">GH₵ 6,180</span>
                </div>
              </div>

              <div className="ticket-divider my-5" />

              <div className="flex items-center gap-2 rounded-xl bg-[var(--sand)] px-4 py-3 text-xs text-[var(--ink)]">
                <span className="h-2 w-2 shrink-0 rounded-full bg-[var(--marigold-dark)]" />
                Funds held until the buyer confirms delivery
              </div>

              <ol className="mt-5 grid grid-cols-4 gap-1 text-[10px] font-medium text-[var(--ink-muted)]">
                {["Paid", "Shipped", "Delivered", "Confirmed"].map((s, i) => (
                  <li key={s} className="flex flex-col items-center gap-1.5">
                    <span
                      className={`h-1.5 w-full rounded-full ${
                        i < 2 ? "bg-[var(--marigold)]" : "bg-[var(--sand-border)]"
                      }`}
                    />
                    {s}
                  </li>
                ))}
              </ol>
            </div>
          </div>
        </div>
      </section>

      {/* The worry */}
      <section className="bg-[var(--paper)] py-24">
        <div className="container-page grid gap-12 md:grid-cols-[0.9fr_1.1fr]">
          <div>
            <h2 className="text-3xl sm:text-4xl">
              Every cross-border buyer asks the same three questions.
            </h2>
          </div>
          <div className="space-y-6 text-lg leading-relaxed text-[var(--ink)]/80">
            <p className="border-l-2 border-[var(--marigold)] pl-5">
              "Can I trust this seller?"
            </p>
            <p className="border-l-2 border-[var(--marigold)] pl-5">
              "Will I actually receive my product?"
            </p>
            <p className="border-l-2 border-[var(--marigold)] pl-5">
              "What happens if something goes wrong?"
            </p>
            <p className="pt-2 text-base text-[var(--ink-muted)]">
              TradeBridge answers all three inside a single transaction, instead of
              leaving you to piece together a payment app, a courier, and a group
              chat.
            </p>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section id="how-it-works" className="bg-[var(--sand)] py-24">
        <div className="container-page">
          <h2 className="max-w-lg text-3xl sm:text-4xl">How a trade moves from start to finish</h2>

          <div className="mt-14 grid gap-14 lg:grid-cols-2">
            <div>
              <h3 className="text-xl">For buyers</h3>
              <ol className="mt-6 space-y-6">
                {steps.buyer.map((step, i) => (
                  <li key={step.title} className="flex gap-4">
                    <span
                      className="tnum flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[var(--ink)] text-sm font-semibold text-[var(--paper)]"
                    >
                      {i + 1}
                    </span>
                    <div>
                      <p className="font-semibold">{step.title}</p>
                      <p className="mt-1 text-[var(--ink-muted)]">{step.body}</p>
                    </div>
                  </li>
                ))}
              </ol>
            </div>

            <div>
              <h3 className="text-xl">For sellers</h3>
              <ol className="mt-6 space-y-6">
                {steps.seller.map((step, i) => (
                  <li key={step.title} className="flex gap-4">
                    <span
                      className="tnum flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[var(--marigold)] text-sm font-semibold text-[var(--ink)]"
                    >
                      {i + 1}
                    </span>
                    <div>
                      <p className="font-semibold">{step.title}</p>
                      <p className="mt-1 text-[var(--ink-muted)]">{step.body}</p>
                    </div>
                  </li>
                ))}
              </ol>
            </div>
          </div>
        </div>
      </section>

      {/* Trust features */}
      <section id="trust" className="bg-[var(--paper)] py-24">
        <div className="container-page">
          <h2 className="max-w-lg text-3xl sm:text-4xl">
            The trust layer, not just the payment layer
          </h2>
          <p className="mt-4 max-w-xl text-[var(--ink-muted)]">
            TradeBridge isn't a marketplace or a wallet on its own. It's the set of
            checks that make a stranger, in another country, safe to trade with.
          </p>

          <div className="mt-12 grid gap-5 lg:grid-cols-3">
            <div className="rounded-3xl bg-[var(--ink)] p-9 text-[var(--paper)] lg:col-span-2 lg:row-span-2">
              <h3 className="text-2xl" style={{ fontFamily: "var(--font-heading)" }}>
                {features[0].title}
              </h3>
              <p className="mt-4 max-w-sm text-[var(--paper-muted)]">{features[0].body}</p>
              <img
                src="https://picsum.photos/seed/tradebridge-verify/640/380"
                alt="A seller preparing a package for cross-border shipment"
                className="mt-8 w-full rounded-2xl object-cover"
                loading="lazy"
              />
            </div>

            {features.slice(1).map((f) => (
              <div key={f.title} className="rounded-3xl border border-[var(--sand-border)] bg-[var(--sand)] p-7">
                <h3 className="text-xl">{f.title}</h3>
                <p className="mt-3 text-sm text-[var(--ink-muted)]">{f.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Live example / receipt */}
      <section className="bg-[var(--sand)] py-24">
        <div className="container-page grid items-center gap-14 lg:grid-cols-2">
          <div>
            <h2 className="text-3xl sm:text-4xl">One trade, worked through end to end</h2>
            <p className="mt-5 text-[var(--ink-muted)]">
              A buyer in Ghana wants ₦150,000 worth of fabric from a seller in
              Nigeria. Here's what each side sees.
            </p>
            <img
              src="https://picsum.photos/seed/tradebridge-market/720/440"
              alt="Fabric market stall, representing the seller's goods"
              className="mt-8 w-full rounded-2xl object-cover"
              loading="lazy"
            />
          </div>

          <div className="rounded-3xl bg-[var(--paper)] p-8 shadow-[0_20px_50px_-25px_rgba(16,32,59,0.35)]">
            <p className="text-sm text-[var(--ink-muted)]">Receipt — Order #TB-2291</p>
            <div className="ticket-divider my-5" />
            <dl className="space-y-4 text-sm">
              <div className="flex items-center justify-between">
                <dt className="text-[var(--ink-muted)]">Item</dt>
                <dd className="font-medium">40 yards Ankara fabric</dd>
              </div>
              <div className="flex items-center justify-between">
                <dt className="text-[var(--ink-muted)]">Seller</dt>
                <dd className="font-medium">Verified · Lagos, Nigeria</dd>
              </div>
              <div className="flex items-center justify-between">
                <dt className="text-[var(--ink-muted)]">Price set by seller</dt>
                <dd className="tnum font-medium">₦150,000</dd>
              </div>
              <div className="flex items-center justify-between">
                <dt className="text-[var(--ink-muted)]">Buyer pays</dt>
                <dd className="tnum font-medium">GH₵ 6,180</dd>
              </div>
              <div className="flex items-center justify-between">
                <dt className="text-[var(--ink-muted)]">Protection</dt>
                <dd className="font-medium text-[var(--leaf)]">Held until confirmed</dd>
              </div>
            </dl>
            <div className="ticket-divider my-5" />
            <p className="text-sm text-[var(--ink-muted)]">
              The seller ships and uploads proof. The buyer tracks the order and
              confirms on arrival — or opens a dispute, with the evidence already
              attached.
            </p>
          </div>
        </div>
      </section>

      {/* For sellers */}
      <section id="sellers" className="bg-[var(--ink)] py-24 text-[var(--paper)]">
        <div className="container-page grid items-center gap-14 lg:grid-cols-2">
          <img
            src="https://picsum.photos/seed/tradebridge-seller/720/520"
            alt="A small business owner packing goods for shipment"
            className="w-full rounded-3xl object-cover order-2 lg:order-1"
            loading="lazy"
          />
          <div className="order-1 lg:order-2">
            <h2 className="text-3xl sm:text-4xl">Sell past your own border, without the risk of not getting paid</h2>
            <p className="mt-5 max-w-md text-[var(--paper-muted)]">
              Every completed order adds to a reputation buyers can actually see.
              You know your earnings in naira, cedis, or shillings before you ship
              — and you get paid once the buyer confirms.
            </p>
            <ul className="mt-8 space-y-4 text-sm">
              <li className="flex items-start gap-3">
                <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-[var(--marigold)]" />
                Reputation built from completed, evidenced transactions
              </li>
              <li className="flex items-start gap-3">
                <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-[var(--marigold)]" />
                Earnings shown in your own currency from the moment an order is placed
              </li>
              <li className="flex items-start gap-3">
                <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-[var(--marigold)]" />
                Payment released once the transaction is confirmed complete
              </li>
            </ul>
            <a href="/get-started" className="btn btn-primary mt-9">Start selling</a>
          </div>
        </div>
      </section>

      {/* Countries strip */}
      <section id="countries" className="overflow-hidden border-y border-[var(--sand-border)] bg-[var(--paper)] py-10">
        <p className="container-page mb-6 text-sm text-[var(--ink-muted)]">
          Pay and get paid in the currency you already use
        </p>
        <div className="marquee-track">
          {[...currencies, ...currencies].map((c, i) => (
            <span
              key={i}
              className="tnum mx-4 shrink-0 rounded-full border border-[var(--sand-border)] px-5 py-2 text-sm font-medium"
            >
              {c}
            </span>
          ))}
        </div>
      </section>

      {/* Testimonials */}
      <section className="bg-[var(--paper)] py-24">
        <div className="container-page">
          <h2 className="max-w-lg text-3xl sm:text-4xl">Trades people actually finish</h2>
          <div className="mt-12 grid gap-6 md:grid-cols-2">
            <figure className="rounded-3xl bg-[var(--sand)] p-8">
              <img
                src="https://picsum.photos/seed/tradebridge-testimonial1/64/64"
                alt=""
                className="h-12 w-12 rounded-full object-cover"
              />
              <blockquote className="mt-6 text-lg leading-relaxed">
                I used to ask cousins to carry cash across the border for me.
                Now I just send the payment and watch the order move.
              </blockquote>
              <figcaption className="mt-5 text-sm text-[var(--ink-muted)]">
                Adaeze O., buyer in Accra
              </figcaption>
            </figure>
            <figure className="rounded-3xl bg-[var(--sand)] p-8">
              <img
                src="https://picsum.photos/seed/tradebridge-testimonial2/64/64"
                alt=""
                className="h-12 w-12 rounded-full object-cover"
              />
              <blockquote className="mt-6 text-lg leading-relaxed">
                Buyers outside Kenya used to disappear after I shipped. Now the
                payment is already held before I send anything.
              </blockquote>
              <figcaption className="mt-5 text-sm text-[var(--ink-muted)]">
                Brian K., seller in Nairobi
              </figcaption>
            </figure>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section id="get-started" className="bg-[var(--ink)] py-24 text-[var(--paper)]">
        <div className="container-page text-center">
          <h2 className="mx-auto max-w-xl text-3xl sm:text-4xl">
            Your next trade doesn't have to be a leap of faith.
          </h2>
          <p className="mx-auto mt-5 max-w-md text-[var(--paper-muted)]">
            Set up a free account and make your first protected cross-border
            trade today.
          </p>
          <div className="mt-9 flex flex-wrap items-center justify-center gap-4">
            <a href="#" className="btn btn-primary">Create a free account</a>
            <a href="#" className="btn btn-outline">Talk to us</a>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-[var(--sand)] py-14">
        <div className="container-page flex flex-col gap-8 md:flex-row md:items-start md:justify-between">
          <div>
            <span className="text-lg" style={{ fontFamily: "var(--font-heading)" }}>TradeBridge</span>
            <p className="mt-3 max-w-xs text-sm text-[var(--ink-muted)]">
              The trust layer for buying and selling across African borders.
            </p>
          </div>
          <div className="grid grid-cols-2 gap-10 text-sm sm:grid-cols-3">
            <div>
              <p className="font-semibold">Product</p>
              <ul className="mt-3 space-y-2 text-[var(--ink-muted)]">
                <li><a href="#how-it-works" className="hover:text-[var(--ink)]">How it works</a></li>
                <li><a href="#trust" className="hover:text-[var(--ink)]">Trust &amp; protection</a></li>
                <li><a href="#countries" className="hover:text-[var(--ink)]">Countries</a></li>
              </ul>
            </div>
            <div>
              <p className="font-semibold">Company</p>
              <ul className="mt-3 space-y-2 text-[var(--ink-muted)]">
                <li><a href="#" className="hover:text-[var(--ink)]">About</a></li>
                <li><a href="#" className="hover:text-[var(--ink)]">Careers</a></li>
              </ul>
            </div>
            <div>
              <p className="font-semibold">Support</p>
              <ul className="mt-3 space-y-2 text-[var(--ink-muted)]">
                <li><a href="#" className="hover:text-[var(--ink)]">Help center</a></li>
                <li><a href="#" className="hover:text-[var(--ink)]">Open a dispute</a></li>
              </ul>
            </div>
          </div>
        </div>
        <p className="container-page mt-12 text-xs text-[var(--ink-muted)]">
          © {new Date().getFullYear()} TradeBridge. All rights reserved.
        </p>
      </footer>
    </main>
  );
}