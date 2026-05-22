import fs from 'fs';
import path from 'path';
import sharp from 'sharp';

const AFFICHES_DIR = 'c:/Users/HP/Documents/gestionpro/affiches';
const BRAIN_DIR = 'C:/Users/HP/.gemini/antigravity/brain/5cfa4915-92dc-457e-bdb2-0877e65c6b4a';

// Ensure directories exist
if (!fs.existsSync(AFFICHES_DIR)) {
  fs.mkdirSync(AFFICHES_DIR, { recursive: true });
}
if (!fs.existsSync(BRAIN_DIR)) {
  fs.mkdirSync(BRAIN_DIR, { recursive: true });
}

// Config for each poster
const postersConfig = [
  {
    num: 9,
    source: 'real_landing.png',
    title: "L'intelligence commerciale",
    titleHighlight: "redéfinie pour l'Afrique",
    subtitle: "GestionPro unifie la gestion de stock en temps réel, la facturation au comptoir et le suivi financier pour propulser votre croissance.",
    cta: "COMMENCER GRATUITEMENT SUR WWW.GESTIONPRO.APP",
    isMobile: false,
    tags: ["🌍 Cloud Africain", "📦 Stocks & POS", "🚀 Croissance"]
  },
  {
    num: 10,
    source: 'real_dashboard.png',
    title: "Décisions intelligentes,",
    titleHighlight: "croissance garantie",
    subtitle: "Pilotez votre commerce grâce à des indicateurs clés en direct : chiffre d'affaires, bénéfices nets, dépenses et alertes de rupture.",
    cta: "DIALLO ÉLECTRONIQUE : +1 295 000 FCFA DE CHIFFRE D'AFFAIRES",
    isMobile: false,
    tags: ["📊 Analytics Live", "💸 Suivi Bénéfice", "🔔 Alertes Stock"]
  },
  {
    num: 11,
    source: 'real_pos.png',
    title: "Point de Vente Express",
    titleHighlight: "et encaissement ultra-rapide",
    subtitle: "Enregistrez vos ventes comptoir en 3 secondes. Sélectionnez les articles, appliquez des remises et imprimez des reçus professionnels.",
    cta: "OPTIMISEZ VOTRE VENTE EN BOUTIQUE SUR GESTIONPRO",
    isMobile: false,
    tags: ["🧾 Factures PDF", "⚡ Caisse Express", "👥 Équipe de Vente"]
  },
  {
    num: 12,
    source: 'real_storefront_mobile.png',
    title: "Votre boutique en ligne",
    titleHighlight: "accessible partout",
    subtitle: "Offrez à vos clients une vitrine e-commerce moderne et réactive pour commander en direct depuis leur smartphone. Partagez votre lien en un clic.",
    cta: "FAITES COMMANDER VOS CLIENTS EN DIRECT ET EN FCFA",
    isMobile: true,
    tags: ["🛒 Vitrine Client", "📱 Mobile Optimisé", "💬 Ventes Directes"]
  },
  {
    num: 13,
    source: 'real_checkout_mobile.png',
    title: "Prise de commande",
    titleHighlight: "simple et sans friction",
    subtitle: "Un processus de commande optimisé de bout en bout. Vos clients ajoutent au panier, renseignent la livraison et valident instantanément.",
    cta: "UN TUNNEL D'ACHAT MOBILE FIABLE ET INTUITIF",
    isMobile: true,
    tags: ["🛍️ Panier Express", "📍 Livraison Simple", "💵 Prix Transparents"]
  },
  {
    num: 14,
    source: 'real_dashboard_mobile.png',
    title: "Votre entreprise dans",
    titleHighlight: "le creux de votre main",
    subtitle: "Accédez à votre tableau de bord GestionPro directement depuis votre mobile. Suivez vos performances et stocks en temps réel où que vous soyez.",
    cta: "TOUTE VOTRE GESTION ACCESSIBLE EN NOMADISME",
    isMobile: true,
    tags: ["📈 Suivi Mobile", "🔋 100% Autonome", "🔒 Sécurisé & Fiable"]
  }
];

