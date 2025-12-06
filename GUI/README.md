# 🖥️ Fitness AI Analyzer - GUI Architecture & Documentation

Questa sezione documenta l'architettura del client desktop sviluppato in **Electron**. L'applicazione funge da interfaccia utente per il sistema di classificazione video, permettendo l'upload dei file, la selezione del modello AI e la visualizzazione delle metriche di performance.

![WhatsApp Image 2025-12-06 at 13 34 44](https://github.com/user-attachments/assets/c9b6ff41-8c8a-451c-a632-062e2d97db99)

---

## 🏗️ Panoramica dell'Architettura

L'applicazione segue il pattern **Electron standard** con una separazione netta tra processi per garantire sicurezza e performance:

1.  **Main Process (`main.js`):** Gestisce il ciclo di vita dell'app e l'accesso al File System nativo.
2.  **Preload Script (`preload.js`):** Un "ponte" sicuro che espone funzioni specifiche al frontend.
3.  **Renderer Process (`renderer.js` + UI):** La logica dell'interfaccia utente e la comunicazione HTTP con il server Python.

---


## 📂 Dettaglio Componenti

### 1. Comunicazione Backend (`api.js` & `config.js`)

Questa è la logica che connette la GUI al server di Deep Learning.

* **`api.js` (FitnessAPI Class):**
    * **Ngrok Bypass:** Implementa l'header `ngrok-skip-browser-warning` per evitare la pagina di stop di Ngrok durante i test.
    * **Polling Intelligente:** L'analisi video è un processo asincrono. L'API invia il video (`POST /analyze`) e riceve un `task_id`. Successivamente, interroga il server (`GET /status/{task_id}`) ogni secondo finché l'elaborazione non è completa.
    * **Selezione Modello:** Il metodo `analyzeVideo` accetta un parametro `modelType` ('hybrid', 'cnn', 'tcn') che viene inoltrato al backend.

* **`config.js`:**
    * Centralizza la configurazione (URL del server, timeout).
    * **Color Mapping:** Definisce una palette colori associata a ogni esercizio (es. *Squat* = Viola, *Plank* = Verde).
    * **Metrics Config:** Mappa le chiavi JSON (`accuracy`, `f1_score`) in etichette leggibili per l'utente.

### 2. Electron Core (`main.js` & `preload.js`)

* **`main.js`:**
    * Crea la finestra browser 1400x1000px.
    * Gestisce l'evento IPC `select-video-file`. Invece di passare solo il percorso, legge il file dal disco usando `fs.promises.readFile` e restituisce il **Buffer**. Questo è cruciale perché i browser moderni (e Electron renderer) non possono leggere percorsi locali assoluti per motivi di sicurezza.

* **`preload.js`:**
    * Usa `contextBridge` per esporre in modo sicuro l'oggetto `window.electron`.
    * Fornisce la funzione `selectVideoFile()` al frontend senza esporre l'intero modulo `ipcRenderer`.

### 3. Logica Frontend (`renderer.js`)

La classe `FitnessAnalyzerApp` agisce come controller della pagina:

* **Gestione Sidebar:** Ascolta i click sui bottoni del modello (Hybrid, CNN, TCN), aggiorna la classe visiva `.active` e salva la scelta nella variabile `this.selectedModel`.
* **Gestione Upload:** Invoca Electron per ottenere il file video, crea un URL Blob per l'anteprima locale nel player `<video>` e nasconde l'area di upload.
* **Analisi:**
    1.  Blocca il pulsante "Analizza" (stato loading).
    2.  Chiama `api.analyzeVideo()` passando il file e il modello scelto.
    3.  Al termine, sblocca l'interfaccia e chiama `displayResults()`.
* **Visualizzazione Risultati:**
    * Cambia il colore del bordo del video in base all'esercizio rilevato.
    * Genera dinamicamente le card delle metriche (Accuracy, F1, etc.) nel DOM.

### 4. Interfaccia Utente (`index.html` & `style.css`)

* **Layout:** Struttura flessibile con **Sidebar** laterale fissa e **Main Content** scrollabile.
* **Stile (Glassmorphism):**
    * Uso estensivo di `backdrop-filter: blur(12px)` e background semi-trasparenti (`rgba`) per un look moderno e tech.
    * Animazioni CSS fluide (`fade-in`, `pulse`) per feedback visivo durante il caricamento e la connessione al server.
* **Responsività:** Media queries per adattare la sidebar (che diventa una top-bar o si riduce) e la griglia delle metriche su schermi più piccoli.

---

## 🔄 Flusso di Esecuzione (Workflow)

1.  **Avvio:** L'app parte, `renderer.js` istanzia la classe e verifica la connessione al server (Health Check). Il pallino nella sidebar diventa verde.
2.  **Selezione Video:** L'utente clicca "Seleziona Video". Il `main.js` apre il file system nativo, legge il file e lo passa alla memoria del renderer.
3.  **Selezione Modello:** L'utente clicca su "Solo TCN" nella sidebar. `renderer.js` aggiorna lo stato interno.
4.  **Analisi:**
    * Click su "Analizza Esercizio".
    * Viene inviata una POST al server con il file video e il campo `model_type='tcn'`.
    * L'interfaccia mostra "Analizzando...".
5.  **Risultato:**
    * Il polling riceve `status: completed`.
    * L'interfaccia rivela la sezione risultati.
    * Il video si illumina del colore dell'esercizio (es. Blu per "Curl Bicipiti").
    * Compaiono le metriche di confidenza.

---

## 🚀 Come Eseguire la GUI

Assicurarsi di avere Node.js installato.

1.  **Installazione Dipendenze:**
    ```bash
    npm install
    ```

2.  **Configurazione Server:**
    Aprire `config.js` e aggiornare `SERVER_URL` con l'indirizzo Ngrok corrente:
    ```javascript
    const CONFIG = {
        SERVER_URL: '[https://tuo-url-ngrok.ngrok-free.dev](https://tuo-url-ngrok.ngrok-free.dev)',
        // ...
    };
    ```

3.  **Avvio Applicazione:**
    ```bash
    npm start
    ```
    *(Per la modalità sviluppatore con console aperta: `npm run dev`)*
