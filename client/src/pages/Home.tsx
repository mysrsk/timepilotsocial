import { startLogin } from "@/const";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import {
  ArrowRight,
  CalendarClock,
  Check,
  Clock3,
  Globe2,
  Layers3,
  ShieldCheck,
  Sparkles,
} from "lucide-react";

const meshImage = "/manus-storage/timepilot-violet-mesh_f2b7bdb2.jpg";
const workflowSteps: Array<{ icon: typeof Layers3; title: string; text: string }> = [
  { icon: Layers3, title: "Compose once", text: "Write rich content, bring media with you, and see each destination before it goes live." },
  { icon: Globe2, title: "Set the moment", text: "Choose a city, not an offset. TimePilot resolves the exact publishing instant for you." },
  { icon: CalendarClock, title: "Publish with confidence", text: "Your queue, outcomes, and notifications remain organized in one composed workspace." },
];

function Wordmark({ light = false }: { light?: boolean }) {
  return (
    <div className={`flex items-center gap-2.5 font-semibold tracking-[-0.04em] ${light ? "text-white" : "text-[#18132d]"}`}>
      <span className="grid size-8 place-items-center rounded-xl bg-gradient-to-br from-[#7467f7] to-[#b679f4] text-white shadow-[0_8px_18px_rgba(104,82,225,0.28)]">
        <Clock3 className="size-4" strokeWidth={2.4} />
      </span>
      <span className="text-[18px]">timepilot</span>
    </div>
  );
}

