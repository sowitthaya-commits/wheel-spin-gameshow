'use client';

import React, { useState } from 'react';
import { SliceItem, SpinHistoryLog } from '../../types/game';
import {
  BarChart3,
  Download,
  RotateCcw,
  Trophy,
  History,
  AlertTriangle,
} from 'lucide-react';

interface StatsTabProps {
  slices: SliceItem[];
  history: SpinHistoryLog[];
  onResetStats: () => Promise<void>;
}

export const StatsTab: React.FC<StatsTabProps> = ({
  slices,
  history,
  onResetStats,
}) => {
  const [showConfirmReset, setShowConfirmReset] = useState(false);
  const [isResetting, setIsResetting] = useState(false);

  // CSV Export with UTF-8 BOM
  const handleExportCSV = () => {
    if (history.length === 0) {
      alert('ยังไม่มีประวัติการหมุนรางวัลสำหรับส่งออก');
      return;
    }

    const headers = ['รอบที่ (Round)', 'เวลา (Timestamp)', 'ชื่อผู้เล่น (Player)', 'รางวัลที่ได้ (Prize)', 'ประเภทการกด (Trigger)'];
    const rows = history.map(item => [
      item.round,
      new Date(item.timestamp).toLocaleString('th-TH'),
      `"${item.playerName.replace(/"/g, '""')}"`,
      `"${item.prizeLabel.replace(/"/g, '""')}"`,
      item.triggerType,
    ]);

    const csvContent = '\uFEFF' + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `wheel_spin_history_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleConfirmReset = async () => {
    setIsResetting(true);
    await onResetStats();
    setIsResetting(false);
    setShowConfirmReset(false);
  };

  return (
    <div className="flex flex-col gap-6">
      {/* 1. Prize Won Tallies & Stock Summary */}
      <div className="rounded-3xl border border-white/10 bg-stage-card/80 p-6 backdrop-blur-md shadow-xl">
        <div className="flex items-center gap-2 text-gold font-bold text-sm uppercase tracking-wider mb-4">
          <Trophy className="h-5 w-5" />
          <span>สรุปผลการออกรางวัล & สต็อกคงเหลือ (Prize Statistics)</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {slices.map(slice => {
            const hasStockLimit = slice.stock !== -1;
            const remaining = hasStockLimit ? Math.max(0, slice.stock - slice.wonCount) : 'ไม่จำกัด';
            const isOutOfStock = hasStockLimit && remaining === 0;

            return (
              <div
                key={slice.id}
                className="flex flex-col p-4 rounded-2xl bg-stage-dark border border-white/10 relative overflow-hidden"
              >
                <div
                  className="absolute top-0 left-0 bottom-0 w-2"
                  style={{ backgroundColor: slice.color }}
                />

                <div className="ml-2">
                  <span className="text-sm font-bold text-white block truncate">
                    {slice.label}
                  </span>

                  <div className="mt-3 flex items-center justify-between text-xs">
                    <span className="text-white/60">ออกรางวัลแล้ว:</span>
                    <span className="font-mono text-base font-black text-gold">
                      {slice.wonCount} ครั้ง
                    </span>
                  </div>

                  <div className="mt-1 flex items-center justify-between text-xs">
                    <span className="text-white/60">สต็อกคงเหลือ:</span>
                    <span
                      className={`font-semibold ${
                        isOutOfStock ? 'text-red-400 font-bold' : 'text-white/80'
                      }`}
                    >
                      {remaining}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 2. Chronological History Log Table */}
      <div className="rounded-3xl border border-white/10 bg-stage-card/80 p-6 backdrop-blur-md shadow-xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
          <div className="flex items-center gap-2 text-gold font-bold text-sm uppercase tracking-wider">
            <History className="h-5 w-5" />
            <span>ประวัติการหมุนทั้งหมด ({history.length} รายการ)</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleExportCSV}
              className="flex items-center gap-1.5 rounded-2xl bg-emerald-600 px-4 py-2 text-xs font-bold text-white hover:bg-emerald-500 shadow transition active:scale-95"
            >
              <Download className="h-4 w-4" />
              <span>ส่งออก CSV (Excel)</span>
            </button>

            <button
              onClick={() => setShowConfirmReset(true)}
              className="flex items-center gap-1.5 rounded-2xl bg-red-600/20 border border-red-500/40 px-3.5 py-2 text-xs font-bold text-red-300 hover:bg-red-600/30 transition"
            >
              <RotateCcw className="h-4 w-4" />
              <span>รีเซ็ตสถิติ</span>
            </button>
          </div>
        </div>

        {history.length === 0 ? (
          <div className="p-8 text-center text-sm text-white/50 border-2 border-dashed border-white/10 rounded-2xl">
            ยังไม่มีประวัติการหมุนรางวัล
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-white/80">
              <thead className="bg-white/5 text-[11px] font-bold uppercase text-gold-light/70 border-b border-white/10">
                <tr>
                  <th className="py-3 px-4">รอบ</th>
                  <th className="py-3 px-4">เวลา</th>
                  <th className="py-3 px-4">ผู้เล่น</th>
                  <th className="py-3 px-4">รางวัลที่ได้</th>
                  <th className="py-3 px-4 text-center">ประเภทการกด</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 font-medium">
                {history.map(item => (
                  <tr key={item.id} className="hover:bg-white/5 transition">
                    <td className="py-3 px-4 font-bold text-gold">#{item.round}</td>
                    <td className="py-3 px-4 text-white/60">
                      {new Date(item.timestamp).toLocaleTimeString('th-TH')}
                    </td>
                    <td className="py-3 px-4 font-bold text-white">{item.playerName}</td>
                    <td className="py-3 px-4 text-gold-light">{item.prizeLabel}</td>
                    <td className="py-3 px-4 text-center">
                      <span
                        className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold ${
                          item.triggerType === 'MANUAL'
                            ? 'bg-blue-500/20 text-blue-300 border border-blue-500/30'
                            : 'bg-purple-500/20 text-purple-300 border border-purple-500/30'
                        }`}
                      >
                        {item.triggerType}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Confirmation Modal for Reset Stats */}
      {showConfirmReset && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="w-full max-w-sm rounded-3xl border border-red-500/50 bg-stage-dark p-6 text-center shadow-2xl">
            <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-red-500/20 text-red-400">
              <AlertTriangle className="h-6 w-6" />
            </div>
            <h3 className="text-lg font-bold text-white">ยืนยันการรีเซ็ตสถิติ?</h3>
            <p className="text-xs text-white/70 mt-1">
              การกระทำนี้จะล้างประวัติการหมุนทั้งหมด และรีเซ็ตจำนวนครั้งที่ได้รับรางวัลเป็น 0 (ไม่สามารถย้อนกลับได้)
            </p>

            <div className="mt-6 flex gap-3">
              <button
                onClick={() => setShowConfirmReset(false)}
                className="flex-1 rounded-2xl bg-white/10 py-2.5 text-xs font-bold text-white hover:bg-white/20 transition"
              >
                ยกเลิก
              </button>
              <button
                onClick={handleConfirmReset}
                disabled={isResetting}
                className="flex-1 rounded-2xl bg-red-600 py-2.5 text-xs font-bold text-white hover:bg-red-500 transition disabled:opacity-50"
              >
                {isResetting ? 'กำลังรีเซ็ต...' : 'ยืนยันรีเซ็ต'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
