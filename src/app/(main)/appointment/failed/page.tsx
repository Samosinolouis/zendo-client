"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

function FailedContent() {
  const params = useSearchParams();
  const paymentLinkId = params.get("paymentLinkId");

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-20">
      <Card className="max-w-md w-full border-0 shadow-lg">
        <CardContent className="p-10 text-center space-y-5">
          <XCircle className="w-16 h-16 text-red-500 mx-auto" />
          <div>
            <h1 className="text-2xl font-bold text-foreground">Payment Failed</h1>
            <p className="text-muted-foreground mt-2">
              Your payment could not be processed. Please check your card details and try again.
            </p>
            {paymentLinkId && (
              <p className="text-xs text-muted-foreground mt-3 font-mono">
                Ref: {paymentLinkId}
              </p>
            )}
          </div>
          <div className="flex flex-col gap-2 pt-2">
            <Button asChild className="w-full">
              <Link href="/explore">Back to Explore</Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default function AppointmentFailedPage() {
  return (
    <Suspense>
      <FailedContent />
    </Suspense>
  );
}
