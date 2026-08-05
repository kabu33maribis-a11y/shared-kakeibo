"use client";

import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { recognizeReceiptText } from "@/features/receipt/ocr";
import {
  parseReceiptText,
  type ParsedReceipt,
} from "@/features/receipt/parse_receipt";
import {
  AMOUNT_CROP,
  guideToVideoCrop,
  prepareAmountCloseup,
} from "@/features/receipt/prepare_amount_image";
import { Camera, Loader2, X } from "lucide-react";

interface ReceiptScanModalProps {
  open: boolean;
  onClose: () => void;
  onParsed: (result: ParsedReceipt) => void;
}

type ScanPhase = "camera" | "recognizing";

const CAMERA_CONSTRAINTS: MediaStreamConstraints = {
  audio: false,
  video: {
    facingMode: { ideal: "environment" },
    width: { ideal: 1920 },
    height: { ideal: 1080 },
  },
};

export function ReceiptScanModal({
  open,
  onClose,
  onParsed,
}: ReceiptScanModalProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [phase, setPhase] = useState<ScanPhase>("camera");
  const [cameraReady, setCameraReady] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const stopCamera = () => {
    const stream = streamRef.current;
    streamRef.current = null;
    if (stream) {
      for (const track of stream.getTracks()) {
        track.stop();
      }
    }
    const video = videoRef.current;
    if (video) {
      video.srcObject = null;
    }
    setCameraReady(false);
  };

  const attachStream = async (stream: MediaStream) => {
    streamRef.current = stream;
    const video = videoRef.current;
    if (!video) {
      return;
    }
    video.srcObject = stream;
    await video.play();
    setCameraReady(true);
  };

  useEffect(() => {
    if (!open) {
      return;
    }

    let cancelled = false;
    setPhase("camera");
    setError(null);
    setCameraReady(false);

    const startCamera = async () => {
      if (!navigator.mediaDevices?.getUserMedia) {
        setError("このブラウザではカメラを利用できません。");
        return;
      }

      try {
        const stream =
          await navigator.mediaDevices.getUserMedia(CAMERA_CONSTRAINTS);

        if (cancelled) {
          for (const track of stream.getTracks()) {
            track.stop();
          }
          return;
        }

        await attachStream(stream);
      } catch {
        if (!cancelled) {
          setError(
            "カメラを起動できませんでした。ブラウザの権限を確認してください。",
          );
        }
      }
    };

    void startCamera();

    return () => {
      cancelled = true;
      const stream = streamRef.current;
      streamRef.current = null;
      if (stream) {
        for (const track of stream.getTracks()) {
          track.stop();
        }
      }
      const video = videoRef.current;
      if (video) {
        video.srcObject = null;
      }
    };
  }, [open]);

  const handleClose = () => {
    if (phase === "recognizing") {
      return;
    }
    stopCamera();
    onClose();
  };

  const handleCapture = async () => {
    const video = videoRef.current;
    if (!video || video.videoWidth === 0 || video.videoHeight === 0) {
      setError("カメラ映像の準備ができていません。");
      return;
    }

    setError(null);
    setPhase("recognizing");

    const full = document.createElement("canvas");
    full.width = video.videoWidth;
    full.height = video.videoHeight;
    const context = full.getContext("2d");
    if (!context) {
      setPhase("camera");
      setError("画像の取得に失敗しました。");
      return;
    }

    context.drawImage(video, 0, 0);
    stopCamera();

    try {
      const rect = video.getBoundingClientRect();
      const crop = guideToVideoCrop(
        full.width,
        full.height,
        rect.width,
        rect.height,
      );
      const closeup = prepareAmountCloseup(full, crop);
      const text = await recognizeReceiptText(closeup);
      const parsed = parseReceiptText(text);
      onParsed(parsed);
      onClose();
    } catch (captureError) {
      const message =
        captureError instanceof Error
          ? captureError.message
          : "レシートの読み取りに失敗しました。";
      setPhase("camera");
      setError(message);

      try {
        const stream =
          await navigator.mediaDevices.getUserMedia(CAMERA_CONSTRAINTS);
        await attachStream(stream);
      } catch {
        setError(`${message} カメラの再起動にも失敗しました。`);
      }
    }
  };

  if (!open) {
    return null;
  }

  const guideStyle = {
    left: `${AMOUNT_CROP.left * 100}%`,
    top: `${AMOUNT_CROP.top * 100}%`,
    width: `${AMOUNT_CROP.width * 100}%`,
    height: `${AMOUNT_CROP.height * 100}%`,
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 p-3 sm:items-center"
      role="dialog"
      aria-modal="true"
      aria-labelledby="receipt-scan-title"
    >
      <div className="flex max-h-[min(92vh,720px)] w-full max-w-md flex-col overflow-hidden rounded-2xl bg-background shadow-xl">
        <div className="flex items-center justify-between border-b border-border/70 px-4 py-3">
          <h2
            id="receipt-scan-title"
            className="text-sm font-semibold tracking-tight"
          >
            合計金額を撮影
          </h2>
          <Button
            type="button"
            size="icon-xs"
            variant="ghost"
            onClick={handleClose}
            disabled={phase === "recognizing"}
            aria-label="閉じる"
          >
            <X />
          </Button>
        </div>

        <div className="relative aspect-[3/4] overflow-hidden bg-black">
          <video
            ref={videoRef}
            className="size-full object-cover"
            playsInline
            muted
            autoPlay
          />
          {phase === "camera" && (
            <>
              <div
                className="pointer-events-none absolute rounded-lg border-2 border-white/90 shadow-[0_0_0_9999px_rgba(0,0,0,0.45)]"
                style={guideStyle}
              />
              <p className="pointer-events-none absolute left-1/2 top-[calc(38%+24%+10px)] w-[84%] -translate-x-1/2 text-center text-[11px] font-medium text-white drop-shadow">
                「合計」と金額が枠内に大きく入るように近づけてください
              </p>
            </>
          )}
          {phase === "recognizing" && (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-black/70 text-white">
              <Loader2 className="size-8 animate-spin" />
              <p className="text-sm font-medium">金額を読み取り中...</p>
              <p className="text-xs text-white/70">初回は少し時間がかかります</p>
            </div>
          )}
        </div>

        <div className="space-y-3 p-4">
          {error && (
            <p className="rounded-xl bg-destructive/10 px-3 py-2 text-xs text-destructive">
              {error}
            </p>
          )}
          <p className="text-xs text-muted-foreground">
            レシート全体ではなく、合計金額付近だけを大きく撮影します。店名はあとから入力できます。画像は保存されません。
          </p>
          <div className="flex flex-col gap-2">
            <Button
              type="button"
              className="h-11 w-full rounded-xl"
              disabled={phase === "recognizing" || !cameraReady}
              onClick={() => {
                void handleCapture();
              }}
            >
              <Camera className="size-4" />
              {phase === "recognizing" ? "読み取り中..." : "撮影して金額を読む"}
            </Button>
            <Button
              type="button"
              variant="outline"
              className="h-11 w-full rounded-xl"
              disabled={phase === "recognizing"}
              onClick={handleClose}
            >
              キャンセル
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
