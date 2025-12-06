// ============================================
// FILE: config.js
// ============================================
const CONFIG = {
    // ⚠️ URL AGGIORNATO DAL TUO TERMINALE ⚠️
    SERVER_URL: 'INSERISCI_QUI_URL_NGROK',
    
    // Lascia invariato il resto
    ENDPOINTS: {
      ANALYZE: '/analyze',
      HEALTH: '/health'
    },
    
    EXERCISE_COLORS: {
      'curl bicipiti': '#5B9BD5',
      'plank': '#88B04B',
      'flessioni': '#FF6F61',
      'squat': '#9B59B6',
      'addominali': '#F7CAC9',
      'jumping jacks': '#FFD662',
      'burpees': '#92A8D1',
      'dip': '#6C757D',       
      'barchetta': '#17A2B8', 
      'default': '#6C757D'
    },
    
    METRICS: {
      'accuracy': { label: 'Accuracy', color: '#5B9BD5' },
      'f1_score': { label: 'F1-Score', color: '#88B04B' },
      'recall': { label: 'Recall', color: '#FF6F61' },
      'precision': { label: 'Precision', color: '#9B59B6' }
    },
    REQUEST_TIMEOUT: 300000, // 5 minuti (sicuro per video pesanti)
    MAX_FILE_SIZE: 500 * 1024 * 1024

};
