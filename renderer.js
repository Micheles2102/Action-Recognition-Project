// ============================================
// FILE: renderer.js (Logica UI + Selezione Modelli)
// ============================================
class FitnessAnalyzerApp {
    constructor() {
      this.api = new FitnessAPI(CONFIG.SERVER_URL);
      this.currentVideoFile = null;
      this.currentVideoPath = null;
      this.isAnalyzing = false;
      this.selectedModel = 'hybrid'; // Default
      
      this.initializeElements();
      this.initSidebar(); // Inizializza listener sidebar
      this.attachEventListeners();
      this.checkServerConnection();
    }
  
    initializeElements() {
      this.elements = {
        uploadArea: document.getElementById('upload-area'),
        videoContainer: document.getElementById('video-container'),
        videoPlayer: document.getElementById('video-player'),
        videoPlayerWrapper: document.getElementById('video-player-wrapper'),
        selectVideoBtn: document.getElementById('select-video-btn'),
        changeVideoBtn: document.getElementById('change-video-btn'),
        analyzeBtn: document.getElementById('analyze-btn'),
        resultSection: document.getElementById('result-section'),
        exerciseLabel: document.getElementById('exercise-label'),
        statusIndicator: document.getElementById('status-indicator'),
        statusText: document.getElementById('status-text'),
        // Nuovi elementi
        modelBadge: document.getElementById('model-badge'),
        metricsGrid: document.getElementById('metrics-grid')
      };
    }

    // Gestione Selezione Modello (Sidebar)
    initSidebar() {
      const buttons = document.querySelectorAll('.nav-btn');
      console.log('Inizializzazione sidebar, bottoni trovati:', buttons.length);
      
      buttons.forEach(btn => {
        btn.addEventListener('click', (e) => {
          console.log('Click su bottone modello');
          
          // Rimuovi active da tutti
          buttons.forEach(b => b.classList.remove('active'));
          
          // Aggiungi al cliccato
          const target = e.currentTarget;
          target.classList.add('active');
          
          // Aggiorna stato
          this.selectedModel = target.dataset.model;
          console.log('Modello selezionato:', this.selectedModel.toUpperCase());
        });
      });
    }
  
    attachEventListeners() {
      this.elements.selectVideoBtn.addEventListener('click', () => this.selectVideo());
      this.elements.changeVideoBtn.addEventListener('click', () => this.selectVideo());
      this.elements.analyzeBtn.addEventListener('click', () => this.analyzeVideo());
      
      console.log('Event listeners attachati');
    }
  
    async checkServerConnection() {
      const isHealthy = await this.api.checkHealth();
      this.updateServerStatus(isHealthy);
    }
  
    updateServerStatus(isConnected) {
      if (isConnected) {
        this.elements.statusIndicator.className = 'status-indicator animate-pulse';
        this.elements.statusIndicator.style.backgroundColor = '#34d399';
        this.elements.statusText.textContent = 'Server connesso';
        this.elements.statusText.style.color = '#34d399';
      } else {
        this.elements.statusIndicator.className = 'status-indicator';
        this.elements.statusIndicator.style.backgroundColor = '#f87171';
        this.elements.statusText.textContent = 'Server non disponibile';
        this.elements.statusText.style.color = '#f87171';
      }
    }
  
    async selectVideo() {
      console.log('selectVideo() chiamato');
      
      try {
        const result = await window.electron.selectVideoFile();
        console.log('Risultato selezione:', result ? 'File ricevuto' : 'Nessun file');
        
        if (!result) return;
    
        this.currentVideoPath = result.filePath;
        this.currentVideoFile = result.buffer;
        
        console.log('Video caricato:', this.currentVideoPath);
        
        // Crea un Blob dal buffer e genera un URL
        const blob = new Blob([this.currentVideoFile], { type: 'video/mp4' });
        const videoUrl = URL.createObjectURL(blob);
        
        // Carica il video
        this.elements.videoPlayer.src = videoUrl;
        this.elements.uploadArea.style.display = 'none';
        this.elements.videoContainer.style.display = 'block';
        this.elements.resultSection.style.display = 'none';
        
        // Reset bordo
        this.elements.videoPlayerWrapper.style.borderColor = '#374151';
        this.elements.videoPlayerWrapper.style.boxShadow = 'none';
        
        console.log('UI aggiornata, video visibile');
      } catch (error) {
        console.error('Errore in selectVideo:', error);
        alert('Errore nel caricamento del video: ' + error.message);
      }
    }
  
