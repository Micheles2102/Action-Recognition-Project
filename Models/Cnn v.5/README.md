# 📉 1D-CNN Baseline: Robust Pose Classification

Questo repository contiene l'implementazione della nostra **Baseline 1D-CNN**. 
Prima di sviluppare modelli complessi basati sulla dilatazione temporale (come TCN), abbiamo progettato questa rete convoluzionale standard per stabilire un punto di riferimento solido e statisticamente affidabile.

L'obiettivo di questo script non è solo la velocità, ma la **robustezza della validazione** su dataset sbilanciati.

---

## ⚙️ 1. Pipeline di Validazione Rigorosa

A differenza di approcci standard che dividono i dati una sola volta, abbiamo optato per una strategia a doppio livello per garantire che le metriche non siano frutto del caso.

### 🛡️ Stratified K-Fold Cross-Validation
Abbiamo implementato una **K-Fold (N=4)** stratificata.
* **Perché?** Con dataset di video pose estimation, è facile avere uno split "fortunato" o "sfortunato".
* **Come funziona:** Invece di addestrare un solo modello, ne addestriamo 4 diversi su porzioni diverse del dataset. La performance finale è la media di questi run. Questo ci dà una stima molto più realistica di come il modello si comporterà nel mondo reale.

### ⚖️ Gestione dello Sbilanciamento (Class Weights)
Analizzando i dati, abbiamo notato che alcune classi erano meno frequenti di altre.
* **La Soluzione:** Abbiamo calcolato i pesi delle classi (`compute_class_weight`) basandoci sulla frequenza nel training set.
* **Impatto:** Questi pesi vengono passati alla Loss Function (`CrossEntropyLoss`). Se il modello sbaglia una classe rara, viene penalizzato molto di più rispetto a quando sbaglia una classe comune. Questo forza la rete a imparare anche le azioni meno rappresentate.

---

## 🏗️ 2. Architettura CNN 1D

Abbiamo progettato una rete leggera ma profonda a sufficienza per estrarre pattern spaziali dai keypoints.

### 🔧 Struttura del Modello (`CNN1D_Advanced`)
1.  **Input Layer:** Accetta le coordinate $(x, y, z)$ dei keypoints.
2.  **Feature Extraction Blocks:** * 3 Blocchi consecutivi di `Conv1d` (64 $\to$ 128 $\to$ 256 filtri).
    * Ogni blocco è seguito da `BatchNorm1d` (per stabilità) e `ReLU`.
    * **MaxPooling:** Riduce progressivamente la dimensione temporale, "riassumendo" il movimento.
3.  **Global Pooling:** * Usiamo `AdaptiveAvgPool1d(1)` alla fine. Invece di appiattire (Flatten) tutti i dati, facciamo una media su tutto l'asse temporale rimanente. Questo rende il modello molto leggero e meno prono all'overfitting rispetto a strati Dense giganti.
4.  **Dropout (0.5):** Abbiamo scelto un dropout aggressivo del 50% prima del classificatore finale per massimizzare la generalizzazione.

---

## 🚀 3. Data Augmentation & Training

Per rendere il modello resiliente, abbiamo applicato trasformazioni specifiche direttamente nel `Dataset` PyTorch.

### 🌪️ Augmentation Strategy
Attiva solo durante il training (`augment=True`):
1.  **Gaussian Noise:** Aggiungiamo rumore ($\sigma=0.01$) alle coordinate per simulare l'imprecisione del rilevamento della telecamera.
2.  **Temporal Shift (Roll):** * Shiftiamo l'intera sequenza temporale di $\pm 3$ frame a random.
    * *Motivazione:* Un'azione non inizia sempre al frame 0 preciso. Il modello deve riconoscerla indipendentemente da un piccolo ritardo iniziale.

### 📉 Ottimizzazione
* **Optimizer:** `AdamW` (LR = 0.0005). Un learning rate più basso rispetto alla TCN per garantire una convergenza più stabile data la natura del K-Fold.
* **
