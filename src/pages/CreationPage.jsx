import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
    Sparkles, FileText, Type, CheckSquare, Image,
    Send, Copy, Check, RefreshCw,
    Youtube, Calendar, Wand2, AlertCircle, ExternalLink, Mic, Square
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
        <button onClick={() => copy(text)}
            style={{
                padding: '4px 10px', borderRadius: 4, fontSize: 11, fontWeight: 500,
                border: 'none', cursor: 'pointer', fontFamily: 'var(--font-body)',
                display: 'inline-flex', alignItems: 'center', gap: 4,
                background: copied ? 'rgba(0,201,167,.15)' : 'var(--bg-elevated)',
                color: copied ? 'var(--accent-teal)' : 'var(--text-muted)',
                transition: 'all .2s'
            }}>
            {copied ? <Check size={13} /> : <Copy size={13} />}
            {copied ? 'Copiado!' : 'Copiar'}
        </button>
    );
}

function ResultBox({ content }) {
    if (!content) return null;
    return (
        <div className="vc-card" style={{ marginTop: 16, borderColor: 'rgba(232,65,42,.3)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                <span style={{ fontWeight: 600 }}>Resultado gerado ✨</span>
                <CopyBtn text={content} />
            </div>
            <div style={{ fontSize: 14, color: 'var(--text-secondary)', lineHeight: 1.8, padding: 16, background: 'var(--bg-elevated)', borderRadius: 8 }}>
                {content}
            </div>
            <button className="vc-btn vc-btn-primary" style={{ marginTop: 16 }}><Calendar size={13} /> Agendar no Pipeline</button>
        </div>
    );
}

function ErrorBox({ error }) {
    if (!error) return null;
    return (
        <div className="vc-toast vc-toast-coral" style={{ marginTop: 12 }}>
            <AlertCircle size={15} style={{ flexShrink: 0 }} />
            <span>{error}</span>
        </div>
    );
}

function ScriptGenerator({ onPipeline, onThemeChange }) {
    const [tema, setTema] = useState('');
    const [formato, setFormato] = useState('shorts');
    const [duracao, setDuracao] = useState('60');
    const [tom, setTom] = useState('educativo');
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState('');
    const [error, setError] = useState('');
    const [isRecording, setIsRecording] = useState(false);
    const [transcript, setTranscript] = useState('');
    const recognitionRef = useRef(null);

    useEffect(() => {
        // Initialize SpeechRecognition if supported
        if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
            const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
            recognitionRef.current = new SpeechRecognition();
            recognitionRef.current.continuous = true;
            recognitionRef.current.interimResults = true;
            recognitionRef.current.lang = 'pt-BR';
            recognitionRef.current.maxAlternatives = 3;

            recognitionRef.current.onresult = (event) => {
                let finalTranscript = '';
                for (let i = event.resultIndex; i < event.results.length; i++) {
                    if (event.results[i].isFinal) {
                        finalTranscript += event.results[i][0].transcript;
                    }
                }
                if (finalTranscript) {
                    setTranscript(finalTranscript);
                    setTema(finalTranscript); // Update tema directly with transcript
                    setIsRecording(false);
                }
            };

            recognitionRef.current.onerror = (event) => {
                // Handle specific errors first - no-speech is normal, don't log
                if (event.error === 'no-speech') {
                    // Don't show error for no-speech, it's normal when user stops talking
                    // With continuous=true, it should keep listening
                    return;
                }
                console.error('Speech recognition error:', event.error);
                setIsRecording(false);
                if (event.error === 'audio-capture') {
                    setError('Microfone não detectado. Verifique as permissões.');
                    return;
                }
                if (event.error === 'not-allowed') {
                    setError('Permissão de microfone negada. Permita nas configurações do navegador.');
                    return;
                }
                setError('Erro no reconhecimento de fala. Tente novamente.');
            };

            recognitionRef.current.onend = () => {
                setIsRecording(false);
            };
        }
    }, []);

    const toggleRecording = () => {
        if (!recognitionRef.current) {
            setError('Seu navegador não suporta reconhecimento de fala. Use Chrome ou Edge.');
            return;
        }

        if (isRecording) {
            recognitionRef.current.stop();
        } else {
            setTranscript('');
            setError('');
            recognitionRef.current.start();
            setIsRecording(true);
        }
    };

    const generate = async () => {
        if (!tema.trim()) return;
        setLoading(true); setError(''); setResult('');
        if (onThemeChange) onThemeChange(tema);
        try {
            const text = await callClaude(
                `Você é um roteirista especialista em conteúdo viral para redes sociais brasileiras. Crie roteiros otimizados para engajamento, com ganchos fortes, linguagem direta e CTAs eficientes.`,
                `Crie um roteiro completo para um vídeo de ${duracao} segundos no formato ${formato}, tom ${tom}.\n\nTema: ${tema}\n\nO roteiro deve tener:\n1. GANCHO (primeiros 3 segundos) — frase que para o scroll\n2. PROBLEMA ou PROMESSA — por que o espectador deve continuar assistindo\n3. DESENVOLVIMENTO — conteúdo principal dividido em blocos curtos\n4. CTA FINAL — chamada para ação clara (curtir, seguir, comentar)\n\nFormate com emojis e deixe claro o tempo de cada parte. Escreva em português do Brasil, linguagem natural e direta.`
            );
            setResult(text);
        } catch (e) { setError(e.message); }
        finally { setLoading(false); }
    };

    return (
        <div className="vc-card">
            <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 16 }}>Gerador de Roteiro</h3>
            <div style={{ marginBottom: 16, display: 'flex', gap: 8, alignItems: 'end' }}>
                <label className="vc-label">Tema ou ideia do vídeo</label>
                <div style={{ flex: 1, display: 'flex', gap: 8 }}>
                    <textarea 
                        className="vc-input" 
                        value={tema} 
                        onChange={e => setTema(e.target.value)}
                        placeholder="Ex: Bitcoin atingiu novo recorde histórico em 2026 e especialistas preveem..."
                        rows={3}
                        style={{ resize: 'vertical', minHeight: 80, flex: 1 }}
                    />
                    <button
                        onClick={toggleRecording}
                        disabled={loading}
                        style={{
                            padding: '8px 16px', 
                            borderRadius: 8, 
                            fontSize: 14, 
                            fontWeight: 500,
                            border: 'none', 
                            cursor: isRecording ? 'not-allowed' : 'pointer',
                            background: isRecording ? 'var(--bg-elevated)' : 'var(--accent-coral)',
                            color: isRecording ? 'var(--text-muted)' : '#fff',
                            transition: 'all .2s',
                            display: 'flex',
                            alignItems: 'center',
                            gap: 4
                        }}
                    >
                        {isRecording ? (
                            <>
                                <Square size={18} style={{ animation: 'vc-pulse 1.5s infinite' }} />
                                <span>Parar</span>
                            </>
                        ) : (
                            <>
                                <Mic size={18} />
                                <span>Gravar</span>
                            </>
                        )}
                    </button>
                </div>
            </div>
            {isRecording && !loading && (
                <div style={{ marginBottom: 12, padding: '10px 14px', background: 'var(--accent-coral-3)', borderRadius: 8, border: '1px solid var(--accent-coral)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <Mic size={16} style={{ color: 'var(--accent-coral)', animation: 'vc-pulse 1.5s infinite' }} />
                        <span style={{ fontSize: 14, color: 'var(--accent-coral)' }}>Ouvindo... Fale claramente</span>
                    </div>
                </div>
            )}
            {transcript && !isRecording && !loading && (
                <div style={{ marginBottom: 12, padding: '10px 14px', background: 'var(--bg-elevated)', borderRadius: 8, border: '1px solid var(--border-default)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: 'var(--text-secondary)' }}>
                        <Check size={14} style={{ color: 'var(--accent-teal)' }} />
                        <span>Transcrito: "{transcript}"</span>
                    </div>
                </div>
            )}
            <div className="vc-grid-3">
                <div style={{ marginBottom: 16 }}>
                    <label className="vc-label">Formato</label>
                    <select className="vc-input" value={formato} onChange={e => setFormato(e.target.value)} style={{ cursor: 'pointer' }}>
                        <option value="shorts">Shorts/TikTok</option>
                        <option value="longo">Longo</option>
                        <option value="reel">Reel</option>
                    </select>
                </div>
                <div style={{ marginBottom: 16 }}>
                    <label className="vc-label">Duração</label>
                    <select className="vc-input" value={duracao} onChange={e => setDuracao(e.target.value)} style={{ cursor: 'pointer' }}>
                        {['30', '60', '90', '180', '300', '600'].map(d => (
                            <option key={d} value={d}>{d}s{d >= 60 ? ` (${d / 60}min)` : ''}</option>
                        ))}
                    </select>
                </div>
                <div style={{ marginBottom: 16 }}>
                    <label className="vc-label">Tom</label>
                    <select className="vc-input" value={tom} onChange={e => setTom(e.target.value)} style={{ cursor: 'pointer' }}>
                        <option value="educativo">Educativo</option>
                        <option value="entretenimento">Entretenimento</option>
                        <option value="motivacional">Motivacional</option>
                        <option value="informativo">Informativo</option>
                    </select>
                </div>
            </div>
            <button className="vc-btn vc-btn-primary" onClick={generate} disabled={!tema.trim() || isRecording || loading}>
                <Wand2 size={14} /> {loading ? 'Gerando roteiro...' : 'Gerar Roteiro'}
            </button>
            <ErrorBox error={error} />
            <ResultBox content={result} />
            {result && onPipeline && (
                <button className="vc-btn vc-btn-primary" style={{ marginTop: 16 }} onClick={() => onPipeline({ script: result })}>
                    <Calendar size={13} /> Agendar no Pipeline
                </button>
            )}
        </div>
    );
}


function TitleGenerator({ onPipeline, onThemeChange }) {
    const [assunto, setAssunto] = useState('');
    const [plataforma, setPlataforma] = useState('youtube');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [titles, setTitles] = useState([]);
    const [selectedTitle, setSelectedTitle] = useState('');
    const [description, setDescription] = useState('');
    const [tags, setTags] = useState('');
    const [isRecording, setIsRecording] = useState(false);
    const [transcript, setTranscript] = useState('');
    const recognitionRef = useRef(null);

    useEffect(() => {
        // Initialize SpeechRecognition if supported
        if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
            const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
            recognitionRef.current = new SpeechRecognition();
            recognitionRef.current.continuous = true;
            recognitionRef.current.interimResults = true;
            recognitionRef.current.lang = 'pt-BR';
            recognitionRef.current.maxAlternatives = 3;

            recognitionRef.current.onresult = (event) => {
                let finalTranscript = '';
                for (let i = event.resultIndex; i < event.results.length; i++) {
                    if (event.results[i].isFinal) {
                        finalTranscript += event.results[i][0].transcript;
                    }
                }
                if (finalTranscript) {
                    setTranscript(finalTranscript);
                    setAssunto(finalTranscript); // Update assunto directly with transcript
                    setIsRecording(false);
                }
            };

            recognitionRef.current.onerror = (event) => {
                // Handle specific errors first - no-speech is normal, don't log
                if (event.error === 'no-speech') {
                    // Don't show error for no-speech, it's normal when user stops talking
                    // With continuous=true, it should keep listening
                    return;
                }
                console.error('Speech recognition error:', event.error);
                setIsRecording(false);
                if (event.error === 'audio-capture') {
                    setError('Microfone não detectado. Verifique as permissões.');
                    return;
                }
                if (event.error === 'not-allowed') {
                    setError('Permissão de microfone negada. Permita nas configurações do navegador.');
                    return;
                }
                setError('Erro no reconhecimento de fala. Tente novamente.');
            };

            recognitionRef.current.onend = () => {
                setIsRecording(false);
            };
        }
    }, []);

    const toggleRecording = () => {
        if (!recognitionRef.current) {
            setError('Seu navegador não suporta reconhecimento de fala. Use Chrome ou Edge.');
            return;
        }

        if (isRecording) {
            recognitionRef.current.stop();
        } else {
            setTranscript('');
            setError('');
            recognitionRef.current.start();
            setIsRecording(true);
        }
    };

    function parseResult(text) {
        const normalized = text.includes('\\n') ? text.replace(/\\n/g, '\n') : text;
        const lines = normalized.split('\n');
        const parsedTitles = [];
        let parsedDesc = '';
        let parsedTags = '';
        let section = null;
        for (const line of lines) {
            const trimmed = line.trim();
            if (!trimmed) continue;
            if (/^##\s*5?\s*OP[ÇC][ÕO]ES?\s*DE\s*T[ÍI]TULO/i.test(trimmed) || /^##\s*T[ÍI]TULO/i.test(trimmed)) { section = 'titles'; continue; }
            if (/^##\s*DESCRI[ÇC][ÃA]O/i.test(trimmed)) { section = 'desc'; continue; }
            if (/^##\s*(?:20\s*)?HASHTAGS/i.test(trimmed)) { section = 'tags'; continue; }
            if (/^##\s*TAGS/i.test(trimmed)) { section = 'tags'; continue; }
            if (section === 'titles') { const m = trimmed.match(/^\d+[\.\)]\s*(.+)/); if (m) parsedTitles.push(m[1].replace(/\*\*/g, '').trim()); }
            else if (section === 'desc') { parsedDesc += (parsedDesc ? '\n' : '') + trimmed; }
            else if (section === 'tags') { const clean = trimmed.replace(/^\d+[\.\)]\s*/, ''); if (clean && !clean.startsWith('#')) { if (parsedTags) parsedTags += ', '; parsedTags += clean.replace(/^#/, '').trim(); } }
        }
        if (parsedTitles.length === 0) {
            const fallback = normalized.match(/##\s*5?\s*OP[ÇC][ÕO]ES?\s*DE\s*T[ÍI]TULO[^]*?(?=##\s*DESCRI[ÇC][ÃA]O|$)/i);
            if (fallback) {
                for (const t of fallback[0].match(/\d+[\.\)]\s*\*\*(.+?)\*\*/g) || []) {
                    const clean = t.replace(/^\d+[\.\)]\s*\*\*/, '').replace(/\*\*$/, '').trim();
                    if (clean) parsedTitles.push(clean);
                }
            }
        }
        if (!parsedDesc) {
            const fallback = normalized.match(/##\s*DESCRI[ÇC][ÃA]O[^]*?(?=##\s*(?:\d+\s*)?HASHTAGS|##\s*TAGS|$)/i);
            if (fallback) parsedDesc = fallback[0].replace(/^##\s*DESCRI[ÇC][ÃA]O[\s\S]*?\n/i, '').trim();
        }
        if (!parsedTags) {
            const fallback = normalized.match(/##\s*TAGS[^]*$/i);
            if (fallback) parsedTags = fallback[0].replace(/^##\s*TAGS[^]*?\n/i, '').trim().replace(/^\d+[\.\)]\s*/gm, '').split(',').map(s => s.trim().replace(/^#/, '')).filter(Boolean).join(', ');
        }
        return { titles: parsedTitles, description: parsedDesc.trim(), tags: parsedTags };
    }

    const generate = async () => {
            if (!assunto.trim()) return;
            setLoading(true); setError(''); setTitles([]); setSelectedTitle(''); setDescription(''); setTags('');
            if (onThemeChange) onThemeChange(assunto);
            try {
                console.log('[TitleGenerator] Enviando para API:', { assunto: assunto.trim(), plataforma });
                const text = await callClaude(
                    `Você é um especialista em SEO e marketing de conteúdo para criadores brasileiros. Cria títulos que maximizam CTR e descrições otimizadas para algoritmo.`,
                    `Crie títulos e descrição completa para ${plataforma} sobre o seguinte assunto:\n\n"${assunto}"\n\nEntregue:\n\n## 5 OPÇÕES DE TÍTULO\n(variações com diferentes ângulos: curiosidade, benefício, número, urgência, polêmica)\n\n## DESCRIÇÃO COMPLETA\n(300-500 palavras, com palavras-chave naturais, parágrafos curtos, links placeholder)\n\n## 20 HASHTAGS\n(mix de populares + nichadas, em ordem de relevância)\n\n## TAGS YOUTUBE\n(15 tags separadas por vírgula, sem #)\n\nTudo em português do Brasil.`
                );
                console.log('[TitleGenerator] Resposta bruta da API:', text);
                if (!text || !text.trim()) {
                    throw new Error('API retornou resposta vazia. Verifique o backend.');
                }
                const parsed = parseResult(text);
                console.log('[TitleGenerator] Parseado:', parsed);
                if (!parsed.titles || parsed.titles.length === 0) {
                    throw new Error('Não foi possível extrair títulos da resposta. Formato inesperado.');
                }
                setTitles(parsed.titles);
                setSelectedTitle(parsed.titles[0] || '');
                setDescription(parsed.description);
                setTags(parsed.tags);
            } catch (e) {
                console.error('[TitleGenerator] Erro:', e);
                setError(e.message);
            }
            finally { setLoading(false); }
        };

    const handlePipeline = () => { if (onPipeline) onPipeline({ title: selectedTitle, description, tags }); };

    return (
        <div className="vc-card">
            <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 16 }}>Gerador de Títulos e Descrição</h3>
            <div style={{ marginBottom: 16, display: 'flex', gap: 8, alignItems: 'end' }}>
                <label className="vc-label">Assunto ou resumo do vídeo</label>
                <div style={{ flex: 1, display: 'flex', gap: 8 }}>
                    <textarea 
                        className="vc-input" 
                        value={assunto} 
                        onChange={e => setAssunto(e.target.value)}
                        placeholder="Descreva o assunto do vídeo..."
                        rows={3}
                        style={{ resize: 'vertical', minHeight: 80, flex: 1 }}
                    />
                    <button
                        onClick={toggleRecording}
                        disabled={loading}
                        style={{
                            padding: '8px 16px', 
                            borderRadius: 8, 
                            fontSize: 14, 
                            fontWeight: 500,
                            border: 'none', 
                            cursor: isRecording ? 'not-allowed' : 'pointer',
                            background: isRecording ? 'var(--bg-elevated)' : 'var(--accent-coral)',
                            color: isRecording ? 'var(--text-muted)' : '#fff',
                            transition: 'all .2s',
                            display: 'flex',
                            alignItems: 'center',
                            gap: 4
                        }}
                    >
                        {isRecording ? (
                            <>
                                <Square size={18} style={{ animation: 'vc-pulse 1.5s infinite' }} />
                                <span>Parar</span>
                            </>
                        ) : (
                            <>
                                <Mic size={18} />
                                <span>Gravar</span>
                            </>
                        )}
                    </button>
                </div>
            </div>
            {isRecording && !loading && (
                <div style={{ marginBottom: 12, padding: '10px 14px', background: 'var(--accent-coral-3)', borderRadius: 8, border: '1px solid var(--accent-coral)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <Mic size={16} style={{ color: 'var(--accent-coral)', animation: 'vc-pulse 1.5s infinite' }} />
                        <span style={{ fontSize: 14, color: 'var(--accent-coral)' }}>Ouvindo... Fale claramente</span>
                    </div>
                </div>
            )}
            {transcript && !isRecording && !loading && (
                <div style={{ marginBottom: 12, padding: '10px 14px', background: 'var(--bg-elevated)', borderRadius: 8, border: '1px solid var(--border-default)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: 'var(--text-secondary)' }}>
                        <Check size={14} style={{ color: 'var(--accent-teal)' }} />
                        <span>Transcrito: "{transcript}"</span>
                    </div>
                </div>
            )}
            <div style={{ marginBottom: 16 }}>
                <label className="vc-label">Plataforma</label>
                <div style={{ display: 'flex', gap: 0, border: '1px solid var(--border-default)', borderRadius: 8, overflow: 'hidden' }}>
                    {['youtube', 'tiktok', 'instagram'].map((p, idx) => (
                        <button key={p}
                            style={{
                                flex: 1, padding: '8px 20px', fontSize: 13, fontWeight: 500,
                                border: 'none', fontFamily: 'var(--font-body)',
                                borderRight: idx < 2 ? '1px solid var(--border-default)' : 'none',
                                background: plataforma === p ? 'var(--accent-coral)' : 'transparent',
                                color: plataforma === p ? '#fff' : 'var(--text-secondary)',
                                cursor: 'pointer', transition: 'all .2s'
                            }}
                            onClick={() => setPlataforma(p)}>
                            {p === 'youtube' ? 'YouTube' : p === 'tiktok' ? 'TikTok' : 'Instagram'}
                        </button>
                    ))}
                </div>
            </div>
            <button className="vc-btn vc-btn-primary" onClick={generate} disabled={!assunto.trim() || isRecording || loading}>
                <Wand2 size={14} /> {loading ? 'Gerando títulos...' : 'Gerar Títulos e Descrição'}
            </button>
            <ErrorBox error={error} />
            {titles.length > 0 && (
                <div style={{ marginTop: 16 }}>
                    <label className="vc-label">Títulos sugeridos ✨</label>
                    {titles.map((t, i) => (
                        <div key={i}
                            style={{
                                display: 'flex', alignItems: 'center', gap: 10,
                                padding: '10px 14px', borderRadius: 8,
                                border: selectedTitle === t ? '1px solid var(--accent-coral)' : '1px solid var(--border-default)',
                                background: selectedTitle === t ? 'var(--accent-coral-3)' : 'transparent',
                                cursor: 'pointer', marginBottom: 8, transition: 'all .2s'
                            }}
                            onClick={() => setSelectedTitle(t)}>
                            <div style={{
                                width: 16, height: 16, borderRadius: '50%',
                                border: selectedTitle === t ? '2px solid var(--accent-coral)' : '2px solid var(--border-default)',
                                display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0
                            }}>
                                {selectedTitle === t && <div style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--accent-coral)' }} />}
                            </div>
                            <span style={{ fontSize: 14 }}>{t}</span>
                        </div>
                    ))}
                    <div style={{ marginBottom: 16, marginTop: 16 }}>
                        <label className="vc-label">Descrição</label>
                        <textarea className="vc-input" value={description} onChange={e => setDescription(e.target.value)} rows={4}
                            style={{ resize: 'vertical', minHeight: 80 }} />
                    </div>
                    <div style={{ marginBottom: 16 }}>
                        <label className="vc-label">Tags</label>
                        <input className="vc-input" value={tags} onChange={e => setTags(e.target.value)} placeholder="tag1, tag2, tag3" />
                    </div>
                </div>
            )}
            {selectedTitle && onPipeline && (
                <button className="vc-btn vc-btn-primary" style={{ marginTop: 16 }} onClick={handlePipeline}>
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
        <div className="vc-card">
            <div style={{ display: 'flex', alignItems: 'center', gap: 24, marginBottom: 20 }}>
                <div style={{
                    width: 100, height: 100, borderRadius: '50%',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    position: 'relative',
                    background: `conic-gradient(var(--accent-teal) 0deg ${pct * 3.6}deg, var(--border-default) ${pct * 3.6}deg 360deg)`
                }}>
                    <svg width="100" height="100" style={{ transform: 'rotate(-90deg)' }}>
                        <circle cx="50" cy="50" r="42" fill="none" stroke="transparent" strokeWidth="6" />
                    </svg>
                    <div style={{
                        position: 'absolute', fontSize: 24, fontWeight: 800,
                        background: 'linear-gradient(135deg, var(--accent-coral), var(--accent-amber))',
                        WebkitBackgroundClip: 'text',
                        WebkitTextFillColor: 'transparent',
                        backgroundClip: 'text'
                    }}>{done}</div>
                </div>
                <div>
                    <div style={{ fontSize: 14, fontWeight: 600 }}>{done} de {total} itens concluídos</div>
                    <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 4 }}>
                        {pct === 100 ? 'Tudo pronto para publicar!' : pct >= 50 ? 'Bom progresso! Continue assim.' : 'Marque os itens conforme prepara o vídeo'}
                    </div>
                    <div style={{ display: 'flex', gap: 8, marginTop: 16 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 11, color: 'var(--text-muted)' }}>
                            <span style={{ display: 'inline-block', width: 10, height: 10, borderRadius: '50%', background: 'var(--accent-teal)' }} /> Pronto
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 11, color: 'var(--text-muted)' }}>
                            <span style={{ display: 'inline-block', width: 10, height: 10, borderRadius: '50%', background: 'var(--border-default)' }} /> Pendente
                        </div>
                    </div>
                </div>
                {done > 0 && <button className="vc-btn vc-btn-secondary vc-btn-sm" style={{ marginLeft: 'auto' }} onClick={() => setChecked({})}>Limpar</button>}
            </div>
            <div style={{ marginBottom: 16 }}>
                <input className="vc-input" placeholder="Título do vídeo" />
            </div>
            {categories.map(cat => (
                <div key={cat} className="vc-card" style={{ marginTop: 16 }}>
                    <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-muted)', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '.5px' }}>{cat}</div>
                    {CHECKLIST_ITEMS.filter(i => i.category === cat).map((item, idx, arr) => (
                        <div key={item.id}
                            style={{
                                display: 'flex', alignItems: 'center', gap: 12,
                                padding: '10px 0',
                                borderBottom: idx < arr.length - 1 ? '1px solid var(--border-subtle)' : 'none',
                                cursor: 'pointer'
                            }}
                            onClick={() => toggle(item.id)}>
                            <div style={{
                                width: 20, height: 20, borderRadius: 5,
                                border: checked[item.id] ? '2px solid var(--accent-teal)' : '2px solid var(--border-default)',
                                cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                                flexShrink: 0, transition: 'all .2s',
                                background: checked[item.id] ? 'var(--accent-teal)' : 'transparent'
                            }}>
                                {checked[item.id] && <Check size={12} color="#fff" />}
                            </div>
                            <span style={{
                                fontSize: 14, flex: 1,
                                textDecoration: checked[item.id] ? 'line-through' : 'none',
                                color: checked[item.id] ? 'var(--text-muted)' : 'var(--text-primary)'
                            }}>{item.text}</span>
                        </div>
                    ))}
                </div>
            ))}
        </div>
    );
}

function ThumbnailGenerator({ onPipeline, defaultPrompt }) {
    const [prompt, setPrompt] = useState('');
    const [aspectRatio, setAspectRatio] = useState('16:9');
    const [loading, setLoading] = useState(false);
    const [promptLoading, setPromptLoading] = useState(false);
    const [predictionId, setPredictionId] = useState(null);
    const [status, setStatus] = useState(null);
    const [output, setOutput] = useState(null);
    const [outputs, setOutputs] = useState([]);
    const [error, setError] = useState('');
    const [imgError, setImgError] = useState(false);
    const [userEdited, setUserEdited] = useState(false);

    const pollStatus = useCallback(async (id) => {
        try {
            const res = await fetch(`${VITE_API_URL}/api/ai/thumbnail-status/${id}`, { credentials: 'include' });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error);
            setStatus(data.status);
            if (data.status === 'succeeded') {
                const url = Array.isArray(data.output) ? data.output[0] : data.output?.url?.() || data.output?.url || data.output;
                if (!url || typeof url !== 'string') { console.error("[Thumbnail] Invalid output:", data.output); throw new Error('Resposta inválida do gerador de imagem'); }
                setOutput(url); setOutputs(prev => [...prev, { url, aspectRatio }]); setLoading(false); return;
            }
            if (data.status === 'failed') throw new Error(data.error || 'Falha ao gerar thumbnail');
            if (data.status === 'processing' || data.status === 'starting') setTimeout(() => pollStatus(id), 2000);
        } catch (e) { setError(e.message); setLoading(false); }
    }, [aspectRatio]);

    useEffect(() => { return () => setPredictionId(null); }, []);

    useEffect(() => {
        if (defaultPrompt && !userEdited && !prompt && !promptLoading) {
            generateIdealPrompt(defaultPrompt);
        }
    }, [defaultPrompt]);

    const generateIdealPrompt = async (theme) => {
        setPromptLoading(true);
        try {
            const ideal = await callClaude(
                `Você é um engenheiro de prompts especializado em criar descrições para geradores de imagem (Imagen, Midjourney, DALL-E). Crie prompts detalhados e prontos para uso.`,
                `Crie UM prompt detalhado em português para gerar uma thumbnail de YouTube sobre: "${theme}".

O prompt deve incluir:
- Estilo visual dramático e chamativo (próprio para thumbnail)
- Cores vibrantes e contraste alto
- Composição com espaço para texto
- Elementos visuais específicos relacionados ao tema
- Iluminação profissional
- Fundo temático
- Menção explícita: "imagem livre de direitos autorais, estilo foto-realista, adequado para thumbnail do YouTube"
- Mínimo 40 palavras

Retorne APENAS o prompt, sem explicações, sem numeração, sem aspas.`
            );
            if (ideal && ideal.trim()) {
                setPrompt(ideal.trim());
                setUserEdited(false);
            }
        } catch (e) {
            setPrompt(theme ? `Thumbnail sobre: ${theme}. Imagem livre de direitos autorais, estilo dramático, cores vibrantes, composição para thumbnail YouTube.` : '');
        } finally {
            setPromptLoading(false);
        }
    };

    const handlePromptChange = (e) => {
        setUserEdited(true);
        setPrompt(e.target.value);
    };

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
            if (data.status === 'succeeded' && data.urls?.get) { setOutput(data.urls.get); setOutputs(prev => [...prev, { url: data.urls.get, aspectRatio }]); setLoading(false); }
            else pollStatus(data.id);
        } catch (e) { setError(e.message); setLoading(false); }
    };

    const generateBoth = async () => {
        if (!prompt.trim()) return;
        setLoading(true); setError(''); setImgError(false);
        const ratios = aspectRatio === '9:16' ? ['9:16', '16:9'] : ['16:9', '9:16'];
        for (const ar of ratios) {
            setStatus('starting');
            try {
                const res = await fetch(`${VITE_API_URL}/api/ai/generate-thumbnail`, {
                    method: 'POST', headers: { 'Content-Type': 'application/json' },
                    credentials: 'include', body: JSON.stringify({ prompt: prompt.trim(), aspectRatio: ar }),
                });
                const data = await res.json();
                if (!res.ok) throw new Error(data.error);
                if (data.status === 'succeeded' && data.urls?.get) {
                    setOutput(data.urls.get);
                    setOutputs(prev => [...prev, { url: data.urls.get, aspectRatio: ar }]);
                }
            } catch (e) { setError(e.message); }
        }
        setLoading(false);
    };

    const downloadImage = async (url, filename = 'thumbnail.jpg') => {
        try {
            const res = await fetch(url);
            const blob = await res.blob();
            const blobUrl = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = blobUrl; a.download = filename;
            document.body.appendChild(a); a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(blobUrl);
        } catch {
            window.open(url, '_blank');
        }
    };

    const ratios = [
        { value: '16:9', label: 'YouTube 16:9' },
        { value: '9:16', label: 'Shorts 9:16' },
        { value: '1:1', label: 'Instagram 1:1' },
        { value: '4:3', label: 'Padrão 4:3' },
    ];

    return (
        <div className="vc-card">
            <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 16 }}>Gerador de Miniatura</h3>

            {defaultPrompt && !userEdited && !prompt && promptLoading && (
                <div className="vc-card" style={{ marginBottom: 16, textAlign: 'center', padding: 16 }}>
                    <RefreshCw size={20} style={{ margin: '0 auto 8px', display: 'block', color: 'var(--accent-coral)', animation: 'spin .8s linear infinite' }} />
                    <p style={{ fontSize: 13, color: 'var(--text-secondary)' }}>Criando prompt ideal com IA...</p>
                </div>
            )}

            <div style={{ marginBottom: 16 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                    <label className="vc-label">Prompt para geração</label>
                    {defaultPrompt && (
                        <button onClick={() => { setUserEdited(false); generateIdealPrompt(defaultPrompt); }}
                            style={{ fontSize: 12, color: 'var(--accent-coral)', background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'var(--font-body)', padding: 0 }}>
                            <RefreshCw size={12} style={{ marginRight: 4 }} />Regenerar prompt ideal
                        </button>
                    )}
                </div>
                <textarea className="vc-input" value={prompt} onChange={handlePromptChange}
                    placeholder={promptLoading ? 'Gerando prompt...' : 'Descreva a thumbnail ou use um tema das abas anteriores'}
                    rows={3} style={{ resize: 'vertical', minHeight: 80 }} />
            </div>

            <div style={{ marginBottom: 16 }}>
                <label className="vc-label">Aspect Ratio</label>
                <div style={{ display: 'flex', gap: 0, border: '1px solid var(--border-default)', borderRadius: 8, overflow: 'hidden' }}>
                    {ratios.map((r, idx) => (
                        <button key={r.value}
                            style={{
                                flex: 1, padding: '8px 20px', fontSize: 13, fontWeight: 500,
                                border: 'none', fontFamily: 'var(--font-body)',
                                borderRight: idx < ratios.length - 1 ? '1px solid var(--border-default)' : 'none',
                                background: aspectRatio === r.value ? 'var(--accent-coral)' : 'transparent',
                                color: aspectRatio === r.value ? '#fff' : 'var(--text-secondary)',
                                cursor: 'pointer', transition: 'all .2s'
                            }}
                            onClick={() => setAspectRatio(r.value)}>
                            {r.label}
                        </button>
                    ))}
                </div>
            </div>

            <div style={{ display: 'flex', gap: 8 }}>
                <button className="vc-btn vc-btn-primary" onClick={generate} disabled={!prompt.trim() || loading}>
                    <Image size={14} /> {loading ? 'Gerando thumbnail...' : 'Gerar Thumbnail'}
                </button>
                {aspectRatio !== '1:1' && aspectRatio !== '4:3' && (
                    <button className="vc-btn" onClick={generateBoth} disabled={!prompt.trim() || loading}
                        style={{ fontSize: 13 }}>
                        Gerar 16:9 + 9:16
                    </button>
                )}
            </div>

            <ErrorBox error={error} />

            {status && !output && !error && (
                <div className="vc-card" style={{ marginTop: 16, textAlign: 'center', padding: 24 }}>
                    <RefreshCw size={24} style={{
                        margin: '0 auto 8px', display: 'block',
                        color: 'var(--accent-coral)',
                        animation: 'spin .8s linear infinite'
                    }} />
                    <p style={{ fontSize: 13, color: 'var(--text-secondary)' }}>{status === 'starting' ? 'Iniciando geração...' : 'Gerando imagem...'}</p>
                </div>
            )}

            {outputs.length > 0 && !imgError && outputs.map((item, idx) => (
                <div key={idx} className="vc-card" style={{ marginTop: 16, borderColor: 'rgba(232,65,42,.3)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                        <span style={{ fontWeight: 600 }}>Thumbnail {item.aspectRatio} ✨</span>
                        <div style={{ display: 'flex', gap: 8 }}>
                            <button onClick={() => downloadImage(item.url, `thumbnail-${item.aspectRatio}.jpg`)}
                                style={{ fontSize: 12, color: 'var(--text-secondary)', background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'var(--font-body)', display: 'flex', alignItems: 'center', gap: 4, padding: 0 }}>
                                <ExternalLink size={13} /> Download
                            </button>
                            <a href={item.url} target="_blank" rel="noopener noreferrer" style={{ fontSize: 12, color: 'var(--text-secondary)', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 4 }}>
                                <ExternalLink size={13} /> Original
                            </a>
                        </div>
                    </div>
                    <div style={{ width: '100%', aspectRatio: item.aspectRatio === '9:16' ? '9/16' : '16/9', borderRadius: 8, overflow: 'hidden' }}>
                        <img src={item.url} alt={`Thumbnail ${item.aspectRatio}`} onError={() => setImgError(true)}
                            style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    </div>
                    {onPipeline && (
                        <button className="vc-btn vc-btn-primary vc-btn-sm" style={{ marginTop: 16 }}
                            onClick={() => onPipeline({ thumbnailUrl: item.url })}>
                            <Calendar size={13} /> Agendar no Pipeline
                        </button>
                    )}
                </div>
            ))}

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
    const [scriptTheme, setScriptTheme] = useState('');

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
            <div style={{ marginBottom: 24 }}>
                <h2 style={{ fontSize: 20, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 8 }}>
                    <Sparkles size={20} style={{
                        background: 'linear-gradient(135deg, var(--accent-coral), var(--accent-amber))',
                        WebkitBackgroundClip: 'text',
                        WebkitTextFillColor: 'transparent',
                        backgroundClip: 'text'
                    }} />
                    Estúdio de Criação
                </h2>
                <p style={{ fontSize: 14, color: 'var(--text-secondary)', marginTop: 4 }}>Ferramentas de IA para criar conteúdo de alto desempenho.</p>
            </div>

            <div style={{
                display: 'flex', gap: 4,
                background: 'var(--bg-elevated)',
                padding: 4, borderRadius: 10, overflowX: 'auto',
                marginBottom: 24
            }}>
                {TABS.map(tab => (
                    <button key={tab.id}
                        style={{
                            padding: '8px 20px', borderRadius: 8, fontSize: 13,
                            fontWeight: 500, cursor: 'pointer', border: 'none',
                            background: activeTab === tab.id ? 'var(--accent-coral)' : 'transparent',
                            color: activeTab === tab.id ? '#fff' : 'var(--text-primary)',
                            opacity: activeTab === tab.id ? 1 : 0.65,
                            fontFamily: 'var(--font-body)',
                            transition: 'all .2s', whiteSpace: 'nowrap'
                        }}
                        onClick={() => setActiveTab(tab.id)}>
                        {tab.label}
                    </button>
                ))}
            </div>

            {activeTab === 'script' && <ScriptGenerator onPipeline={handlePipeline} onThemeChange={setScriptTheme} />}
            {activeTab === 'titles' && <TitleGenerator onPipeline={handlePipeline} onThemeChange={setScriptTheme} />}
            {activeTab === 'thumbnail' && <ThumbnailGenerator onPipeline={handlePipeline} defaultPrompt={scriptTheme} />}
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
