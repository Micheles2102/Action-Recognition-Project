import pandas as pd
import numpy as np
import torch
import torch.nn as nn
import torch.nn.utils.weight_norm as weight_norm
import torch.nn.functional as F
import matplotlib.pyplot as plt
import seaborn as sns
from sklearn.metrics import classification_report, confusion_matrix

# ================= CONFIGURAZIONE =================

PATH_CNN = " /// "
PATH_TCN = " /// "

CLASSES_PATH = " /// "
CSV_TEST_PATH = "///"

DEVICE = torch.device("cuda" if torch.cuda.is_available() else "cpu")

# =========================================================
# 1. ARCHITETTURA 1D-CNN (Advanced version 5)
# =========================================================
class CNN1D_Advanced(nn.Module):
    def _init_(self, in_features, num_classes):
        super()._init_()
        self.conv1 = nn.Conv1d(in_features, 64, 3, padding=1)
        self.bn1 = nn.BatchNorm1d(64)
        self.conv2 = nn.Conv1d(64, 128, 3, padding=1)
        self.bn2 = nn.BatchNorm1d(128)
        self.conv3 = nn.Conv1d(128, 256, 3, padding=1)
        self.bn3 = nn.BatchNorm1d(256)
        self.pool = nn.MaxPool1d(2)
        self.global_pool = nn.AdaptiveAvgPool1d(1)
        self.dropout = nn.Dropout(0.5)
        self.fc1 = nn.Linear(256, 128)
        self.fc2 = nn.Linear(128, num_classes)

    def forward(self, x):
        x = x.permute(0, 2, 1)
        x = F.relu(self.bn1(self.conv1(x)))
        x = self.pool(x)
        x = F.relu(self.bn2(self.conv2(x)))
        x = self.pool(x)
        x = F.relu(self.bn3(self.conv3(x)))
        x = self.global_pool(x).squeeze(-1)
        # self.dropout(x) # Disattivato in eval
        x = F.relu(self.fc1(x))
        x = self.fc2(x)
        return x

# ==========================================
# 2. ARCHITETTURA TCN (Corretta: _init_)
# ==========================================
class Chomp1d(nn.Module):
    def _init_(self, chomp_size):
        super(Chomp1d, self)._init_()
        self.chomp_size = chomp_size
    def forward(self, x): return x[:, :, :-self.chomp_size].contiguous()

class TemporalBlock(nn.Module):
    def _init_(self, n_inputs, n_outputs, kernel_size, stride, dilation, padding, dropout=0.2):
        super(TemporalBlock, self)._init_()
        self.net = nn.Sequential(
            weight_norm(nn.Conv1d(n_inputs, n_outputs, kernel_size, stride=stride, padding=padding, dilation=dilation)),
            Chomp1d(padding), nn.ReLU(), nn.Dropout(dropout),
            weight_norm(nn.Conv1d(n_outputs, n_outputs, kernel_size, stride=stride, padding=padding, dilation=dilation)),
            Chomp1d(padding), nn.ReLU(), nn.Dropout(dropout)
        )
        self.downsample = nn.Conv1d(n_inputs, n_outputs, 1) if n_inputs != n_outputs else None
        self.relu = nn.ReLU()

    def forward(self, x):
        out = self.net(x)
        res = x if self.downsample is None else self.downsample(x)
        return self.relu(out + res)

class TCN(nn.Module):
    def _init_(self, input_size, output_size, num_channels, kernel_size=2, dropout=0.2):
        super(TCN, self)._init_()
        layers = []
        num_levels = len(num_channels)
        for i in range(num_levels):
            dilation_size = 2 ** i
            in_channels = input_size if i == 0 else num_channels[i-1]
            out_channels = num_channels[i]
            layers += [TemporalBlock(in_channels, out_channels, kernel_size, stride=1, dilation=dilation_size,
                                     padding=(kernel_size-1) * dilation_size, dropout=dropout)]
        self.network = nn.Sequential(*layers)
        self.linear = nn.Linear(num_channels[-1], output_size)

    def forward(self, x):
        x = x.permute(0, 2, 1)
        y = self.network(x)
        return self.linear(y[:, :, -1])

