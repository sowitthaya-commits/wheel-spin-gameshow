'use client';

import React, { useState } from 'react';
import { SliceItem, GameConfig } from '../../types/game';
import {
  Image as ImageIcon,
  Plus,
  Trash2,
  Sliders,
  CheckCircle2,
  AlertCircle,
  Upload,
} from 'lucide-react';

interface PrizeSetupTabProps {
  config: GameConfig;
  slices: SliceItem[];
  onUpdateConfig: (updates: Partial<GameConfig>) => void;
  onUpdateSlices: (slices: SliceItem[]) => void;
  onNormalizePercentages: () => void;
}

export const PrizeSetupTab: React.FC<PrizeSetupTabProps> = ({
  config,
  slices,
  onUpdateConfig,
  onUpdateSlices,
  onNormalizePercentages,
}) => {
  const [localTitle, setLocalTitle] = useState(config.gameTitle);
  const [localLogoUrl, setLocalLogoUrl] = useState(config.logoUrl || '');

  // Calculate total percentage
  const totalPercentage = parseFloat(
    slices.reduce((sum, s) => sum + (s.percentage || 0), 0).toFixed(2)
  );
  const is100Percent = Math.abs(totalPercentage - 100) < 0.05;

  const handleTitleBlur = () => {
    onUpdateConfig({ gameTitle: localTitle });
  };

  const handleLogoUrlBlur = () => {
    onUpdateConfig({ logoUrl: localLogoUrl });
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64 = reader.result as string;
        setLocalLogoUrl(base64);
        onUpdateConfig({ logoUrl: base64 });
      };
      reader.readAsDataURL(file);
    }
  };

  // Slices Operations
  const handleSliceChange = (
    index: number,
    field: keyof SliceItem,
    value: string | number
  ) => {
    const updated = slices.map((s, idx) => {
      if (idx === index) {
        return { ...s, [field]: value };
      }
      return s;
    });
    onUpdateSlices(updated);
  };

  const handleAddSlice = () => {
    const newId = `slice_${Date.now()}`;
    const defaultColors = [
      '#FF2E63',
      '#08D9D6',
      '#F08A5D',
      '#B83B5E',
      '#00ADB5',
      '#F38181',
      '#FCE38A',
      '#4E54C8',
    ];
    const color = defaultColors[slices.length % defaultColors.length];

    const newSlice: SliceItem = {
      id: newId,
      label: `รางวัลที่ ${slices.length + 1}`,
      color,
      percentage: 10,
      stock: -1,
      wonCount: 0,
    };
    onUpdateSlices([...slices, newSlice]);
  };

  const handleDeleteSlice = (id: string) => {
    if (slices.length <= 2) {
      alert('ต้องมีอย่างน้อย 2 ช่องรางวัลในวงล้อ');
      return;
    }
    const updated = slices.filter(s => s.id !== id);
    onUpdateSlices(updated);
  };

  return (
    <div className="flex flex-col gap-6">
      {/* 1. Branding & Logo Setup */}
      <div className="rounded-3xl border border-white/10 bg-stage-card/80 p-6 backdrop-blur-md shadow-xl">
        <div className="flex items-center gap-2 text-gold font-bold text-sm uppercase tracking-wider mb-4">
          <ImageIcon className="h-5 w-5" />
          <span>ปรับแต่งโลโก้ & ชื่อเกม (Game Branding)</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="text-xs text-white/70 block mb-1">ชื่อเกมโชว์ (Game Title):</label>
            <input
              type="text"
              value={localTitle}
              onChange={e => setLocalTitle(e.target.value)}
              onBlur={handleTitleBlur}
              placeholder="เช่น LUCKY SPIN SHOW"
              className="w-full rounded-2xl border border-white/20 bg-stage-dark p-3 text-sm font-bold text-white focus:border-gold outline-none"
            />
          </div>

          <div>
            <label className="text-xs text-white/70 block mb-1">โลโก้ (Image URL หรือ อัปโหลด):</label>
            <div className="flex gap-2">
              <input
                type="text"
                value={localLogoUrl}
                onChange={e => setLocalLogoUrl(e.target.value)}
                onBlur={handleLogoUrlBlur}
                placeholder="https://example.com/logo.png"
                className="w-full rounded-2xl border border-white/20 bg-stage-dark p-3 text-sm text-white focus:border-gold outline-none"
              />
              <label className="flex items-center gap-1.5 shrink-0 rounded-2xl border border-white/20 bg-white/10 px-4 py-2 text-xs font-bold text-white cursor-pointer hover:bg-white/20 transition">
                <Upload className="h-4 w-4" />
                <span>อัปโหลด</span>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleFileUpload}
                  className="hidden"
                />
              </label>
            </div>
          </div>
        </div>

        {localLogoUrl && (
          <div className="mt-4 flex items-center gap-3 p-3 rounded-2xl bg-white/5 border border-white/10">
            <span className="text-xs text-white/60">พรีวิวโลโก้:</span>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={localLogoUrl} alt="Logo Preview" className="h-10 object-contain max-w-[120px]" />
            <button
              onClick={() => {
                setLocalLogoUrl('');
                onUpdateConfig({ logoUrl: '' });
              }}
              className="text-xs text-red-400 hover:underline ml-auto"
            >
              ลบโลโก้
            </button>
          </div>
        )}
      </div>

      {/* 2. Prize Slices Configuration */}
      <div className="rounded-3xl border border-white/10 bg-stage-card/80 p-6 backdrop-blur-md shadow-xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
          <div className="flex items-center gap-2 text-gold font-bold text-sm uppercase tracking-wider">
            <Sliders className="h-5 w-5" />
            <span>ช่องรางวัล & ความน่าจะเป็น (Proportional Slices)</span>
          </div>

          {/* Normalization & Total Indicator */}
          <div className="flex items-center gap-3">
            <div
              className={`flex items-center gap-1.5 rounded-full px-3.5 py-1 text-xs font-black border ${
                is100Percent
                  ? 'bg-green-500/20 text-green-400 border-green-500/40'
                  : 'bg-amber-500/20 text-amber-300 border-amber-500/40'
              }`}
            >
              {is100Percent ? (
                <CheckCircle2 className="h-4 w-4" />
              ) : (
                <AlertCircle className="h-4 w-4" />
              )}
              <span>รวม: {totalPercentage}%</span>
            </div>

            <button
              onClick={onNormalizePercentages}
              className="flex items-center gap-1.5 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 px-4 py-2 text-xs font-bold text-white shadow hover:brightness-110 active:scale-95 transition"
            >
              <span>ปรับสัดส่วนรวม 100% (Normalize)</span>
            </button>
          </div>
        </div>

        {/* Slice Rows Table / List */}
        <div className="flex flex-col gap-3">
          {slices.map((slice, index) => (
            <div
              key={slice.id}
              className="flex flex-col sm:flex-row sm:items-center gap-3 p-3.5 rounded-2xl bg-stage-dark border border-white/10 hover:border-white/20 transition"
            >
              {/* Color Picker */}
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={slice.color}
                  onChange={e => handleSliceChange(index, 'color', e.target.value)}
                  className="h-9 w-9 rounded-xl border-none cursor-pointer bg-transparent"
                />
                <span className="text-xs font-bold text-white/50 w-5">#{index + 1}</span>
              </div>

              {/* Label Input */}
              <div className="flex-1">
                <input
                  type="text"
                  value={slice.label}
                  onChange={e => handleSliceChange(index, 'label', e.target.value)}
                  placeholder="ชื่อของรางวัล"
                  className="w-full rounded-xl border border-white/20 bg-stage-card px-3 py-2 text-sm font-semibold text-white focus:border-gold outline-none"
                />
              </div>

              {/* Percentage Input */}
              <div className="flex items-center gap-1.5">
                <label className="text-xs text-white/60">โอกาส:</label>
                <div className="relative">
                  <input
                    type="number"
                    min="0"
                    max="100"
                    step="0.5"
                    value={slice.percentage}
                    onChange={e =>
                      handleSliceChange(index, 'percentage', parseFloat(e.target.value) || 0)
                    }
                    className="w-20 rounded-xl border border-white/20 bg-stage-card px-2.5 py-2 text-sm font-bold text-gold text-right pr-6 focus:border-gold outline-none"
                  />
                  <span className="absolute right-2 top-2 text-xs text-white/50">%</span>
                </div>
              </div>

              {/* Stock Input */}
              <div className="flex items-center gap-1.5">
                <label className="text-xs text-white/60">สต็อก:</label>
                <input
                  type="number"
                  min="-1"
                  value={slice.stock}
                  onChange={e =>
                    handleSliceChange(index, 'stock', parseInt(e.target.value) || -1)
                  }
                  title="-1 คือไม่จำกัดจำนวน"
                  className="w-16 rounded-xl border border-white/20 bg-stage-card px-2 py-2 text-sm font-semibold text-white text-center focus:border-gold outline-none"
                />
                <span className="text-[10px] text-white/40">(-1=ไม่จำกัด)</span>
              </div>

              {/* Delete Slice */}
              <button
                onClick={() => handleDeleteSlice(slice.id)}
                className="p-2 text-red-400 hover:text-red-300 rounded-xl hover:bg-red-500/10 transition sm:ml-auto"
                title="ลบช่องนี้"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          ))}
        </div>

        {/* Add Slice Button */}
        <div className="mt-4">
          <button
            onClick={handleAddSlice}
            className="flex items-center gap-2 rounded-2xl border-2 border-dashed border-white/20 bg-white/5 py-3 w-full justify-center text-sm font-bold text-white/80 hover:border-gold hover:text-gold hover:bg-gold/5 transition"
          >
            <Plus className="h-5 w-5" />
            <span>เพิ่มช่องรางวัลใหม่ (+ Add Prize Slice)</span>
          </button>
        </div>
      </div>
    </div>
  );
};
