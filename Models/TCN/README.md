
# 🧠 TCN Pro: Advanced Pose Classification

Questo repository contiene l'implementazione finale del nostro modello di classificazione delle azioni basato su **Temporal Convolutional Networks (TCN)**. 

Dopo diverse iterazioni e test comparativi con architetture standard (come LSTM e 1D-CNN classiche), il nostro team ha sviluppato questa versione "Pro" ottimizzata per catturare le dipendenze temporali a lungo termine nei video di input.

---

## ⚙️ 1. Pipeline dei Dati & Feature Engineering

Il punto di partenza è un dataset di keypoints $(x, y, z)$ estratti frame per frame. Tuttavia, abbiamo notato che le sole coordinate spaziali non erano sufficienti per distinguere azioni simili con dinamiche diverse.

### 🚀 L'Intuizione: Velocity Features
Invece di limitarci ai dati grezzi, abbiamo arricchito l'input calcolando esplicitamente la **velocità** del movimento.
Per ogni frame $t$, calcoliamo la differenza rispetto al frame precedente:
$$\Delta P_t = P_t - P_{t-1}$$

L'input finale alla rete è una concatenazione di **Posizione + Velocità**.
* **Input Size:** Da 66 features (raw) siamo passati a **132 features**.
* **Risultato:** Il modello ora "vede" non solo *dove* si trova un arto, ma *quanto velocemente* e in *che direzione* si sta muovendo.

### 🛡️ Data Augmentation Robusta
Per prevenire l'overfitting e rendere il modello invariante a piccole variazioni, abbiamo implementato una pipeline di augmentation personalizzata attiva solo in fase di training:
1.  **Jittering:** Aggiunta di rumore gaussiano ($\mu=0, \sigma=0.01$) per simulare imperfezioni nel tracking.
2.  **Scaling Dinamico:** Moltiplicazione delle coordinate per un fattore casuale ($0.9x - 1.1x$). Questo simula l'effetto "zoom",