    async analyzeVideo() {
      if (!this.currentVideoFile || this.isAnalyzing) {
        console.warn('Analisi non possibile:', !this.currentVideoFile ? 'Nessun video' : 'Analisi in corso');
        return;
      }
  
      this.isAnalyzing = true;
      this.updateAnalyzeButton(true);
  
      try {
        const blob = new Blob([this.currentVideoFile], { type: 'video/mp4' });
        const file = new File([blob], 'video.mp4', { type: 'video/mp4' });
  
        // Passiamo il modello selezionato all'API
        console.log('Invio richiesta analisi con modello:', this.selectedModel);
        const result = await this.api.analyzeVideo(file, this.selectedModel);
        
        this.displayResults(result);
      } catch (error) {
        alert('Errore durante l\'analisi: ' + error.message);
        console.error(error);
      } finally {
        this.isAnalyzing = false;
        this.updateAnalyzeButton(false);
      }
    }
  
    updateAnalyzeButton(analyzing) {
      if (analyzing) {
        this.elements.analyzeBtn.disabled = true;
        this.elements.analyzeBtn.innerHTML = `
          <div class="spinner"></div>
          <span>Analizzando...</span>
        `;
      } else {
        this.elements.analyzeBtn.disabled = false;
        this.elements.analyzeBtn.innerHTML = `
          <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" 
                  d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"/>
          </svg>
          <span>Analizza Esercizio</span>
        `;
      }
    }
  
    displayResults(result) {
      const { exercise, metrics } = result;
      const color = CONFIG.EXERCISE_COLORS[exercise] || CONFIG.EXERCISE_COLORS.default;
  
      // Aggiorna bordo video
      this.elements.videoPlayerWrapper.style.borderColor = color;
      this.elements.videoPlayerWrapper.style.boxShadow = `0 0 30px ${color}40`;
  
      // Mostra etichetta esercizio
      this.elements.exerciseLabel.textContent = exercise.toUpperCase();
      this.elements.exerciseLabel.style.color = color;
      this.elements.exerciseLabel.style.textShadow = `0 0 20px ${color}40`;

      // Aggiorna Badge Modello
      if (this.elements.modelBadge) {
        this.elements.modelBadge.textContent = `(Modello: ${this.selectedModel.toUpperCase()})`;
      }
  
      // Generazione Dinamica Metriche
      this.elements.metricsGrid.innerHTML = ''; // Pulisci vecchie card
      
      if (metrics) {
        Object.entries(metrics).forEach(([key, value]) => {
          const metricConfig = CONFIG.METRICS[key];
          if (!metricConfig) return;

          const div = document.createElement('div');
          div.className = 'metric-card';
          div.style.borderColor = metricConfig.color;
          div.innerHTML = `
            <div style="color: ${metricConfig.color}; font-size: 0.9rem; font-weight: 600;">${metricConfig.label}</div>
            <div style="font-size: 1.5rem; font-weight: bold; color: white;">${(value * 100).toFixed(1)}%</div>
          `;
          this.elements.metricsGrid.appendChild(div);
        });
      }

      // Mostra sezione risultati con animazione
      this.elements.resultSection.style.display = 'block';
      this.elements.resultSection.classList.remove('fade-in');
      void this.elements.resultSection.offsetWidth; // Trigger reflow
      this.elements.resultSection.classList.add('fade-in');
    }
}
  
// Inizializza l'app quando il DOM è pronto
document.addEventListener('DOMContentLoaded', () => {
  console.log('DOM caricato, inizializzazione app...');
  new FitnessAnalyzerApp();
});