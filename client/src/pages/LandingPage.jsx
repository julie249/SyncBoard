import React from 'react';
import { Link } from 'react-router-dom';
import {
  Layers,
  Zap,
  Users,
  ShieldCheck,
  Calendar,
  CheckCircle,
  ArrowRight,
  Kanban
} from 'lucide-react';
import { Button } from '../components/common/Button';

export const LandingPage = () => {
  return (
    <div className="min-h-screen bg-slate-900 text-white selection:bg-indigo-500 selection:text-white">
      {/* Navbar */}
      <header className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-500 to-violet-500 flex items-center justify-center text-white shadow-lg shadow-indigo-500/30">
            <Layers className="w-5 h-5" />
          </div>
          <span className="text-xl font-bold tracking-tight">SyncBoard</span>
        </div>

        <div className="flex items-center gap-3">
          <Link to="/login">
            <Button variant="ghost" className="text-slate-300 hover:text-white hover:bg-slate-800">
              Sign In
            </Button>
          </Link>
          <Link to="/register">
            <Button>Get Started Free</Button>
          </Link>
        </div>
      </header>

      {/* Hero Section */}
      <section className="max-w-5xl mx-auto px-6 pt-16 pb-20 text-center space-y-6">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-indigo-950/80 border border-indigo-800 text-indigo-300 text-xs font-semibold">
          <Zap className="w-3.5 h-3.5 text-indigo-400" />
          Real-Time Collaboration Engine v2.0
        </div>

        <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight leading-tight sm:leading-none">
          Organize teams, assign tasks, and{' '}
          <span className="bg-gradient-to-r from-indigo-400 via-violet-400 to-pink-400 bg-clip-text text-transparent">
            sync in real time.
          </span>
        </h1>

        <p className="max-w-2xl mx-auto text-base sm:text-lg text-slate-400 leading-relaxed">
          SyncBoard empowers product teams, software engineers, and modern creators to organize workspaces, drag-and-drop tasks, collaborate through live updates, and track milestones effortlessly.
        </p>

        <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-4">
          <Link to="/register">
            <Button size="lg" className="w-full sm:w-auto text-base px-6 py-3 font-semibold">
              Start Free Today
              <ArrowRight className="w-4 h-4 ml-1" />
            </Button>
          </Link>
          <Link to="/login">
            <Button
              variant="outline"
              size="lg"
              className="w-full sm:w-auto text-base px-6 py-3 border-slate-700 text-slate-300 hover:bg-slate-800"
            >
              Sign In with Demo Accounts
            </Button>
          </Link>
        </div>

        {/* Demo Accounts Pill */}
        <div className="pt-8">
          <div className="max-w-xl mx-auto p-4 rounded-2xl bg-slate-800/60 border border-slate-700/80 text-left text-xs text-slate-300 space-y-1">
            <p className="font-semibold text-slate-200 mb-2">⚡ Quick Demo Credentials Included:</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px] text-slate-400">
              <div>
                <span className="text-indigo-400 font-medium">Admin:</span> admin@syncboard.dev
              </div>
              <div>
                <span className="text-indigo-400 font-medium">Password:</span> Password123!
              </div>
              <div>
                <span className="text-indigo-400 font-medium">Member:</span> alex@syncboard.dev
              </div>
              <div>
                <span className="text-indigo-400 font-medium">Password:</span> Password123!
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Feature Grid */}
      <section className="max-w-7xl mx-auto px-6 py-16 border-t border-slate-800">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="p-6 rounded-2xl bg-slate-800/40 border border-slate-700/60 space-y-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-600/20 text-indigo-400 flex items-center justify-center">
              <Kanban className="w-5 h-5" />
            </div>
            <h3 className="text-lg font-bold text-white">Fluid Kanban Boards</h3>
            <p className="text-sm text-slate-400 leading-relaxed">
              Drag-and-drop task cards with dnd-kit. Set priorities, due dates, custom tags, and checklist progress.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-slate-800/40 border border-slate-700/60 space-y-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-600/20 text-emerald-400 flex items-center justify-center">
              <Zap className="w-5 h-5" />
            </div>
            <h3 className="text-lg font-bold text-white">Live Socket.IO Sync</h3>
            <p className="text-sm text-slate-400 leading-relaxed">
              Changes propagate instantly across teammates. When someone moves a card or writes a comment, you see it live.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-slate-800/40 border border-slate-700/60 space-y-3">
            <div className="w-10 h-10 rounded-xl bg-violet-600/20 text-violet-400 flex items-center justify-center">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <h3 className="text-lg font-bold text-white">Workspaces & Security</h3>
            <p className="text-sm text-slate-400 leading-relaxed">
              Strict role-based access control (Admin / Member). Isolated data per workspace with JWT security.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
};
