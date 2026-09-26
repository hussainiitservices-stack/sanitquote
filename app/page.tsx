import Link from "next/link";

import { Button } from "@/components/ui/button";

const points = [
  "One catalog of brands and products, shared by every showroom.",
  "Each merchant only quotes the companies an admin has enabled.",
  "A quotation keeps the price and product details from the day it was made.",
];

export default function HomePage() {
  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-lg flex-col justify-between px-5 py-8">
      <p className="text-sm font-semibold tracking-wide text-primary">SanitQuote</p>
      <div className="grid gap-6 py-12">
        <h1 className="text-4xl font-semibold tracking-tight text-balance">
          Quotations your showroom can send today.
        </h1>
        <p className="text-base leading-7 text-muted-foreground">
          A mobile workspace for sanitaryware merchants. Brands stay central.
          Clients and quotes stay with the showroom that created them.
        </p>
        <Button asChild className="h-11 w-full sm:w-fit">
          <Link href="/login">Sign in</Link>
        </Button>
      </div>
      <ul className="grid gap-3 text-sm leading-6">
        {points.map((point) => (
          <li key={point} className="border-t pt-3">
            {point}
          </li>
        ))}
      </ul>
    </main>
  );
}
