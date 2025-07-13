import React, { useState, useRef } from 'react';
import { Search, Shield, ShieldAlert, Brain, TrendingUp, AlertCircle, CheckCircle2 } from 'lucide-react';
import { detectFakeNews, PredictionResponse } from './api';
import AttentionHeatmap from './AttentionHeatmap';

function App() {
  const [newsText, setNewsText] = useState('');
  const [result, setResult] = useState<'real' | 'fake' | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [xaiExplanation, setXaiExplanation] = useState('');
  const [confidenceScore, setConfidenceScore] = useState(0);
  const [tokens, setTokens] = useState<string[]>([]);
  const [displayTokens, setDisplayTokens] = useState<string[]>([]);
  const [scores, setScores] = useState<number[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [attentions, setAttentions] = useState<number[][][] | null>(null);

  // Add a ref to store the current AbortController
  const abortControllerRef = useRef<AbortController | null>(null);

  const handleDetect = async () => {
    if (!newsText.trim()) return;
    
    setIsLoading(true);
    setError(null);
    
    // Create a new AbortController for this request
    abortControllerRef.current = new AbortController();
    
    try {
      const response = await detectFakeNews(
        newsText, 
        abortControllerRef.current.signal
      );
      
      setResult(response.prediction);
      // Format confidence score to max 99.99% even if it's very close to 100%
      const rawConfidence = Number(response.probability) * 100;
      setConfidenceScore(rawConfidence >= 99.99 ? 99.99 : rawConfidence);
      setTokens(response.tokens);
      setDisplayTokens(response.display_tokens || response.tokens);
      setScores(response.scores);
      setAttentions(response.attentions);
      
      // Generate explanation based on prediction
      setXaiExplanation(response.prediction === 'real' 
        ? 'This article contains factual information with credible sources. Key indicators include verified quotes, official statistics, and cross-referenced data from reliable institutions.'
        : 'This content shows signs of misinformation. Red flags include sensationalized language, lack of credible sources, and claims that contradict established facts.');
    } catch (error: unknown) {
      // Don't show error if it was a deliberate cancellation
      if (error instanceof Error && error.name !== 'AbortError') {
        setError('Failed to connect to the backend server. Please ensure it is running.');
        console.error(error);
      }
    } finally {
      setIsLoading(false);
      abortControllerRef.current = null;
    }
  };

  const resetDetector = () => {
    // If there's an ongoing request, abort it
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    
    // Reset all state
    setNewsText('');
    setResult(null);
    setXaiExplanation('');
    setConfidenceScore(0);
    setTokens([]);
    setScores([]);
    setError(null);
    setIsLoading(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 relative overflow-hidden">
      {/* Background decorative elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-purple-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-blue-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-pink-500 rounded-full mix-blend-multiply filter blur-xl opacity-10 animate-pulse"></div>
      </div>

      <div className="relative z-10 container mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="flex items-center justify-center mb-4">
            <div className="relative">
              <Shield className="w-16 h-16 text-blue-400 drop-shadow-lg" />
              <div className="absolute -top-2 -right-2 w-6 h-6 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center">
                <Brain className="w-3 h-3 text-white" />
              </div>
            </div>
          </div>
          <h1 className="text-5xl font-bold text-white mb-4 bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
            Fake News Detector
          </h1>
          <p className="text-xl text-gray-300 max-w-2xl mx-auto">
            AI-powered news verification with explainable insights
          </p>
        </div>

        {/* Main Content */}
        <div className="max-w-4xl mx-auto">
          {/* Input Section */}
          <div className="backdrop-blur-xl bg-white/10 rounded-3xl p-8 shadow-2xl border border-white/20 mb-8">
            <div className="mb-6">
              <label htmlFor="news-input" className="block text-lg font-medium text-white mb-3 flex items-center gap-2">
                <Search className="w-5 h-5" />
                Enter News Article or Headline
              </label>
              <textarea
                id="news-input"
                value={newsText}
                onChange={(e) => setNewsText(e.target.value)}
                placeholder="Paste your news article or headline here to analyze its authenticity..."
                className="w-full h-40 p-4 bg-white/5 border border-white/20 rounded-2xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all duration-300 resize-none backdrop-blur-sm"
                disabled={isLoading}
              />
            </div>

            <div className="flex gap-4">
              <button
                onClick={handleDetect}
                disabled={!newsText.trim() || isLoading}
                className="flex-1 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 disabled:from-gray-500 disabled:to-gray-600 text-white font-semibold py-4 px-8 rounded-2xl transition-all duration-300 transform hover:scale-105 disabled:scale-100 disabled:cursor-not-allowed shadow-lg hover:shadow-xl backdrop-blur-sm flex items-center justify-center gap-3"
              >
                {isLoading ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                    Analyzing...
                  </>
                ) : (
                  <>
                    <Search className="w-5 h-5" />
                    Detect Fake News
                  </>
                )}
              </button>
              
              {/* Make Reset button available during loading as well */}
              {(result || isLoading) && (
                <button
                  onClick={resetDetector}
                  className="bg-white/10 hover:bg-white/20 text-white font-semibold py-4 px-6 rounded-2xl transition-all duration-300 backdrop-blur-sm border border-white/20 hover:border-white/40"
                >
                  {isLoading ? "Cancel" : "Reset"}
                </button>
              )}
            </div>
          </div>

          {/* Results Section */}
          {result && (
            <div className="backdrop-blur-xl bg-white/10 rounded-3xl p-8 shadow-2xl border border-white/20 mb-8 animate-in fade-in duration-500">
              <div className="text-center mb-8">
                <div className="flex items-center justify-center mb-4">
                  {result === 'real' ? (
                    <CheckCircle2 className="w-16 h-16 text-green-400 drop-shadow-lg" />
                  ) : (
                    <AlertCircle className="w-16 h-16 text-red-400 drop-shadow-lg" />
                  )}
                </div>
                
                <h2 className="text-4xl font-bold mb-3">
                  <span className={`bg-gradient-to-r ${result === 'real' 
                    ? 'from-green-400 to-emerald-400' 
                    : 'from-red-400 to-pink-400'
                  } bg-clip-text text-transparent`}>
                    {result === 'real' ? 'REAL NEWS' : 'FAKE NEWS'}
                  </span>
                </h2>
                
                <div className="flex items-center justify-center gap-2 mb-4">
                  <TrendingUp className="w-5 h-5 text-gray-300" />
                  <span className="text-gray-300">Confidence: </span>
                  <span className="text-white font-semibold">{confidenceScore.toFixed(1)}%</span>
                </div>
                
                {/* Confidence Bar */}
                <div className="w-full max-w-md mx-auto bg-white/10 rounded-full h-3 overflow-hidden">
                  <div 
                    className={`h-full rounded-full transition-all duration-1000 ${
                      result === 'real' 
                        ? 'bg-gradient-to-r from-green-500 to-emerald-500' 
                        : 'bg-gradient-to-r from-red-500 to-pink-500'
                    }`}
                    style={{ width: `${confidenceScore}%` }}
                  ></div>
                </div>
              </div>
            </div>
          )}

          {/* XAI Section */}
          {xaiExplanation && (
            <div className="backdrop-blur-xl bg-white/10 rounded-3xl p-8 shadow-2xl border border-white/20 animate-in fade-in duration-700">
              <div className="flex items-center gap-3 mb-6">
                <Brain className="w-8 h-8 text-purple-400" />
                <h3 className="text-2xl font-bold text-white">AI Explanation</h3>
              </div>
              
              <div className="mb-6">
                <p className="text-gray-300 leading-relaxed text-lg">
                  {xaiExplanation}
                </p>
              </div>
              
              {/* Visual XAI Representation */}
              <div className="bg-white/5 rounded-2xl p-6 border border-white/10 mb-8">
                <h4 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-blue-400" />
                  Analysis Breakdown
                </h4>
                
                <div className="space-y-2">
                  {tokens.length > 0 && scores.length > 0 ? (
                    // Display tokens in their original order (from first to last in the text)
                    [...Array(Math.min(tokens.length, 10)).keys()]
                      .map(index => ({ token: tokens[index], score: scores[index] }))
                      .map(({ token, score }, index) => {
                        const positive = score >= 0;
                        
                        // Calculate the total sum of absolute scores for normalization
                        const totalAbsScore = scores.reduce((sum, s) => sum + Math.abs(s), 0);
                        
                        // Normalize the score as a percentage of the total influence
                        // This ensures all scores add up to approximately 100%
                        const percentValue = (Math.abs(score) / totalAbsScore) * 100;
                        
                        return (
                          <div key={index} className="flex items-center gap-4">
                            <div className="w-32 text-sm text-gray-300 truncate" title={token}>{token}</div>
                            <div className="flex-1 bg-white/10 rounded-full h-2 overflow-hidden">
                              <div 
                                className={`h-full rounded-full transition-all duration-500 ${
                                  positive 
                                    ? 'bg-gradient-to-r from-green-500 to-emerald-500' 
                                    : 'bg-gradient-to-r from-red-500 to-pink-500'
                                }`}
                                style={{ width: `${percentValue}%` }}
                              ></div>
                            </div>
                            <div className="w-24 text-sm text-gray-300 text-right">
                              {positive ? '+' : '-'}{percentValue.toFixed(2)}%
                              <span className="text-xs ml-1 opacity-70">
                                ({positive ? 'real' : 'fake'})
                              </span>
                            </div>
                          </div>
                        );
                      })
                  ) : (
                    <div className="text-gray-400 text-center py-4">No token analysis available</div>
                  )}
                </div>
                
                {/* Add a legend explaining the scores */}
                <div className="mt-4 text-xs text-gray-400 flex justify-between">
                  <div className="flex items-center">
                    <div className="w-3 h-3 rounded-full bg-gradient-to-r from-red-500 to-pink-500 mr-2"></div>
                    <span>Indicates fake news</span>
                  </div>
                  <div className="flex items-center">
                    <div className="w-3 h-3 rounded-full bg-gradient-to-r from-green-500 to-emerald-500 mr-2"></div>
                    <span>Indicates real news</span>
                  </div>
                </div>
              </div>

              {/* Attention Heatmap Section */}
              <div className="bg-white/5 rounded-2xl p-6 border border-white/10">
                <h4 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-purple-400" />
                  Attention Heatmap
                </h4>
                
                {tokens.length > 0 && attentions && attentions.length > 0 && (
                  <AttentionHeatmap
                    tokens={displayTokens}
                    attention={attentions[0][0]} // Pass the first layer's attention matrix (2D array)
                  />
                )}
              </div>
            </div>
          )}
      </div>
    </div>
  </div>
)}
export default App;














