import React from 'react';

export const HeroSection: React.FC = () => {
  return (
    <section className="pt-2 pb-1 text-center sm:text-left space-y-1">
      <h2 className="text-2xl sm:text-3xl md:text-4xl font-black tracking-tight text-white leading-tight">
        Terjemahkan Video &{' '}
        <span className="bg-gradient-to-r from-purple-400 via-pink-400 to-cyan-300 bg-clip-text text-transparent">
          Subtitle Otomatis
        </span>
      </h2>
      <p className="text-slate-400 text-xs sm:text-sm">
        Unggah video, pilih bahasa target, dan buat subtitle viral otomatis.
      </p>
    </section>
  );
};
