# Human Pose Classification: 1D-CNN vs TCN vs Hybrid 🧠🏃‍♂️

Questa repository contiene diversi approcci di Deep Learning per la classificazione di azioni umane basate su sequenze di Keypoints (Pose Estimation). L'obiettivo è confrontare una **Baseline 1D-CNN**, una più avanzata **Temporal Convolutional Network (TCN)** e un sistema **Ibrido** che unisce le due.

Il dataset di input consiste in serie temporali di coordinate $(x, y, z)$ estratte da video (es. tramite MediaPipe), strutturate in finestre di **180 frames**.

---

## 1. Modello 1: 1D-CNN (Baseline) 📉

Questo script implementa una rete neurale convoluzionale standard ottimizzata per serie temporali, con un forte focus sulla robustezza della validazione.

### 🛠 Caratteristiche Chiave:
* **Architettura:**
    * 3 Blocchi Convoluzionali (Conv1d → BatchNorm → ReLU).
    * **MaxPooling** progressivo per ridurre la dimensionalità temporale.
    * **Global Average Pooling** finale per sintetizzare l'intera sequenza in un vettore di feature.
* **Strategia di Training:**
    * Utilizza **Stratified K-Fold Cross-Validation (K=4)** per garantire che i risultati non dipendano da un singolo split fortunato.
    * Implementa **Class Weights** nella Loss Function (`CrossEntropyLoss`) per gestire dataset sbilanciati.
* **Data Augmentation:**
    * Gaussian Noise.
    * **Random Temporal Shift (Roll):** Sposta circolarmente la sequenza temporale per rendere il modello invariante al punto di inizio dell'azione.

### ✅ Punti di Forza:
* Robustezza statistica grazie al K-Fold.
* Gestione esplicita dello sbilanciamento delle classi.
* Modello leggero e veloce da addestrare.

---

## 2. Modello 2: TCN - Temporal Convolutional Network (Advanced) 🚀

Questo script implementa un'architettura allo stato dell'arte per le serie temporali, arricchita da tecniche di Feature Engineering.

### 🛠 Caratteristiche Chiave:
* **Feature Engineering (Velocity):**
    * Non usa solo le coordinate $(x, y, z)$. Calcola esplicitamente la **Velocità** (differenza tra frame $t$ e $t-1$).
    * L'input raddoppia di dimensione (da 66 a **132 features**), fornendo alla rete informazioni dirette sulla dinamica del movimento.
* **Architettura TCN:**
    * **Dilated Convolutions:** Usa un fattore di dilatazione esponenziale ($d=1, 3, 9, 27...$) per espandere il campo recettivo (Receptive Field) e catturare dipendenze a lungo termine senza perdere risoluzione.
    * **Causal Padding (Chomp1d):** Garantisce che il modello non "veda nel futuro" (no data leakage).
    * **Residual Blocks:** Connessioni residuali per permettere un training più profondo e stabile.
* **Data Augmentation Avanzata:**
    * Oltre al rumore, implementa **Random Scaling (Zoom)**: simula il soggetto più vicino o più lontano dalla telecamera (fattore 0.9x - 1.1x).

### ✅ Punti di Forza:
* Capacità superiore di modellare relazioni temporali complesse.
* Migliore generalizzazione su azioni dinamiche grazie all'input di velocità.
* Invarianza alla distanza del soggetto (grazie allo scaling).

---

## 3. L'Approccio Ibrido: Ensemble (CNN + TCN) ⚡

Dopo aver addestrato i due modelli separatamente, abbiamo sviluppato un sistema di inferenza combinato (`inference_ensemble.py`) che sfrutta i punti di forza di entrambi per massimizzare l'accuratezza.

### 🧠 Logica Decisionale a Due Livelli
L'ensemble non si limita a una media matematica, ma applica una logica "intelligente" basata sull'analisi degli errori precedenti:

1.  **Hard Overrides (Regole di Veto):** 🛑
    * Abbiamo identificato casi in cui la TCN confonde movimenti verticali simili (es. *Squat* vs *Bicipiti*).
    * In questi casi specifici, se la **CNN** è sicura di una posa statica (es. gambe piegate nello Squat), il sistema ignora la TCN e si fida ciecamente della CNN.
2.  **Weighted Soft Voting:** ⚖️
    * Per tutti gli altri casi non ambigui, le probabilità dei due modelli vengono mediate con un sistema di pesi:
    * **CNN (Peso 1.2):** Favorita per la sua stabilità generale.
    * **TCN (Peso 0.8):** Usata per confermare la dinamica temporale.

### ⚙️ Pipeline Input Differenziata
Lo script gestisce automaticamente la trasformazione dei dati per soddisfare le diverse esigenze dei modelli in tempo reale:
* Passa i dati **Raw** (66 features) alla CNN.
* Calcola la **Velocity** al volo e passa i dati arricchiti (132 features) alla TCN.

---

## ⚔️ Confronto Tecnico Completo

| Feature | 1D-CNN (Baseline) | TCN (Advanced) | Hybrid Ensemble |
| :--- | :--- | :--- | :--- |
| **Input Data** | Coordinate Raw (66) | Coords + **Velocità** (132) | Dual Stream (Raw + Vel) |
| **Architettura** | Standard Conv1d | Dilated Conv + Residual | Ensemble Logico |
| **Focus** | Pattern Locali / Statici | Pattern Globali / Dinamici | Correzione Errori |
| **Validazione** | Stratified K-Fold | Train/Test Split | Analisi Errori Post-Hoc |
| **Logica** | Probabilistica Pura | Probabilistica Pura | **Regole condizionali + Pesi** |

---

## 📊 Performance e Output

Gli script di training generano:
* Modelli salvati (`.pth`) e classi (`.npy`).
* Grafici delle curve di Loss.

Lo script di **Inferenza Ibrida** fornisce inoltre:
* **Analisi degli Errori Dettagliata:** Spiega *perché* l'ensemble ha scelto una classe rispetto all'altra (Logica "Blame Assignment").
* **Matrici di Confusione:** Assolute e Normalizzate per valutare la precisione reale.

## 📦 Requirements

```txt
pandas
numpy
torch
scikit-learn
matplotlib
seaborn
