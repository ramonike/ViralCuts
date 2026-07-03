import React, { useState, useEffect, useCallback } from 'react';
import {
    Sparkles, FileText, Type, CheckSquare, Image,
    Send, Copy, Check, RefreshCw,
    Youtube, Calendar, Wand2, AlertCircle, ExternalLink
} from 'lucide-react';
import { PageLayout } from '../components/layout/PageLayout';
import { useTheme } from '../contexts/ThemeContext';
import { ScheduleVideoModal } from '../components/calendar/ScheduleVideoModal';

const VITE_API_URL = import.meta.env.VITE_API_URL || '';

async function callClaude(systemPrompt, userPrompt) {
    const res = await fetch(`${VITE_API_URL}/api/ai/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ system: systemPrompt, prompt: userPrompt }),
    });
    if (!res.ok) throw new Error('Erro ao chamar a IA. Tente novamente.');
    const data = await res.json();
    return data.text || data.content || '';
}

function useCopy() {
    const [copied, setCopied] = useState(false);
    const copy = (text) => {
        navigator.clipboard.writeText(text).then(() => {
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        });
    };
    return { copied, copy };
}

function CopyBtn({ text }) {
    const { copied, copy } = useCopy();
    return (
        <button className={`copy-btn ${copied ? 'copied' : ''}`} onClick={() => copy(text)}>
            {copied ? <Check size={13} /> : <Copy size={13} />}
            {copied ? 'Copiado!' : 'Copiar'}
        </button>
    );
}

function ResultBox({ content }) {
    if (!content) return null;
    return (
        <div className="card mt-4" style={{ borderColor: 'rgba(124,58,237,.3)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                <span style={{ fontWeight: 600 }}>Resultado gerado ✨</span>
                <CopyBtn text={content} />
            </div>
            <div style={{ fontSize: 14, color: 'var(--text2)', lineHeight: 1.8, padding: 16, background: 'var(--bg-card2)', borderRadius: 8 }}>
                {content}
            </div>
            <button className="btn btn-gradient mt-4"><Calendar size={13} /> Agendar no Pipeline</button>
        </div>
    );
}

function ErrorBox({ error }) {
    if (!error) return null;
    return (
        <div className="vc-toast vc-toast-coral" style={{ marginTop: 12 }}>
            <AlertCircle size={15} className="shrink-0" />
            <span>{error}</span>
        </div>
    );
}

function ScriptGenerator({ onPipeline }) {
    const [tema, setTema] = useState('');
    const [formato, setFormato] = useState('shorts');
    const [duracao, setDuracao] = useState('60');
    const [tom, setTom] = useState('educativo');
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState('');
    const [error, setError] = useState('');

    const generate = async () => {
        if (!tema.trim()) return;
        setLoading(true); setError(''); setResult('');
        try {
            const text = await callClaude(
                `Você é um roteirista especialista em conteúdo viral para redes sociais brasileiras. Crie roteiros otimizados para engajamento, com ganchos fortes, linguagem direta e CTAs eficientes.`,
                `Crie um roteiro completo para um vídeo de ${duracao} segundos no formato ${formato}, tom ${tom}.

Tema: ${tema}

O roteiro deve ter:
1. GANCHO (primeiros 3 segundos) — frase que para o scroll
2. PROBLEMA ou PROMESSA — por que o espectador deve continuar assistindo
3. DESENVOLVIMENTO — conteúdo principal dividido em blocos curtos
4. CTA FINAL — chamada para ação clara (curtir, seguir, comentar)

Formate com emojis e deixe claro o tempo de cada parte. Escreva em português do Brasil, linguagem natural e direta.`
            );
            setResult(text);
        } catch (e) { setError(e.message); }
        finally { setLoading(false); }
    };

    return (
        <div className="card">
            <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 16 }}>Gerador de Roteiro</h3>
            <div className="form-group">
                <label className="form-label">Tema ou ideia do vídeo</label>
                <textarea className="input" value={tema} onChange={e => setTema(e.target.value)}
                    placeholder="Ex: Bitcoin atingiu novo recorde histórico em 2026 e especialistas preveem..." rows={3} />
            </div>
            <div className="grid-3">
                <div className="form-group">
                    <label className="form-label">Formato</label>
                    <select className="input" value={formato} onChange={e => setFormato(e.target.value)}>
                        <option value="shorts">Shorts/TikTok</option>
                        <option value="longo">Longo</option>
                        <option value="reel">Reel</option>
                    </select>
                </div>
                <div className="form-group">
                    <label className="form-label">Duração</label>
                    <select className="input" value={duracao} onChange={e => setDuracao(e.target.value)}>
                        {['30', '60', '90', '180', '300', '600'].map(d => (
                            <option key={d} value={d}>{d}s{d >= 60 ? ` (${d / 60}min)` : ''}</option>
                        ))}
                    </select>
                </div>
                <div className="form-group">
                    <label className="form-label">Tom</label>
                    <select className="input" value={tom} onChange={e => setTom(e.target.value)}>
                        <option value="educativo">Educativo</option>
                        <option value="entretenimento">Entretenimento</option>
                        <option value="motivacional">Motivacional</option>
                        <option value="informativo">Informativo</option>
                    </select>
                </div>
            </div>
            <button className="btn btn-gradient" onClick={generate} disabled={!tema.trim()}>
                <Wand2 size={14} /> {loading ? 'Gerando roteiro...' : 'Gerar Roteiro'}
            </button>
            <ErrorBox error={error} />
            <ResultBox content={result} />
            {result && onPipeline && (
                <button className="btn btn-gradient mt-4" onClick={() => onPipeline({ script: result })}>
                    <Calendar size={13} /> Agendar no Pipeline
                </button>
            )}
        </div>
    );
}

function TitleGenerator({ onPipeline }) {
    const [assunto, setAssunto] = useState('');
    const [plataforma, setPlataforma] = useState('youtube');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [titles, setTitles] = useState([]);
    const [selectedTitle, setSelectedTitle] = useState('');
    const [description, setDescription] = useState('');
    const [tags, setTags] = useState('');

    function parseResult(text) {
        const lines = text.split('\n');
        const parsedTitles = [];
        let parsedDesc = '';
        let parsedTags = '';
        let section = null;
        for (const line of lines) {
            const trimmed = line.trim();
            if (/##\s*5?.*?(?:OP[ÇC][ÕO]ES?\s*DE\s*)?T[ÍI]TULO/i.test(trimmed) || /##\s*OP[ÇC][ÕO]ES?\s*DE\s*T[ÍI]TULO/i.test(trimmed)) { section = 'titles'; continue; }
            if (/##\s*DESCRI[ÇC][ÃA]O/i.test(trimmed)) { section = 'desc'; continue; }
            if (/##\s*(?:20\s*)?HASHTAGS/i.test(trimmed)) { section = 'tags'; continue; }
            if (/##\s*TAGS/i.test(trimmed)) { section = 'tags'; continue; }
            if (section === 'titles') { const m = trimmed.match(/^\d+[\.\)]\s*(.+)/); if (m) parsedTitles.push(m[1].replace(/\*\*/g, '').trim()); }
            else if (section === 'desc') { if (parsedDesc) parsedDesc += '\n'; parsedDesc += trimmed; }
            else if (section === 'tags') { if (trimmed && !trimmed.startsWith('#')) { if (parsedTags) parsedTags += ', '; parsedTags += trimmed.replace(/^#/, '').trim(); } }
        }
        return { titles: parsedTitles, description: parsedDesc.trim(), tags: parsedTags };
    }

    const generate = async () => {
        if (!assunto.trim()) return;
        setLoading(true); setError(''); setTitles([]); setSelectedTitle(''); setDescription(''); setTags('');
        try {
            const text = await callClaude(
                `Você é um especialista em SEO e marketing de conteúdo para criadores brasileiros. Cria títulos que maximizam CTR e descrições otimizadas para algoritmo.`,
                `Crie títulos e descrição completa para ${plataforma} sobre o seguinte assunto:

"${assunto}"

Entregue:

## 5 OPÇÕES DE TÍTULO
(variações com diferentes ângulos: curiosidade, benefício, número, urgência, polêmica)

## DESCRIÇÃO COMPLETA
(300-500 palavras, com palavras-chave naturais, parágrafos curtos, links placeholder)

## 20 HASHTAGS
(mix de populares + nichadas, em ordem de relevância)

## TAGS YOUTUBE
(15 tags separadas por vírgula, sem #)

Tudo em português do Brasil.`
            );
            const parsed = parseResult(text);
            setTitles(parsed.titles);
            setSelectedTitle(parsed.titles[0] || '');
            setDescription(parsed.description);
            setTags(parsed.tags);
        } catch (e) { setError(e.message); }
        finally { setLoading(false); }
    };

    const handlePipeline = () => { if (onPipeline) onPipeline({ title: selectedTitle, description, tags }); };

    return (
        <div className="card">
            <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 16 }}>Gerador de Títulos e Descrição</h3>
            <div className="form-group">
                <label className="form-label">Assunto ou resumo do vídeo</label>
                <textarea className="input" value={assunto} onChange={e => setAssunto(e.target.value)}
                    placeholder="Descreva o assunto do vídeo..." rows={3} />
            </div>
            <div className="form-group">
                <label className="form-label">Plataforma</label>
                <div className="toggle-group">
                    {['youtube', 'tiktok', 'instagram'].map(p => (
                        <button key={p}
                            className={`toggle-btn ${plataforma === p ? 'active' : ''}`}
                            onClick={() => setPlataforma(p)}>
                            {p === 'youtube' ? 'YouTube' : p === 'tiktok' ? 'TikTok' : 'Instagram'}
                        </button>
                    ))}
                </div>
            </div>
            <button className="btn btn-gradient" onClick={generate} disabled={!assunto.trim()}>
                <Wand2 size={14} /> {loading ? 'Gerando títulos...' : 'Gerar Títulos e Descrição'}
            </button>
            <ErrorBox error={error} />
            {titles.length > 0 && (
                <div className="mt-4">
                    <label className="form-label">Títulos sugeridos ✨</label>
                    {titles.map((t, i) => (
                        <div key={i} className={`title-option ${selectedTitle === t ? 'selected' : ''}`}
                            onClick={() => setSelectedTitle(t)}>
                            <div className="radio" />
                            <span style={{ fontSize: 14 }}>{t}</span>
                        </div>
                    ))}
                    <div className="form-group mt-4">
                        <label className="form-label">Descrição</label>
                        <textarea className="input" value={description} onChange={e => setDescription(e.target.value)} rows={4} />
                    </div>
                    <div className="form-group">
                        <label className="form-label">Tags</label>
                        <input className="input" value={tags} onChange={e => setTags(e.target.value)} placeholder="tag1, tag2, tag3" />
                    </div>
                </div>
            )}
            {selectedTitle && onPipeline && (
                <button className="btn btn-gradient mt-4" onClick={handlePipeline}>
                    <Calendar size={13} /> Agendar no Pipeline
                </button>
            )}
        </div>
    );
}

const CHECKLIST_ITEMS = [
    { id: 'thumb', category: 'Visual', text: 'Miniatura personalizada criada' },
    { id: 'marca', category: 'Visual', text: 'Marca d\'água ou logo visível' },
    { id: 'legendas', category: 'Visual', text: 'Legendas ou texto na capa' },
    { id: 'titulo', category: 'SEO', text: 'Título otimizado com palavras-chave' },
    { id: 'descricao', category: 'SEO', text: 'Descrição detalhada com links' },
    { id: 'tags', category: 'SEO', text: 'Tags relevantes adicionadas' },
    { id: 'cta', category: 'Engajamento', text: 'CTA no final do vídeo' },
    { id: 'pergunta', category: 'Engajamento', text: 'Pergunta para engajar nos comentários' },
    { id: 'categoria', category: 'Organização', text: 'Vídeo categorizado corretamente' },
    { id: 'playlist', category: 'Organização', text: 'Playlist definida' },
];

function PublicationChecklist() {
    const [checked, setChecked] = useState({});
    const toggle = (id) => setChecked(prev => ({ ...prev, [id]: !prev[id] }));
    const total = CHECKLIST_ITEMS.length;
    const done = Object.values(checked).filter(Boolean).length;
    const categories = [...new Set(CHECKLIST_ITEMS.map(i => i.category))];
    const pct = Math.round((done / total) * 100);

    return (
        <div className="card">
            <div style={{ display: 'flex', alignItems: 'center', gap: 24, marginBottom: 20 }}>
                <div className="progress-ring" style={{ background: `conic-gradient(var(--teal) 0deg ${pct * 3.6}deg, var(--purple) ${pct * 3.6}deg 360deg)` }}>
                    <svg width="100" height="100">
                        <circle cx="50" cy="50" r="42" fill="none" stroke="transparent" strokeWidth="6" />
                    </svg>
                    <div className="value gradient-text">{done}</div>
                </div>
                <div>
                    <div style={{ fontSize: 14, fontWeight: 600 }}>{done} de {total} itens concluídos</div>
                    <div style={{ fontSize: 12, color: 'var(--text2)', marginTop: 4 }}>
                        {pct === 100 ? 'Tudo pronto para publicar!' : pct >= 50 ? 'Bom progresso! Continue assim.' : 'Marque os itens conforme prepara o vídeo'}
                    </div>
                    <div className="flex gap-2 mt-4" style={{ gap: 8 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 11, color: 'var(--text3)' }}>
                            <span className="legend-dot" style={{ background: 'var(--teal)' }} /> Pronto
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 11, color: 'var(--text3)' }}>
                            <span className="legend-dot" style={{ background: 'var(--purple)' }} /> Pendente
                        </div>
                    </div>
                </div>
                {done > 0 && <button className="btn btn-ghost btn-sm" style={{ marginLeft: 'auto' }} onClick={() => setChecked({})}>Limpar</button>}
            </div>
            <div className="form-group">
                <input className="input" placeholder="Título do vídeo" />
            </div>
            {categories.map(cat => (
                <div key={cat} className="card mt-4">
                    <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text3)', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '.5px' }}>{cat}</div>
                    {CHECKLIST_ITEMS.filter(i => i.category === cat).map(item => (
                        <div key={item.id} className="checklist-item" onClick={() => toggle(item.id)}>
                            <div className={`checkbox ${checked[item.id] ? 'checked' : ''}`}>
                                {checked[item.id] && <i className="fas fa-check" />}
                            </div>
                            <span className={`text ${checked[item.id] ? 'done' : ''}`}>{item.text}</span>
                        </div>
                    ))}
                </div>
            ))}
        </div>
    );
}

function ThumbnailGenerator({ onPipeline }) {
    const [prompt, setPrompt] = useState('');
    const [aspectRatio, setAspectRatio] = useState('16:9');
    const [loading, setLoading] = useState(false);
    const [predictionId, setPredictionId] = useState(null);
    const [status, setStatus] = useState(null);
    const [output, setOutput] = useState(null);
    const [error, setError] = useState('');
    const [imgError, setImgError] = useState(false);

    const pollStatus = useCallback(async (id) => {
        try {
            const res = await fetch(`${VITE_API_URL}/api/ai/thumbnail-status/${id}`, { credentials: 'include' });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error);
            setStatus(data.status);
            if (data.status === 'succeeded') {
                const url = Array.isArray(data.output) ? data.output[0] : data.output?.url?.() || data.output?.url || data.output;
                if (!url || typeof url !== 'string') { console.error("[Thumbnail] Invalid output:", data.output); throw new Error('Resposta inválida do gerador de imagem'); }
                setOutput(url); setLoading(false); return;
            }
            if (data.status === 'failed') throw new Error(data.error || 'Falha ao gerar thumbnail');
            if (data.status === 'processing' || data.status === 'starting') setTimeout(() => pollStatus(id), 2000);
        } catch (e) { setError(e.message); setLoading(false); }
    }, []);

    useEffect(() => { return () => setPredictionId(null); }, []);

    const generate = async () => {
        if (!prompt.trim()) return;
        setLoading(true); setError(''); setOutput(null); setImgError(false); setStatus('starting');
        try {
            const res = await fetch(`${VITE_API_URL}/api/ai/generate-thumbnail`, {
                method: 'POST', headers: { 'Content-Type': 'application/json' },
                credentials: 'include', body: JSON.stringify({ prompt: prompt.trim(), aspectRatio }),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error);
            setPredictionId(data.id); setStatus(data.status);
            if (data.status === 'succeeded' && data.urls?.get) { setOutput(data.urls.get); setLoading(false); }
            else pollStatus(data.id);
        } catch (e) { setError(e.message); setLoading(false); }
    };

    const ratios = [
        { value: '16:9', label: 'YouTube 16:9' },
        { value: '9:16', label: 'Shorts 9:16' },
        { value: '1:1', label: 'Instagram 1:1' },
        { value: '4:3', label: 'Padrão 4:3' },
    ];

    return (
        <div className="card">
            <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 16 }}>Gerador de Miniatura</h3>
            <div className="form-group">
                <label className="form-label">Descrição da thumbnail</label>
                <textarea className="input" value={prompt} onChange={e => setPrompt(e.target.value)}
                    placeholder="Ex: Bitcoin explodindo com fundo de fogo, seta verde apontando para cima..." rows={3} />
            </div>
            <div className="form-group">
                <label className="form-label">Aspect Ratio</label>
                <div className="toggle-group">
                    {ratios.map(r => (
                        <button key={r.value}
                            className={`toggle-btn ${aspectRatio === r.value ? 'active' : ''}`}
                            onClick={() => setAspectRatio(r.value)}>
                            {r.label}
                        </button>
                    ))}
                </div>
            </div>
            <button className="btn btn-gradient" onClick={generate} disabled={!prompt.trim()}>
                <Image size={14} /> {loading ? 'Gerando thumbnail...' : 'Gerar Thumbnail'}
            </button>
            <ErrorBox error={error} />
            {status && !output && !error && (
                <div className="card mt-4" style={{ textAlign: 'center', padding: 24 }}>
                    <RefreshCw size={24} className="spinning" style={{ margin: '0 auto 8px', display: 'block', color: 'var(--coral)' }} />
                    <p style={{ fontSize: 13, color: 'var(--text2)' }}>{status === 'starting' ? 'Iniciando geração...' : 'Gerando imagem...'}</p>
                </div>
            )}
            {output && !imgError && (
                <div className="card mt-4" style={{ borderColor: 'rgba(124,58,237,.3)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                        <span style={{ fontWeight: 600 }}>Thumbnail gerada ✨</span>
                        <a href={output} target="_blank" rel="noopener noreferrer" style={{ fontSize: 12, color: 'var(--text2)', textDecoration: 'none' }}>
                            <ExternalLink size={13} /> Abrir original
                        </a>
                    </div>
                    <div style={{ width: '100%', aspectRatio: aspectRatio === '9:16' ? '9/16' : '16/9', borderRadius: 8, overflow: 'hidden' }}>
                        <img src={output} alt="Thumbnail" onError={() => setImgError(true)}
                            style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    </div>
                    {onPipeline && (
                        <button className="btn btn-gradient btn-sm mt-4" style={{ marginLeft: 'auto' }}
                            onClick={() => onPipeline({ thumbnailUrl: output })}>
                            <Calendar size={13} /> Agendar no Pipeline
                        </button>
                    )}
                </div>
            )}
            {imgError && <ErrorBox error={`Falha ao carregar imagem. URL retornada: ${output}`} />}
        </div>
    );
}

const TABS = [
    { id: 'script', label: 'Roteiro' },
    { id: 'titles', label: 'Títulos e Descrição' },
    { id: 'thumbnail', label: 'Miniatura' },
    { id: 'checklist', label: 'Checklist de Publicação' },
];

export default function CreationPage() {
    const { theme } = useTheme();
    const [activeTab, setActiveTab] = useState('script');
    const [pipelineModalOpen, setPipelineModalOpen] = useState(false);
    const [pipelineData, setPipelineData] = useState(null);

    const handlePipeline = (data) => {
        setPipelineData(prev => {
            const merged = { ...prev };
            if (data.script) merged.script = data.script;
            if (data.title !== undefined) merged.title = data.title;
            if (data.description !== undefined) merged.description = data.description;
            if (data.tags !== undefined) merged.tags = data.tags;
            if (data.thumbnailUrl) merged.thumbnailUrl = data.thumbnailUrl;
            return merged;
        });
        setPipelineModalOpen(true);
    };

    return (
        <PageLayout maxWidth="4xl" spacing="standard">
            <div className="section-intro">
                <h2><Sparkles size={20} className="gradient-purple" /> Estúdio de Criação</h2>
                <p>Ferramentas de IA para criar conteúdo de alto desempenho.</p>
            </div>

            <div className="tabs mb-6">
                {TABS.map(tab => (
                    <button key={tab.id}
                        className={`tab ${activeTab === tab.id ? 'active' : ''}`}
                        onClick={() => setActiveTab(tab.id)}>
                        {tab.label}
                    </button>
                ))}
            </div>

            {activeTab === 'script' && <ScriptGenerator onPipeline={handlePipeline} />}
            {activeTab === 'titles' && <TitleGenerator onPipeline={handlePipeline} />}
            {activeTab === 'thumbnail' && <ThumbnailGenerator onPipeline={handlePipeline} />}
            {activeTab === 'checklist' && <PublicationChecklist />}

            <ScheduleVideoModal
                isOpen={pipelineModalOpen}
                onClose={() => setPipelineModalOpen(false)}
                initialData={pipelineData ? {
                    title: pipelineData.title || '',
                    description: pipelineData.description || '',
                    tags: pipelineData.tags || '',
                } : null}
            />
        </PageLayout>
    );
}