async function generatePoster(config, format) {
  const isSquare = format === 'square';
  const width = 1080;
  const height = isSquare ? 1080 : 1920;

  // Frame parameters based on format & device type
  let screenshotWidth, screenshotHeight, frameX, frameY;
  let logoY, titleY, subtitleY, tagsY, ctaY;

  if (isSquare) {
    logoY = 80;
    titleY = 195;
    subtitleY = 85;
    ctaY = 1020;
    tagsY = 0; // No tags in square format to prevent crowding

    if (config.isMobile) {
      screenshotWidth = 350;
      screenshotHeight = 630;
      frameX = 365;
      frameY = 340;
    } else {
      screenshotWidth = 840;
      screenshotHeight = 460;
      frameX = 120;
      frameY = 420;
    }
  } else {
    // Portrait 1080x1920 (Mobile-first stories/status layout)
    logoY = 140;
    titleY = 300;
    subtitleY = 110;
    ctaY = 1800;

    if (config.isMobile) {
      screenshotWidth = 540;
      screenshotHeight = 960;
      frameX = 270;
      frameY = 650;
      tagsY = 1660;
    } else {
      screenshotWidth = 900;
      screenshotHeight = 520;
      frameX = 90;
      frameY = 800;
      tagsY = 1420;
    }
  }

  const inputPath = path.join(AFFICHES_DIR, config.source);
  if (!fs.existsSync(inputPath)) {
    console.warn(`Source image ${inputPath} not found! Skipping format ${format}...`);
    return;
  }

  // 1. Process and resize screenshot
  const processedScreenshot = await sharp(inputPath)
    .resize(screenshotWidth, screenshotHeight, {
      fit: 'cover',
      position: 'top'
    })
    .toBuffer();

  // Create corner mask for screenshot (Mac browser: 0 top, 8 bottom/inside; Mobile: 38 radius)
  const screenshotCornerRadius = config.isMobile ? (isSquare ? 36 : 48) : 0;
  const screenshotMask = Buffer.from(`
    <svg width="${screenshotWidth}" height="${screenshotHeight}">
      <rect width="${screenshotWidth}" height="${screenshotHeight}" rx="${screenshotCornerRadius}" ry="${screenshotCornerRadius}" fill="white" />
    </svg>
  `);

  const maskedScreenshot = await sharp(processedScreenshot)
    .composite([{
      input: screenshotMask,
      blend: 'dest-in'
    }])
    .toBuffer();

  // 2. Generate SVG Overlay
  const glowX = 540;
  const glowY = isSquare ? 650 : 1000;
  const glowRadius = isSquare ? 380 : 580;

  // XML escape helper
  const esc = (str) => {
    if (!str) return '';
    return str.replace(/&/g, '&amp;')
              .replace(/</g, '&lt;')
              .replace(/>/g, '&gt;')
              .replace(/"/g, '&quot;')
              .replace(/'/g, '&apos;');
  };

  // Build tags SVG elements if in portrait mode
  let tagsSvg = '';
  if (!isSquare && config.tags && config.tags.length === 3) {
    const pillWidth = 240;
    const pillHeight = 44;
    const spacing = 40;
    const totalWidth = (pillWidth * 3) + (spacing * 2);
    const startX = (width - totalWidth) / 2;

    tagsSvg = `
      <g transform="translate(0, ${tagsY})">
        ${config.tags.map((tag, idx) => {
          const x = startX + idx * (pillWidth + spacing);
          return `
            <g transform="translate(${x}, 0)">
              <!-- Glass pill background -->
              <rect width="${pillWidth}" height="${pillHeight}" rx="${pillHeight/2}" ry="${pillHeight/2}" fill="#ffffff" fill-opacity="0.04" stroke="#ea580c" stroke-opacity="0.25" stroke-width="1.5" />
              <!-- Tag text -->
              <text x="${pillWidth/2}" y="${pillHeight/2 + 5}" font-family="system-ui, -apple-system, sans-serif" font-weight="600" font-size="14" fill="#f3f4f6" text-anchor="middle">
                ${esc(tag)}
              </text>
            </g>
          `;
        }).join('')}
      </g>
    `;
  }

  const svgOverlay = `
    <svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <!-- Background Gradient -->
        <linearGradient id="bg-grad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="#070503" />
          <stop offset="50%" stop-color="#0e0a07" />
          <stop offset="100%" stop-color="#140f0c" />
        </linearGradient>
        
        <!-- Glowing Ambient light -->
        <radialGradient id="glow-grad" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stop-color="#ea580c" stop-opacity="0.20" />
          <stop offset="50%" stop-color="#ea580c" stop-opacity="0.06" />
          <stop offset="100%" stop-color="#ea580c" stop-opacity="0" />
        </radialGradient>

        <linearGradient id="logo-grad" x1="0" y1="0" x2="64" y2="64" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stop-color="#EA580C"/>
          <stop offset="100%" stop-color="#7C2D12"/>
        </linearGradient>

        <linearGradient id="border-grad" x1="0" y1="0" x2="0" y2="100%">
          <stop offset="0%" stop-color="#ffffff" stop-opacity="0.2" />
          <stop offset="100%" stop-color="#ea580c" stop-opacity="0.45" />
        </linearGradient>

        <linearGradient id="mobile-border-grad" x1="0" y1="0" x2="100%" y2="100%">
          <stop offset="0%" stop-color="#ffffff" stop-opacity="0.3" />
          <stop offset="50%" stop-color="#ea580c" stop-opacity="0.4" />
          <stop offset="100%" stop-color="#000000" stop-opacity="0.9" />
        </linearGradient>

        <!-- Drop Shadows -->
        <filter id="shadow" x="-10%" y="-10%" width="120%" height="120%">
          <feDropShadow dx="0" dy="25" stdDeviation="25" flood-color="#000000" flood-opacity="0.65" />
        </filter>

        <filter id="glow-filter" x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation="70" result="blur" />
        </filter>
      </defs>

      <!-- Base Background -->
      <rect width="${width}" height="${height}" fill="url(#bg-grad)" />

      <!-- Radial Glowing Blob -->
      <circle cx="${glowX}" cy="${glowY}" r="${glowRadius}" fill="url(#glow-grad)" filter="url(#glow-filter)" />

      <!-- Abstract Tech Lines / Grid Background (Sleek Orange Accents) -->
      <path d="M 0,200 L 1080,400 M 0,500 L 1080,700 M 0,800 L 1080,600 M 0,1200 L 1080,1400 M 0,1600 L 1080,1500" stroke="#ea580c" stroke-opacity="0.04" stroke-width="2" fill="none" />
      <path d="M 200,0 L 400,${height} M 600,0 L 500,${height} M 800,0 L 900,${height}" stroke="#ea580c" stroke-opacity="0.04" stroke-width="2" fill="none" />

      <!-- Header: Logo + Brand Name -->
      <g transform="translate(540, ${logoY})">
        <!-- Rounded Square Logo Mark -->
        <g transform="translate(-130, -20) scale(0.65)">
          <rect width="64" height="64" rx="14" ry="14" fill="url(#logo-grad)"/>
          <text x="32" y="48" text-anchor="middle" font-family="system-ui, -apple-system, sans-serif" font-weight="900" font-size="44" fill="#ffffff" letter-spacing="-2">G</text>
        </g>
        <!-- Brand Name Text -->
        <text x="-80" y="22" font-family="system-ui, -apple-system, sans-serif" font-weight="900" font-size="34" fill="#ffffff" letter-spacing="-0.5">Gestion<tspan fill="#ea580c">Pro</tspan></text>
      </g>

      <!-- Titles & Copy -->
      <g text-anchor="middle" transform="translate(540, ${titleY})">
        <text font-family="system-ui, -apple-system, sans-serif" font-weight="800" font-size="${isSquare ? 42 : 46}" fill="#ffffff" letter-spacing="-1">
          ${esc(config.title)}
        </text>
        <text y="${isSquare ? 50 : 60}" font-family="system-ui, -apple-system, sans-serif" font-weight="900" font-size="${isSquare ? 46 : 52}" fill="#ea580c" letter-spacing="-1">
          ${esc(config.titleHighlight)}
        </text>
        
        <!-- Subtitle Wrap -->
        <foreignObject x="-440" y="${subtitleY}" width="880" height="150">
          <div xmlns="http://www.w3.org/1999/xhtml" style="font-family: system-ui, -apple-system, sans-serif; font-size: ${isSquare ? '17px' : '19px'}; font-weight: 500; color: #a1a1aa; line-height: 1.5; text-align: center; margin: 0; padding: 0 20px;">
            ${esc(config.subtitle)}
          </div>
        </foreignObject>
      </g>

      <!-- Mockup Device Frames -->
      ${config.isMobile ? `
        <!-- MOBILE MOCKUP FRAME (iPhone 15 Pro Style) -->
        <!-- Drop Shadow outer glow -->
        <rect x="${frameX - 8}" y="${frameY - 8}" width="${screenshotWidth + 16}" height="${screenshotHeight + 16}" rx="${isSquare ? 46 : 56}" ry="${isSquare ? 46 : 56}" fill="#000000" filter="url(#shadow)" />
        
        <!-- Steel/Dark Orange Outer Rim -->
        <rect x="${frameX - 8}" y="${frameY - 8}" width="${screenshotWidth + 16}" height="${screenshotHeight + 16}" rx="${isSquare ? 46 : 56}" ry="${isSquare ? 46 : 56}" fill="none" stroke="url(#mobile-border-grad)" stroke-width="7" />
        
        <!-- Black Inner Screen Bezel -->
        <rect x="${frameX - 3}" y="${frameY - 3}" width="${screenshotWidth + 6}" height="${screenshotHeight + 6}" rx="${isSquare ? 41 : 51}" ry="${isSquare ? 41 : 51}" fill="none" stroke="#09090c" stroke-width="5" />

        <!-- Dynamic Island Notch -->
        <rect x="${540 - 65}" y="${frameY + (isSquare ? 12 : 22)}" width="130" height="30" rx="15" ry="15" fill="#000000" />
        <!-- Speaker slit -->
        <rect x="525" y="${frameY + (isSquare ? 5 : 12)}" width="30" height="3" rx="1.5" fill="#1b1b22" />
      ` : `
        <!-- DESKTOP MOCKUP FRAME (MacBook/Premium Browser Style) -->
        <!-- Drop Shadow outer glow -->
        <rect x="${frameX - 4}" y="${frameY - 34}" width="${screenshotWidth + 8}" height="${screenshotHeight + 38}" rx="14" ry="14" fill="#000000" filter="url(#shadow)" />

        <!-- Glassmorphic Browser Window Container -->
        <rect x="${frameX - 2}" y="${frameY - 32}" width="${screenshotWidth + 4}" height="${screenshotHeight + 34}" rx="12" ry="12" fill="#111115" stroke="url(#border-grad)" stroke-width="2.5" />
        
        <!-- Browser Top Bar -->
        <rect x="${frameX - 1}" y="${frameY - 31}" width="${screenshotWidth + 2}" height="30" rx="10" ry="10" fill="#17171e" />
        <!-- Remove bottom roundness of top bar -->
        <rect x="${frameX - 1}" y="${frameY - 15}" width="${screenshotWidth + 2}" height="15" fill="#17171e" />

        <!-- Browser Window Controls (Red, Yellow, Green dots) -->
        <circle cx="${frameX + 16}" cy="${frameY - 16}" r="6" fill="#ef4444" />
        <circle cx="${frameX + 34}" cy="${frameY - 16}" r="6" fill="#f59e0b" />
        <circle cx="${frameX + 52}" cy="${frameY - 16}" r="6" fill="#10b981" />

        <!-- Browser URL Bar -->
        <rect x="${frameX + 80}" y="${frameY - 24}" width="${screenshotWidth - 160}" height="16" rx="8" ry="8" fill="#0a0a0d" />
        <text x="540" y="-12" transform="translate(0, ${frameY})" font-family="system-ui, -apple-system, sans-serif" font-weight="500" font-size="10" fill="#6b7280" text-anchor="middle">
          diallo-electronique.gestionpro.app
        </text>
      `}

      <!-- Glass tags for portrait orientation -->
      ${tagsSvg}

      <!-- Footer / CTA -->
      <g transform="translate(540, ${ctaY})" text-anchor="middle">
        <!-- CTA Button glassmorphic background -->
        <rect x="-340" y="-28" width="680" height="50" rx="25" ry="25" fill="#ea580c" fill-opacity="0.08" stroke="#ea580c" stroke-opacity="0.3" stroke-width="1.5" />
        <!-- Call To Action Text -->
        <text y="1" font-family="system-ui, -apple-system, sans-serif" font-weight="800" font-size="13" fill="#ea580c" letter-spacing="2.5">
          ${config.cta}
        </text>
      </g>
    </svg>
  `;

  // 3. Composite everything onto the final background canvas
  const outputPath = path.join(AFFICHES_DIR, `affiche_${config.num}_real_${format}.png`);

  await sharp({
    create: {
      width: width,
      height: height,
      channels: 4,
      background: { r: 7, g: 5, b: 3, alpha: 1 } // Charcoal-brown background base
    }
  })
  .composite([
    {
      input: Buffer.from(svgOverlay),
      top: 0,
      left: 0
    },
    {
      input: maskedScreenshot,
      top: frameY,
      left: frameX
    }
  ])
  .png()
  .toFile(outputPath);

  console.log(`[${format.toUpperCase()}] Generated: ${outputPath}`);

  // Copy to brain directory for user visualization
  const brainPath = path.join(BRAIN_DIR, `affiche_${config.num}_real_${format}.png`);
  fs.copyFileSync(outputPath, brainPath);

  // If square, copy to default name to support any scripts looking for `affiche_<num>_real.png`
  if (isSquare) {
    const defaultPath = path.join(AFFICHES_DIR, `affiche_${config.num}_real.png`);
    fs.copyFileSync(outputPath, defaultPath);
    const defaultBrainPath = path.join(BRAIN_DIR, `affiche_${config.num}_real.png`);
    fs.copyFileSync(outputPath, defaultBrainPath);
  }
}

async function main() {
  console.log("🚀 Starting generation of Square (1080x1080) and Mobile-first Portrait (1080x1920) posters...");

  for (const config of postersConfig) {
    console.log(`\n--- Poster ${config.num}: ${config.title} ---`);
    await generatePoster(config, 'square');
    await generatePoster(config, 'portrait');
  }

  console.log("\n✨ All posters successfully generated in Square and Mobile-first formats!");
}

main().catch(console.error);
