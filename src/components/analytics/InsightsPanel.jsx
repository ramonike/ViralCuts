/**
 * InsightsPanel Component
 * Analyzes analytics data and generates actionable recommendations
 * Requirements: 3.5
 */

import React from 'react';
import { 
  Lightbulb, 
  TrendingUp, 
  TrendingDown, 
  Clock, 
  Target,
  AlertCircle,
  CheckCircle,
  Info
} from 'lucide-react';

/**
 * Analyze channel analytics and generate insights
 * @param {Object} channelAnalytics - Channel analytics data
 * @param {Array} trafficSources - Traffic sources data
 * @param {Object} bestTimes - Best publishing times data
 * @returns {Array} Array of insight objects
 */
function generateInsights(channelAnalytics, trafficSources, bestTimes) {
  const insights = [];
  
  if (!channelAnalytics) return insights;
  
  // Insight 1: CTR Analysis
  const avgCTR = 4.5; // Industry average for YouTube
  if (channelAnalytics.impressionsCTR > 0) {
    if (channelAnalytics.impressionsCTR < avgCTR) {
      insights.push({
        type: 'warning',
        title: 'CTR abaixo da média',
        description: `Seu CTR de ${channelAnalytics.impressionsCTR.toFixed(1)}% está abaixo da média de ${avgCTR}%. Considere melhorar suas thumbnails e títulos para aumentar os cliques.`,
        metric: 'CTR',
        value: channelAnalytics.impressionsCTR,
        icon: AlertCircle,
        actionable: true,
        suggestions: [
          'Use thumbnails com cores vibrantes e texto legível',
          'Crie títulos curiosos que despertem interesse',
          'Teste diferentes estilos de thumbnail'
        ]
      });
    } else if (channelAnalytics.impressionsCTR > avgCTR * 1.2) {
      insights.push({
        type: 'positive',
        title: 'Excelente CTR!',
        description: `Seu CTR de ${channelAnalytics.impressionsCTR.toFixed(1)}% está ${((channelAnalytics.impressionsCTR / avgCTR - 1) * 100).toFixed(0)}% acima da média. Continue com essa estratégia de thumbnails e títulos!`,
        metric: 'CTR',
        value: channelAnalytics.impressionsCTR,
        icon: CheckCircle,
        actionable: false
      });
    }
  }
  
  // Insight 2: Audience Retention
  const avgRetention = 50; // Average retention percentage
  const estimatedRetention = channelAnalytics.averageViewDuration > 0 
    ? (channelAnalytics.averageViewDuration / 180) * 100 // Assuming 3min avg video
    : 0;
    
  if (estimatedRetention > 0 && estimatedRetention < avgRetention) {
    insights.push({
      type: 'warning',
      title: 'Retenção de audiência baixa',
      description: `A retenção estimada de ${estimatedRetention.toFixed(0)}% sugere que os espectadores saem cedo. Foque em hooks fortes nos primeiros 30 segundos.`,
      metric: 'Retenção',
      value: estimatedRetention,
      icon: TrendingDown,
      actionable: true,
      suggestions: [
        'Comece com um gancho forte nos primeiros 5 segundos',
        'Evite intros longas - vá direto ao ponto',
        'Use cortes dinâmicos para manter o ritmo'
      ]
    });
  } else if (estimatedRetention >= avgRetention * 1.1) {
    insights.push({
      type: 'positive',
      title: 'Ótima retenção de audiência',
      description: `Retenção de ${estimatedRetention.toFixed(0)}% mostra que seu conteúdo mantém os espectadores engajados. Excelente trabalho!`,
      metric: 'Retenção',
      value: estimatedRetention,
      icon: TrendingUp,
      actionable: false
    });
  }
  
  // Insight 3: Best Publishing Times
  if (bestTimes && bestTimes.peakHours && bestTimes.peakHours.length > 0) {
    const topHour = bestTimes.peakHours[0];
    const timeStr = `${topHour.hour.toString().padStart(2, '0')}:00`;
    
    insights.push({
      type: 'info',
      title: 'Melhor horário para publicar',
      description: `Seus vídeos performam melhor às ${timeStr}. Considere agendar uploads para esse horário para maximizar o alcance inicial.`,
      metric: 'Horário',
      value: timeStr,
      icon: Clock,
      actionable: true,
      suggestions: [
        `Publique entre ${timeStr} e ${(topHour.hour + 2).toString().padStart(2, '0')}:00`,
        'Mantenha consistência no horário de publicação',
        'Avise sua audiência sobre o horário fixo'
      ]
    });
  }
  
  // Insight 4: Subscriber Growth
  if (channelAnalytics.subscribersGained > 0 && channelAnalytics.subscribersLost > 0) {
    const retentionRate = ((channelAnalytics.subscribersGained - channelAnalytics.subscribersLost) / channelAnalytics.subscribersGained) * 100;
    
    if (retentionRate < 80) {
      insights.push({
        type: 'warning',
        title: 'Taxa de retenção de inscritos baixa',
        description: `Você está perdendo ${channelAnalytics.subscribersLost} inscritos enquanto ganha ${channelAnalytics.subscribersGained}. Foque em conteúdo consistente e de qualidade.`,
        metric: 'Retenção de Inscritos',
        value: retentionRate,
        icon: AlertCircle,
        actionable: true,
        suggestions: [
          'Mantenha uma frequência consistente de uploads',
          'Crie conteúdo alinhado com as expectativas da audiência',
          'Peça feedback nos comentários'
        ]
      });
    } else {
      insights.push({
        type: 'positive',
        title: 'Crescimento saudável de inscritos',
        description: `Você está mantendo ${retentionRate.toFixed(0)}% dos novos inscritos. Continue criando conteúdo de valor!`,
        metric: 'Crescimento',
        value: channelAnalytics.subscribersGained - channelAnalytics.subscribersLost,
        icon: TrendingUp,
        actionable: false
      });
    }
  }
  
  // Insight 5: Traffic Sources
  if (trafficSources && trafficSources.length > 0) {
    const topSource = trafficSources[0];
    const searchTraffic = trafficSources.find(s => s.source.toLowerCase().includes('search'));
    
    if (searchTraffic && searchTraffic.percentage < 20) {
      insights.push({
        type: 'info',
        title: 'Baixo tráfego de busca',
        description: `Apenas ${searchTraffic.percentage.toFixed(1)}% do tráfego vem de buscas. Otimize SEO com palavras-chave relevantes nos títulos e descrições.`,
        metric: 'Tráfego de Busca',
        value: searchTraffic.percentage,
        icon: Target,
        actionable: true,
        suggestions: [
          'Use palavras-chave no título e nos primeiros 100 caracteres da descrição',
          'Adicione tags relevantes ao seu nicho',
          'Crie conteúdo sobre tópicos que as pessoas buscam'
        ]
      });
    } else if (topSource.source.toLowerCase().includes('suggested')) {
      insights.push({
        type: 'positive',
        title: 'Forte presença em sugestões',
        description: `${topSource.percentage.toFixed(1)}% do tráfego vem de vídeos sugeridos. O algoritmo está recomendando seu conteúdo!`,
        metric: 'Vídeos Sugeridos',
        value: topSource.percentage,
        icon: CheckCircle,
        actionable: false
      });
    }
  }
  
  // Insight 6: Watch Time
  if (channelAnalytics.watchTimeMinutes > 0) {
    const hoursWatched = channelAnalytics.watchTimeMinutes / 60;
    
    if (hoursWatched >= 4000) {
      insights.push({
        type: 'positive',
        title: 'Meta de monetização atingida!',
        description: `Você já tem ${hoursWatched.toFixed(0)} horas de exibição. Continue focando em crescer seus inscritos para monetizar.`,
        metric: 'Tempo de Exibição',
        value: hoursWatched,
        icon: CheckCircle,
        actionable: false
      });
    } else {
      const remaining = 4000 - hoursWatched;
      insights.push({
        type: 'info',
        title: 'Progresso para monetização',
        description: `Faltam ${remaining.toFixed(0)} horas de exibição para atingir o requisito de monetização. Continue criando conteúdo engajante!`,
        metric: 'Tempo de Exibição',
        value: hoursWatched,
        icon: Info,
        actionable: true,
        suggestions: [
          'Crie vídeos mais longos (8-15 minutos) para aumentar watch time',
          'Use playlists para incentivar visualizações em sequência',
          'Adicione cards e telas finais para promover outros vídeos'
        ]
      });
    }
  }
  
  return insights;
}

