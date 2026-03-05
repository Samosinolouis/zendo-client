"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { Ban } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

function CancelledContent() {
  const params = useSearchParams();
  const paymentLinkId = params.get("paymentLinkId");

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-20">
      <Card className="max-w-md w-full border-0 shadow-lg">
        <CardContent className="p-10 text-center space-y-5">
          <Ban className="w-16 h-16 text-amber-500 mx-auto" />
          <div>
            <h1 className="text-2xl font-bold text-foreground">Payment Cancelled</h1>
            <p className="text-muted-foreground mt-2">
              You cancelled the payment. Your appointment slot may no longer be reserved.
            </p>
            {paymentLinkId && (
              <p className="text-xs text-muted-foreground mt-3 font-mono">
                Ref: {paymentLinkId}
              </p>
            )}
          </div>
          <div className="flex flex-col gap-2 pt-2">
            <Button asChild className="w-full">
              <Link href="/appointments">View My Appointments</Link>
            </Button>
            <Button variant="outline" asChild className="w-full">
              <Link href="/explore">Explore Services</Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default function AppointmentCancelledPage() {
  return (
    <Suspense>
      <CancelledContent />
    </Suspense>
  );
}
