'use client';

import React, { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import {
  AlertCircle,
  ArrowLeft,
  CheckCircle2,
  Clock,
  Copy,
  ExternalLink,
  Filter,
  LifeBuoy,
  RefreshCw,
  Search,
  ShieldAlert,
  UserCheck,
  XCircle,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';

interface Escalation {
  id: number;
  reference_id: string;
  user_id: string;
  customer_name: string;
  issue_type: 'PAYMENT_REFUND' | 'ORDER_DISPUTE' | 'OTHER_ESCALATION';
  issue_summary: string;
  verified_information?: string;
  urgency: 'LOW' | 'MEDIUM' | 'HIGH';
  language: string;
  preferred_followup_method: string;
  status: 'OPEN' | 'IN_PROGRESS' | 'RESOLVED' | 'CANCELLED';
  created_at: string;
  updated_at: string;
}

export default function SupportDashboardPage() {
  const [escalations, setEscalations] = useState<Escalation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [urgencyFilter] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedEscalation, setSelectedEscalation] = useState<Escalation | null>(null);
  const [copiedRef, setCopiedRef] = useState<string | null>(null);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const fetchEscalations = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (statusFilter !== 'ALL' && statusFilter !== 'HIGH_PRIORITY') {
        params.set('status', statusFilter);
      }
      if (statusFilter === 'HIGH_PRIORITY') {
        params.set('urgency', 'HIGH');
      } else if (urgencyFilter !== 'ALL') {
        params.set('urgency', urgencyFilter);
      }
      if (searchQuery.trim()) {
        params.set('search', searchQuery.trim());
      }

      const res = await fetch(`/api/escalations?${params.toString()}`);
      const data = await res.json();

      if (data.success) {
        setEscalations(data.escalations || []);
      } else {
        setError(data.error || 'Failed to load support requests');
      }
    } catch (err: unknown) {
      console.error('Error fetching escalations:', err);
      setError('Could not connect to support server');
    } finally {
      setLoading(false);
    }
  }, [statusFilter, urgencyFilter, searchQuery]);

  useEffect(() => {
    fetchEscalations();
  }, [fetchEscalations]);

  const handleUpdateStatus = async (referenceId: string, newStatus: string) => {
    setUpdatingId(referenceId);
    try {
      const res = await fetch(`/api/escalations/${referenceId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });
      const data = await res.json();
      if (data.success) {
        setEscalations((prev) =>
          prev.map((item) =>
            item.reference_id === referenceId
              ? {
                  ...item,
                  status: newStatus as Escalation['status'],
                  updated_at: new Date().toISOString(),
                }
              : item
          )
        );
        if (selectedEscalation?.reference_id === referenceId) {
          setSelectedEscalation((prev) =>
            prev ? { ...prev, status: newStatus as Escalation['status'] } : null
          );
        }
      }
    } catch (err) {
      console.error('Failed to update status:', err);
    } finally {
      setUpdatingId(null);
    }
  };

  const seedDemoData = async () => {
    setLoading(true);
    try {
      const testCases = [
        {
          user_id: 'cust_radhika',
          customer_name: 'Radhika Sharma',
          issue_type: 'PAYMENT_REFUND',
          issue_summary: 'Payment deducted ₹640 for 2 Basmati Rice packs but order status pending.',
          verified_information:
            'Order ORD_RADHIKA_101 created, UPI tx reference verified, status pending.',
          urgency: 'HIGH',
          language: 'Hindi',
          preferred_followup_method: 'Phone',
        },
        {
          user_id: 'cust_priya',
          customer_name: 'Priya Sharma',
          issue_type: 'ORDER_DISPUTE',
          issue_summary:
            'Ordered 2 units of Mustard Oil, but received only 1 unit in delivery bag.',
          verified_information:
            'Delivery receipt shows 2 items billed. Missing 1 unit of 1L Mustard Oil.',
          urgency: 'MEDIUM',
          language: 'Hinglish',
          preferred_followup_method: 'SMS',
        },
        {
          user_id: 'cust_anand',
          customer_name: 'Anand Verma',
          issue_type: 'ORDER_DISPUTE',
          issue_summary:
            'Damaged packaging for Aashirvaad Atta 5kg bag. Flour spilled during transit.',
          verified_information: 'Customer uploaded delivery outer bag damage image.',
          urgency: 'MEDIUM',
          language: 'English',
          preferred_followup_method: 'Phone',
        },
      ];

      for (const item of testCases) {
        await fetch('/api/escalations', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(item),
        });
      }
      await fetchEscalations();
    } catch (err) {
      console.error('Error seeding demo data:', err);
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedRef(text);
    setTimeout(() => setCopiedRef(null), 2000);
  };

  // Stats calculation
  const totalCount = escalations.length;
  const openCount = escalations.filter((e) => e.status === 'OPEN').length;
  const inProgressCount = escalations.filter((e) => e.status === 'IN_PROGRESS').length;
  const highPriorityCount = escalations.filter(
    (e) => e.urgency === 'HIGH' && (e.status === 'OPEN' || e.status === 'IN_PROGRESS')
  ).length;
  const resolvedCount = escalations.filter((e) => e.status === 'RESOLVED').length;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-50">
      {/* Top Navbar */}
      <header className="sticky top-0 z-40 border-b border-slate-800/80 bg-slate-950/80 backdrop-blur-md">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3">
            <Link
              href="/"
              className="inline-flex items-center gap-2 rounded-lg border border-slate-800 bg-slate-900 px-3 py-1.5 text-xs font-medium text-slate-300 transition-colors hover:border-slate-700 hover:bg-slate-800 hover:text-white"
            >
              <ArrowLeft className="size-4" />
              <span>Voice Assistant</span>
            </Link>
            <div className="h-5 w-px bg-slate-800" />
            <div className="flex items-center gap-2">
              <div className="flex size-9 items-center justify-center rounded-lg border border-emerald-500/30 bg-emerald-500/10 text-emerald-400">
                <LifeBuoy className="size-5" />
              </div>
              <div>
                <h1 className="text-base font-bold tracking-tight text-white sm:text-lg">
                  LOCAL COMMERCE SUPPORT CENTER
                </h1>
                <p className="text-xs text-slate-400">Human Support Escalation Management System</p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={fetchEscalations}
              disabled={loading}
              className="border-slate-800 bg-slate-900 text-xs font-semibold text-slate-300 hover:bg-slate-800 hover:text-white"
            >
              <RefreshCw className={`mr-1.5 size-3.5 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
            {totalCount === 0 && !loading && (
              <Button
                size="sm"
                onClick={seedDemoData}
                className="bg-emerald-600 text-xs font-semibold text-white hover:bg-emerald-500"
              >
                Seed Test Data
              </Button>
            )}
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Metric Cards */}
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-5">
          <Card className="border-slate-800/80 bg-slate-900/60 shadow-lg backdrop-blur-sm">
            <CardContent className="p-4">
              <div className="text-xs font-medium text-slate-400">Total Escalations</div>
              <div className="mt-1 text-2xl font-extrabold text-white">{totalCount}</div>
            </CardContent>
          </Card>

          <Card className="border-emerald-500/20 bg-emerald-950/20 shadow-lg backdrop-blur-sm">
            <CardContent className="p-4">
              <div className="flex items-center justify-between text-xs font-medium text-emerald-400">
                <span>Open Requests</span>
                <span className="size-2 animate-pulse rounded-full bg-emerald-400" />
              </div>
              <div className="mt-1 text-2xl font-extrabold text-emerald-300">{openCount}</div>
            </CardContent>
          </Card>

          <Card className="border-blue-500/20 bg-blue-950/20 shadow-lg backdrop-blur-sm">
            <CardContent className="p-4">
              <div className="text-xs font-medium text-blue-400">In Progress</div>
              <div className="mt-1 text-2xl font-extrabold text-blue-300">{inProgressCount}</div>
            </CardContent>
          </Card>

          <Card className="border-rose-500/30 bg-rose-950/20 shadow-lg backdrop-blur-sm">
            <CardContent className="p-4">
              <div className="flex items-center justify-between text-xs font-medium text-rose-400">
                <span>High Priority</span>
                <ShieldAlert className="size-4 animate-bounce text-rose-400" />
              </div>
              <div className="mt-1 text-2xl font-extrabold text-rose-300">{highPriorityCount}</div>
            </CardContent>
          </Card>

          <Card className="border-slate-800/80 bg-slate-900/60 shadow-lg backdrop-blur-sm">
            <CardContent className="p-4">
              <div className="text-xs font-medium text-slate-400">Resolved</div>
              <div className="mt-1 text-2xl font-extrabold text-slate-300">{resolvedCount}</div>
            </CardContent>
          </Card>
        </div>

        {/* Filter Controls & Search */}
        <div className="mt-8 flex flex-col gap-4 rounded-xl border border-slate-800 bg-slate-900/40 p-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="relative max-w-md flex-1">
            <Search className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-slate-400" />
            <Input
              placeholder="Search Reference ID, Customer Name, or Issue..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="border-slate-800 bg-slate-950/80 pl-9 text-xs text-white placeholder:text-slate-500 focus-visible:ring-emerald-500"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <span className="flex items-center gap-1 text-xs font-semibold text-slate-400">
              <Filter className="size-3.5" /> Filter Status:
            </span>
            {[
              { id: 'ALL', label: 'All' },
              { id: 'OPEN', label: 'Open' },
              { id: 'IN_PROGRESS', label: 'In Progress' },
              { id: 'RESOLVED', label: 'Resolved' },
              { id: 'CANCELLED', label: 'Cancelled' },
              { id: 'HIGH_PRIORITY', label: 'High Priority' },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setStatusFilter(tab.id)}
                className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-all ${
                  statusFilter === tab.id
                    ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/20'
                    : 'bg-slate-900 text-slate-400 hover:bg-slate-800 hover:text-slate-200'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Error State */}
        {error && (
          <div className="mt-6 flex items-center gap-3 rounded-xl border border-rose-500/30 bg-rose-950/30 p-4 text-xs font-medium text-rose-300">
            <AlertCircle className="size-5 shrink-0 text-rose-400" />
            <div className="flex-1">{error}</div>
            <Button
              size="sm"
              variant="outline"
              onClick={fetchEscalations}
              className="border-rose-500/40 text-rose-300"
            >
              Retry
            </Button>
          </div>
        )}

        {/* Loading Skeleton */}
        {loading && (
          <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="h-56 animate-pulse rounded-xl border border-slate-800 bg-slate-900/40 p-5"
              />
            ))}
          </div>
        )}

        {/* Empty State */}
        {!loading && !error && escalations.length === 0 && (
          <div className="mt-12 flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-800 p-12 text-center">
            <div className="flex size-16 items-center justify-center rounded-full border border-slate-800 bg-slate-900 text-slate-400">
              <LifeBuoy className="size-8" />
            </div>
            <h3 className="mt-4 text-lg font-bold text-white">No Human Support Escalations</h3>
            <p className="mt-1 max-w-sm text-xs leading-relaxed text-slate-400">
              No escalations match your filter criteria. Place a voice request reporting a payment
              or order dispute to test real-time escalation.
            </p>
            <Button
              onClick={seedDemoData}
              className="mt-6 rounded-lg bg-emerald-600 px-6 text-xs font-semibold text-white shadow-lg hover:bg-emerald-500"
            >
              Seed Demo Escalations
            </Button>
          </div>
        )}

        {/* Escalation Cards Grid */}
        {!loading && !error && escalations.length > 0 && (
          <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {escalations.map((esc) => {
              const isHigh = esc.urgency === 'HIGH';
              const isOpen = esc.status === 'OPEN';
              const isInProgress = esc.status === 'IN_PROGRESS';
              const isResolved = esc.status === 'RESOLVED';

              return (
                <Card
                  key={esc.reference_id}
                  className={`relative flex flex-col justify-between overflow-hidden border bg-slate-900/60 shadow-xl transition-all duration-200 hover:border-slate-700 ${
                    isHigh && isOpen
                      ? 'border-rose-500/40 ring-1 ring-rose-500/20'
                      : 'border-slate-800'
                  }`}
                >
                  <CardHeader className="p-4 pb-2">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-sm font-extrabold tracking-wider text-emerald-400">
                            {esc.reference_id}
                          </span>
                          <button
                            onClick={() => copyToClipboard(esc.reference_id)}
                            className="text-slate-500 transition-colors hover:text-slate-300"
                            title="Copy Reference ID"
                          >
                            {copiedRef === esc.reference_id ? (
                              <CheckCircle2 className="size-3.5 text-emerald-400" />
                            ) : (
                              <Copy className="size-3.5" />
                            )}
                          </button>
                        </div>
                        <CardTitle className="mt-1 text-sm font-bold text-white">
                          {esc.customer_name}
                        </CardTitle>
                      </div>

                      {/* Urgency Badge */}
                      <Badge
                        className={`text-[10px] font-bold tracking-wider uppercase ${
                          esc.urgency === 'HIGH'
                            ? 'border-rose-500/30 bg-rose-500/10 text-rose-400'
                            : esc.urgency === 'MEDIUM'
                              ? 'border-amber-500/30 bg-amber-500/10 text-amber-400'
                              : 'border-blue-500/30 bg-blue-500/10 text-blue-400'
                        }`}
                      >
                        {esc.urgency} Urgency
                      </Badge>
                    </div>

                    <CardDescription className="mt-1 flex items-center gap-2 text-xs font-semibold text-slate-400">
                      <span className="rounded-md border border-slate-800 bg-slate-950 px-2 py-0.5 text-[11px] font-medium text-slate-300">
                        {esc.issue_type === 'PAYMENT_REFUND'
                          ? '💳 Payment / Refund'
                          : esc.issue_type === 'ORDER_DISPUTE'
                            ? '📦 Order Dispute'
                            : '❓ General Issue'}
                      </span>
                      <span>•</span>
                      <span>{esc.language}</span>
                    </CardDescription>
                  </CardHeader>

                  <CardContent className="flex-1 p-4 pt-2">
                    <div className="rounded-lg border border-slate-800/80 bg-slate-950/70 p-3 text-xs leading-relaxed text-slate-300">
                      <p className="font-semibold text-slate-200">Summary:</p>
                      <p className="mt-0.5 line-clamp-3 text-slate-300">{esc.issue_summary}</p>

                      {esc.verified_information && (
                        <div className="mt-2.5 border-t border-slate-800/80 pt-2 text-[11px]">
                          <span className="font-semibold text-emerald-400">Verified Info: </span>
                          <span className="text-slate-400">{esc.verified_information}</span>
                        </div>
                      )}
                    </div>

                    <div className="mt-3 flex items-center justify-between text-[11px] text-slate-400">
                      <div className="flex items-center gap-1.5">
                        <Clock className="size-3 text-slate-500" />
                        <span>
                          {new Date(esc.created_at).toLocaleTimeString([], {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5 font-medium text-slate-300">
                        <UserCheck className="size-3 text-slate-500" />
                        <span>Follow-up: {esc.preferred_followup_method}</span>
                      </div>
                    </div>
                  </CardContent>

                  {/* Card Footer Actions */}
                  <div className="flex items-center justify-between border-t border-slate-800/80 bg-slate-950/40 p-3">
                    <div className="flex items-center gap-1.5">
                      <Badge
                        variant="outline"
                        className={`text-[10px] font-bold ${
                          isOpen
                            ? 'border-emerald-500/40 bg-emerald-500/10 text-emerald-400'
                            : isInProgress
                              ? 'border-blue-500/40 bg-blue-500/10 text-blue-400'
                              : isResolved
                                ? 'border-slate-700 bg-slate-800 text-slate-300'
                                : 'border-rose-500/30 bg-rose-500/10 text-rose-400'
                        }`}
                      >
                        {esc.status.replace('_', ' ')}
                      </Badge>
                    </div>

                    <div className="flex items-center gap-1">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => setSelectedEscalation(esc)}
                        className="h-7 px-2 text-[11px] text-slate-300 hover:bg-slate-800 hover:text-white"
                      >
                        <ExternalLink className="mr-1 size-3" /> View
                      </Button>

                      {isOpen && (
                        <Button
                          size="sm"
                          disabled={updatingId === esc.reference_id}
                          onClick={() => handleUpdateStatus(esc.reference_id, 'IN_PROGRESS')}
                          className="h-7 rounded bg-blue-600 px-2.5 text-[11px] font-semibold text-white hover:bg-blue-500"
                        >
                          In Progress
                        </Button>
                      )}

                      {(isOpen || isInProgress) && (
                        <Button
                          size="sm"
                          disabled={updatingId === esc.reference_id}
                          onClick={() => handleUpdateStatus(esc.reference_id, 'RESOLVED')}
                          className="h-7 rounded bg-emerald-600 px-2.5 text-[11px] font-semibold text-white hover:bg-emerald-500"
                        >
                          Resolve
                        </Button>
                      )}
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        )}
      </main>

      {/* Detail Modal Dialog */}
      {selectedEscalation && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 p-4 backdrop-blur-sm">
          <div className="relative w-full max-w-xl rounded-2xl border border-slate-800 bg-slate-900 p-6 shadow-2xl">
            <button
              onClick={() => setSelectedEscalation(null)}
              className="absolute top-4 right-4 text-slate-400 hover:text-white"
            >
              <XCircle className="size-5" />
            </button>

            <div className="flex items-center gap-3">
              <div className="flex size-10 items-center justify-center rounded-xl border border-emerald-500/30 bg-emerald-500/10 text-emerald-400">
                <LifeBuoy className="size-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-mono text-base font-extrabold text-emerald-400">
                    {selectedEscalation.reference_id}
                  </h3>
                  <Badge className="text-[10px] font-bold">{selectedEscalation.status}</Badge>
                </div>
                <p className="text-xs text-slate-400">
                  Customer: {selectedEscalation.customer_name} ({selectedEscalation.user_id})
                </p>
              </div>
            </div>

            <div className="mt-6 space-y-4 text-xs text-slate-300">
              <div className="grid grid-cols-2 gap-3 rounded-xl border border-slate-800 bg-slate-950 p-3">
                <div>
                  <span className="font-medium text-slate-500">Issue Type:</span>
                  <p className="font-semibold text-white">{selectedEscalation.issue_type}</p>
                </div>
                <div>
                  <span className="font-medium text-slate-500">Urgency:</span>
                  <p className="font-semibold text-rose-400">{selectedEscalation.urgency}</p>
                </div>
                <div>
                  <span className="font-medium text-slate-500">Language:</span>
                  <p className="font-semibold text-white">{selectedEscalation.language}</p>
                </div>
                <div>
                  <span className="font-medium text-slate-500">Follow-up Method:</span>
                  <p className="font-semibold text-white">
                    {selectedEscalation.preferred_followup_method}
                  </p>
                </div>
              </div>

              <div className="rounded-xl border border-slate-800 bg-slate-950 p-4">
                <h4 className="mb-1 font-bold text-white">Issue Summary:</h4>
                <p className="leading-relaxed text-slate-300">{selectedEscalation.issue_summary}</p>
              </div>

              {selectedEscalation.verified_information && (
                <div className="rounded-xl border border-emerald-500/20 bg-emerald-950/20 p-4">
                  <h4 className="mb-1 font-bold text-emerald-400">Verified Information:</h4>
                  <p className="leading-relaxed text-emerald-200">
                    {selectedEscalation.verified_information}
                  </p>
                </div>
              )}

              <div className="flex items-center justify-between pt-2 text-[11px] text-slate-500">
                <span>Created: {new Date(selectedEscalation.created_at).toLocaleString()}</span>
                <span>Updated: {new Date(selectedEscalation.updated_at).toLocaleString()}</span>
              </div>
            </div>

            <div className="mt-6 flex items-center justify-end gap-2 border-t border-slate-800 pt-4">
              {selectedEscalation.status !== 'RESOLVED' && (
                <Button
                  size="sm"
                  onClick={() => handleUpdateStatus(selectedEscalation.reference_id, 'RESOLVED')}
                  className="bg-emerald-600 text-xs font-semibold text-white hover:bg-emerald-500"
                >
                  Mark Resolved
                </Button>
              )}
              {selectedEscalation.status !== 'CANCELLED' && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleUpdateStatus(selectedEscalation.reference_id, 'CANCELLED')}
                  className="border-slate-800 text-xs font-semibold text-slate-400 hover:bg-slate-800 hover:text-white"
                >
                  Cancel Request
                </Button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