# =========================================================
# 3. LOGICA DI ENSEMBLE
# =========================================================
def get_ensemble_prediction(tensor_cnn, tensor_tcn, model_cnn, model_tcn, class_names):
    with torch.no_grad():
        logits_cnn = model_cnn(tensor_cnn)
        logits_tcn = model_tcn(tensor_tcn)

        probs_cnn = F.softmax(logits_cnn, dim=1).cpu().numpy()[0]
        probs_tcn = F.softmax(logits_tcn, dim=1).cpu().numpy()[0]

    # Indici predetti dai singoli modelli
    idx_cnn = np.argmax(probs_cnn)
    idx_tcn = np.argmax(probs_tcn)

    name_cnn = class_names[idx_cnn].lower()
    name_tcn = class_names[idx_tcn].lower()

    # ==================================================================
    # 🛑 HARD OVERRIDES (Regole di Veto Assoluto)
    # Queste regole scavalcano qualsiasi calcolo probabilistico.
    # ==================================================================

    # 1. Caso "Dip vs Bicipiti": La TCN confonde spesso i Dip per Bicipiti.
    # Se la CNN vede un Dip, è quasi sicuramente un Dip.
    if "dip" in name_cnn and "bicipiti" in name_tcn:
        return idx_cnn, 1.0 # Vince CNN (Dip)

    # 2. Caso "Squat vs Bicipiti": Stesso problema, movimento verticale.
    # Se la CNN vede uno Squat statico, fidati di lei.
    if "squat" in name_cnn and "bicipiti" in name_tcn:
        return idx_cnn, 1.0 # Vince CNN (Squat)

    # 3. Caso "Bicipiti vs Dip": Viceversa, se la CNN è sicura sui Bicipiti
    # ma la TCN vede un Dip, spesso la CNN ha ragione sulla posa delle braccia.
    if "bicipiti" in name_cnn and "dip" in name_tcn:
        return idx_cnn, 1.0 # Vince CNN (Bicipiti)

    # ==================================================================
    # Calcolo Standard (per tutti gli altri casi non ambigui)
    # ==================================================================
    conf_cnn = np.max(probs_cnn)
    conf_tcn = np.max(probs_tcn)

    # Peso base: CNN leggermente favorita perché più stabile
    weight_cnn = conf_cnn * 1.2
    weight_tcn = conf_tcn * 0.8

    total_weight = weight_cnn + weight_tcn
    weight_cnn /= total_weight
    weight_tcn /= total_weight

    weighted_prob = (probs_cnn * weight_cnn) + (probs_tcn * weight_tcn)
    final_idx = np.argmax(weighted_prob)
    final_conf = weighted_prob[final_idx]

    return final_idx, final_conf
