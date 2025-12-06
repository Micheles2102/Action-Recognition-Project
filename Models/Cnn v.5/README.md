
# Human Pose Classification: 1D-CNN vs TCN 🧠🏃‍♂️

Questa repository contiene due approcci di Deep Learning distinti per la classificazione di azioni umane basate su sequenze di Keypoints (Pose Estimation). L'obiettivo è confrontare una **Baseline 1D-CNN** con una più avanzata **Temporal Convolutional Network (TCN)**.

Il dataset di input consiste in serie temporali di coordinate $(x, y, z)$ estratte da video (es. tramite MediaPipe), strutturate in finestre di **180 frames**.

---
## 1. Modello 1: 1D-CNN (Baseline) 📉

Questo script implementa una rete neurale convoluzionale standard ottimizzata per serie temporali, con un forte focus sulla robustezza della validazione.

### 🛠 Caratteristiche Chiave:
* **Architettura:** * 3 Blocchi Convoluzionali (Conv1d → BatchNorm → ReLU).
    * **MaxPooling** progressivo per ridurre la dimensionalità temporale.
    * **Global Average Pooling** finale per sintetizzare l'intera sequenza in un vettore di feature.
* **Strategia di Training:** * Utilizza **Stratified K-Fold Cross-Validation (K=4)** per garantire che i risultati non dipendano da un singolo split fortunato.
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
* **Feature Engineering (Velocity):** * Non usa solo le coordinate $(x, y, z)$. Calcola esplicitamente la **Velocità** (differenza tra frame $t$ e $t-1$).
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

## ⚔️ Confronto Tecnico: CNN vs TCN

| Feature | 1D-CNN (Baseline) | TCN (Advanced) |
| :--- | :--- | :--- |
| **Input Data** | Coordinate Raw (66 features) | Coordinate + **Velocità** (132 features) |
| **Architettura** | Standard Conv1d + MaxPool | Dilated Conv + Residual Conn. |
| **Memory** | Breve termine (Local Patterns) | Lungo termine (Global Patterns) |
| **Validazione** | Stratified K-Fold (4 Split) | Train/Test Split (80/20) |
| **Augmentation** | Noise + Time Shift | Noise + **Scaling (Zoom)** |
| **Loss Function** | Weighted CrossEntropy | Standard CrossEntropy |
| **Optimizer** | AdamW | AdamW + Weight Decay |

---

## 📊 Performance e Output

Entrambi gli script generano:
* Salvataggio del modello migliore (`.pth`).
* Salvataggio delle classi (`.npy`).
* Grafici delle curve di Loss (Train vs Val).

Lo script **TCN** include inoltre alla fine del training:
* **Classification Report** (Precision, Recall, F1-Score).
* **Confusion Matrix** visualizzata con Seaborn.

## 📦 Requirements

```txt
pandas
numpy
torch
scikit-learn
matplotlib
seaborn
