import React, { useState, useEffect, useRef } from 'react';
import { 
  X, Download, Copy, Check, Sparkles, Share2, 
  Instagram, Smartphone, Globe, ShieldCheck, Award, 
  Palette, ExternalLink, RefreshCw, Star, Megaphone
} from 'lucide-react';
import confetti from 'canvas-confetti';

interface InstagramFlyerModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultAffiliateCode?: string;
}

type ThemeType = 'vernunt_luxury' | 'instagram_sunset' | 'midnight_gold';

export default function InstagramFlyerModal({
  isOpen,
  onClose,
  defaultAffiliateCode
}: InstagramFlyerModalProps) {
  const [theme, setTheme] = useState<ThemeType>('vernunt_luxury');
  const [copiedCaption, setCopiedCaption] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [generatedImageUrl, setGeneratedImageUrl] = useState<string>('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [customHandle, setCustomHandle] = useState('@vernunt');
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const instagramCaption = `📢 Calling all Content Creators, Parenting Bloggers & Influencers! 🌟

Are you ready to unlock direct brand collaborations and sponsored partnerships? 🚀

Vernunt is partnering with top child-friendly brands, activity centers, daycares, and kids' brands looking to collaborate with creators like YOU!

✨ Why register with Vernunt?
💼 Direct Brand Collaboration Deals
🎁 Product Gifting, Samples & Event VIP Passes
💰 Fast & Transparent Payouts (Direct UPI / Bank)
🛡️ 100% Free Registration — Zero agency lock-ins

👉 How to join?
Simply register on our official portal:
🔗 https://app.vernunt.com

Drop a comment or DM us once you've signed up so our creator team can fast-track your profile! 💌

#Vernunt #InfluencerMarketing #BrandCollaboration #ContentCreators #ParentingInfluencer #MomBloggersIndia #DadBloggers #CreatorEconomy #BrandDeals #InfluencersWanted #KidsBrandCollabs #CollabOpportunities`;

  // Draw 1080x1080 canvas
  const renderCanvasImage = () => {
    setIsGenerating(true);
    const canvas = canvasRef.current || document.createElement('canvas');
    canvas.width = 1080;
    canvas.height = 1080;
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      setIsGenerating(false);
      return;
    }

    // 1. Background Gradient
    if (theme === 'vernunt_luxury') {
      const grad = ctx.createLinearGradient(0, 0, 1080, 1080);
      grad.addColorStop(0, '#450a0a'); // deep crimson
      grad.addColorStop(0.35, '#881337'); // rose
      grad.addColorStop(0.7, '#991b1b'); // red
      grad.addColorStop(1, '#1e1b4b'); // deep indigo corner
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, 1080, 1080);

      // Radial glow top-left
      const radial1 = ctx.createRadialGradient(200, 200, 20, 200, 200, 600);
      radial1.addColorStop(0, 'rgba(251, 191, 36, 0.25)');
      radial1.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = radial1;
      ctx.fillRect(0, 0, 1080, 1080);

      // Radial glow bottom-right
      const radial2 = ctx.createRadialGradient(880, 880, 20, 880, 880, 600);
      radial2.addColorStop(0, 'rgba(244, 63, 94, 0.35)');
      radial2.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = radial2;
      ctx.fillRect(0, 0, 1080, 1080);
    } else if (theme === 'instagram_sunset') {
      const grad = ctx.createLinearGradient(0, 0, 1080, 1080);
      grad.addColorStop(0, '#833ab4'); // purple
      grad.addColorStop(0.3, '#c13584'); // insta magenta
      grad.addColorStop(0.65, '#e1306c'); // rose red
      grad.addColorStop(0.9, '#fd1d1d'); // coral
      grad.addColorStop(1, '#f77737'); // warm orange
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, 1080, 1080);

      // Soft glow
      const radial = ctx.createRadialGradient(540, 400, 50, 540, 400, 700);
      radial.addColorStop(0, 'rgba(255, 230, 150, 0.25)');
      radial.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = radial;
      ctx.fillRect(0, 0, 1080, 1080);
    } else {
      // midnight_gold
      const grad = ctx.createLinearGradient(0, 0, 1080, 1080);
      grad.addColorStop(0, '#030712'); // obsidian
      grad.addColorStop(0.5, '#0f172a'); // slate 900
      grad.addColorStop(1, '#172554'); // dark blue
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, 1080, 1080);

      const radial = ctx.createRadialGradient(540, 300, 20, 540, 300, 650);
      radial.addColorStop(0, 'rgba(251, 191, 36, 0.22)');
      radial.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = radial;
      ctx.fillRect(0, 0, 1080, 1080);
    }

    // 2. Decorative Background Circles & Grid accents
    ctx.save();
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.08)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(100, 950, 250, 0, Math.PI * 2);
    ctx.stroke();

    ctx.beginPath();
    ctx.arc(980, 120, 220, 0, Math.PI * 2);
    ctx.stroke();

    // Geometric sparkle stars
    const drawStar = (cx: number, cy: number, spikes: number, outerRadius: number, innerRadius: number, color: string) => {
      let rot = (Math.PI / 2) * 3;
      let x = cx;
      let y = cy;
      const step = Math.PI / spikes;

      ctx.beginPath();
      ctx.moveTo(cx, cy - outerRadius);
      for (let i = 0; i < spikes; i++) {
        x = cx + Math.cos(rot) * outerRadius;
        y = cy + Math.sin(rot) * outerRadius;
        ctx.lineTo(x, y);
        rot += step;

        x = cx + Math.cos(rot) * innerRadius;
        y = cy + Math.sin(rot) * innerRadius;
        ctx.lineTo(x, y);
        rot += step;
      }
      ctx.lineTo(cx, cy - outerRadius);
      ctx.closePath();
      ctx.fillStyle = color;
      ctx.fill();
    };

    drawStar(140, 140, 4, 24, 8, 'rgba(251, 191, 36, 0.7)');
    drawStar(960, 260, 4, 30, 10, 'rgba(253, 224, 71, 0.8)');
    drawStar(920, 920, 4, 26, 9, 'rgba(251, 191, 36, 0.6)');
    drawStar(80, 520, 4, 18, 6, 'rgba(255, 255, 255, 0.4)');
    ctx.restore();

    // 3. TOP BRAND HEADER
    ctx.save();
    // Vernunt Logo text & verified badge
    ctx.font = '900 42px "Times New Roman", Georgia, serif';
    ctx.fillStyle = '#ffffff';
    ctx.textAlign = 'center';
    ctx.shadowColor = 'rgba(0, 0, 0, 0.4)';
    ctx.shadowBlur = 10;
    ctx.fillText('VERNUNT', 540, 105);

    // Header Pill
    ctx.shadowBlur = 0;
    ctx.fillStyle = 'rgba(255, 255, 255, 0.15)';
    const pillWidth = 440;
    const pillHeight = 36;
    const pillX = 540 - pillWidth / 2;
    const pillY = 125;
    ctx.beginPath();
    ctx.roundRect(pillX, pillY, pillWidth, pillHeight, 18);
    ctx.fill();
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
    ctx.lineWidth = 1.5;
    ctx.stroke();

    ctx.font = '800 15px sans-serif';
    ctx.fillStyle = '#fef08a'; // light yellow
    ctx.textAlign = 'center';
    ctx.fillText('⭐ OFFICIAL CREATOR & BRAND COLLABORATION HUB ⭐', 540, 149);
    ctx.restore();

    // 4. ATTENTION INFLUENCERS BADGE
    ctx.save();
    const alertPillWidth = 660;
    const alertPillHeight = 56;
    const alertX = 540 - alertPillWidth / 2;
    const alertY = 195;

    // Glowing Pill
    ctx.shadowColor = 'rgba(245, 158, 11, 0.6)';
    ctx.shadowBlur = 24;
    ctx.fillStyle = '#f59e0b';
    ctx.beginPath();
    ctx.roundRect(alertX, alertY, alertPillWidth, alertPillHeight, 28);
    ctx.fill();

    ctx.shadowBlur = 0;
    ctx.font = '900 24px sans-serif';
    ctx.fillStyle = '#0f172a';
    ctx.textAlign = 'center';
    ctx.fillText('📢 ATTENTION INFLUENCERS & CREATORS!', 540, 232);
    ctx.restore();

    // 5. MAIN HEADLINE
    ctx.save();
    ctx.textAlign = 'center';
    ctx.shadowColor = 'rgba(0, 0, 0, 0.6)';
    ctx.shadowBlur = 16;

    ctx.font = '900 58px sans-serif';
    ctx.fillStyle = '#ffffff';
    ctx.fillText('GET EXCLUSIVE BRAND', 540, 315);

    ctx.font = '900 68px "Times New Roman", Georgia, serif';
    const goldGradient = ctx.createLinearGradient(300, 340, 780, 390);
    goldGradient.addColorStop(0, '#fef08a');
    goldGradient.addColorStop(0.5, '#f59e0b');
    goldGradient.addColorStop(1, '#fbbf24');
    ctx.fillStyle = goldGradient;
    ctx.fillText('COLLABORATIONS', 540, 390);

    ctx.font = '700 24px sans-serif';
    ctx.fillStyle = '#fde047';
    ctx.fillText('& PAID SPONSORSHIP OPPORTUNITIES', 540, 435);
    ctx.restore();

    // 6. CENTRAL HERO CALL-TO-ACTION CARD (THE CORE MESSAGE)
    ctx.save();
    const heroCardWidth = 860;
    const heroCardHeight = 220;
    const heroCardX = 540 - heroCardWidth / 2;
    const heroCardY = 475;

    // Outer card glow & border
    ctx.shadowColor = 'rgba(0, 0, 0, 0.5)';
    ctx.shadowBlur = 30;
    ctx.shadowOffsetY = 12;
    ctx.fillStyle = 'rgba(15, 23, 42, 0.85)';
    ctx.beginPath();
    ctx.roundRect(heroCardX, heroCardY, heroCardWidth, heroCardHeight, 32);
    ctx.fill();

    ctx.shadowBlur = 0;
    ctx.shadowOffsetY = 0;
    ctx.strokeStyle = 'rgba(251, 191, 36, 0.6)';
    ctx.lineWidth = 3;
    ctx.stroke();

    // Card Inner Content
    ctx.textAlign = 'center';
    ctx.font = '800 20px sans-serif';
    ctx.fillStyle = '#cbd5e1';
    ctx.fillText('TOP PARENTING, LIFESTYLE & KIDS BRANDS ARE WAITING FOR YOU!', 540, 520);

    // Call to action sub-label
    ctx.font = '900 18px sans-serif';
    ctx.fillStyle = '#f59e0b';
    ctx.fillText('👉 REGISTER FREE ON THE OFFICIAL PLATFORM:', 540, 558);

    // Website Domain Badge Box
    const domainBoxW = 620;
    const domainBoxH = 68;
    const domainBoxX = 540 - domainBoxW / 2;
    const domainBoxY = 585;

    const domainGrad = ctx.createLinearGradient(domainBoxX, domainBoxY, domainBoxX + domainBoxW, domainBoxY);
    domainGrad.addColorStop(0, '#dc2626');
    domainGrad.addColorStop(0.5, '#ea580c');
    domainGrad.addColorStop(1, '#d97706');
    ctx.fillStyle = domainGrad;
    ctx.shadowColor = 'rgba(234, 88, 12, 0.5)';
    ctx.shadowBlur = 20;
    ctx.beginPath();
    ctx.roundRect(domainBoxX, domainBoxY, domainBoxW, domainBoxH, 20);
    ctx.fill();

    ctx.shadowBlur = 0;
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 2.5;
    ctx.stroke();

    ctx.font = '900 36px monospace, sans-serif';
    ctx.fillStyle = '#ffffff';
    ctx.textAlign = 'center';
    ctx.fillText('app.vernunt.com', 540, 632);
    ctx.restore();

    // 7. FOUR KEY CREATOR BENEFITS (2x2 GRID)
    const benefits = [
      { icon: '💼', title: 'PAID BRAND DEALS', desc: 'Direct sponsorships & campaigns' },
      { icon: '🎁', title: 'FREE GIFTING & PERKS', desc: 'Toys, kits & VIP family passes' },
      { icon: '⚡', title: 'INSTANT PAYOUTS', desc: 'Direct UPI & bank settlement' },
      { icon: '🛡️', title: '100% FREE SIGNUP', desc: 'Zero fees & keep 100% rights' }
    ];

    const cardW = 415;
    const cardH = 92;
    const gapX = 30;
    const startX = 540 - cardW - gapX / 2;
    const startY = 725;

    benefits.forEach((b, idx) => {
      const col = idx % 2;
      const row = Math.floor(idx / 2);
      const bx = startX + col * (cardW + gapX);
      const by = startY + row * (cardH + 20);

      ctx.save();
      ctx.fillStyle = 'rgba(255, 255, 255, 0.12)';
      ctx.beginPath();
      ctx.roundRect(bx, by, cardW, cardH, 20);
      ctx.fill();
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.25)';
      ctx.lineWidth = 1.5;
      ctx.stroke();

      // Icon
      ctx.font = '36px sans-serif';
      ctx.textAlign = 'left';
      ctx.fillText(b.icon, bx + 22, by + 58);

      // Title & Desc
      ctx.font = '900 17px sans-serif';
      ctx.fillStyle = '#ffffff';
      ctx.fillText(b.title, bx + 78, by + 40);

      ctx.font = '600 13px sans-serif';
      ctx.fillStyle = '#fde68a';
      ctx.fillText(b.desc, bx + 78, by + 66);
      ctx.restore();
    });

    // 8. FOOTER BANNER
    ctx.save();
    const footerW = 860;
    const footerH = 80;
    const footerX = 540 - footerW / 2;
    const footerY = 945;

    ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
    ctx.beginPath();
    ctx.roundRect(footerX, footerY, footerW, footerH, 22);
    ctx.fill();
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
    ctx.lineWidth = 1.5;
    ctx.stroke();

    ctx.textAlign = 'center';
    ctx.font = '800 18px sans-serif';
    ctx.fillStyle = '#ffffff';
    ctx.fillText('🔗 LINK IN BIO OR OPEN BROWSER: app.vernunt.com', 540, 980);

    ctx.font = '600 13px sans-serif';
    ctx.fillStyle = '#fef08a';
    ctx.fillText('Tag @Vernunt • #VernuntCreators • #BrandCollabs • #InfluencersWanted', 540, 1008);
    ctx.restore();

    // Finalize image URL
    try {
      const dataUrl = canvas.toDataURL('image/png', 1.0);
      setGeneratedImageUrl(dataUrl);
    } catch (err) {
      console.error('Canvas export error:', err);
    }
    setIsGenerating(false);
  };

  useEffect(() => {
    if (isOpen) {
      // Allow DOM to settle then render
      setTimeout(() => {
        renderCanvasImage();
      }, 100);
    }
  }, [isOpen, theme]);

  if (!isOpen) return null;

  // Handle Download PNG
  const handleDownloadImage = () => {
    if (!generatedImageUrl) return;
    const link = document.createElement('a');
    link.download = `vernunt-instagram-influencer-collab-${theme}.png`;
    link.href = generatedImageUrl;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    confetti({
      particleCount: 60,
      spread: 70,
      origin: { y: 0.7 }
    });
  };

  // Copy Caption to Clipboard
  const handleCopyCaption = () => {
    navigator.clipboard.writeText(instagramCaption);
    setCopiedCaption(true);
    setTimeout(() => setCopiedCaption(false), 2500);
  };

  // Copy Link to Clipboard
  const handleCopyLink = () => {
    navigator.clipboard.writeText('https://app.vernunt.com');
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-950/80 backdrop-blur-md animate-fadeIn overflow-y-auto">
      {/* Hidden off-screen canvas for high-DPI 1080x1080 rendering */}
      <canvas ref={canvasRef} style={{ display: 'none' }} width={1080} height={1080} />

      <div className="relative w-full max-w-4xl bg-slate-900 border border-slate-700/80 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        
        {/* MODAL HEADER */}
        <div className="px-5 py-4 bg-gradient-to-r from-slate-900 via-rose-950 to-slate-900 border-b border-slate-800 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-2xl bg-gradient-to-tr from-rose-500 to-amber-500 flex items-center justify-center text-white shadow-md">
              <Instagram className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base sm:text-lg font-black font-serif text-white tracking-wide">
                  Instagram Influencer Flyer Generator
                </h3>
                <span className="px-2 py-0.5 rounded-full bg-amber-400 text-slate-950 text-[10px] font-black uppercase tracking-wider">
                  1080 x 1080 HD
                </span>
              </div>
              <p className="text-xs text-rose-200">
                Post on Instagram to invite creators to register on <strong className="text-white underline">app.vernunt.com</strong>
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-full transition cursor-pointer"
            title="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* MODAL BODY */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          
          {/* LEFT: LIVE PREVIEW & DOWNLOAD (7 Cols) */}
          <div className="lg:col-span-7 flex flex-col items-center space-y-4">
            
            {/* Theme Selector Pills */}
            <div className="w-full flex items-center justify-between gap-2 p-1.5 bg-slate-950 rounded-2xl border border-slate-800 text-xs">
              <span className="text-[11px] font-bold text-slate-400 pl-2 flex items-center gap-1">
                <Palette className="w-3.5 h-3.5 text-amber-400" />
                <span>Theme:</span>
              </span>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => setTheme('vernunt_luxury')}
                  className={`px-3 py-1.5 rounded-xl font-extrabold transition cursor-pointer text-[11px] ${
                    theme === 'vernunt_luxury' 
                      ? 'bg-gradient-to-r from-red-600 to-rose-700 text-white shadow-xs' 
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  🍷 Vernunt Royal
                </button>
                <button
                  type="button"
                  onClick={() => setTheme('instagram_sunset')}
                  className={`px-3 py-1.5 rounded-xl font-extrabold transition cursor-pointer text-[11px] ${
                    theme === 'instagram_sunset' 
                      ? 'bg-gradient-to-r from-purple-600 via-rose-600 to-amber-500 text-white shadow-xs' 
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  🌅 Sunset Glow
                </button>
                <button
                  type="button"
                  onClick={() => setTheme('midnight_gold')}
                  className={`px-3 py-1.5 rounded-xl font-extrabold transition cursor-pointer text-[11px] ${
                    theme === 'midnight_gold' 
                      ? 'bg-gradient-to-r from-slate-800 to-blue-900 text-amber-300 shadow-xs' 
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  ✨ Midnight Gold
                </button>
              </div>
            </div>

            {/* 1:1 Aspect Ratio Image Frame */}
            <div className="relative w-full max-w-[420px] aspect-square rounded-3xl overflow-hidden border-2 border-slate-700 shadow-2xl bg-slate-950 flex items-center justify-center group">
              {generatedImageUrl ? (
                <img 
                  src={generatedImageUrl} 
                  alt="Vernunt Influencer Collaboration Instagram Post" 
                  className="w-full h-full object-contain"
                  referrerPolicy="no-referrer"
                />
              ) : (
                <div className="text-center p-6 space-y-2 text-slate-400">
                  <RefreshCw className="w-8 h-8 animate-spin mx-auto text-amber-400" />
                  <p className="text-xs font-bold">Rendering 1080x1080 HD Graphic...</p>
                </div>
              )}

              {/* Hover Overlay Hint */}
              <div className="absolute inset-0 bg-slate-950/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3 backdrop-blur-xs">
                <button
                  type="button"
                  onClick={handleDownloadImage}
                  className="px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white font-extrabold rounded-xl text-xs flex items-center gap-1.5 shadow-lg transform hover:scale-105 transition cursor-pointer"
                >
                  <Download className="w-4 h-4" />
                  <span>Download Image</span>
                </button>
              </div>
            </div>

            {/* Primary Action Buttons */}
            <div className="w-full max-w-[420px] flex flex-col sm:flex-row items-center gap-2.5">
              <button
                type="button"
                onClick={handleDownloadImage}
                disabled={!generatedImageUrl}
                className="w-full sm:flex-1 py-3 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 active:scale-95 text-white font-black rounded-2xl text-xs transition flex items-center justify-center gap-2 cursor-pointer shadow-lg disabled:opacity-50"
              >
                <Download className="w-4 h-4 animate-bounce" />
                <span>Download High-Res 1080x1080 PNG</span>
              </button>

              <button
                type="button"
                onClick={handleCopyLink}
                className="w-full sm:w-auto px-4 py-3 bg-slate-800 hover:bg-slate-700 active:scale-95 text-slate-200 hover:text-white font-bold rounded-2xl text-xs transition flex items-center justify-center gap-1.5 cursor-pointer border border-slate-700"
              >
                {copiedLink ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                <span>{copiedLink ? 'Copied Link!' : 'Copy Link URL'}</span>
              </button>
            </div>

            <div className="text-center text-[11px] text-slate-400 font-mono">
              Ready for Instagram Feed (1:1), Stories & WhatsApp Status!
            </div>
          </div>

          {/* RIGHT: INSTAGRAM CAPTION & POSTING GUIDE (5 Cols) */}
          <div className="lg:col-span-5 space-y-4">
            
            {/* Quick Summary Card */}
            <div className="bg-slate-950/80 rounded-2xl p-4 border border-slate-800 space-y-2.5">
              <div className="flex items-center gap-2 text-amber-300 font-serif font-black text-sm">
                <Sparkles className="w-4 h-4 text-amber-400" />
                <span>Ready-To-Post Campaign Assets</span>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed">
                Post this eye-catching graphic on your Instagram feed or story. It encourages parenting, mom/dad bloggers, and lifestyle creators to register directly at <strong className="text-amber-300">app.vernunt.com</strong>.
              </p>

              <div className="pt-1 flex flex-wrap gap-1.5 text-[10px] font-bold">
                <span className="px-2 py-0.5 rounded-md bg-rose-500/20 text-rose-300 border border-rose-500/30">
                  ✓ Verified Brands
                </span>
                <span className="px-2 py-0.5 rounded-md bg-amber-500/20 text-amber-300 border border-amber-500/30">
                  ✓ 100% Free
                </span>
                <span className="px-2 py-0.5 rounded-md bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  ✓ High Payouts
                </span>
              </div>
            </div>

            {/* Ready-to-Copy Instagram Caption */}
            <div className="bg-slate-950/80 rounded-2xl p-4 border border-slate-800 space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-black uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
                  <Instagram className="w-3.5 h-3.5 text-rose-400" />
                  <span>Instagram Caption & Hashtags</span>
                </label>
                <button
                  type="button"
                  onClick={handleCopyCaption}
                  className="px-3 py-1 bg-rose-600 hover:bg-rose-500 active:scale-95 text-white font-extrabold text-[11px] rounded-xl transition flex items-center gap-1 cursor-pointer shadow-xs"
                >
                  {copiedCaption ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                  <span>{copiedCaption ? 'Copied!' : 'Copy Caption'}</span>
                </button>
              </div>

              <div className="bg-slate-900/90 rounded-xl p-3 border border-slate-800 text-[11px] text-slate-300 font-sans leading-relaxed max-h-56 overflow-y-auto whitespace-pre-line select-all">
                {instagramCaption}
              </div>

              <div className="text-[10px] text-slate-400 flex items-center justify-between pt-1">
                <span>Optimized with high-reach creator hashtags</span>
                <button 
                  type="button"
                  onClick={handleCopyCaption}
                  className="text-amber-400 hover:underline font-bold cursor-pointer"
                >
                  Tap to Copy All
                </button>
              </div>
            </div>

            {/* Quick 3-Step Posting Instructions */}
            <div className="bg-gradient-to-br from-slate-950 to-slate-900 rounded-2xl p-4 border border-slate-800/80 space-y-2.5 text-xs text-slate-300">
              <h4 className="font-extrabold text-slate-200 flex items-center gap-1.5">
                <Megaphone className="w-4 h-4 text-rose-400" />
                <span>How to Post on Instagram (3 Steps):</span>
              </h4>
              <ol className="space-y-1.5 pl-4 list-decimal text-[11px] text-slate-400">
                <li>
                  Click <strong className="text-slate-200">"Download 1080x1080 PNG"</strong> above to save the image to your phone or desktop.
                </li>
                <li>
                  Open Instagram, tap <strong className="text-slate-200">+ New Post</strong>, and select the downloaded image.
                </li>
                <li>
                  Click <strong className="text-slate-200">"Copy Caption"</strong> and paste it into the caption field, then publish!
                </li>
              </ol>
            </div>

          </div>

        </div>

        {/* MODAL FOOTER */}
        <div className="px-5 py-3 bg-slate-950 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400 shrink-0">
          <div className="flex items-center gap-2">
            <Globe className="w-3.5 h-3.5 text-amber-400" />
            <span>Target Portal: <strong className="text-white">app.vernunt.com</strong></span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 bg-slate-800 hover:bg-slate-700 text-white font-bold rounded-xl transition cursor-pointer text-xs"
          >
            Close
          </button>
        </div>

      </div>
    </div>
  );
}