# =========================================================
# 4. MAIN LOOP
# =========================================================
def main():
    print(f"🚀 Avvio Ensemble Ibrido (CNN + TCN Pro) su: {DEVICE}")

    try:
        classes = np.load(CLASSES_PATH, allow_pickle=True)
        print(f"✅ Classi ({len(classes)}): {classes}")
        class_to_idx = {c.lower(): i for i, c in enumerate(classes)}
    except Exception as e:
        print(f"❌ Errore caricamento classi: {e}")
        return

    try:
        # 1. CNN
        cnn = CNN1D_Advanced(in_features=66, num_classes=len(classes)).to(DEVICE)
        cnn.load_state_dict(torch.load(PATH_CNN, map_location=DEVICE))
        cnn.eval()

        # 2. TCN (Configurazione identica al Training)
        # Input 132 (Pos+Vel), Channels profondi, Kernel 5
        tcn = TCN(input_size=132, output_size=len(classes),
                  num_channels=[64, 64, 128, 128, 256],
                  kernel_size=5, dropout=0.2).to(DEVICE)

        tcn.load_state_dict(torch.load(PATH_TCN, map_location=DEVICE))
        tcn.eval()
        print("✅ Entrambi i modelli caricati correttamente.")

    except FileNotFoundError as e:
        print(f"❌ File modello non trovato: {e}")
        return
    except RuntimeError as e:
        print(f"❌ Errore di architettura o pesi: {e}")
        return

    # C. Carica Dati CSV
    try:
        df = pd.read_csv(CSV_TEST_PATH)
        print(f"📄 CSV caricato: {len(df)} righe.")
    except: return

    feature_cols = [c for c in df.columns if c.startswith(('x_', 'y_', 'z_'))]
    grouped = df.groupby('video_name')

    y_true = []
    y_pred = []

    print("\n--- Analisi Ibrida ---")

    for video_name, group in grouped:
        if len(group) != 180: continue

        label_str = str(group.iloc[0]['label']).strip().lower()
        true_idx = -1
        for name, idx in class_to_idx.items():
            if name in label_str:
                true_idx = idx
                break
        if true_idx == -1: continue

        # 1. Dati CNN (Solo Posizione: 66 features)
        pose_data = group[feature_cols].values.astype(np.float32)
        tensor_cnn = torch.tensor(pose_data).unsqueeze(0).to(DEVICE)

        # 2. Dati TCN (Posizione + Velocità: 132 features)
        velocity = np.zeros_like(pose_data)
        velocity[1:, :] = pose_data[1:, :] - pose_data[:-1, :]
        pose_velocity = np.concatenate([pose_data, velocity], axis=1)
        tensor_tcn = torch.tensor(pose_velocity).unsqueeze(0).to(DEVICE)

        # Predizione Ensemble
        pred_idx, conf = get_ensemble_prediction(tensor_cnn, tensor_tcn, cnn, tcn, classes)

        y_true.append(true_idx)
        y_pred.append(pred_idx)

    if not y_true:
        print("⚠️ Nessun dato valido trovato per il test.")
        return

    print("\n" + "="*50)
    print("📊 CLASSIFICATION REPORT (IBRIDO)")
    print("="*50)
    print(classification_report(y_true, y_pred, target_names=classes))

    fig, axes = plt.subplots(1, 2, figsize=(22, 9))
    cm = confusion_matrix(y_true, y_pred)
    sns.heatmap(cm, annot=True, fmt='d', cmap='Blues', xticklabels=classes, yticklabels=classes, ax=axes[0])
    axes[0].set_title('Conteggi Assoluti')

    cm_norm = confusion_matrix(y_true, y_pred, normalize='true')
    sns.heatmap(cm_norm, annot=True, fmt='.2%', cmap='Purples', xticklabels=classes, yticklabels=classes, ax=axes[1])
    axes[1].set_title('Normalizzata (%) - Ensemble Ibrido')

    plt.tight_layout()


    print("\n" + "="*50)
    print("🕵️‍♂️ ANALISI ERRORI: CNN vs TCN")
    print("="*50)

    current_idx = 0
    for video_name, group in grouped:
        if len(group) != 180: continue

        # Ricalcola indici
        label_str = str(group.iloc[0]['label']).strip().lower()
        t_idx = -1
        for name, idx in class_to_idx.items():
            if name in label_str: t_idx = idx; break
        if t_idx == -1: continue

        # Se c'è stato un errore nell'ensemble
        if y_pred[current_idx] != t_idx:
            # Recupera i dati per fare un check veloce
            pose_data = group[feature_cols].values.astype(np.float32)
            t_cnn = torch.tensor(pose_data).unsqueeze(0).to(DEVICE)

            vel = np.zeros_like(pose_data)
            vel[1:, :] = pose_data[1:, :] - pose_data[:-1, :]
            t_tcn = torch.tensor(np.concatenate([pose_data, vel], axis=1)).unsqueeze(0).to(DEVICE)

            # Predizioni singole
            with torch.no_grad():
                l_cnn = cnn(t_cnn)
                l_tcn = tcn(t_tcn)
                p_cnn = torch.argmax(l_cnn, dim=1).item()
                p_tcn = torch.argmax(l_tcn, dim=1).item()

            pred_ensemble = y_pred[current_idx]
            real_name = classes[t_idx]
            ens_name = classes[pred_ensemble]
            cnn_name = classes[p_cnn]
            tcn_name = classes[p_tcn]

            print(f"Video: {video_name}")
            print(f"   Reale: {real_name} | Ensemble: {ens_name}")
            print(f"   👉 CNN dice: {cnn_name} | TCN dice: {tcn_name}")
            print("-" * 30)

        current_idx += 1


    plt.show()

if _name_ == "_main_":
    main()
