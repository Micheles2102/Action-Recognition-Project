Questo progetto implementa un sistema end-to-end per la classificazione di azioni umane in video, basato sull'analisi di sequenze temporali di landmark scheletrici.

-Pipeline di Elaborazione

Feature Extraction: Utilizzo di MediaPipe Pose per l'estrazione frame-by-frame di 33 keypoints corporei (coordinate x, y, z).
Preprocessing Dati:
Normalizzazione Spaziale: Centratura delle coordinate relativa al punto medio del bacino (hip-center) per garantire invarianza alla posizione.
Scaling: Normalizzazione basata sulla dimensione del torso per garantire invarianza alla distanza dalla camera.
Resampling Temporale: Interpolazione lineare delle sequenze per ottenere input a lunghezza fissa (es. 180 frame).

Architetture Neurali:
1D-CNN (Convolutional Neural Network): Rete convoluzionale monodimensionale ottimizzata per l'estrazione di pattern locali nelle serie temporali.
TCN (Temporal Convolutional Network): Modello avanzato con convoluzioni dilatate (dilated convolutions) e connessioni residuali per catturare dipendenze temporali a lungo termine e relazioni causali.
Approccio Ibrido di cooperazione tra i modelli per le predizioni.

Fitness AI Analyzer è un'applicazione desktop cross-platform sviluppata con Electron che permette di analizzare video di allenamento per identificare automaticamente l'esercizio eseguito e valutarne le performance attraverso metriche di accuratezza.
L'applicazione integra tre diversi modelli di intelligenza artificiale tra cui poter scegliere per effettuare la classificazione :

✨ Caratteristiche

🎥 Caricamento video locale - Supporto formati: MP4, MOV, AVI, MKV, WebM

🤖 Selezione modello AI - Scegli tra CNN, TCN o Hybrid

📊 Metriche dettagliate - Accuracy, F1-Score, Precision, Recall

🎨 UI moderna e responsive - Design glassmorphism con animazioni fluide

🔄 Analisi asincrona - Polling server con feedback real-time

🌐 Backend remoto - Connessione via Ngrok tunnel

⚡ Performance ottimizzate - Gestione buffer video efficiente


![WhatsApp Image 2025-12-06 at 13 34 00](https://github.com/user-attachments/assets/e31b8ced-e314-4bea-be3b-c70bf14e8971)


i risultati vengono ritornati in una sezione al di sotto del video , inoltre vi è l'aggiunta di un effetto blur che contorna il video sulla base della predizione:

<img width="600" alt="image" src="https://github.com/user-attachments/assets/e689566d-964f-4c6b-9a24-da52dfdc8a47" />




![WhatsApp Image 2025-12-06 at 13 34 44](https://github.com/user-attachments/assets/1523f4b2-1896-43f3-a227-7f9271fff72b)



