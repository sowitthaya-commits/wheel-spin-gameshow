'use client';

import React, { useState, useEffect } from 'react';
import { X, QrCode, Copy, Check, ExternalLink } from 'lucide-react';

interface JoinQrModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const JoinQrModal: React.FC<JoinQrModalProps> = ({ isOpen, onClose }) => {
  const [playUrl, setPlayUrl] = useState('');
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const origin = window.location.origin;
      setPlayUrl(`${origin}/play`);
    }
  }, []);

  const handleCopy = () => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(playUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  if (!isOpen) return null;

  const qrImageUrl = `https://api.qrserver.com/v1/create-qr-code/?size=280x280&data=${encodeURIComponent(playUrl)}&bgcolor=FFFFFF&color=0B0F2A`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-in fade-in duration-200">
      <div className="relative w-full max-w-sm rounded-3xl border border-gold/50 bg-stage-card/95 p-6 text-center shadow-2xl backdrop-blur-xl animate-in zoom-in-95">
        <button
          onClick={onClose}
          className="absolute right-4 top-4 rounded-full bg-white/10 p-2 text-white/70 hover:bg-white/20 hover:text-white transition"
          aria-label="Close"
        >
          <X className="h-5 w-5" />
        </button>

        <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-gold/20 text-gold">
          <QrCode className="h-6 w-6" />
        </div>

        <h3 className="text-xl font-black text-white">QR Code สำหรับผู้เล่น</h3>
        <p className="text-xs text-white/60 mt-1 mb-4">
          ให้ผู้เข้าร่วมงานสแกน QR Code ด้วยมือถือเพื่อเข้าหน้ากดหมุน
        </p>

        {/* QR Code Container */}
        <div className="mx-auto flex h-64 w-64 items-center justify-center rounded-2xl bg-white p-3 shadow-inner">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={qrImageUrl}
            alt="Join Game QR Code"
            className="h-full w-full object-contain"
          />
        </div>

        {/* Link Copy Bar */}
        <div className="mt-4 flex items-center gap-2 rounded-xl border border-white/20 bg-stage-dark p-2">
          <input
            type="text"
            readOnly
            value={playUrl}
            className="flex-1 bg-transparent text-xs text-white/90 truncate outline-none px-2"
          />
          <button
            onClick={handleCopy}
            className="flex items-center gap-1 rounded-lg bg-gold/20 text-gold px-2.5 py-1 text-xs font-bold hover:bg-gold/30 transition shrink-0"
          >
            {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
            <span>{copied ? 'คัดลอกแล้ว' : 'คัดลอก'}</span>
          </button>
        </div>

        <div className="mt-4">
          <a
            href={playUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 text-xs text-gold hover:underline"
          >
            <span>เปิดหน้านี้ในแท็บใหม่</span>
            <ExternalLink className="h-3.5 w-3.5" />
          </a>
        </div>
      </div>
    </div>
  );
};
