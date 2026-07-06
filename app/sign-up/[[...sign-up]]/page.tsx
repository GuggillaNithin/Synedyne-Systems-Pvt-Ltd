"use client";

import { SignUp } from "@clerk/nextjs";

export default function SignUpPage() {
  return (
    <div className="h-screen overflow-hidden grid lg:grid-cols-[55%_45%]">
      <section className="flex items-center justify-center bg-[#0A2540] px-8 py-10 text-white sm:px-10 lg:px-14">
        <div className="w-full max-w-[600px] space-y-8">
          <span className="inline-flex items-center rounded-full border border-white/15 bg-white/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.24em] text-slate-200">
            Join Synedyne Systems
          </span>

          <div className="space-y-4">
            <h1 className="text-4xl font-semibold leading-tight sm:text-5xl lg:text-[3.4rem]">
              Create your account and accelerate manufacturing execution.
            </h1>
            <p className="max-w-xl text-base leading-8 text-slate-300 sm:text-lg">
              Bring your team onto a premium ERP workspace designed for operations, planning, finance, and delivery.
            </p>
          </div>

          <div className="grid gap-4">
            <div className="rounded-2xl border border-white/10 bg-white/8 p-5 backdrop-blur-sm">
              <h2 className="text-sm font-semibold text-white">Modern workflow orchestration</h2>
              <p className="mt-2 text-sm leading-6 text-slate-300">
                Coordinate production and dispatch from one intelligent operating system.
              </p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/8 p-5 backdrop-blur-sm">
              <h2 className="text-sm font-semibold text-white">Secure collaboration</h2>
              <p className="mt-2 text-sm leading-6 text-slate-300">
                Clerk authentication keeps your team secure while offering a polished sign-up flow.
              </p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/8 p-5 backdrop-blur-sm">
              <h2 className="text-sm font-semibold text-white">Built to scale</h2>
              <p className="mt-2 text-sm leading-6 text-slate-300">
                Add users and processes as your manufacturing footprint grows.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="flex items-center justify-center bg-white px-4 py-8 sm:px-6 lg:px-8">
        <SignUp path="/sign-up" routing="path" signInUrl="/sign-in" forceRedirectUrl="/dashboard" />
      </section>
    </div>
  );
}