export default function Home() {
  return (
    <div className="min-h-screen overflow-hidden bg-[#fbfaff] text-[#201a35]">
      <header className="relative z-20 mx-auto flex h-20 max-w-[1220px] items-center justify-between px-5 lg:px-8">
        <Wordmark />
        <nav className="hidden items-center gap-7 text-sm font-medium text-[#625d73] md:flex">
          <a href="#workflow" className="transition-colors hover:text-[#4d3bd4]">Workflow</a>
          <a href="#timezones" className="transition-colors hover:text-[#4d3bd4]">Time zones</a>
          <a href="#platforms" className="transition-colors hover:text-[#4d3bd4]">Platforms</a>
        </nav>
        <div className="flex items-center gap-2.5">
          <Button variant="ghost" onClick={() => startLogin()} className="hidden text-[#514b63] sm:inline-flex">Sign in</Button>
          <Button onClick={() => startLogin()} className="rounded-xl bg-[#5c4ee5] px-4 text-white shadow-[0_9px_18px_rgba(92,78,229,0.22)] hover:bg-[#4e40d8]">Start scheduling <ArrowRight className="ml-1 size-4" /></Button>
        </div>
      </header>

      <main>
        <section className="relative mx-auto max-w-[1220px] px-5 pb-20 pt-12 lg:px-8 lg:pb-28 lg:pt-20">
          <div className="absolute right-[-190px] top-[-220px] h-[720px] w-[720px] rounded-full bg-[#e9e5ff] blur-3xl" />
          <div className="relative grid items-center gap-14 lg:grid-cols-[0.92fr_1.08fr]">
            <div className="max-w-[600px]">
              <div className="mb-7 inline-flex items-center gap-2 rounded-full border border-[#e7e2ff] bg-white/80 px-3 py-1.5 text-xs font-semibold text-[#5f52d9] shadow-sm backdrop-blur">
                <Sparkles className="size-3.5" /> A calmer way to publish globally
              </div>
              <h1 className="max-w-[580px] font-display text-[46px] font-semibold leading-[1.03] tracking-[-0.065em] text-[#211a38] sm:text-[62px] lg:text-[68px]">
                Your content,
                <span className="block bg-gradient-to-r from-[#6054e7] via-[#7f65ec] to-[#b06ee9] bg-clip-text text-transparent">right on time.</span>
              </h1>
              <p className="mt-7 max-w-[510px] text-[17px] leading-7 text-[#696377]">
                A focused scheduling studio for teams that publish everywhere, while thinking in the local time of every audience.
              </p>
              <div className="mt-9 flex flex-col gap-3 sm:flex-row">
                <Button onClick={() => startLogin()} size="lg" className="h-12 rounded-xl bg-[#5c4ee5] px-5 text-[15px] text-white shadow-[0_12px_26px_rgba(92,78,229,0.26)] hover:bg-[#4e40d8]">Create your workspace <ArrowRight className="ml-1.5 size-4" /></Button>
                <Link href="/app"><Button size="lg" variant="outline" className="h-12 rounded-xl border-[#ded9eb] bg-white px-5 text-[15px] text-[#373044] shadow-sm hover:bg-[#f8f7fc]">Explore workspace</Button></Link>
              </div>
              <div className="mt-8 flex items-center gap-5 text-xs font-medium text-[#777083]">
                <span className="flex items-center gap-1.5"><Check className="size-3.5 text-[#6859e8]" /> Native connections</span>
                <span className="flex items-center gap-1.5"><Check className="size-3.5 text-[#6859e8]" /> DST handled</span>
                <span className="flex items-center gap-1.5"><Check className="size-3.5 text-[#6859e8]" /> Team-ready</span>
              </div>
            </div>

            <div className="relative mx-auto w-full max-w-[650px] lg:ml-auto">
              <div className="absolute -inset-7 rounded-[36px] bg-[#a99fff]/20 blur-2xl" />
              <div className="relative overflow-hidden rounded-[28px] border border-white/30 bg-[#1f1934] p-2 shadow-[0_36px_70px_rgba(43,28,90,0.25)]">
                <img src={meshImage} alt="" className="absolute inset-0 h-full w-full object-cover opacity-35 mix-blend-screen" />
                <div className="relative overflow-hidden rounded-[21px] border border-white/10 bg-[#25203b]/90 p-4 sm:p-5">
                  <div className="mb-5 flex items-center justify-between">
                    <Wordmark light />
                    <div className="rounded-lg bg-white/10 px-2.5 py-1 text-[11px] font-medium text-white/80">Tuesday, August 13</div>
                  </div>
                  <div className="grid gap-3 sm:grid-cols-[0.88fr_1.12fr]">
                    <div className="rounded-2xl border border-white/10 bg-[#30294b]/80 p-4">
                      <p className="text-[11px] font-semibold uppercase tracking-[0.15em] text-white/45">Local now</p>
                      <div className="mt-3 flex items-end justify-between"><p className="font-display text-3xl tracking-[-0.06em] text-white">08:42</p><span className="mb-1 text-xs text-[#c7beff]">EDT</span></div>
                      <div className="mt-5 space-y-3 text-xs">
                        <div className="flex items-center justify-between text-white/65"><span>Los Angeles</span><span>05:42 PDT</span></div>
                        <div className="flex items-center justify-between text-white/65"><span>London</span><span>13:42 BST</span></div>
                        <div className="flex items-center justify-between text-white/65"><span>Tokyo</span><span>21:42 JST</span></div>
                      </div>
                    </div>
                    <div className="rounded-2xl border border-white/10 bg-white p-4 text-[#28213f]">
                      <div className="flex items-center justify-between"><span className="text-xs font-semibold">Scheduled next</span><span className="rounded-full bg-[#f0edff] px-2 py-1 text-[10px] font-bold text-[#6252e3]">3 channels</span></div>
                      <p className="mt-4 text-sm leading-5 text-[#4e4760]">A quiet system is the best productivity upgrade a content team can make.</p>
                      <div className="mt-5 flex items-center justify-between border-t border-[#eeeaf5] pt-3"><div className="flex -space-x-1.5"><span className="grid size-6 place-items-center rounded-full border-2 border-white bg-[#1b1b1b] text-[9px] font-bold text-white">X</span><span className="grid size-6 place-items-center rounded-full border-2 border-white bg-[#e1559d] text-[9px] font-bold text-white">IG</span><span className="grid size-6 place-items-center rounded-full border-2 border-white bg-[#1767b1] text-[9px] font-bold text-white">in</span></div><span className="text-[11px] font-semibold text-[#746c86]">09:00 · New York</span></div>
                    </div>
                  </div>
                  <div className="mt-3 rounded-2xl border border-white/10 bg-[#30294b]/75 p-4"><div className="flex items-center gap-3"><span className="grid size-9 place-items-center rounded-xl bg-[#6c5ce7] text-white"><Globe2 className="size-4" /></span><div><p className="text-xs font-semibold text-white">Daylight saving, resolved</p><p className="mt-0.5 text-[11px] text-white/55">Times stay correct across every IANA time zone.</p></div><span className="ml-auto rounded-full bg-[#85d9c3]/15 px-2.5 py-1 text-[10px] font-bold text-[#9ce7d4]">AUTOMATIC</span></div></div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section id="workflow" className="border-y border-[#eeeaf5] bg-white py-20">
          <div className="mx-auto max-w-[1120px] px-5 lg:px-8">
            <div className="max-w-[560px]"><p className="text-xs font-bold uppercase tracking-[0.18em] text-[#6b5de7]">The publishing ritual</p><h2 className="mt-4 font-display text-4xl font-semibold tracking-[-0.055em] text-[#261f3a]">One clear flow from thought to audience.</h2></div>
            <div className="mt-12 grid gap-4 md:grid-cols-3">
              {workflowSteps.map(({ icon: Icon, title, text }, index) => (
                <article key={title} className="group rounded-2xl border border-[#ebe7f3] bg-[#fdfcff] p-6 transition-all hover:-translate-y-1 hover:border-[#d9d3ff] hover:shadow-[0_16px_30px_rgba(67,52,125,0.08)]">
                  <div className="grid size-10 place-items-center rounded-xl bg-[#efedff] text-[#6253df]"><Icon className="size-5" /></div>
                  <p className="mt-7 text-xs font-bold uppercase tracking-[0.17em] text-[#9b94a9]">0{index + 1}</p><h3 className="mt-2 text-lg font-semibold tracking-[-0.03em] text-[#312a42]">{title}</h3><p className="mt-3 text-sm leading-6 text-[#746e80]">{text}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section id="timezones" className="mx-auto max-w-[1120px] px-5 py-20 lg:px-8"><div className="grid gap-12 lg:grid-cols-[1fr_0.9fr]"><div><p className="text-xs font-bold uppercase tracking-[0.18em] text-[#6b5de7]">A global clock, without the math</p><h2 className="mt-4 font-display text-4xl font-semibold tracking-[-0.055em] text-[#261f3a]">Work in local time. Keep the promise in UTC.</h2><p className="mt-5 max-w-[530px] text-[16px] leading-7 text-[#746e80]">Every scheduled moment is preserved with its original IANA time-zone intent, then resolved to UTC for reliable publishing. When daylight saving shifts, your plan stays human.</p><div className="mt-7 grid grid-cols-2 gap-x-7 gap-y-4 text-sm text-[#5f586e]"><span className="flex items-center gap-2"><ShieldCheck className="size-4 text-[#6253df]" /> Eastern through Hawaii</span><span className="flex items-center gap-2"><ShieldCheck className="size-4 text-[#6253df]" /> All world time zones</span><span className="flex items-center gap-2"><ShieldCheck className="size-4 text-[#6253df]" /> DST gap protection</span><span className="flex items-center gap-2"><ShieldCheck className="size-4 text-[#6253df]" /> Auditable UTC record</span></div></div><div className="rounded-[26px] border border-[#e4dff1] bg-[#f4f1ff] p-5 shadow-[0_14px_34px_rgba(86,69,144,0.08)]"><div className="rounded-2xl bg-white p-5 shadow-sm"><div className="flex items-center justify-between"><span className="text-sm font-semibold">Schedule at a glance</span><span className="text-xs text-[#706882]">Global launch</span></div><div className="mt-6 space-y-4">{[["New York", "09:00 EDT", "13:00 UTC"], ["Chicago", "08:00 CDT", "13:00 UTC"], ["Los Angeles", "06:00 PDT", "13:00 UTC"], ["Honolulu", "03:00 HST", "13:00 UTC"]].map(([city, local, utc]) => <div className="flex items-center justify-between border-b border-[#f0edf5] pb-3 text-sm last:border-0 last:pb-0" key={city}><span className="font-medium text-[#3f3850]">{city}</span><span className="text-[#716b7c]">{local}</span><span className="rounded-md bg-[#f1effa] px-2 py-1 text-xs font-semibold text-[#5d50ce]">{utc}</span></div>)}</div></div></div></div></section>

        <section id="platforms" className="bg-[#211a37] py-20 text-white"><div className="mx-auto flex max-w-[1120px] flex-col items-start justify-between gap-8 px-5 lg:flex-row lg:items-end lg:px-8"><div className="max-w-[570px]"><p className="text-xs font-bold uppercase tracking-[0.18em] text-[#b8adff]">Native by design</p><h2 className="mt-4 font-display text-4xl font-semibold tracking-[-0.055em]">Build a publishing system your customers can trust.</h2><p className="mt-5 text-[16px] leading-7 text-white/65">Separate native connectors, encrypted token fields, isolated workspaces, and a subscription-ready foundation are built into the product architecture.</p></div><Button onClick={() => startLogin()} size="lg" className="h-12 rounded-xl bg-white px-5 text-[#35295b] hover:bg-[#f4f1ff]">Begin with TimePilot <ArrowRight className="ml-1.5 size-4" /></Button></div></section>
      </main>
      <footer className="bg-[#211a37] px-5 pb-8 lg:px-8"><div className="mx-auto flex max-w-[1120px] items-center justify-between border-t border-white/10 pt-7 text-xs text-white/45"><Wordmark light /><span>TimePilot Social · Built for clear, global publishing.</span></div></footer>
    </div>
  );
}
