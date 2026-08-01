"use client";

import Link from "next/link";
import React from "react";
import { cn } from "@/lib/utils";

type LinkProps = { children: React.ReactNode; href: string; className?: string };

// Skiper UI's CSS link interaction preset (skiper40), adapted for internal Next links.
export function Link000({ children, href, className }: LinkProps) {
  return <Link href={href} className={cn("group relative inline-flex items-center before:absolute before:bottom-0 before:left-0 before:h-px before:w-full before:origin-right before:scale-x-0 before:bg-current before:transition-transform before:duration-300 hover:before:origin-left hover:before:scale-x-100", className)}>{children}</Link>;
}

export function Link003({ children, href, className }: LinkProps) {
  return <Link href={href} className={cn("group relative inline-flex items-center before:absolute before:bottom-0 before:left-0 before:h-px before:w-full before:origin-center before:scale-x-0 before:bg-current before:transition-transform before:duration-300 hover:before:scale-x-100", className)}>{children}</Link>;
}
