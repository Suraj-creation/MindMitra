import React, { useState } from "react";
import { Sparkles, Image as ImageIcon, HelpCircle, Code, CheckCircle, ExternalLink, Download } from "lucide-react";

export const AssetStudioView: React.FC = () => {
  const [selectedAsset, setSelectedAsset] = useState<"tea" | "river">("tea");

  return (
    <div className="max-w-5xl mx-auto px-4 py-8 space-y-8">
      {/* Header */}
      <div className="pb-6 border-b border-[#e6ddcf]">
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold uppercase tracking-wider text-[#5e6f4a] bg-[#e5ece0] px-2.5 py-1 rounded-md">
            Platform Capabilities & Asset Studio
          </span>
          <span className="text-xs text-[#7a7a71]">Google AI Studio Integration</span>
        </div>
        <h1 className="text-3xl font-bold font-serif text-[#332f29] mt-2">
          Platform Development & Asset Generation
        </h1>
        <p className="text-sm text-[#6b6b63] mt-1 max-w-2xl">
          Answering your inquiry regarding Stitch API integration, automated image asset creation, and repository pulling.
        </p>
      </div>

      {/* Answer Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Stitch Card */}
        <div className="bg-[#f7eadc] border border-[#e6ddcf] p-6 rounded-2xl space-y-3">
          <div className="w-10 h-10 rounded-xl bg-[#ffefd4] text-[#9a3c04] flex items-center justify-center">
            <Code size={22} />
          </div>
          <h2 className="text-xl font-bold font-serif text-[#332f29]">
            Can you connect to Stitch through an API?
          </h2>
          <div className="text-xs text-[#6b6b63] space-y-2 leading-relaxed">
            <p>
              <strong className="text-[#332f29]">Architecture:</strong> <em>Stitch</em> is Google’s AI-powered UI design tool within the AI Studio ecosystem. Stitch does not currently offer an external public REST API for programmatic remote control.
            </p>
            <p>
              <strong className="text-[#332f29]">Integration in AI Studio:</strong> Within the platform, Stitch operates through an MCP (Model Context Protocol) interface. We can import, explore, modify, and host Stitch-generated HTML/CSS prototypes (as seen in the <em>Stitch Prototypes</em> tab).
            </p>
          </div>
        </div>

        {/* Image Assets Card */}
        <div className="bg-[#f7eadc] border border-[#e6ddcf] p-6 rounded-2xl space-y-3">
          <div className="w-10 h-10 rounded-xl bg-[#e5ece0] text-[#5e6f4a] flex items-center justify-center">
            <Sparkles size={22} />
          </div>
          <h2 className="text-xl font-bold font-serif text-[#332f29]">
            Can you create image assets in platform development?
          </h2>
          <div className="text-xs text-[#6b6b63] space-y-2 leading-relaxed">
            <p>
              <strong className="text-[#332f29]">Yes, natively!</strong> In this development workspace, we use built-in image generation tools powered by Google’s latest Imagen models.
            </p>
            <p>
              <strong className="text-[#332f29]">Custom Reminiscence Assets:</strong> We generated the two Assam watercolor reminiscence assets below specifically for Purnima’s cognitive care memory album.
            </p>
          </div>
        </div>
      </div>

      {/* Generated Assets Showcase */}
      <div className="bg-[#f7eadc] border border-[#e6ddcf] p-6 rounded-2xl space-y-6">
        <div>
          <h3 className="text-xl font-bold font-serif text-[#332f29] flex items-center gap-2">
            <ImageIcon size={22} className="text-[#5e6f4a]" />
            Generated Reminiscence Assets in MindMitra
          </h3>
          <p className="text-xs text-[#6b6b63] mt-1">
            Generated directly during platform development and stored in <code className="bg-[#fffaf1] px-1.5 py-0.5 rounded border border-[#e6ddcf]">public/assets/images/</code>.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Tea Garden Asset */}
          <div
            onClick={() => setSelectedAsset("tea")}
            className={`border-2 rounded-2xl overflow-hidden cursor-pointer transition-all ${
              selectedAsset === "tea" ? "border-[#5e6f4a] shadow-md" : "border-[#e6ddcf] hover:border-[#ccd9c2]"
            }`}
          >
            <img
              src="/assets/images/assam_tea_garden_1788977277508.jpg"
              alt="Assam Tea Garden watercolor"
              className="w-full h-56 object-cover"
            />
            <div className="p-4 bg-[#fbf1e3]">
              <div className="flex items-center justify-between">
                <p className="font-bold font-serif text-base text-[#332f29]">Assam Tea Garden Landscape</p>
                <span className="text-[10px] bg-[#e5ece0] text-[#38452d] font-bold px-2 py-0.5 rounded-full">
                  1:1 Aspect Ratio
                </span>
              </div>
              <p className="text-xs text-[#6b6b63] mt-1 leading-relaxed">
                Prompt: <em>"A serene watercolor illustration of lush green Assam tea gardens on gentle rolling hills with misty morning light and a distant wooden bridge, warm earthy tones."</em>
              </p>
            </div>
          </div>

          {/* Brahmaputra River Asset */}
          <div
            onClick={() => setSelectedAsset("river")}
            className={`border-2 rounded-2xl overflow-hidden cursor-pointer transition-all ${
              selectedAsset === "river" ? "border-[#5e6f4a] shadow-md" : "border-[#e6ddcf] hover:border-[#ccd9c2]"
            }`}
          >
            <img
              src="/assets/images/brahmaputra_river_1788977296883.jpg"
              alt="Brahmaputra River sunset"
              className="w-full h-56 object-cover"
            />
            <div className="p-4 bg-[#fbf1e3]">
              <div className="flex items-center justify-between">
                <p className="font-bold font-serif text-base text-[#332f29]">Brahmaputra Twilight River</p>
                <span className="text-[10px] bg-[#e5ece0] text-[#38452d] font-bold px-2 py-0.5 rounded-full">
                  1:1 Aspect Ratio
                </span>
              </div>
              <p className="text-xs text-[#6b6b63] mt-1 leading-relaxed">
                Prompt: <em>"A tranquil watercolor landscape of the Brahmaputra river in Assam at sunset, gentle golden water ripples, distant silhouette of small traditional wooden ferry boat."</em>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
