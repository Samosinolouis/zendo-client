"use client";

import { useMemo, useState } from "react";
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
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import {
	Sheet,
	SheetContent,
	SheetHeader,
	SheetTitle,
} from "@/components/ui/sheet";
import {
	Building2,
	Calendar,
	ChevronDown,
	ChevronUp,
	DollarSign,
	FileText,
	Loader2,
	Percent,
	Receipt,
	TrendingUp,
} from "lucide-react";

type GenerateStatementResult = {
	payoutStatement: PayoutStatement;
	serviceBillings: ServiceBilling[];
};

type GenerateStatementResponse = {
	generateBusinessPaymentStatement: GenerateStatementResult;
};

// ─── Disbursements Sheet ─────────────────────────────────────────────────────
function DisbursementsSheet({
	business,
	statements,
	open,
	onClose,
}: {
	readonly business: Business | null;
	readonly statements: PayoutStatement[];
	readonly open: boolean;
	readonly onClose: () => void;
}) {
	const { showError } = useToast();
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

	return (
		<Sheet open={open} onOpenChange={(v) => { if (!v) onClose(); }}>
			<SheetContent className="w-full sm:max-w-2xl overflow-y-auto p-4">
				<SheetHeader className="mb-4 p-0">
					<SheetTitle className="flex items-center gap-2">
						<Receipt className="w-4 h-4" />
						Disbursements
					</SheetTitle>
					{business && (
						<p className="text-sm text-muted-foreground">{business.name}</p>
					)}
				</SheetHeader>
				<Separator className="mb-4" />

				{statements.length === 0 ? (
					<div className="text-center py-12">
						<Receipt className="w-8 h-8 text-muted-foreground/25 mx-auto mb-2" />
						<p className="text-sm text-muted-foreground">No disbursements yet.</p>
						<p className="text-xs text-muted-foreground/60 mt-1">
							Use the New Disbursement action to generate one.
						</p>
					</div>
				) : (
					<div className="space-y-2">
						{statements.map((stmt, idx) => {
							const isDownloading = loadingStatementId === stmt.id;
							return (
								<div key={stmt.id} className="rounded-xl border border-border overflow-hidden bg-card">
									<div className="flex items-center justify-between px-4 py-3 border-b">
										<div className="flex items-center gap-3">
											<Badge variant="secondary" className="text-xs tabular-nums">
												#{statements.length - idx}
											</Badge>
											<div>
												<p className="text-sm font-medium leading-tight">
													{formatDate(stmt.periodStart)} &ndash; {formatDate(stmt.periodEnd)}
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
									<div className="grid grid-cols-4 divide-x">
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
			</SheetContent>
		</Sheet>
	);
}

// ─── Business Card ────────────────────────────────────────────────────────────
interface BusinessWithMeta extends Business {
	ownerName: string;
	lastPayoutEnd?: string;
	statements: PayoutStatement[];
}

function BusinessCard({
	business,
	expanded,
	onToggle,
	onViewDisbursements,
	onDisbursement,
	isGenerating,
}: {
	readonly business: BusinessWithMeta;
	readonly expanded: boolean;
	readonly onToggle: () => void;
	readonly onViewDisbursements: () => void;
	readonly onDisbursement: () => void;
	readonly isGenerating: boolean;
}) {
	const latest = business.statements[0] ?? null;

	return (
		<div className="rounded-xl border border-border overflow-hidden bg-card shadow-sm">
			{/* Header row */}
			<button
				type="button"
				onClick={onToggle}
				className="w-full text-left px-5 py-4 hover:bg-muted/30 transition-colors"
			>
				<div className="flex items-center justify-between gap-4">
					<div className="flex items-center gap-3 min-w-0">
						<div className="p-2.5 rounded-xl bg-blue-50 dark:bg-blue-950/30 shrink-0">
							<Building2 className="w-5 h-5 text-blue-600" />
						</div>
						<div className="min-w-0">
							<p className="text-sm font-semibold text-foreground truncate">{business.name}</p>
							<div className="flex items-center gap-1.5 text-xs text-muted-foreground mt-0.5">
								<span>{business.ownerName}</span>
								{business.lastPayoutEnd && (
									<>
										<span>&middot;</span>
										<Calendar className="w-3 h-3" />
										<span>Last payout {formatDate(business.lastPayoutEnd)}</span>
									</>
								)}
							</div>
						</div>
					</div>
					<div className="flex items-center gap-3 shrink-0">
						{latest && (
							<div className="text-right">
								<p className="text-base font-bold text-emerald-600">
									{formatCurrency(latest.netPayout)}
								</p>
								<p className="text-[10px] text-muted-foreground">net payout</p>
							</div>
						)}
						{expanded
							? <ChevronUp className="w-4 h-4 text-muted-foreground" />
							: <ChevronDown className="w-4 h-4 text-muted-foreground" />}
					</div>
				</div>
			</button>

			{/* Expanded detail */}
			{expanded && (
				<>
					<Separator />
					<div className="px-5 py-4 bg-muted/20 space-y-4">
						{latest && (
							<div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
								<div className="bg-background rounded-lg p-3 border border-border">
									<p className="text-[10px] text-muted-foreground uppercase tracking-wide">Gross</p>
									<p className="text-sm font-bold text-foreground mt-0.5">{formatCurrency(latest.grossCollection)}</p>
								</div>
								<div className="bg-background rounded-lg p-3 border border-border">
									<p className="text-[10px] text-muted-foreground uppercase tracking-wide">Fees</p>
									<p className="text-sm font-bold text-red-600 mt-0.5">- {formatCurrency(latest.totalFees)}</p>
								</div>
								<div className="bg-background rounded-lg p-3 border border-border">
									<p className="text-[10px] text-muted-foreground uppercase tracking-wide">Tax</p>
									<p className="text-sm font-bold text-orange-600 mt-0.5">- {formatCurrency(latest.withholdingTax)}</p>
								</div>
								<div className="rounded-lg p-3 border border-emerald-200 bg-emerald-50/50 dark:bg-emerald-950/20 dark:border-emerald-800">
									<p className="text-[10px] text-muted-foreground uppercase tracking-wide">Net</p>
									<p className="text-sm font-bold text-emerald-600 mt-0.5">{formatCurrency(latest.netPayout)}</p>
								</div>
							</div>
						)}
						<div className="flex justify-end gap-2">
							<Button
								size="sm"
								variant="outline"
								className="gap-1.5 text-xs"
								onClick={(e) => { e.stopPropagation(); onViewDisbursements(); }}
							>
								<FileText className="w-3.5 h-3.5" />
								View Disbursements
							</Button>
							<Button
								size="sm"
								variant="default"
								className="gap-1.5 text-xs"
								onClick={(e) => { e.stopPropagation(); onDisbursement(); }}
								disabled={isGenerating}
							>
								{isGenerating ? (
									<Loader2 className="w-3.5 h-3.5 animate-spin" />
								) : (
									<Receipt className="w-3.5 h-3.5" />
								)}
								New Disbursement
							</Button>
						</div>
					</div>
				</>
			)}
		</div>
	);
}

// ─── Main page ────────────────────────────────────────────────────────────────
export default function AdminBusinessesPage() {
	const { showError, showSuccess } = useToast();
	const [expandedId, setExpandedId] = useState<string | null>(null);
	const [sheetBusinessId, setSheetBusinessId] = useState<string | null>(null);

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

	const userMap = useMemo(() => {
		const map: Record<string, string> = {};
		for (const u of users) {
			map[u.id] = `${u.firstName} ${u.lastName}`.trim();
		}
		return map;
	}, [users]);

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

	const businessesWithMeta = useMemo(
		(): BusinessWithMeta[] =>
			businesses.map((b) => {
				const stmts = statementsByBusiness[b.id] ?? [];
				return {
					...b,
					ownerName: userMap[b.userId] ?? `…${b.userId.slice(-8)}`,
					lastPayoutEnd: stmts[0]?.periodEnd,
					statements: stmts,
				};
			}),
		[businesses, userMap, statementsByBusiness],
	);

	const totals = useMemo(
		() => ({
			gross: statements.reduce((s, p) => s + p.grossCollection, 0),
			fees:  statements.reduce((s, p) => s + p.totalFees, 0),
			tax:   statements.reduce((s, p) => s + p.withholdingTax, 0),
			net:   statements.reduce((s, p) => s + p.netPayout, 0),
		}),
		[statements],
	);

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

	const sheetBusiness = businessesWithMeta.find((b) => b.id === sheetBusinessId) ?? null;

	function renderContent() {
		if (bizLoading) {
			return (
				<div className="space-y-3">
					{[0, 1, 2, 3].map((n) => (
						<Skeleton key={n} className="h-20 w-full rounded-xl" />
					))}
				</div>
			);
		}

		if (businesses.length === 0) {
			return (
				<div className="text-center py-20">
					<Building2 className="w-10 h-10 text-muted-foreground/30 mx-auto mb-3" />
					<p className="text-muted-foreground font-medium">No businesses found</p>
					<p className="text-sm text-muted-foreground/60 mt-1">
						Businesses will appear here once registered.
					</p>
				</div>
			);
		}

		return (
			<div className="space-y-3">
				{businessesWithMeta.map((biz) => (
					<BusinessCard
						key={biz.id}
						business={biz}
						expanded={expandedId === biz.id}
						onToggle={() => setExpandedId(expandedId === biz.id ? null : biz.id)}
						onViewDisbursements={() => setSheetBusinessId(biz.id)}
						onDisbursement={() => onDisbursement(biz.id)}
						isGenerating={runningBusinessId === biz.id}
					/>
				))}
			</div>
		);
	}

	return (
		<div className="space-y-8">
			<div>
				<h1 className="text-3xl font-bold tracking-tight text-foreground">Businesses</h1>
				<p className="text-muted-foreground mt-1">
					Manage registered businesses and generate disbursements.
				</p>
			</div>

			{!bizLoading && statements.length > 0 && (
				<div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
					{(
						[
							{ icon: DollarSign, label: "Total Gross",  value: totals.gross, color: "text-foreground",  bg: "bg-muted" },
							{ icon: Receipt,    label: "Total Fees",   value: totals.fees,  color: "text-red-600",     bg: "bg-red-50 dark:bg-red-950/30" },
							{ icon: Percent,    label: "Tax Withheld", value: totals.tax,   color: "text-orange-600",  bg: "bg-orange-50 dark:bg-orange-950/30" },
							{ icon: TrendingUp, label: "Net Payout",   value: totals.net,   color: "text-emerald-600", bg: "bg-emerald-50 dark:bg-emerald-950/30" },
						] as const
					).map((s) => (
						<div key={s.label} className="rounded-xl border border-border bg-card p-4 text-center shadow-sm">
							<div className={`inline-flex p-2 rounded-lg ${s.bg} mb-2`}>
								<s.icon className={`w-4 h-4 ${s.color}`} />
							</div>
							<p className="text-xs text-muted-foreground">{s.label}</p>
							<p className={`text-base font-bold mt-0.5 ${s.color}`}>{formatCurrency(s.value)}</p>
						</div>
					))}
				</div>
			)}

			{renderContent()}

			<DisbursementsSheet
				business={sheetBusiness}
				statements={sheetBusiness?.statements ?? []}
				open={sheetBusinessId !== null}
				onClose={() => setSheetBusinessId(null)}
			/>
		</div>
	);
}
