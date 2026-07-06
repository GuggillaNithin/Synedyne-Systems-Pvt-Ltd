"use client";

import { SignIn } from "@clerk/nextjs";
import Image from "next/image";

export default function SignInPage() {
  return (
    <div className="h-screen overflow-hidden grid lg:grid-cols-[55%_45%]">
      <section className="flex items-center justify-center bg-[#0A2540] px-8 py-10 text-white sm:px-10 lg:px-14">
        <div className="w-full max-w-[600px] space-y-8">
          <div className="flex items-center gap-3">
            <Image src="/logo.png" alt="Synedyne logo" width={36} height={36} className="rounded-lg object-cover" />
            <span className="inline-flex items-center rounded-full border border-white/15 bg-white/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.24em] text-slate-200">
              Welcome to Synedyne Systems
            </span>
          </div>

          <div className="space-y-4">
            <h1 className="text-4xl font-semibold leading-tight sm:text-5xl lg:text-[2.4rem]">
              Run your manufacturing operations from one secure platform.
            </h1>
            <p className="max-w-xl text-base leading-8 text-slate-300 sm:text-lg">
              Synedyne Systems unifies orders, inventory, production, and revenue in a premium ERP experience built for modern teams.
            </p>
          </div>

          <div className="grid gap-4">
            <div className="rounded-2xl border border-white/10 bg-white/8 p-5 backdrop-blur-sm">
              <h2 className="text-sm font-semibold text-white">Enterprise-grade visibility</h2>
              <p className="mt-2 text-sm leading-6 text-slate-300">
                Track every order, material plan, and dispatch with clarity across the organization.
              </p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/8 p-5 backdrop-blur-sm">
              <h2 className="text-sm font-semibold text-white">Secure, frictionless access</h2>
              <p className="mt-2 text-sm leading-6 text-slate-300">
                Sign in with Clerk and move between ERP workflows with confidence and speed.
              </p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/8 p-5 backdrop-blur-sm">
              <h2 className="text-sm font-semibold text-white">Built for growth</h2>
              <p className="mt-2 text-sm leading-6 text-slate-300">
                Scale operations with workflows designed for finance, production, and customer delivery.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="flex items-center justify-center bg-white px-4 py-8 sm:px-6 lg:px-8">
        <SignIn
          path="/sign-in"
          routing="path"
          signUpUrl="/sign-up"
          forceRedirectUrl="/dashboard"
        />
      </section>
    </div>
  );
}
