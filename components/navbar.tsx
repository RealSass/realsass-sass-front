"use client"

import { useState } from "react"
import { motion } from "framer-motion"
import { Menu, X } from "lucide-react"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { LoginModal } from "@/components/login-modal"

const navLinks = [
  { label: "Features", href: "#features" },
  { label: "Pricing", href: "#pricing" },
  { label: "Reviews", href: "#reviews" },
  { label: "Contact", href: "#contact" },
]

export function Navbar() {
  const [loginOpen, setLoginOpen] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  return (
    <>
      <motion.header
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ type: "spring", stiffness: 300, damping: 30 }}
        className="fixed top-0 right-0 left-0 z-50 border-b border-border/40 backdrop-blur-xl"
        style={{ backgroundColor: "rgba(245, 240, 235, 0.8)" }}
      >
        <nav className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 md:h-18 lg:px-8">
          {/* Logo */}
          <a href="#" className="flex items-center gap-2">
            <span className="font-serif text-xl tracking-tight text-foreground md:text-2xl">
              Propiedad
            </span>
          </a>

          {/* Desktop Nav Links */}
          <div className="hidden items-center gap-8 md:flex">
            {navLinks.map((link) => (
              <a
                key={link.label}
                href={link.href}
                className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
              >
                {link.label}
              </a>
            ))}
          </div>

          {/* Right side */}
          <div className="flex items-center gap-3">
            {/* Mobile menu button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="flex h-12 w-12 items-center justify-center rounded-lg text-foreground transition-colors hover:bg-secondary md:hidden"
              aria-label={mobileMenuOpen ? "Close menu" : "Open menu"}
            >
              {mobileMenuOpen ? <X className="size-5" /> : <Menu className="size-5" />}
            </button>

            {/* Avatar / Login trigger */}
            <button
              onClick={() => setLoginOpen(true)}
              className="flex h-12 w-12 items-center justify-center rounded-full transition-transform hover:scale-105 active:scale-95"
              aria-label="Open login"
            >
              <Avatar className="size-9 border-2 border-primary/20">
                <AvatarFallback className="bg-primary/10 font-medium text-primary">
                  U
                </AvatarFallback>
              </Avatar>
            </button>
          </div>
        </nav>

        {/* Mobile dropdown */}
        {mobileMenuOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ type: "spring", stiffness: 400, damping: 30 }}
            className="border-t border-border/40 px-4 pb-4 md:hidden"
          >
            {navLinks.map((link) => (
              <a
                key={link.label}
                href={link.href}
                className="flex h-12 items-center text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
              >
                {link.label}
              </a>
            ))}
          </motion.div>
        )}
      </motion.header>

      <LoginModal open={loginOpen} onOpenChange={setLoginOpen} />
    </>
  )
}