/**
 * Get icon component based on insight type
 */
function getInsightIcon(insight) {
  const Icon = insight.icon;
  const colorClass = {
    positive: 'text-green-400 bg-green-400/10',
    warning: 'text-yellow-400 bg-yellow-400/10',
    info: 'text-blue-400 bg-blue-400/10'
  }[insight.type] || 'text-slate-400 bg-slate-400/10';
  
  return (
    <div className={`p-2 rounded-lg ${colorClass}`}>
      <Icon className="w-5 h-5" />
    </div>
  );
}

/**
 * InsightsPanel Component
 */
export function InsightsPanel({ 
  channelAnalytics, 
  trafficSources, 
  bestTimes,
  loading = false 
}) {
  const insights = generateInsights(channelAnalytics, trafficSources, bestTimes);
  
  if (loading) {
    return (
      <div className="glass-panel p-6 rounded-xl border border-slate-800">
        <div className="flex items-center gap-3 mb-6">
          <Lightbulb className="w-6 h-6 text-yellow-400" />
          <h2 className="text-xl font-bold text-white">Insights Automáticos</h2>
        </div>
        
        <div className="space-y-4">
          {[1, 2, 3].map(i => (
            <div key={i} className="animate-pulse">
              <div className="h-4 bg-slate-700 rounded w-3/4 mb-2"></div>
              <div className="h-3 bg-slate-700 rounded w-full"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }
  
  if (insights.length === 0) {
    return (
      <div className="glass-panel p-6 rounded-xl border border-slate-800">
        <div className="flex items-center gap-3 mb-4">
          <Lightbulb className="w-6 h-6 text-yellow-400" />
          <h2 className="text-xl font-bold text-white">Insights Automáticos</h2>
        </div>
        
        <div className="text-center py-8">
          <Info className="w-12 h-12 text-slate-600 mx-auto mb-3" />
          <p className="text-slate-400">
            Não há insights disponíveis no momento. Continue criando conteúdo e volte em breve!
          </p>
        </div>
      </div>
    );
  }
  
  return (
    <div className="glass-panel p-6 rounded-xl border border-slate-800">
      <div className="flex items-center gap-3 mb-6">
        <Lightbulb className="w-6 h-6 text-yellow-400" />
        <h2 className="text-xl font-bold text-white">Insights Automáticos</h2>
        <span className="ml-auto text-xs text-slate-400 bg-slate-800 px-2 py-1 rounded">
          {insights.length} {insights.length === 1 ? 'insight' : 'insights'}
        </span>
      </div>
      
      <div className="space-y-4">
        {insights.map((insight, index) => (
          <div 
            key={index}
            className="p-4 rounded-lg bg-slate-800/50 border border-slate-700 hover:border-slate-600 transition-colors"
          >
            <div className="flex items-start gap-3">
              {getInsightIcon(insight)}
              
              <div className="flex-1">
                <h3 className="font-semibold text-white mb-1">
                  {insight.title}
                </h3>
                <p className="text-sm text-slate-300 mb-3">
                  {insight.description}
                </p>
                
                {insight.actionable && insight.suggestions && (
                  <div className="mt-3 pt-3 border-t border-slate-700">
                    <p className="text-xs font-medium text-slate-400 mb-2">
                      Sugestões:
                    </p>
                    <ul className="space-y-1">
                      {insight.suggestions.map((suggestion, idx) => (
                        <li 
                          key={idx}
                          className="text-xs text-slate-400 flex items-start gap-2"
                        >
                          <span className="text-blue-400 mt-0.5">•</span>
                          <span>{suggestion}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
              
              {insight.metric && (
                <div className="text-right">
                  <div className="text-xs text-slate-400 mb-1">
                    {insight.metric}
                  </div>
                  <div className="text-lg font-bold text-white">
                    {typeof insight.value === 'number' && insight.value % 1 !== 0
                      ? insight.value.toFixed(1)
                      : insight.value}
                    {insight.metric.includes('%') || insight.metric.includes('CTR') || insight.metric.includes('Retenção') 
                      ? '%' 
                      : ''}
                  </div>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
      
      <div className="mt-6 pt-4 border-t border-slate-700">
        <p className="text-xs text-slate-500 text-center">
          Os insights são gerados automaticamente com base nos seus dados de analytics.
          Atualize regularmente para obter recomendações mais precisas.
        </p>
      </div>
    </div>
  );
}

export default InsightsPanel;
