# ⚡ Hybrid Ensemble: 1D-CNN + TCN Pro

Questo repository contiene lo script di inferenza finale (`inference_ensemble.py`). 
Dopo aver addestrato separatamente la **1D-CNN** (per la stabilità spaziale) e la **TCN** (per la dinamica temporale), abbiamo sviluppato un sistema **Ibrido** che combina le predizioni di entrambi per massimizzare l'accuratezza.

Non ci siamo limitati a una media ponderata: abbiamo implementato una logica condizionale basata sull'analisi degli errori (Error Analysis) delle fasi precedenti.

---

## 🧠 La Logica dell'Ensemble

Il sistema non tratta i due modelli come pari. Sfrutta i punti di forza specifici di ciascuno attraverso due livelli di decisione:

### 1. Hard Overrides (Il "Veto" della CNN) 🛑
Analizzando le matrici di confusione dei singoli modelli, abbiamo notato che la TCN, pur essendo eccellente nel catturare il movimento, tende a confondersi su esercizi che coinvolgono movimenti verticali simili ma posture diverse.
Abbiamo quindi introdotto delle **regole di business** (Hard Rules) dove la CNN ha l'autorità assoluta:

* **Dip vs Bicipiti:** Se la CNN vede un "Dip" e la TCN vede "Bicipiti", vince la **CNN**. (La CNN riconosce meglio la posizione statica delle braccia rispetto al corpo).
* **Squat vs Bicipiti:** Se la CNN vede uno "Squat" e la TCN vede "Bicipiti", vince la **CNN**. (La TCN viene ingannata dal movimento verticale ritmico simile, ma la CNN distingue chiaramente la posa delle gambe).

### 2. Weighted Soft Voting ⚖️
Per tutti i casi non ambigui (dove non scattano le regole sopra), combiniamo le probabilità (Softmax) dei due modelli con un sistema di pesi sbilanciato:

* **Peso CNN:** `1.2` (Leggermente favorita per la sua stabilità generale).
* **Peso TCN:** `0.8` (Usata per confermare o correggere la dinamica).

La formula finale per la probabilità unificata è:
$$P_{final} = \frac{(P_{cnn} \times 1.2) + (P_{tcn} \times 0.8)}{2.0}$$

---

## 🛠 Pipeline dei Dati Differenziata

Uno degli aspetti chiave di questo ensemble è che i due "giudici" guardano i dati in modo diverso:

| Modello | Input Shape | Tipo di Dati | Cosa vede? |
| :--- | :--- | :--- | :--- |
| **CNN 1D** | `(Batch, 66, 180)` | Raw Coordinates | La geometria pura della posa. |
| **TCN Pro** | `(Batch, 132, 180)` | Coords + **Velocity** | La geometria + la velocità/direzione del movimento. |

Lo script gestisce questa dicotomia calcolando la velocità al volo per la TCN mentre passa i dati grezzi alla CNN.

---

## 🔍 Analisi e Debugging

Lo script è progettato per essere lo strumento finale di validazione. Oltre a stampare il **Classification Report** combinato, include un modulo di **Analisi degli Errori**:

* Confronta le predizioni dell'Ensemble con la Ground Truth.
* In caso di errore, stampa un log dettagliato ("Blame assignment"):
    > *"Video X: Reale = Squat. Ensemble = Bicipiti. 👉 La CNN diceva Squat, ma la TCN diceva Bicipiti."*
    
Questo ci permette di capire se l'errore deriva da un modello specifico o dalla logica di pesatura.

---

## 📊 Visualizzazione

Vengono generate due matrici di confusione affiancate:
1.  **Valori Assoluti:** Per capire il volume di dati testati.
2.  **Valori Normalizzati (%):** Per valutare la precisione reale su classi sbilanciate.

---
