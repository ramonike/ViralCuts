import React, { useState, useEffect } from "react";
import { Button } from "./ui/button";
import { Mail, X } from "lucide-react";
import { api } from "../lib/api-client";

export default function EmailVerificationBanner({ userEmail }) {
  const [dismissed, setDismissed] = useState(false);
  const [sending, setSending] = useState(false);

  // Check if banner was dismissed in this session
  useEffect(() => {
    const isDismissed = sessionStorage.getItem('emailBannerDismissed') === 'true';
    setDismissed(isDismissed);
  }, []);

  const handleDismiss = () => {
    setDismissed(true);
    sessionStorage.setItem('emailBannerDismissed', 'true');
  };

  const handleResend = async () => {
    setSending(true);
    try {
      await api.resendVerificationEmail();
      alert("Email de verificação reenviado! Verifique sua caixa de entrada.");
    } catch (error) {
      console.error("Failed to resend verification email:", error);
      alert("Erro ao reenviar email. Tente novamente mais tarde.");
    } finally {
      setSending(false);
    }
  };

  if (dismissed) return null;

  return (
    <div className="mb-4 bg-blue-500/10 border border-blue-500/20 rounded-lg p-3 flex items-center justify-between animate-in fade-in slide-in-from-top-2 duration-300">
      <div className="flex items-center gap-3">
        <div className="p-2 bg-blue-500/20 rounded-lg">
          <Mail className="w-4 h-4 text-blue-400" />
        </div>
        <div>
          <p className="text-sm font-medium text-blue-200">Email não verificado</p>
          <p className="text-xs text-blue-300/70">Verifique seu email para acesso completo.</p>
        </div>
      </div>
      <div className="flex items-center gap-2">
        <Button
          onClick={handleResend}
          disabled={sending}
          variant="ghost"
          size="sm"
          className="text-xs text-blue-400 hover:text-blue-300 hover:bg-blue-500/10 h-8"
        >
          {sending ? "Enviando..." : "Reenviar Email"}
        </Button>
        <button
          onClick={handleDismiss}
          className="p-1.5 rounded-lg text-blue-400 hover:text-blue-300 hover:bg-blue-500/10 transition-colors"
          title="Dispensar"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
