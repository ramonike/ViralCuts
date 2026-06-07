import React, { useState } from 'react';
import {
    Sparkles, FileText, Type, CheckSquare,
    Send, Copy, Check, RefreshCw, ChevronDown, ChevronUp,
    Youtube, Hash, Clock, Target, Wand2, AlertCircle
} from 'lucide-react';
import { PageLayout } from '../components/layout/PageLayout';
import { useTheme } from '../contexts/ThemeContext';

// ─── Helpers ─────────────────────────────────────────────────────────────────
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

// ─── UI Atoms ─────────────────────────────────────────────────────────────────
function Card({ children, isDark, style = {} }) {
    return (
        <div style={{
            background: isDark ? 'rgba(255,255,255,0.03)' : '#fff',
            border: `1px solid ${isDark ? 'rgba(255,255,255,0.08)' : '#e5e7eb'}`,
            borderRadius: 16,
            padding: '20px 22px',
            ...style,
        }}>
            {children}
        </div>
    );
}

function TabBtn({ active, onClick, icon, label, isDark }) {
    return (
        <button onClick={onClick} style={{
            display: 'flex', alignItems: 'center', gap: 8,
            padding: '9px 18px', borderRadius: 10,
            background: active ? 'linear-gradient(135deg,#7c3aed,#2563eb)' : 'transparent',
            border: active ? 'none' : `1px solid ${isDark ? 'rgba(255,255,255,0.1)' : '#e5e7eb'}`,
            color: active ? '#fff' : (isDark ? '#9ca3af' : '#6b7280'),
            cursor: 'pointer', fontFamily: 'inherit',
            fontSize: 13, fontWeight: 600,
            transition: 'all 0.15s',
        }}>
            {icon}
            {label}
        </button>
    );
}

function Textarea({ value, onChange, placeholder, isDark, rows = 4 }) {
    return (
        <textarea
            value={value}
            onChange={e => onChange(e.target.value)}
            placeholder={placeholder}
            rows={rows}
            style={{
                width: '100%', padding: '12px 14px',
                background: isDark ? 'rgba(0,0,0,0.3)' : '#f9fafb',
                border: `1px solid ${isDark ? 'rgba(255,255,255,0.1)' : '#e5e7eb'}`,
                borderRadius: 10, color: isDark ? '#f3f4f6' : '#111827',
                fontSize: 13, lineHeight: 1.6, resize: 'vertical',
                fontFamily: 'inherit', outline: 'none',
                boxSizing: 'border-box',
            }}
        />
    );
}

function PrimaryBtn({ onClick, disabled, loading, children, isDark }) {
    return (
        <button onClick={onClick} disabled={disabled || loading} style={{
            display: 'flex', alignItems: 'center', gap: 8,
            padding: '10px 20px',
            background: disabled || loading ? (isDark ? 'rgba(255,255,255,0.05)' : '#f3f4f6') : 'linear-gradient(135deg,#7c3aed,#2563eb)',
            border: 'none', borderRadius: 10,
            color: disabled || loading ? (isDark ? '#4b5563' : '#9ca3af') : '#fff',
            cursor: disabled || loading ? 'not-allowed' : 'pointer',
            fontSize: 13, fontWeight: 700, fontFamily: 'inherit',
            transition: 'all 0.15s',
        }}>
            {loading ? <RefreshCw size={14} style={{ animation: 'spin 1s linear infinite' }} /> : null}
            {children}
        </button>
    );
}

function CopyBtn({ text, isDark }) {
    const { copied, copy } = useCopy();
    return (
        <button onClick={() => copy(text)} style={{
            display: 'flex', alignItems: 'center', gap: 6,
            padding: '6px 12px', borderRadius: 8,
            background: copied ? (isDark ? 'rgba(52,211,153,0.15)' : '#f0fdf4') : (isDark ? 'rgba(255,255,255,0.05)' : '#f9fafb'),
            border: `1px solid ${copied ? (isDark ? 'rgba(52,211,153,0.3)' : '#bbf7d0') : (isDark ? 'rgba(255,255,255,0.08)' : '#e5e7eb')}`,
            color: copied ? '#34d399' : (isDark ? '#9ca3af' : '#6b7280'),
            cursor: 'pointer', fontSize: 12, fontWeight: 600, fontFamily: 'inherit',
        }}>
            {copied ? <Check size={13} /> : <Copy size={13} />}
            {copied ? 'Copiado!' : 'Copiar'}
        </button>
    );
}

