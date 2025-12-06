// ============================================
// FILE: api.js (Fix Ngrok Warning + Model Selection)
// ============================================
class FitnessAPI {
    constructor(baseURL) {
      // Rimuove slash finali per pulizia
      this.baseURL = baseURL.replace(/\/$/, "");
      console.log("API Configured:", this.baseURL);
    }
  
    // Funzione helper per le chiamate (aggiunge l'header anti-blocco)
    async _fetch(url, options = {}) {
      const headers = {
        'ngrok-skip-browser-warning': 'true', // <--- IL TRUCCO MAGICO
        ...options.headers
      };
      return fetch(url, { ...options, headers });
    }
  
    async checkHealth() {
      try {
        const response = await this._fetch(`${this.baseURL}/health`);
        return response.ok;
      } catch (error) {
        console.warn('Health check skipped/failed:', error);
        return false;
      }
    }
  
    // AGGIORNATO: Aggiunto parametro modelType con default 'hybrid'
    async analyzeVideo(videoFile, modelType = 'hybrid') {
      console.log(`🚀 Step 1: Upload Video (Model: ${modelType})...`);
      const formData = new FormData();
      formData.append('video', videoFile);
      formData.append('model_type', modelType); // <--- INVIA LA SELEZIONE AL SERVER
  
      let task_id;
  
      // 1. UPLOAD (POST)
      try {
        const startResponse = await this._fetch(`${this.baseURL}/analyze`, {
          method: 'POST',
          body: formData
        });
  
        if (!startResponse.ok) {
           const errText = await startResponse.text();
           throw new Error(`Server Error (${startResponse.status}): ${errText}`);
        }
  
        const data = await startResponse.json();
        task_id = data.task_id;
        console.log("✅ Upload OK. Task ID:", task_id);
  
      } catch (error) {
        throw new Error("Errore Upload: " + error.message);
      }
  
      // 2. POLLING (GET)
      console.log("🔄 Step 2: Inizio Polling...");
      
      return new Promise((resolve, reject) => {
        const interval = setInterval(async () => {
          try {
            const statusRes = await this._fetch(`${this.baseURL}/status/${task_id}`);
            
            // Gestione errore se non è JSON
            const contentType = statusRes.headers.get("content-type");
            if (contentType && contentType.indexOf("application/json") === -1) {
                console.error("⚠️ Ricevuto HTML invece di JSON. Probabile errore server o Ngrok.");
                return; 
            }

            if (!statusRes.ok) {
                clearInterval(interval);
                reject(new Error(`Errore Server ${statusRes.status}`));
                return;
            }

            const statusData = await statusRes.json();
            console.log(`📊 Stato Task: ${statusData.status}`);
  
            if (statusData.status === 'completed') {
              console.log("🎉 Finito!");
              clearInterval(interval);
              resolve(statusData.result);
            } else if (statusData.status === 'error') {
              console.error("💀 Errore Backend:", statusData.message);
              clearInterval(interval);
              reject(new Error(statusData.message));
            }
  
          } catch (err) {
            console.error("Errore polling:", err);
            clearInterval(interval);
            reject(err);
          }
        }, 1000); 
      });
    }
}