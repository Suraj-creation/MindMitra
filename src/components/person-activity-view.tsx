"use client";

import { Check, Heart, RefreshCw, Sparkles, Wind } from "lucide-react";
import { useState } from "react";

type FlowerItem = {
  id: string;
  name: string;
  assamese: string;
  color: string;
  emoji: string;
  note: string;
};

const FLOWERS: FlowerItem[] = [
  { id: "f1", name: "Marigold", assamese: "Gendhu Phul", color: "bg-[#f59e0b]", emoji: "🌼", note: "Bright golden marigold from your garden." },
  { id: "f2", name: "Nahor Blossom", assamese: "Nahor", color: "bg-[#ef4444]", emoji: "🌺", note: "Fragrant white and red flower of Assam." },
  { id: "f3", name: "Jasmine", assamese: "Beli / Tagar", color: "bg-[#f3f4f6]", emoji: "🌸", note: "Sweet scented evening flower." },
  { id: "f4", name: "Tulsi Leaves", assamese: "Tulsi Paat", color: "bg-[#10b981]", emoji: "🌿", note: "Holy basil leaves for morning puja." },
];

type TeaIngredient = {
  id: string;
  name: string;
  assamese: string;
  emoji: string;
  note: string;
};

const TEA_INGREDIENTS: TeaIngredient[] = [
  { id: "t1", name: "Fragrant Tea Leaves", assamese: "Chah Paat", emoji: "🍃", note: "Freshly harvested from the nearby tea estate." },
  { id: "t2", name: "Crushed Cardamom", assamese: "Elachi", emoji: "🌿", note: "Adds the sweet aroma to your 4:00 PM tea." },
  { id: "t3", name: "Fresh Ginger", assamese: "Ada", emoji: "🫚", note: "Warming ginger slice for gentle comfort." },
  { id: "t4", name: "Pure Jaggery", assamese: "Gur", emoji: "🍯", note: "Golden sweetness just as you like it." },
];

