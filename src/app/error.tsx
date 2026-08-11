"use client";

import { useEffect } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ErrorState } from "@/components/shared/states";

export default function GlobalError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="container flex min-h-[60vh] items-center justify-center py-20">
      <div className="w-full max-w-md">
        <ErrorState
          title="The pond went quiet"
          description={
            error.message ||
            "Something failed while loading this view. Retrying usually clears it."
          }
          onRetry={reset}
        />
        <div className="mt-4 flex justify-center">
          <Button asChild variant="ghost" size="sm">
            <Link href="/">Back to dashboard</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
