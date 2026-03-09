"use client";

import React, { useMemo, useState } from "react";
import { graphqlClient } from "@/lib/graphql-client";
import { useQuery, useMutation, extractNodes } from "@/graphql/hooks";
import {
	GET_BUSINESSES,
	GET_USERS,
	GET_PAYOUT_STATEMENTS,
	GET_SERVICE_BILLINGS,
} from "@/graphql/queries";
import { GENERATE_BUSINESS_PAYMENT_STATEMENT } from "@/graphql/mutations";
import { openServiceBillingPdf } from "@/lib/service-billing-pdf";
import type { Business, Connection, PayoutStatement, ServiceBilling, User } from "@/types";
import { formatCurrency, formatDate } from "@/lib/utils";
import { useToast } from "@/providers/ToastProvider";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Building2, FileText, Loader2, MoreHorizontal, Receipt } from "lucide-react";

type GenerateStatementResult = {
	payoutStatement: PayoutStatement;
	serviceBillings: ServiceBilling[];
};

type GenerateStatementResponse = {
	generateBusinessPaymentStatement: GenerateStatementResult;
};

export default function AdminBusinessesPage() {
	const { showError, showSuccess } = useToast();

	// ── Data fetches ──────────────────────────────────────────────────────────
	const { data: bizData, loading: bizLoading } = useQuery<{ businesses: Connection<Business> }>(
		GET_BUSINESSES,
		{ first: 500 },
	);
	const { data: usersData } = useQuery<{ users: Connection<User> }>(GET_USERS, { first: 500 });
	const { data: statementsData, refetch: refetchStatements } = useQuery<{
		payoutStatements: Connection<PayoutStatement>;
	}>(GET_PAYOUT_STATEMENTS, { first: 1000 });

	const businesses = extractNodes(bizData?.businesses);
	const users = extractNodes(usersData?.users);
	const statements = extractNodes(statementsData?.payoutStatements);

	// ── Derived maps ──────────────────────────────────────────────────────────
	const userMap = useMemo(() => {
		const map: Record<string, string> = {};
		for (const u of users) {
			map[u.id] = `${u.firstName} ${u.lastName}`.trim();
		}
		return map;
	}, [users]);

	const lastPayoutMap = useMemo(() => {
		const map: Record<string, string> = {};
		for (const s of statements) {
			if (!map[s.businessId] || s.periodEnd > map[s.businessId]) {
				map[s.businessId] = s.periodEnd;
			}
		}
		return map;
	}, [statements]);

	const statementsByBusiness = useMemo(() => {
		const map: Record<string, PayoutStatement[]> = {};
		for (const s of statements) {
			if (!map[s.businessId]) map[s.businessId] = [];
			map[s.businessId].push(s);
		}
		for (const key of Object.keys(map)) {
			map[key].sort((a, b) => b.periodEnd.localeCompare(a.periodEnd));
		}
		return map;
	}, [statements]);

	// ── Disbursement mutation ─────────────────────────────────────────────────
	const [runningBusinessId, setRunningBusinessId] = useState<string | null>(null);
	const { mutate: generatePaymentStatement } = useMutation<GenerateStatementResponse>(
		GENERATE_BUSINESS_PAYMENT_STATEMENT,
		{ throwOnError: true },
	);

	async function onDisbursement(businessId: string): Promise<void> {
		setRunningBusinessId(businessId);
		try {
			const response = await generatePaymentStatement({ input: { businessId } });
			const generated = response?.generateBusinessPaymentStatement;
			if (!generated) {
				showError("Failed to generate disbursement.");
				return;
			}
			showSuccess(`Disbursement created with ${generated.serviceBillings.length} service billing(s).`);
			refetchStatements();
		} catch (err) {
			showError(err instanceof Error ? err.message : "Failed to generate disbursement.");
		} finally {
			setRunningBusinessId(null);
		}
	}

	// ── Previous disbursements modal ──────────────────────────────────────────
	const [modalBusinessId, setModalBusinessId] = useState<string | null>(null);
	const [loadingStatementId, setLoadingStatementId] = useState<string | null>(null);

	async function handleDownloadPdf(statementId: string): Promise<void> {
		setLoadingStatementId(statementId);
		try {
			const res = await graphqlClient<{ serviceBillings: Connection<ServiceBilling> }>(
				GET_SERVICE_BILLINGS,
				{ first: 100, filter: { payoutStatementId: statementId } },
			);
			const billings = res.data?.serviceBillings?.edges?.map((e) => e.node) ?? [];
			if (billings.length === 0) {
				showError("No service billings found for this statement.");
				return;
			}
			for (const billing of billings) {
				openServiceBillingPdf(billing.payload);
			}
		} catch {
			showError("Failed to load service billings.");
		} finally {
			setLoadingStatementId(null);
		}
	}

	const modalBusiness = businesses.find((b) => b.id === modalBusinessId);
	const modalStatements = modalBusinessId ? (statementsByBusiness[modalBusinessId] ?? []) : [];

	// ── Render ────────────────────────────────────────────────────────────────
	let content: React.ReactNode;
	if (bizLoading) {
		content = (
			<Card>
				<CardContent className="p-0">
					<div className="divide-y">
						{["s1", "s2", "s3", "s4", "s5"].map((k) => (
							<div key={k} className="flex items-center gap-4 px-6 py-4">
								<Skeleton className="h-4 w-48" />
								<Skeleton className="h-4 w-32 ml-auto" />
								<Skeleton className="h-4 w-24" />
								<Skeleton className="h-8 w-8 rounded-md" />
							</div>
						))}
					</div>
				</CardContent>
			</Card>
		);
	} else if (businesses.length === 0) {
		content = (
			<Card>
				<CardContent className="py-20 text-center">
					<div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-muted">
						<Building2 className="h-6 w-6 text-muted-foreground" />
					</div>
					<p className="text-sm font-medium text-foreground">No businesses found</p>
					<p className="text-xs text-muted-foreground mt-1">Businesses will appear here once registered.</p>
				</CardContent>
			</Card>
		);
	} else {
		content = (
			<Card>
				<CardHeader className="px-6 py-4 border-b">
					<div className="flex items-center justify-between">
						<CardTitle className="text-base font-semibold">All Businesses</CardTitle>
						<Badge variant="secondary" className="text-xs font-medium">
							{businesses.length} {businesses.length === 1 ? "business" : "businesses"}
						</Badge>
					</div>
				</CardHeader>
				<CardContent className="p-0">
					<Table>
						<TableHeader>
							<TableRow className="hover:bg-transparent">
								<TableHead className="pl-6 w-[35%]">Business</TableHead>
								<TableHead className="w-[25%]">Owner</TableHead>
								<TableHead className="w-[25%]">Last Payout Period End</TableHead>
								<TableHead className="pr-6 w-[15%] text-right">Actions</TableHead>
							</TableRow>
						</TableHeader>
						<TableBody>
							{businesses.map((biz) => {
								const isGenerating = runningBusinessId === biz.id;
								const ownerName = userMap[biz.userId] ?? `…${biz.userId.slice(-8)}`;
								const lastPayout = lastPayoutMap[biz.id];
								return (
									<TableRow key={biz.id}>
										<TableCell className="pl-6">
											<p className="font-medium text-sm leading-tight">{biz.name}</p>
											{biz.description && (
												<p className="text-xs text-muted-foreground truncate max-w-xs mt-0.5">
													{biz.description}
												</p>
											)}
										</TableCell>
										<TableCell>
											<span className="text-sm text-foreground">{ownerName}</span>
										</TableCell>
										<TableCell>
											{lastPayout ? (
												<Badge variant="outline" className="font-normal text-xs">
													{formatDate(lastPayout)}
												</Badge>
											) : (
												<span className="text-muted-foreground text-xs">No payouts yet</span>
											)}
										</TableCell>
										<TableCell className="pr-6 text-right">
											<DropdownMenu>
												<DropdownMenuTrigger asChild>
													<Button
														variant="ghost"
														size="sm"
														className="h-8 w-8 p-0"
														disabled={isGenerating}
													>
														{isGenerating ? (
															<Loader2 className="h-4 w-4 animate-spin" />
														) : (
															<MoreHorizontal className="h-4 w-4" />
														)}
														<span className="sr-only">Open menu</span>
													</Button>
												</DropdownMenuTrigger>
												<DropdownMenuContent align="end" className="w-52">
													<DropdownMenuItem
														className="gap-2 cursor-pointer"
														onClick={() => setModalBusinessId(biz.id)}
													>
														<FileText className="h-4 w-4 text-muted-foreground" />
														View Disbursements
													</DropdownMenuItem>
													<DropdownMenuSeparator />
													<DropdownMenuItem
														className="gap-2 cursor-pointer"
														onClick={() => onDisbursement(biz.id)}
													>
														<Receipt className="h-4 w-4 text-muted-foreground" />
														New Disbursement
													</DropdownMenuItem>
												</DropdownMenuContent>
											</DropdownMenu>
										</TableCell>
									</TableRow>
								);
							})}
						</TableBody>
					</Table>
				</CardContent>
			</Card>
		);
	}

	return (
		<div className="space-y-6">
			<div className="flex items-start justify-between">
				<div>
					<h1 className="text-2xl font-bold tracking-tight text-foreground">Businesses</h1>
					<p className="text-sm text-muted-foreground mt-1">
						Manage registered businesses and generate disbursements.
					</p>
				</div>
			</div>
			<Separator />

			{content}

			{/* Previous Disbursements Modal */}
			<Dialog
				open={modalBusinessId !== null}
				onOpenChange={(open) => {
					if (!open) setModalBusinessId(null);
				}}
			>
				<DialogContent className="max-w-2xl">
					<DialogHeader>
						<DialogTitle className="flex items-center gap-2">
							<Receipt className="h-5 w-5 text-muted-foreground" />
							Disbursements
						</DialogTitle>
						{modalBusiness && (
							<p className="text-sm text-muted-foreground">{modalBusiness.name}</p>
						)}
					</DialogHeader>

					<Separator />

					{modalStatements.length === 0 ? (
						<div className="py-14 text-center">
							<div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-muted">
								<Receipt className="h-5 w-5 text-muted-foreground" />
							</div>
							<p className="text-sm font-medium text-foreground">No disbursements yet</p>
							<p className="text-xs text-muted-foreground mt-1">Use the New Disbursement action to generate one.</p>
						</div>
					) : (
						<div className="space-y-2 max-h-[58vh] overflow-y-auto">
							{modalStatements.map((stmt, idx) => {
								const isDownloading = loadingStatementId === stmt.id;
								return (
									<div key={stmt.id} className="rounded-lg border bg-card">
										{/* Header row */}
										<div className="flex items-center justify-between px-4 py-3 border-b">
											<div className="flex items-center gap-3">
												<Badge variant="secondary" className="text-xs tabular-nums">
													#{modalStatements.length - idx}
												</Badge>
												<div>
													<p className="text-sm font-medium leading-tight">
														{formatDate(stmt.periodStart)} – {formatDate(stmt.periodEnd)}
													</p>
													<p className="text-[11px] text-muted-foreground font-mono mt-0.5">
														{stmt.id.slice(-12).toUpperCase()}
													</p>
												</div>
											</div>
											<Button
												size="sm"
												variant="outline"
												className="h-8 gap-1.5 text-xs"
												onClick={() => handleDownloadPdf(stmt.id)}
												disabled={isDownloading}
											>
												{isDownloading ? (
													<Loader2 className="h-3.5 w-3.5 animate-spin" />
												) : (
													<FileText className="h-3.5 w-3.5" />
												)}
												Download PDF
											</Button>
										</div>
										{/* Stats row */}
										<div className="grid grid-cols-4 divide-x px-0">
											{([
												["Gross", formatCurrency(stmt.grossCollection)],
												["Fees", formatCurrency(stmt.totalFees)],
												["Tax", formatCurrency(stmt.withholdingTax)],
												["Net Payout", formatCurrency(stmt.netPayout)],
											] as [string, string][]).map(([label, value], i) => (
												<div key={label} className={`px-4 py-3 ${i === 3 ? "bg-primary/5" : ""}`}>
													<p className="text-[11px] text-muted-foreground uppercase tracking-wide">{label}</p>
													<p className={`text-sm font-semibold mt-0.5 tabular-nums ${i === 3 ? "text-primary" : ""}`}>
														{value}
													</p>
												</div>
											))}
										</div>
									</div>
								);
							})}
						</div>
					)}
				</DialogContent>
			</Dialog>
		</div>
	);
}
