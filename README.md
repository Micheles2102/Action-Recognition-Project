# ⚙️ Machine Learning: Action-Recognition-Project ⚙️

Questo progetto implementa un sistema end-to-end per la classificazione di azioni umane in video, basato sull'analisi di sequenze temporali di landmark scheletrici.

<p align="center">
  <img src="https://github.com/user-attachments/assets/e31b8ced-e314-4bea-be3b-c70bf14e8971" width="100%" alt="Fitness AI Analyzer Dashboard">
</p>

---

## 🧠 Pipeline di Elaborazione & Architetture

Il cuore del progetto si basa su una pipeline robusta che trasforma video grezzi in predizioni accurate.

### 🔹 Pipeline Dati
1.  **Feature Extraction:** Utilizzo di **MediaPipe Pose** per l'estrazione frame-by-frame di 33 keypoints corporei (coordinate x, y, z).
2.  **Preprocessing Dati:**
    * **Normalizzazione Spaziale:** Centratura delle coordinate relativa al punto medio del bacino (hip-center) per garantire invarianza alla posizione.
    * **Scaling:** Normalizzazione basata sulla dimensione del torso per garantire invarianza alla distanza dalla camera.
    * **Resampling Temporale:** Interpolazione lineare delle sequenze per ottenere input a lunghezza fissa (es. 180 frame).

### 🔹 Architetture Neurali
Il sistema permette di scegliere tra tre approcci distinti:
* **1D-CNN (Convolutional Neural Network):** Rete convoluzionale monodimensionale ottimizzata per l'estrazione di pattern locali nelle serie temporali.
* **TCN (Temporal Convolutional Network):** Modello avanzato con convoluzioni dilatate (dilated convolutions) e connessioni residuali per catturare dipendenze temporali a lungo termine e relazioni causali.
* **Hybrid Ensemble:** Approccio ibrido che sfrutta la cooperazione tra i modelli per massimizzare l'accuratezza delle predizioni.

---

## 💻 Fitness AI Analyzer (App Desktop)

**Fitness AI Analyzer** è un'applicazione desktop cross-platform sviluppata con **Electron** che permette di analizzare video di allenamento per identificare automaticamente l'esercizio eseguito e valutarne le performance attraverso metriche di accuratezza.

### ✨ Caratteristiche Principali

| Feature | Descrizione |
| :--- | :--- |
| 🎥 **Input Flessibile** | Caricamento video locale (MP4, MOV, AVI, MKV, WebM) |
| 🤖 **AI Selectable** | Scegli in real-time tra CNN, TCN o Hybrid model |
| 📊 **Metriche** | Visualizzazione di Accuracy, F1-Score, Precision, Recall |
| 🎨 **UI Moderna** | Design glassmorphism con animazioni fluide e responsive |
| ⚡ **Performance** | Gestione buffer video efficiente e analisi asincrona |
| 🌐 **Backend** | Connessione a server remoto via tunnel Ngrok |

---

## 👁️ Visualizzazione Risultati

L'applicazione fornisce un feedback visivo immediato. Il risultato del modello viene mostrato in una sezione dedicata sotto il video, arricchita da un effetto **blur dinamico** che contorna il player in base alla predizione.

### Mappatura Classi & Colori
Ogni esercizio è associato a un colore specifico per un riconoscimento istantaneo:

<p align="center">
  <img src="https://github.com/user-attachments/assets/e689566d-964f-4c6b-9a24-da52dfdc8a47" width="600" alt="Tabella Mapping Colori">
</p>

### Predizione Finale
Esempio di output con la label predetta dal modello selezionato:

<p align="center">
  <img src="https://github.com/user-attachments/assets/1523f4b2-1896-43f3-a227-7f9271fff72b" width="600" alt="Esempio Predizione">
</p>

---

## 📂 Pose Exercise Dataset

Questo repository contiene informazioni e strumenti per utilizzare il dataset di pose estimation e classificazione degli esercizi creato per questo progetto.

📥 **Download Dataset:**
Il dataset completo è disponibile su **Kaggle**:
[👉 Vai al Dataset su Kaggle](https://www.kaggle.com/datasets/michelerispo/machinelearning-project-pose-fitness-data-analisy/data)

### Contenuto del repository
* `README.md` (questa descrizione)
* Script di esempio / notebook per elaborare i dati
* File di preprocessing e utility
