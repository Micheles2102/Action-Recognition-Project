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
2.  **Scaling Dinamico:** Moltiplicazione delle coordinate per un fattore casuale ($0.9x - 1.1x$). Questo simula l'effetto "zoom", rendendo il modello capace di riconoscere l'azione indipendentemente dalla distanza del soggetto dalla camera.

---

## 🏗️ 2. Architettura TCN: Scelte Progettuali

Abbiamo scelto una **TCN (Temporal Convolutional Network)** perché, rispetto alle RNN, offre parallelizzazione migliore e un controllo più preciso sul campo recettivo (Receptive Field).



[Image of dilated convolution neural network architecture]


### 🔧 Tuning degli Iperparametri
Le configurazioni attuali sono il frutto di numerosi esperimenti di validazione. Ecco perché abbiamo scelto questi valori specifici:

#### **A. Kernel Size & Dilatazione**
Invece dei classici kernel piccoli (size 2 o 3) con dilatazione standard in base 2 ($2^i$), abbiamo optato per una configurazione più aggressiva:
* **Kernel Size = 5:** Un kernel più grande ci permette di catturare più contesto locale in ogni singolo step convoluzionale.
* **Dilatazione Base 3 ($3^i$):** Abbiamo impostato i fattori di dilatazione a `1, 3, 9, 27, 81`.
    * *Motivazione:* Questa crescita esponenziale rapida permette al campo recettivo di coprire l'intera sequenza di **180 frames** con meno layer rispetto a una base 2, mantenendo il modello computazionalmente leggero ma capace di comprendere la relazione tra l'inizio e la fine del video.

#### **B. Regolarizzazione (Dropout)**
Durante i primi test, il modello tendeva a memorizzare il training set (overfitting rapido).
* Abbiamo calibrato il **Dropout a 0.2** (spegnimento del 20% dei neuroni).
* Dai nostri test, un valore di 0.5 (standard in letteratura) risultava troppo penalizzante per la convergenza su questo specifico tipo di dati, mentre 0.1 non era sufficiente. Il valore 0.2 si è rivelato il *sweet spot*.

#### **C. Blocchi Residui**
Ogni `TemporalBlock` implementa una connessione residua (`Input + Output`). Questo è fondamentale per permettere al gradiente di fluire attraverso la rete profonda senza svanire, garantendo un training stabile anche con molti canali (fino a 256).



---

## 📉 3. Strategia di Training

Per massimizzare le prestazioni, abbiamo abbandonato l'ottimizzatore SGD standard in favore di **AdamW** combinato con uno Scheduler.

* **Optimizer:** `AdamW` con `weight_decay=0.01`. La regolarizzazione L2 diretta sui pesi ci ha aiutato a mantenere i pesi del modello piccoli e generalizzabili.
* **Scheduler:** `CosineAnnealingLR`. Il Learning Rate non è fisso, ma decresce seguendo una curva coseno. Questo approccio ci ha permesso di "atterrare" nei minimi della Loss function in modo più morbido rispetto a un decadimento a gradino.
* **Early Stopping:** Monitoriamo la `Val Loss` con una pazienza di **20 epoche** per interrompere il training se il modello smette di migliorare, salvando sempre la versione migliore dei pesi.

---

## 📊 4. Output e Analisi

Lo script non si limita ad addestrare il modello, ma fornisce strumenti diagnostici completi:
1.  **Curve di Loss:** Per verificare visivamente l'assenza di overfitting.
2.  **Confusion Matrix:** Normalizzata per capire quali classi vengono confuse tra loro.
3.  **Classification Report:** Precision, Recall e F1-Score per ogni singola classe.

Il modello finale viene salvato come `tcn_pro_v2.pth` e le classi codificate in `classes_tcn_pro_v2.npy`.

---

### 📝 Requisiti
* Python 3.8+
* PyTorch
* Pandas / Numpy
* Scikit-Learn
* Matplotlib / Seaborn