function ResultBox({ content, isDark }) {
    if (!content) return null;
    return (
        <div style={{
            marginTop: 16,
            background: isDark ? 'rgba(0,0,0,0.2)' : '#f9fafb',
            border: `1px solid ${isDark ? 'rgba(255,255,255,0.08)' : '#e5e7eb'}`,
            borderRadius: 12, overflow: 'hidden',
        }}>
            <div style={{
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                padding: '10px 14px',
                borderBottom: `1px solid ${isDark ? 'rgba(255,255,255,0.06)' : '#e5e7eb'}`,
                background: isDark ? 'rgba(124,58,237,0.08)' : '#f3f0ff',
            }}>
                <span style={{ fontSize: 11, fontWeight: 700, color: isDark ? '#a78bfa' : '#7c3aed', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    Resultado gerado ✨
                </span>
                <CopyBtn text={content} isDark={isDark} />
            </div>
            <pre style={{
                margin: 0, padding: '14px 16px',
                fontSize: 13, lineHeight: 1.7,
                color: isDark ? '#e5e7eb' : '#374151',
                whiteSpace: 'pre-wrap', wordBreak: 'break-word',
                fontFamily: 'inherit',
                maxHeight: 400, overflowY: 'auto',
            }}>
                {content}
            </pre>
        </div>
    );
}

function ErrorBox({ error, isDark }) {
    if (!error) return null;
    return (
        <div style={{
            marginTop: 12, padding: '12px 14px',
            background: isDark ? 'rgba(239,68,68,0.1)' : '#fef2f2',
            border: `1px solid ${isDark ? 'rgba(239,68,68,0.25)' : '#fecaca'}`,
            borderRadius: 10,
            display: 'flex', gap: 10, alignItems: 'flex-start',
        }}>
            <AlertCircle size={15} color="#f87171" style={{ flexShrink: 0, marginTop: 1 }} />
            <p style={{ margin: 0, fontSize: 13, color: isDark ? '#fca5a5' : '#dc2626' }}>{error}</p>
        </div>
    );
}

// ─── Ferramenta 1: Gerador de Roteiro ────────────────────────────────────────
function ScriptGenerator({ isDark }) {
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
        { value: 'educativo', label: '📚 Educativo' },
        { value: 'entretenimento', label: '🎭 Entretenimento' },
        { value: 'motivacional', label: '🔥 Motivacional' },
        { value: 'informativo', label: '📰 Informativo' },
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
        } catch (e) {
            setError(e.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div>
                <label style={{ fontSize: 12, fontWeight: 600, color: isDark ? '#9ca3af' : '#6b7280', display: 'block', marginBottom: 6 }}>
                    Tema ou ideia do vídeo *
                </label>
                <Textarea
                    value={tema}
                    onChange={setTema}
                    placeholder="Ex: 3 erros que iniciantes cometem ao investir em criptomoedas"
                    isDark={isDark}
                    rows={2}
                />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
                <div>
                    <label style={{ fontSize: 12, fontWeight: 600, color: isDark ? '#9ca3af' : '#6b7280', display: 'block', marginBottom: 6 }}>
                        Formato
                    </label>
                    <select value={formato} onChange={e => setFormato(e.target.value)} style={{
                        width: '100%', padding: '9px 12px',
                        background: isDark ? 'rgba(0,0,0,0.3)' : '#f9fafb',
                        border: `1px solid ${isDark ? 'rgba(255,255,255,0.1)' : '#e5e7eb'}`,
                        borderRadius: 10, color: isDark ? '#f3f4f6' : '#111827',
                        fontSize: 13, fontFamily: 'inherit', cursor: 'pointer',
                    }}>
                        {formatos.map(f => <option key={f.value} value={f.value}>{f.label}</option>)}
                    </select>
                </div>

                <div>
                    <label style={{ fontSize: 12, fontWeight: 600, color: isDark ? '#9ca3af' : '#6b7280', display: 'block', marginBottom: 6 }}>
                        Duração (seg)
                    </label>
                    <select value={duracao} onChange={e => setDuracao(e.target.value)} style={{
                        width: '100%', padding: '9px 12px',
                        background: isDark ? 'rgba(0,0,0,0.3)' : '#f9fafb',
                        border: `1px solid ${isDark ? 'rgba(255,255,255,0.1)' : '#e5e7eb'}`,
                        borderRadius: 10, color: isDark ? '#f3f4f6' : '#111827',
                        fontSize: 13, fontFamily: 'inherit', cursor: 'pointer',
                    }}>
                        {['30', '60', '90', '180', '300', '600'].map(d => (
                            <option key={d} value={d}>{d}s {d >= 60 ? `(${d / 60}min)` : ''}</option>
                        ))}
                    </select>
                </div>

                <div>
                    <label style={{ fontSize: 12, fontWeight: 600, color: isDark ? '#9ca3af' : '#6b7280', display: 'block', marginBottom: 6 }}>
                        Tom
                    </label>
                    <select value={tom} onChange={e => setTom(e.target.value)} style={{
                        width: '100%', padding: '9px 12px',
                        background: isDark ? 'rgba(0,0,0,0.3)' : '#f9fafb',
                        border: `1px solid ${isDark ? 'rgba(255,255,255,0.1)' : '#e5e7eb'}`,
                        borderRadius: 10, color: isDark ? '#f3f4f6' : '#111827',
                        fontSize: 13, fontFamily: 'inherit', cursor: 'pointer',
                    }}>
                        {tons.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                    </select>
                </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                <PrimaryBtn onClick={generate} disabled={!tema.trim()} loading={loading} isDark={isDark}>
                    <Wand2 size={14} />
                    {loading ? 'Gerando roteiro...' : 'Gerar Roteiro'}
                </PrimaryBtn>
            </div>

            <ErrorBox error={error} isDark={isDark} />
            <ResultBox content={result} isDark={isDark} />
        </div>
    );
}

// ─── Ferramenta 2: Títulos e Descrições ──────────────────────────────────────
function TitleGenerator({ isDark }) {
    const [assunto, setAssunto] = useState('');
    const [plataforma, setPlataforma] = useState('youtube');
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState('');
    const [error, setError] = useState('');

    const generate = async () => {
        if (!assunto.trim()) return;
        setLoading(true); setError(''); setResult('');
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
            setResult(text);
        } catch (e) {
            setError(e.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div>
                <label style={{ fontSize: 12, fontWeight: 600, color: isDark ? '#9ca3af' : '#6b7280', display: 'block', marginBottom: 6 }}>
                    Assunto ou resumo do vídeo *
                </label>
                <Textarea
                    value={assunto}
                    onChange={setAssunto}
                    placeholder="Ex: Um vídeo mostrando como eu economizei R$500 por mês cortando gastos desnecessários com 5 hacks simples"
                    isDark={isDark}
                    rows={3}
                />
            </div>

            <div>
                <label style={{ fontSize: 12, fontWeight: 600, color: isDark ? '#9ca3af' : '#6b7280', display: 'block', marginBottom: 8 }}>
                    Plataforma principal
                </label>
                <div style={{ display: 'flex', gap: 8 }}>
                    {[
                        { value: 'youtube', label: '▶ YouTube' },
                        { value: 'tiktok', label: '♪ TikTok' },
                        { value: 'instagram', label: '◈ Instagram' },
                    ].map(p => (
                        <button key={p.value} onClick={() => setPlataforma(p.value)} style={{
                            padding: '7px 14px', borderRadius: 8, cursor: 'pointer', fontFamily: 'inherit',
                            fontSize: 12, fontWeight: 600,
                            background: plataforma === p.value ? (isDark ? 'rgba(124,58,237,0.25)' : '#f3f0ff') : 'transparent',
                            border: `1px solid ${plataforma === p.value ? (isDark ? 'rgba(124,58,237,0.4)' : '#ddd6fe') : (isDark ? 'rgba(255,255,255,0.1)' : '#e5e7eb')}`,
                            color: plataforma === p.value ? (isDark ? '#a78bfa' : '#7c3aed') : (isDark ? '#9ca3af' : '#6b7280'),
                        }}>
                            {p.label}
                        </button>
                    ))}
                </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                <PrimaryBtn onClick={generate} disabled={!assunto.trim()} loading={loading} isDark={isDark}>
                    <Type size={14} />
                    {loading ? 'Gerando títulos...' : 'Gerar Títulos e Descrição'}
                </PrimaryBtn>
            </div>

            <ErrorBox error={error} isDark={isDark} />
            <ResultBox content={result} isDark={isDark} />
        </div>
    );
}

// ─── Ferramenta 3: Checklist de Publicação ───────────────────────────────────
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

function PublicationChecklist({ isDark }) {
    const [checked, setChecked] = useState({});
    const [videoTitle, setVideoTitle] = useState('');

    const toggle = (id) => setChecked(prev => ({ ...prev, [id]: !prev[id] }));
    const total = CHECKLIST_ITEMS.length;
    const done = Object.values(checked).filter(Boolean).length;
    const pct = Math.round((done / total) * 100);

    const categories = [...new Set(CHECKLIST_ITEMS.map(i => i.category))];

    const scoreColor = pct === 100 ? '#34d399' : pct >= 70 ? '#a78bfa' : pct >= 40 ? '#fbbf24' : '#f87171';

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {/* Score */}
            <div style={{
                display: 'flex', alignItems: 'center', gap: 16,
                padding: '16px 20px',
                background: isDark ? 'rgba(0,0,0,0.2)' : '#f9fafb',
                borderRadius: 12,
                border: `1px solid ${isDark ? 'rgba(255,255,255,0.06)' : '#e5e7eb'}`,
            }}>
                <div style={{
                    width: 56, height: 56, borderRadius: '50%',
                    background: `conic-gradient(${scoreColor} ${pct * 3.6}deg, ${isDark ? 'rgba(255,255,255,0.05)' : '#f3f4f6'} 0deg)`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                }}>
                    <div style={{
                        width: 42, height: 42, borderRadius: '50%',
                        background: isDark ? '#09090b' : '#fff',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: 13, fontWeight: 800, color: scoreColor,
                    }}>
                        {pct}%
                    </div>
                </div>
                <div style={{ flex: 1 }}>
                    <input
                        value={videoTitle}
                        onChange={e => setVideoTitle(e.target.value)}
                        placeholder="Nome do vídeo (opcional)"
                        style={{
                            width: '100%', background: 'transparent', border: 'none', outline: 'none',
                            fontSize: 15, fontWeight: 700, color: isDark ? '#f3f4f6' : '#111827',
                            fontFamily: 'inherit', marginBottom: 4,
                        }}
                    />
                    <p style={{ margin: 0, fontSize: 12, color: isDark ? '#6b7280' : '#9ca3af' }}>
                        {done} de {total} itens concluídos
                        {pct === 100 && ' — Pronto para publicar! 🚀'}
                        {pct >= 70 && pct < 100 && ' — Quase lá!'}
                        {pct < 70 && done > 0 && ' — Continue revisando'}
                        {done === 0 && ' — Marque os itens conforme prepara o vídeo'}
                    </p>
                </div>
                {done > 0 && (
                    <button onClick={() => setChecked({})} style={{
                        fontSize: 11, color: isDark ? '#6b7280' : '#9ca3af',
                        background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'inherit',
                    }}>
                        Limpar
                    </button>
                )}
            </div>

            {/* Items by category */}
            {categories.map(cat => (
                <div key={cat}>
                    <p style={{ margin: '0 0 8px', fontSize: 11, fontWeight: 700, color: isDark ? '#6b7280' : '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.07em' }}>
                        {cat}
                    </p>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                        {CHECKLIST_ITEMS.filter(i => i.category === cat).map(item => (
                            <div
                                key={item.id}
                                onClick={() => toggle(item.id)}
                                style={{
                                    display: 'flex', alignItems: 'center', gap: 12,
                                    padding: '10px 14px', borderRadius: 10, cursor: 'pointer',
                                    background: checked[item.id]
                                        ? (isDark ? 'rgba(52,211,153,0.08)' : '#f0fdf4')
                                        : (isDark ? 'rgba(255,255,255,0.02)' : '#fafafa'),
                                    border: `1px solid ${checked[item.id]
                                        ? (isDark ? 'rgba(52,211,153,0.2)' : '#bbf7d0')
                                        : (isDark ? 'rgba(255,255,255,0.06)' : '#e5e7eb')}`,
                                    transition: 'all 0.15s',
                                }}
                            >
                                <div style={{
                                    width: 20, height: 20, borderRadius: 6, flexShrink: 0,
                                    background: checked[item.id]
                                        ? '#34d399'
                                        : (isDark ? 'rgba(255,255,255,0.05)' : '#f3f4f6'),
                                    border: `2px solid ${checked[item.id] ? '#34d399' : (isDark ? 'rgba(255,255,255,0.15)' : '#d1d5db')}`,
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                }}>
                                    {checked[item.id] && <Check size={11} color="#fff" strokeWidth={3} />}
                                </div>
                                <span style={{ fontSize: 14 }}>{item.icon}</span>
                                <span style={{
                                    fontSize: 13, flex: 1,
                                    color: checked[item.id] ? (isDark ? '#6b7280' : '#9ca3af') : (isDark ? '#e5e7eb' : '#374151'),
                                    textDecoration: checked[item.id] ? 'line-through' : 'none',
                                }}>
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

// ─── Main Page ────────────────────────────────────────────────────────────────
const TABS = [
    { id: 'script', label: 'Roteiro', icon: <FileText size={14} /> },
    { id: 'titles', label: 'Títulos e Descrição', icon: <Type size={14} /> },
    { id: 'checklist', label: 'Checklist de Publicação', icon: <CheckSquare size={14} /> },
];

export default function CreationPage() {
    const { theme } = useTheme();
    const isDark = theme === 'dark' || (theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);
    const [activeTab, setActiveTab] = useState('script');

    return (
        <PageLayout maxWidth="4xl" spacing="standard">
            {/* Header */}
            <div style={{ marginBottom: 28 }}>
                <h1 style={{ margin: '0 0 6px', fontSize: 28, fontWeight: 900, color: isDark ? '#f9fafb' : '#111827', display: 'flex', alignItems: 'center', gap: 10 }}>
                    <Sparkles size={24} color="#a78bfa" />
                    Estúdio de Criação
                </h1>
                <p style={{ margin: 0, fontSize: 14, color: isDark ? '#6b7280' : '#9ca3af' }}>
                    IA para criar roteiros, títulos e garantir que seu vídeo está pronto para publicar.
                </p>
            </div>

            {/* Tabs */}
            <div style={{ display: 'flex', gap: 8, marginBottom: 24, flexWrap: 'wrap' }}>
                {TABS.map(tab => (
                    <TabBtn
                        key={tab.id}
                        active={activeTab === tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        icon={tab.icon}
                        label={tab.label}
                        isDark={isDark}
                    />
                ))}
            </div>

            {/* Content */}
            <Card isDark={isDark}>
                {activeTab === 'script' && (
                    <>
                        <div style={{ marginBottom: 18 }}>
                            <h2 style={{ margin: '0 0 4px', fontSize: 16, fontWeight: 700, color: isDark ? '#f3f4f6' : '#111827' }}>
                                Gerador de Roteiro
                            </h2>
                            <p style={{ margin: 0, fontSize: 13, color: isDark ? '#6b7280' : '#9ca3af' }}>
                                Descreva o tema e a IA cria um roteiro completo com gancho, desenvolvimento e CTA.
                            </p>
                        </div>
                        <ScriptGenerator isDark={isDark} />
                    </>
                )}
                {activeTab === 'titles' && (
                    <>
                        <div style={{ marginBottom: 18 }}>
                            <h2 style={{ margin: '0 0 4px', fontSize: 16, fontWeight: 700, color: isDark ? '#f3f4f6' : '#111827' }}>
                                Títulos, Descrição e Hashtags
                            </h2>
                            <p style={{ margin: 0, fontSize: 13, color: isDark ? '#6b7280' : '#9ca3af' }}>
                                Gere 5 variações de título + descrição completa otimizada para SEO + hashtags para qualquer plataforma.
                            </p>
                        </div>
                        <TitleGenerator isDark={isDark} />
                    </>
                )}
                {activeTab === 'checklist' && (
                    <>
                        <div style={{ marginBottom: 18 }}>
                            <h2 style={{ margin: '0 0 4px', fontSize: 16, fontWeight: 700, color: isDark ? '#f3f4f6' : '#111827' }}>
                                Checklist de Publicação
                            </h2>
                            <p style={{ margin: 0, fontSize: 13, color: isDark ? '#6b7280' : '#9ca3af' }}>
                                Revise cada detalhe antes de publicar. Canais consistentes crescem mais rápido.
                            </p>
                        </div>
                        <PublicationChecklist isDark={isDark} />
                    </>
                )}
            </Card>

            <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
        </PageLayout>
    );
}
