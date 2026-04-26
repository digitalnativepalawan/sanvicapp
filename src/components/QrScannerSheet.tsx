import { useEffect, useRef, useState } from "react";
import { Html5Qrcode } from "html5-qrcode";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import { Button } from "@/components/ui/button";
import { Sparkles, CheckCircle2, XCircle, Loader2 } from "lucide-react";

type ScanState =
  | { status: "idle" }
  | { status: "scanning" }
  | { status: "processing" }
  | { status: "success"; pebbles: number; message: string }
  | { status: "error"; message: string };

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onPebblesAwarded?: () => void;
}

const CAMERA_ID = "qr-scanner-camera";

export function QrScannerSheet({ open, onOpenChange, onPebblesAwarded }: Props) {
  const { user } = useAuth();
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const [scanState, setScanState] = useState<ScanState>({ status: "idle" });
  const processingRef = useRef(false);

  const stopScanner = async () => {
    if (scannerRef.current) {
      try {
        const state = scannerRef.current.getState();
        // state 2 = SCANNING
        if (state === 2) {
          await scannerRef.current.stop();
        }
      } catch {
        // ignore stop errors
      }
      scannerRef.current.clear();
      scannerRef.current = null;
    }
  };

  const startScanner = async () => {
    setScanState({ status: "scanning" });
    processingRef.current = false;

    try {
      const scanner = new Html5Qrcode(CAMERA_ID);
      scannerRef.current = scanner;

      await scanner.start(
        { facingMode: "environment" },
        { fps: 10, qrbox: { width: 250, height: 250 } },
        async (decodedText) => {
          if (processingRef.current) return;
          processingRef.current = true;
          setScanState({ status: "processing" });
          await stopScanner();
          await handleScannedCode(decodedText);
        },
        () => {
          // QR not yet detected — normal, ignore
        },
      );
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Camera access denied or unavailable.";
      setScanState({ status: "error", message: msg });
    }
  };

  const handleScannedCode = async (code: string) => {
    if (!user) {
      setScanState({ status: "error", message: "You must be signed in to scan." });
      return;
    }

    // 1. Look up QR code
    const { data: qrCode, error: qrErr } = await supabase
      .from("qr_codes")
      .select("id, reward_pebbles, active")
      .eq("code", code)
      .maybeSingle();

    if (qrErr || !qrCode) {
      setScanState({ status: "error", message: "QR code not recognised. Try another code." });
      return;
    }

    if (!qrCode.active) {
      setScanState({ status: "error", message: "This QR code is no longer active." });
      return;
    }

    // 2. Check for duplicate scan within the last 24 hours
    const since = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    const { data: existing } = await supabase
      .from("qr_scans")
      .select("id")
      .eq("user_id", user.id)
      .eq("qr_code_id", qrCode.id)
      .gte("scanned_at", since)
      .maybeSingle();

    if (existing) {
      setScanState({
        status: "error",
        message: "You already scanned this code recently. Come back tomorrow!",
      });
      return;
    }

    // 3. Award pebbles — run all writes; if any fail, bail out cleanly
    const pebbles = qrCode.reward_pebbles;

    // Insert scan record
    const { error: scanErr } = await supabase.from("qr_scans").insert({
      user_id: user.id,
      qr_code_id: qrCode.id,
      pebbles_awarded: pebbles,
    });

    if (scanErr) {
      setScanState({ status: "error", message: "Failed to record scan. Please try again." });
      return;
    }

    // Insert transaction record
    await supabase.from("pebbles_transactions").insert({
      user_id: user.id,
      amount: pebbles,
      reason: "qr_scan",
      metadata: { qr_code_id: qrCode.id },
    });

    // Update pebbles balance atomically via RPC
    await supabase.rpc("increment_pebbles", { uid: user.id, delta: pebbles });

    setScanState({
      status: "success",
      pebbles,
      message: `You earned ${pebbles} pebbles! Keep exploring San Vicente.`,
    });

    onPebblesAwarded?.();
  };

  // Start scanner when drawer opens; stop when it closes
  useEffect(() => {
    if (open) {
      setScanState({ status: "idle" });
      processingRef.current = false;
      // slight delay so the drawer DOM element is visible
      const t = setTimeout(() => startScanner(), 300);
      return () => clearTimeout(t);
    } else {
      stopScanner();
      setScanState({ status: "idle" });
      processingRef.current = false;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const handleClose = () => {
    onOpenChange(false);
  };

  const handleRetry = () => {
    setScanState({ status: "idle" });
    processingRef.current = false;
    startScanner();
  };

  const isDone = scanState.status === "success" || scanState.status === "error";

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent className="max-h-[92dvh]">
        <DrawerHeader className="text-center">
          <DrawerTitle>Scan QR Code</DrawerTitle>
          <DrawerDescription>
            Point your camera at a San Vicente QR code to earn pebbles.
          </DrawerDescription>
        </DrawerHeader>

        <div className="px-4 pb-2 flex flex-col items-center gap-4">
          {/* Camera viewport — always rendered so html5-qrcode can attach */}
          <div
            id={CAMERA_ID}
            className={`w-full max-w-xs rounded-xl overflow-hidden bg-muted ${isDone ? "hidden" : ""}`}
            style={{ minHeight: isDone ? 0 : 300 }}
          />

          {scanState.status === "processing" && (
            <div className="flex flex-col items-center gap-2 py-8">
              <Loader2 className="h-10 w-10 animate-spin text-accent" />
              <p className="text-sm text-muted-foreground">Processing…</p>
            </div>
          )}

          {scanState.status === "success" && (
            <div className="flex flex-col items-center gap-3 py-6 text-center">
              <CheckCircle2 className="h-14 w-14 text-emerald-500" />
              <p className="font-display text-3xl font-bold flex items-center gap-2">
                <Sparkles className="h-6 w-6 text-accent" />+{scanState.pebbles}
              </p>
              <p className="text-sm text-muted-foreground max-w-[260px]">{scanState.message}</p>
            </div>
          )}

          {scanState.status === "error" && (
            <div className="flex flex-col items-center gap-3 py-6 text-center">
              <XCircle className="h-14 w-14 text-destructive" />
              <p className="text-sm text-muted-foreground max-w-[260px]">{scanState.message}</p>
            </div>
          )}
        </div>

        <DrawerFooter>
          {scanState.status === "error" && (
            <Button onClick={handleRetry} className="w-full">
              Try again
            </Button>
          )}
          <DrawerClose asChild>
            <Button variant="outline" className="w-full" onClick={handleClose}>
              {scanState.status === "success" ? "Done" : "Cancel"}
            </Button>
          </DrawerClose>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
}
