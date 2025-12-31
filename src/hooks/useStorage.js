/**
 * Utilitários de persistência para localStorage
 */

const STORAGE_KEY = "viralcuts_workflow_v1";

export const defaultSettings = {
    channelName: "PetCutsBR",
    timezone: "America/Manaus",
    uploadTargets: ["YouTube Shorts", "TikTok"],
    dailyGoal: 4,
    ctaText: "🚀 Domine o Método ViralCuts",
    ctaLink: "https://seu-curso-ou-metodo.com",
    opusApiKey: "",
    defaultVisibility: "public",
    defaultCategory: "24",
    defaultTags: "shorts, viral, clips",
    notifyUpload: true,
    notifyError: true,
    notifyWeekly: false,
};

export const defaultChecklists = [
    {
        id: "setup",
        title: "Configuração de Contas",
        items: [
            {
                id: "g_account",
                text: "Criar conta Google & canal YouTube",
                done: false,
                actions: [
                    { type: "google", url: "https://accounts.google.com/signup" },
                    { type: "youtube", url: "https://www.youtube.com/create_channel" }
                ]
            },
            {
                id: "tiktok_acc",
                text: "Criar conta TikTok com mesmo nome",
                done: false,
                actions: [{ type: "tiktok", url: "https://www.tiktok.com/signup" }]
            },
            {
                id: "profile_img",
                text: "Imagem de perfil 800x800 exportada",
                done: false,
                actions: [{ type: "canva", url: "https://www.canva.com/create/profile-pictures/" }]
            },
            {
                id: "banner",
                text: "Banner YouTube (2560x1440) com safe area",
                done: false,
                actions: [{ type: "canva", url: "https://www.canva.com/create/youtube-banners/" }]
            },
            {
                id: "bio",
                text: "Bios escritas com CTA e links",
                done: false,
                actions: [{ type: "chatgpt", url: "https://chat.openai.com" }]
            },
        ],
    },
    {
        id: "production",
        title: "Pipeline de Produção",
        items: [
            {
                id: "clips_ready",
                text: "10 cortes prontos (edição + legendas)",
                done: false,
                actions: [{ type: "opus", url: "https://www.opus.pro/" }]
            },
            {
                id: "thumbs",
                text: "Templates de thumbnail prontos (Canva)",
                done: false,
                actions: [{ type: "canva", url: "https://www.canva.com/youtube-thumbnails/templates/" }]
            },
            {
                id: "uploads_sched",
                text: "Uploads agendados (YouTube + TikTok)",
                done: false,
                actions: [
                    { type: "youtube_studio", url: "https://studio.youtube.com" },
                    { type: "tiktok", url: "https://www.tiktok.com/upload" }
                ]
            },
            {
                id: "zapier",
                text: "Zapier/Make > Airtable > upload flow configurado",
                done: false,
                actions: [
                    { type: "zapier", url: "https://zapier.com" },
                    { type: "make", url: "https://www.make.com" }
                ]
            },
        ],
    },
    {
        id: "monetize",
        title: "Monetização & Crescimento",
        items: [
            {
                id: "ypp_check",
                text: "Monitorar requisitos YPP (inscritos + horas/shorts views)",
                done: false,
                actions: [{ type: "youtube_monetization", url: "https://studio.youtube.com/channel/monetization" }]
            },
            {
                id: "partner",
                text: "Criar outreach para parcerias/TikTok Marketplace",
                done: false,
                actions: [{ type: "tiktok_marketplace", url: "https://creator.tiktok.com/creator-marketplace" }]
            },
        ],
    },
];

export const defaultAuth = {
    youtubeToken: null,
    youtubeTokenExpiresAt: null,
    connectedAccounts: [],
    activeAccountId: null,
};

export const defaultState = {
    settings: defaultSettings,
    pipeline: { jobs: [] },
    checklists: defaultChecklists,
    uploadQueue: [],
    analytics: { views24h: [] },
    recentUploads: [],
    suggestions: [],
    auth: defaultAuth,
    channelStats: null,
    history: {},
    cache: {
        channelStats: { data: null, timestamp: null },
        recentUploads: { data: null, timestamp: null },
        suggestions: { data: null, timestamp: null },
        analytics: { data: null, timestamp: null }
    },
    quotaExceeded: false,
    quota: { used: 0, limit: 10000, lastReset: Date.now() },
    channelsData: {}
};

export function loadState() {
    try {
        const raw = typeof window !== "undefined" ? localStorage.getItem(STORAGE_KEY) : null;
        if (!raw) return defaultState;
        
        const loaded = JSON.parse(raw);
        return {
            ...defaultState,
            ...loaded,
            history: loaded.history || {},
            channelStats: loaded.channelStats || null,
            settings: { ...defaultSettings, ...(loaded.settings || {}) },
            quota: loaded.quota || defaultState.quota,
            pipeline: loaded.pipeline || { jobs: [] },
            auth: {
                ...defaultAuth,
                ...(loaded.auth || {}),
                connectedAccounts: loaded.auth?.connectedAccounts || [],
                activeAccountId: loaded.auth?.activeAccountId || null
            },
            channelsData: loaded.channelsData || {}
        };
    } catch (e) {
        console.error("Failed to load state", e);
        return defaultState;
    }
}

export function saveState(state) {
    try {
        if (typeof window !== "undefined") {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
        }
    } catch (e) {
        console.warn("Could not save state to localStorage", e);
    }
}

export function exportCSV(rows, filename = "viralcuts_export.csv") {
    const header = Object.keys(rows[0] || {}).join(",");
    const lines = rows.map((r) =>
        Object.values(r)
            .map((v) => `"${String(v).replace(/"/g, '""')}"`)
            .join(",")
    );
    const csv = [header, ...lines].join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
}
