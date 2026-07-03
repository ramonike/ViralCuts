import React, { useState, useEffect, useCallback } from 'react';
import {
    Sparkles, FileText, Type, CheckSquare, Image,
    Send, Copy, Check, RefreshCw, ChevronDown, ChevronUp,
    Youtube, Hash, Clock, Target, Wand2, AlertCircle, ExternalLink, Calendar
} from 'lucide-react';
import { PageLayout } from '../components/layout/PageLayout';
import { useTheme } from '../contexts/ThemeContext';
import { ScheduleVideoModal } from '../components/calendar/ScheduleVideoModal';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';

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
        <Button variant="secondary" size="sm" onClick={() => copy(text)}>
            {copied ? <Check size={13} /> : <Copy size={13} />}
            {copied ? 'Copiado!' : 'Copiar'}
        </Button>
    );
}

function ResultBox({ content }) {
    if (!content) return null;
    return (
        <div className="vc-card" style={{ marginTop: 16, overflow: 'hidden' }}>
            <div className="vc-card-header" style={{ background: 'var(--accent-coral-3)', borderBottom: '1px solid rgba(232,65,42,0.15)', padding: '10px 16px' }}>
                <span className="text-label" style={{ color: 'var(--accent-coral-2)' }}>Resultado gerado</span>
                <CopyBtn text={content} />
            </div>
            <pre className="vc-card-body" style={{ fontSize: 13, lineHeight: 1.7, margin: 0, whiteSpace: 'pre-wrap', wordBreak: 'break-word', maxHeight: 400, overflowY: 'auto' }}>
                {content}
            </pre>
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

    const formatos = [
        { value: 'shorts', label: 'YouTube Shorts / TikTok (vertical)' },
        { value: 'longo', label: 'Vídeo longo (horizontal)' },
        { value: 'reel', label: 'Instagram Reel' },
    ];
    const tons = [
        { value: 'educativo', label: 'Educativo' },
        { value: 'entretenimento', label: 'Entretenimento' },
        { value: 'motivacional', label: 'Motivacional' },
        { value: 'informativo', label: 'Informativo' },
    ];

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
        <div className="space-y-4">
            <div>
                <label className="vc-label">Tema ou ideia do vídeo *</label>
                <textarea value={tema} onChange={e => setTema(e.target.value)} placeholder="Ex: 3 erros que iniciantes cometem ao investir em criptomoedas" rows={2}
                    className="vc-input" style={{ resize: 'vertical' }} />
            </div>
            <div className="vc-grid-3">
                <div>
                    <label className="vc-label">Formato</label>
                    <select value={formato} onChange={e => setFormato(e.target.value)} className="vc-input">
                        {formatos.map(f => <option key={f.value} value={f.value}>{f.label}</option>)}
                    </select>
                </div>
                <div>
                    <label className="vc-label">Duração (seg)</label>
                    <select value={duracao} onChange={e => setDuracao(e.target.value)} className="vc-input">
                        {['30', '60', '90', '180', '300', '600'].map(d => (
                            <option key={d} value={d}>{d}s {d >= 60 ? `(${d / 60}min)` : ''}</option>
                        ))}
                    </select>
                </div>
                <div>
                    <label className="vc-label">Tom</label>
                    <select value={tom} onChange={e => setTom(e.target.value)} className="vc-input">
                        {tons.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                    </select>
                </div>
            </div>
            <div className="flex justify-end">
                <Button onClick={generate} disabled={!tema.trim()} loading={loading}>
                    <Wand2 size={14} />
                    {loading ? 'Gerando roteiro...' : 'Gerar Roteiro'}
                </Button>
            </div>
            <ErrorBox error={error} />
            <ResultBox content={result} />
            {result && onPipeline && (
                <div className="flex justify-end">
                    <Button variant="secondary" onClick={() => onPipeline({ script: result })}>
                        <Calendar size={13} /> Agendar no Pipeline
                    </Button>
                </div>
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

    const platformBtn = (val, label) => (
        <button key={val} onClick={() => setPlataforma(val)}
            className={`px-3 py-1.5 rounded-[var(--radius-md)] text-xs font-semibold transition-all cursor-pointer font-inherit ${
                plataforma === val
                    ? 'bg-[var(--accent-coral-3)] border border-[rgba(232,65,42,0.3)] text-[var(--accent-coral-2)]'
                    : 'bg-transparent border border-[var(--border-default)] text-[var(--text-secondary)] hover:border-[var(--border-strong)] hover:text-[var(--text-primary)]'
            }`}>
            {label}
        </button>
    );

    return (
        <div className="space-y-4">
            <div>
                <label className="vc-label">Assunto ou resumo do vídeo *</label>
                <textarea value={assunto} onChange={e => setAssunto(e.target.value)} placeholder="Ex: Um vídeo mostrando como eu economizei R$500 por mês cortando gastos desnecessários" rows={3}
                    className="vc-input" style={{ resize: 'vertical' }} />
            </div>
            <div>
                <label className="vc-label">Plataforma principal</label>
                <div className="flex gap-2">
                    {platformBtn('youtube', 'YouTube')}
                    {platformBtn('tiktok', 'TikTok')}
                    {platformBtn('instagram', 'Instagram')}
                </div>
            </div>
            <div className="flex justify-end">
                <Button onClick={generate} disabled={!assunto.trim()} loading={loading}>
                    <Type size={14} />
                    {loading ? 'Gerando títulos...' : 'Gerar Títulos e Descrição'}
                </Button>
            </div>
            <ErrorBox error={error} />
            {titles.length > 0 && (
                <div>
                    <label className="vc-label">Escolha 1 título</label>
                    <div className="space-y-1.5">
                        {titles.map((t, i) => (
                            <div key={i} onClick={() => setSelectedTitle(t)}
                                className={`flex items-center gap-2.5 p-2.5 rounded-[var(--radius-md)] cursor-pointer transition-all ${
                                    selectedTitle === t
                                        ? 'bg-[var(--accent-coral-3)] border border-[rgba(232,65,42,0.25)]'
                                        : 'bg-[var(--bg-card)] border border-[var(--border-subtle)] hover:border-[var(--border-default)]'
                                }`}>
                                <div className={`w-5 h-5 rounded-full flex-shrink-0 flex items-center justify-center border-2 transition-all ${
                                    selectedTitle === t
                                        ? 'border-[var(--accent-coral)] bg-[var(--accent-coral)]'
                                        : 'border-[var(--border-strong)] bg-transparent'
                                }`}>
                                    {selectedTitle === t && <div className="w-2 h-2 rounded-full bg-white" />}
                                </div>
                                <span className="text-sm text-[var(--text-primary)]">{t}</span>
                            </div>
                        ))}
                    </div>
                </div>
            )}
            {description && (
                <div>
                    <label className="vc-label">Descrição</label>
                    <textarea value={description} onChange={e => setDescription(e.target.value)} rows={4} className="vc-input" style={{ resize: 'vertical' }} />
                </div>
            )}
            {tags && (
                <div>
                    <label className="vc-label">Tags (separadas por vírgula)</label>
                    <input value={tags} onChange={e => setTags(e.target.value)} className="vc-input" />
                </div>
            )}
            {selectedTitle && onPipeline && (
                <div className="flex justify-end">
                    <Button variant="secondary" onClick={handlePipeline}>
                        <Calendar size={13} /> Agendar no Pipeline
                    </Button>
                </div>
            )}
        </div>
    );
}

const CHECKLIST_ITEMS = [
    { id: 'thumb', category: 'Visual', icon: '🖼️', text: 'Thumbnail criada (1280×720px, rosto visível, texto grande)' },
    { id: 'titulo', category: 'SEO', icon: '📝', text: 'Título com palavra-chave principal nos primeiros 60 caracteres' },
    { id: 'descricao', category: 'SEO', icon: '📄', text: 'Descrição com 300+ palavras, keyword nas primeiras 2 linhas' },
    { id: 'hashtags', category: 'SEO', icon: '#️⃣', text: 'Hashtags adicionadas (3-5 para YouTube, 20-30 para TikTok)' },
    { id: 'tags', category: 'SEO', icon: '🏷️', text: 'Tags do YouTube preenchidas (mínimo 10 tags relevantes)' },
    { id: 'capitulos', category: 'Engajamento', icon: '📍', text: 'Capítulos/timestamps na descrição (vídeos acima de 3 min)' },
    { id: 'cta_descricao', category: 'Engajamento', icon: '📣', text: 'CTA na descrição (link, inscrição, comentário)' },
    { id: 'cards', category: 'Engajamento', icon: '🃏', text: 'Cards e telas finais configurados no YouTube Studio' },
    { id: 'playlist', category: 'Organização', icon: '📂', text: 'Vídeo adicionado à playlist correspondente' },
    { id: 'horario', category: 'Distribuição', icon: '⏰', text: 'Publicação agendada no horário de pico do seu público' },
    { id: 'crosspost', category: 'Distribuição', icon: '🔄', text: 'Cross-post planejado para outras plataformas' },
    { id: 'primeiro_comentario', category: 'Engajamento', icon: '💬', text: 'Primeiro comentário fixado com CTA ou pergunta' },
];

function PublicationChecklist() {
    const [checked, setChecked] = useState({});
    const [videoTitle, setVideoTitle] = useState('');
    const toggle = (id) => setChecked(prev => ({ ...prev, [id]: !prev[id] }));
    const total = CHECKLIST_ITEMS.length;
    const done = Object.values(checked).filter(Boolean).length;
    const pct = Math.round((done / total) * 100);
    const categories = [...new Set(CHECKLIST_ITEMS.map(i => i.category))];
    const scoreColor = pct === 100 ? 'var(--accent-teal)' : pct >= 70 ? 'var(--accent-amber)' : pct >= 40 ? 'var(--accent-amber)' : 'var(--accent-coral)';

    return (
        <div className="space-y-4">
            <div className="vc-card" style={{ display: 'flex', alignItems: 'center', gap: 16, padding: '16px 20px' }}>
                <div style={{
                    width: 56, height: 56, borderRadius: '50%', flexShrink: 0, position: 'relative',
                    background: `conic-gradient(${scoreColor} ${pct * 3.6}deg, var(--bg-elevated) 0deg)`,
                }}>
                    <div style={{
                        position: 'absolute', inset: 7, borderRadius: '50%',
                        background: 'var(--bg-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: 13, fontWeight: 800, color: scoreColor,
                    }}>
                        {pct}%
                    </div>
                </div>
                <div style={{ flex: 1 }}>
                    <input value={videoTitle} onChange={e => setVideoTitle(e.target.value)}
                        placeholder="Nome do vídeo (opcional)"
                        className="vc-input" style={{ border: 'none', background: 'transparent', padding: '0 0 4px', fontSize: 15, fontWeight: 700 }} />
                    <p className="text-xs text-[var(--text-muted)]" style={{ margin: 0 }}>
                        {done} de {total} itens concluídos
                        {pct === 100 && ' — Pronto para publicar!'}
                        {pct >= 70 && pct < 100 && ' — Quase lá!'}
                        {pct < 70 && done > 0 && ' — Continue revisando'}
                        {done === 0 && ' — Marque os itens conforme prepara o vídeo'}
                    </p>
                </div>
                {done > 0 && (
                    <button onClick={() => setChecked({})} className="text-xs text-[var(--text-muted)] hover:text-[var(--text-primary)] bg-transparent border-none cursor-pointer font-inherit">
                        Limpar
                    </button>
                )}
            </div>
            {categories.map(cat => (
                <div key={cat}>
                    <p className="text-label text-[var(--text-muted)] mb-2">{cat}</p>
                    <div className="space-y-1.5">
                        {CHECKLIST_ITEMS.filter(i => i.category === cat).map(item => (
                            <div key={item.id} onClick={() => toggle(item.id)}
                                className={`flex items-center gap-3 p-2.5 rounded-[var(--radius-md)] cursor-pointer transition-all ${
                                    checked[item.id]
                                        ? 'bg-[rgba(0,201,167,0.08)] border border-[rgba(0,201,167,0.2)]'
                                        : 'bg-[var(--bg-card)] border border-[var(--border-subtle)] hover:border-[var(--border-default)]'
                                }`}>
                                <div className={`w-5 h-5 rounded-[6px] flex-shrink-0 flex items-center justify-center border-2 transition-all ${
                                    checked[item.id]
                                        ? 'bg-[var(--accent-teal)] border-[var(--accent-teal)]'
                                        : 'bg-transparent border-[var(--border-strong)]'
                                }`}>
                                    {checked[item.id] && <Check size={11} color="#fff" strokeWidth={3} />}
                                </div>
                                <span style={{ fontSize: 14 }}>{item.icon}</span>
                                <span className={`text-sm flex-1 transition-all ${checked[item.id] ? 'text-[var(--text-muted)] line-through' : 'text-[var(--text-primary)]'}`}>
                                    {item.text}
                                </span>
                            </div>
                        ))}
                    </div>
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
        { value: '16:9', label: 'YouTube (16:9)' },
        { value: '9:16', label: 'Shorts/TikTok (9:16)' },
        { value: '1:1', label: 'Instagram (1:1)' },
        { value: '4:3', label: 'Padrão (4:3)' },
    ];

    const ratioBtn = (r) => (
        <button key={r.value} onClick={() => setAspectRatio(r.value)}
            className={`px-3 py-1.5 rounded-[var(--radius-md)] text-xs font-semibold transition-all cursor-pointer font-inherit ${
                aspectRatio === r.value
                    ? 'bg-[var(--accent-coral-3)] border border-[rgba(232,65,42,0.3)] text-[var(--accent-coral-2)]'
                    : 'bg-transparent border border-[var(--border-default)] text-[var(--text-secondary)] hover:border-[var(--border-strong)] hover:text-[var(--text-primary)]'
            }`}>
            {r.label}
        </button>
    );

    return (
        <div className="space-y-4">
            <div>
                <label className="vc-label">Descrição da thumbnail *</label>
                <textarea value={prompt} onChange={e => setPrompt(e.target.value)}
                    placeholder="Ex: Close em rosto surpreso, fundo vermelho, texto 'VOCÊ NÃO VAI ACREDITAR', setas apontando, estilo youtuber"
                    rows={3} className="vc-input" style={{ resize: 'vertical' }} />
            </div>
            <div>
                <label className="vc-label">Proporção</label>
                <div className="flex gap-2 flex-wrap">
                    {ratios.map(r => ratioBtn(r))}
                </div>
            </div>
            <div className="flex justify-end">
                <Button onClick={generate} disabled={!prompt.trim()} loading={loading}>
                    <Image size={14} />
                    {loading ? 'Gerando thumbnail...' : 'Gerar Thumbnail'}
                </Button>
            </div>
            <ErrorBox error={error} />
            {status && !output && !error && (
                <div className="vc-card" style={{ textAlign: 'center', padding: 24 }}>
                    <RefreshCw size={24} className="animate-spin" style={{ margin: '0 auto 8px', display: 'block', color: 'var(--accent-coral)' }} />
                    <p className="text-sm text-[var(--text-secondary)]">{status === 'starting' ? 'Iniciando geração...' : 'Gerando imagem...'}</p>
                </div>
            )}
            {output && !imgError && (
                <div className="vc-card" style={{ overflow: 'hidden' }}>
                    <div className="vc-card-header" style={{ background: 'var(--accent-coral-3)', borderBottom: '1px solid rgba(232,65,42,0.15)', padding: '10px 16px' }}>
                        <span className="text-label" style={{ color: 'var(--accent-coral-2)' }}>Thumbnail gerada</span>
                        <a href={output} target="_blank" rel="noopener noreferrer" className="text-sm">
                            <ExternalLink size={13} /> Abrir original
                        </a>
                    </div>
                    <div className="vc-card-body" style={{ display: 'flex', justifyContent: 'center', padding: 14 }}>
                        <img src={output} alt="Thumbnail" onError={() => setImgError(true)}
                            style={{ maxWidth: '100%', maxHeight: 400, borderRadius: 'var(--radius-md)', boxShadow: 'var(--shadow-elevated)' }} />
                    </div>
                    {onPipeline && (
                        <div style={{ padding: '0 14px 14px', display: 'flex', justifyContent: 'flex-end' }}>
                            <Button variant="secondary" onClick={() => onPipeline({ thumbnailUrl: output })}>
                                <Calendar size={13} /> Agendar no Pipeline
                            </Button>
                        </div>
                    )}
                </div>
            )}
            {imgError && <ErrorBox error={`Falha ao carregar imagem. URL retornada: ${output}`} />}
        </div>
    );
}

const TABS = [
    { id: 'script', label: 'Roteiro', icon: <FileText size={14} /> },
    { id: 'titles', label: 'Títulos e Descrição', icon: <Type size={14} /> },
    { id: 'thumbnail', label: 'Miniatura', icon: <Image size={14} /> },
    { id: 'checklist', label: 'Checklist de Publicação', icon: <CheckSquare size={14} /> },
];

export default function CreationPage() {
    const { theme } = useTheme();
    const isDark = theme === 'dark' || (theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);
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
            <div style={{ marginBottom: 28 }}>
                <h1 className="text-display" style={{ fontSize: 28, display: 'flex', alignItems: 'center', gap: 10, margin: '0 0 6px' }}>
                    <Sparkles size={24} style={{ color: 'var(--accent-coral)' }} />
                    Estúdio de Criação
                </h1>
                <p className="text-sm text-[var(--text-secondary)]" style={{ margin: 0 }}>
                    IA para criar roteiros, títulos e garantir que seu vídeo está pronto para publicar.
                </p>
            </div>

            <div className="flex gap-2 mb-6 flex-wrap">
                {TABS.map(tab => (
                    <button key={tab.id} onClick={() => setActiveTab(tab.id)}
                        className={`px-4 py-2 text-sm font-medium rounded-[var(--radius-md)] transition-all cursor-pointer font-inherit ${
                            activeTab === tab.id
                                ? 'bg-[var(--accent-coral-3)] text-[var(--accent-coral-2)] border border-[rgba(232,65,42,0.2)]'
                                : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-tertiary)] border border-transparent'
                        }`}>
                        <span className="inline-flex mr-1.5">{tab.icon}</span>
                        {tab.label}
                    </button>
                ))}
            </div>

            <Card>
                {activeTab === 'script' && (
                    <>
                        <CardHeader>
                            <div>
                                <CardTitle>Gerador de Roteiro</CardTitle>
                                <CardDescription>Descreva o tema e a IA cria um roteiro completo com gancho, desenvolvimento e CTA.</CardDescription>
                            </div>
                        </CardHeader>
                        <CardContent><ScriptGenerator onPipeline={handlePipeline} /></CardContent>
                    </>
                )}
                {activeTab === 'titles' && (
                    <>
                        <CardHeader>
                            <div>
                                <CardTitle>Títulos, Descrição e Hashtags</CardTitle>
                                <CardDescription>Gere 5 variações de título + descrição completa otimizada para SEO + hashtags para qualquer plataforma.</CardDescription>
                            </div>
                        </CardHeader>
                        <CardContent><TitleGenerator onPipeline={handlePipeline} /></CardContent>
                    </>
                )}
                {activeTab === 'thumbnail' && (
                    <>
                        <CardHeader>
                            <div>
                                <CardTitle>Gerador de Thumbnail</CardTitle>
                                <CardDescription>IA cria thumbnails profissionais. Descreva a cena e estilo.</CardDescription>
                            </div>
                        </CardHeader>
                        <CardContent><ThumbnailGenerator onPipeline={handlePipeline} /></CardContent>
                    </>
                )}
                {activeTab === 'checklist' && (
                    <>
                        <CardHeader>
                            <div>
                                <CardTitle>Checklist de Publicação</CardTitle>
                                <CardDescription>Revise cada detalhe antes de publicar. Canais consistentes crescem mais rápido.</CardDescription>
                            </div>
                        </CardHeader>
                        <CardContent><PublicationChecklist /></CardContent>
                    </>
                )}
            </Card>

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