export function PersonActivityView() {
  const [activity, setActivity] = useState<"garland" | "tea" | "breath">("garland");

  // Garland state
  const [garland, setGarland] = useState<FlowerItem[]>([
    FLOWERS[0],
    FLOWERS[1],
  ]);

  // Tea basket state
  const [basket, setBasket] = useState<TeaIngredient[]>([
    TEA_INGREDIENTS[0],
  ]);

  const addFlower = (flower: FlowerItem) => {
    setGarland((prev) => [...prev, flower]);
  };

  const addTeaItem = (item: TeaIngredient) => {
    if (!basket.some((b) => b.id === item.id)) {
      setBasket((prev) => [...prev, item]);
    }
  };

  const resetGarland = () => {
    setGarland([FLOWERS[0]]);
  };

  const resetTea = () => {
    setBasket([TEA_INGREDIENTS[0]]);
  };

  return (
    <div className="flex flex-col gap-6 w-full max-w-7xl mx-auto pb-6">
      {/* Activity selector */}
      <div className="flex items-center gap-2 p-1.5 bg-[#eee1cc] rounded-xl max-w-2xl">
        <button
          type="button"
          onClick={() => setActivity("garland")}
          className={`flex-1 py-2.5 px-3 sm:px-4 rounded-lg font-bold text-sm sm:text-base transition-all ${
            activity === "garland"
              ? "bg-[#fffaf1] text-[#332f29] shadow-sm"
              : "text-[#6b6b63] hover:text-[#332f29]"
          }`}
        >
          🌼 Flower Garland
        </button>

        <button
          type="button"
          onClick={() => setActivity("tea")}
          className={`flex-1 py-2.5 px-3 sm:px-4 rounded-lg font-bold text-sm sm:text-base transition-all ${
            activity === "tea"
              ? "bg-[#fffaf1] text-[#332f29] shadow-sm"
              : "text-[#6b6b63] hover:text-[#332f29]"
          }`}
        >
          ☕ Afternoon Tea
        </button>

        <button
          type="button"
          onClick={() => setActivity("breath")}
          className={`flex-1 py-2.5 px-3 sm:px-4 rounded-lg font-bold text-sm sm:text-base transition-all ${
            activity === "breath"
              ? "bg-[#fffaf1] text-[#332f29] shadow-sm"
              : "text-[#6b6b63] hover:text-[#332f29]"
          }`}
        >
          🌬 Gentle Breath
        </button>
      </div>

      {/* 1. FLOWER GARLAND */}
      {activity === "garland" && (
        <section aria-label="Flower Garland Activity" className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Left: Available Flowers to String */}
          <div className="lg:col-span-5 flex flex-col gap-3.5 order-2 lg:order-1">
            <h4 className="text-lg font-bold text-[#332f29]">Choose flowers to string:</h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-3">
              {FLOWERS.map((fl) => (
                <button
                  key={fl.id}
                  type="button"
                  onClick={() => addFlower(fl)}
                  className="flex items-center gap-3.5 p-3.5 min-h-[70px] bg-[#fffaf1] hover:bg-[#eee1cc] active:scale-[0.98] border-2 border-[#e6ddcf] hover:border-[#5e6f4a] rounded-xl text-left transition-all shadow-sm"
                >
                  <span className="text-3xl shrink-0">{fl.emoji}</span>
                  <div>
                    <p className="text-base font-bold text-[#332f29]">{fl.name} ({fl.assamese})</p>
                    <p className="text-xs text-[#6b6b63]">{fl.note}</p>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Right: Current Garland Visualizer */}
          <div className="lg:col-span-7 bg-[#fffaf1] border-2 border-[#e6ddcf] rounded-2xl p-6 shadow-sm order-1 lg:order-2 flex flex-col justify-between min-h-[360px]">
            <div>
              <h3 className="text-2xl font-serif text-[#332f29] font-normal">
                Phulor Mala (Altar Flower Garland)
              </h3>
              <p className="text-sm sm:text-base text-[#6b6b63] mt-1">
                Tap any flower on the left to string it into your altar garland. Every combination is lovely.
              </p>

              <div className="mt-6 p-6 bg-[#fbf1e3] border-2 border-dashed border-[#d8b878] rounded-xl flex flex-col items-center justify-center min-h-[160px]">
                <span className="text-xs uppercase tracking-wider font-bold text-[#5e6f4a] mb-3">
                  Your Altar Garland
                </span>

                <div className="flex flex-wrap items-center justify-center gap-3">
                  {garland.map((fl, idx) => (
                    <div
                      key={`${fl.id}-${idx}`}
                      className="w-14 h-14 rounded-full bg-white shadow-sm border border-[#e6ddcf] flex items-center justify-center text-2xl animate-in zoom-in-50 duration-200"
                      title={fl.name}
                    >
                      {fl.emoji}
                    </div>
                  ))}
                </div>

                {garland.length >= 4 && (
                  <div className="mt-4 flex items-center gap-2 text-[#5e6f4a] font-serif text-lg font-medium text-center">
                    <Sparkles size={20} />
                    What a graceful garland you have woven today, Purnima baideu.
                  </div>
                )}
              </div>
            </div>

            <div className="flex justify-end mt-4">
              <button
                type="button"
                onClick={resetGarland}
                className="inline-flex items-center gap-2 text-xs font-bold text-[#6b6b63] hover:text-[#332f29] px-3 py-1.5 rounded-lg bg-[#eee1cc] hover:bg-[#d8b878]/40 transition-all"
              >
                <RefreshCw size={14} /> Start fresh
              </button>
            </div>
          </div>
        </section>
      )}

      {/* 2. AFTERNOON TEA BASKET */}
      {activity === "tea" && (
        <section aria-label="Afternoon Tea Basket" className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Left: Ingredients */}
          <div className="lg:col-span-5 flex flex-col gap-3.5 order-2 lg:order-1">
            <h4 className="text-lg font-bold text-[#332f29]">Select tea ingredients:</h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-3">
              {TEA_INGREDIENTS.map((item) => {
                const isAdded = basket.some((b) => b.id === item.id);
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => addTeaItem(item)}
                    className={`flex items-center gap-3.5 p-3.5 min-h-[70px] rounded-xl text-left border-2 transition-all shadow-sm ${
                      isAdded
                        ? "bg-[#eee1cc] border-[#5e6f4a]"
                        : "bg-[#fffaf1] border-[#e6ddcf] hover:border-[#a85e46]"
                    }`}
                  >
                    <span className="text-3xl shrink-0">{item.emoji}</span>
                    <div className="flex-1">
                      <p className="text-base font-bold text-[#332f29]">{item.name}</p>
                      <p className="text-xs text-[#6b6b63]">{item.note}</p>
                    </div>
                    {isAdded && <Check size={20} className="text-[#5e6f4a]" />}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Right: Tea Tray Visualizer */}
          <div className="lg:col-span-7 bg-[#fffaf1] border-2 border-[#e6ddcf] rounded-2xl p-6 shadow-sm order-1 lg:order-2 flex flex-col justify-between min-h-[360px]">
            <div>
              <h3 className="text-2xl font-serif text-[#332f29] font-normal">
                Preparing the 4:00 PM Tea
              </h3>
              <p className="text-sm sm:text-base text-[#6b6b63] mt-1">
                Select what we should include for our tea with Anu this afternoon.
              </p>

              <div className="mt-6 p-6 bg-[#fbf1e3] border-2 border-dashed border-[#a85e46]/40 rounded-xl flex flex-col items-center justify-center min-h-[160px]">
                <span className="text-xs uppercase tracking-wider font-bold text-[#a85e46] mb-3">
                  The Tea Tray
                </span>

                <div className="flex flex-wrap items-center justify-center gap-3">
                  {basket.map((item) => (
                    <div
                      key={item.id}
                      className="flex items-center gap-2 bg-white px-4 py-2.5 rounded-full border border-[#e6ddcf] shadow-sm text-base font-bold text-[#332f29]"
                    >
                      <span>{item.emoji}</span>
                      <span>{item.name}</span>
                    </div>
                  ))}
                </div>

                {basket.length >= 3 && (
                  <div className="mt-4 flex items-center gap-2 text-[#5e6f4a] font-serif text-lg font-medium text-center">
                    <Heart size={20} fill="currentColor" />
                    Your tea will be fragrant and comforting at 4:00 PM.
                  </div>
                )}
              </div>
            </div>

            <div className="flex justify-end mt-4">
              <button
                type="button"
                onClick={resetTea}
                className="inline-flex items-center gap-2 text-xs font-bold text-[#6b6b63] hover:text-[#332f29] px-3 py-1.5 rounded-lg bg-[#eee1cc] hover:bg-[#d8b878]/40 transition-all"
              >
                <RefreshCw size={14} /> Clear tray
              </button>
            </div>
          </div>
        </section>
      )}

      {/* 3. GENTLE BREATH */}
      {activity === "breath" && (
        <section aria-label="Gentle Breathing" className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center bg-[#fffaf1] border-2 border-[#e6ddcf] rounded-2xl p-6 lg:p-10 shadow-sm">
          <div className="lg:col-span-6 flex flex-col text-left">
            <div className="inline-flex items-center gap-2 text-[#5e6f4a] font-bold text-sm uppercase tracking-wider mb-2">
              <Wind size={20} />
              Courtyard Serenity
            </div>
            <h3 className="text-2xl sm:text-3xl font-serif text-[#332f29] font-normal">
              Gentle Courtyard Breath
            </h3>
            <p className="text-base text-[#6b6b63] mt-2 leading-relaxed">
              Feel the gentle air from the river Brahmaputra. Breathe slowly, at your own peaceful pace. There is no rush, only calm.
            </p>
            <p className="font-serif text-lg text-[#5e6f4a] mt-6 italic">
              "You are peaceful. You are safe. You are home in Tezpur with loved ones."
            </p>
          </div>

          <div className="lg:col-span-6 flex flex-col items-center justify-center p-6">
            <div className="relative w-52 h-52 flex items-center justify-center">
              <div className="absolute inset-0 rounded-full bg-[#5e6f4a]/20 animate-ping duration-1000 opacity-30" />
              <div className="w-44 h-44 rounded-full bg-[#eee1cc] border-4 border-[#5e6f4a] flex flex-col items-center justify-center shadow-inner">
                <span className="font-serif text-2xl font-bold text-[#332f29]">Breathe in</span>
                <span className="text-sm font-semibold text-[#5e6f4a] mt-1">Peace & Calm</span>
              </div>
            </div>
          </div>
        </section>
      )}
    </div>
  );
}
