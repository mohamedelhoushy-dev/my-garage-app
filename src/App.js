import React, { useState, useEffect } from "react";
import { initializeApp } from "firebase/app";
import { getDatabase, ref, onValue, set, update } from "firebase/database";

const firebaseConfig = {
  apiKey: "AIzaSyBYtF3DIZQcuLYxBgvHkKbo2lAHlB4Fbgo",
  authDomain: "parking-manager-992eb.firebaseapp.com",
  databaseURL: "https://parking-manager-992eb-default-rtdb.europe-west1.firebasedatabase.app/",
  projectId: "parking-manager-992eb",
  storageBucket: "parking-manager-992eb.firebasestorage.app",
  messagingSenderId: "798714072933",
  appId: "1:798714072933:web:86d8035d04f7d4f7545b8c"
};

const app = initializeApp(firebaseConfig);
const db = getDatabase(app);

const CAR_BRANDS = ["Hyundai", "Skoda", "Mitsubishi", "Toyota", "BMW", "Mercedes", "Peugeot", "Ford", "Volkswagen", "Kia", "Other"];
const SLOT_COLORS = ["#e63946","#2196f3","#4caf50","#ff9800","#9c27b0","#00bcd4","#f44336","#3f51b5"];
const PASSCODE = "2026";

function timeUntil(departure) {
  if (!departure) return null;
  const diff = new Date(departure) - new Date();
  if (diff < 0) return { label: "Overdue", urgent: true };
  const h = Math.floor(diff / 3600000);
  const m = Math.floor((diff % 3600000) / 60000);
  if (h === 0 && m < 30) return { label: m + "m", urgent: true };
  if (h === 0) return { label: m + "m", urgent: false };
  return { label: h + "h" + m + "m", urgent: false };
}

function CarIcon({ color, size = 38 }) {
  return (
    <svg width={size} height={size * 0.55} viewBox="0 0 60 34" fill="none">
      <rect x="8" y="10" width="44" height="16" rx="4" fill={color || "#333"} opacity="0.9"/>
      <rect x="14" y="4" width="28" height="14" rx="4" fill={color || "#333"} opacity="0.7"/>
      <circle cx="16" cy="27" r="5" fill="#1a1a2e" stroke={color || "#333"} strokeWidth="2"/>
      <circle cx="44" cy="27" r="5" fill="#1a1a2e" stroke={color || "#333"} strokeWidth="2"/>
      <rect x="16" y="6" width="11" height="8" rx="2" fill="#a8d8ea" opacity="0.6"/>
      <rect x="30" y="6" width="10" height="8" rx="2" fill="#a8d8ea" opacity="0.6"/>
    </svg>
  );
}

function SlotBox({ slot, onClick, compact = false }) {
  if (!slot) return null;
  const timer = slot.occupied ? timeUntil(slot.departure) : null;
  const isEmpty = !slot.occupied;

  return (
    <div
      onClick={() => onClick(slot)}
      style={{
        background: isEmpty ? "rgba(255,255,255,0.03)" : slot.color + "15",
        border: isEmpty ? "1.5px dashed #2a3050" : "1.5px solid " + slot.color + "60",
        borderRadius: 8, padding: compact ? "6px 8px" : "8px 10px", cursor: "pointer",
        transition: "all 0.18s", display: "flex", flexDirection: "column",
        alignItems: "center", gap: 3, position: "relative",
        minWidth: compact ? 80 : 100, minHeight: compact ? 60 : 72, justifyContent: "center",
      }}
    >
      <div style={{ position: "absolute", top: 4, left: 6, fontSize: 9, color: "#3a4060", fontWeight: 700 }}>#{slot.id}</div>
      {isEmpty ? (
        <div style={{ fontSize: 18, color: "#2a3050" }}>+</div>
      ) : (
        <>
          <CarIcon color={slot.color} size={compact ? 32 : 38}/>
          <div style={{ fontSize: 10, fontWeight: 700, color: "#e0e4f0", textAlign: "center" }}>{slot.owner}</div>
          {timer && (
            <div style={{
              fontSize: 9, padding: "1px 5px", borderRadius: 8,
              background: timer.urgent ? "#3a1a1a" : "#1a2a1a",
              color: timer.urgent ? "#e05252" : "#52c070", fontWeight: 600
            }}>{timer.label}</div>
          )}
        </>
      )}
    </div>
  );
}

function Modal({ slot, onSave, onClose }) {
  const [form, setForm] = useState({
    owner: slot.owner || "", brand: slot.brand || "", plate: slot.plate || "",
    color: slot.color || SLOT_COLORS[0], departure: slot.departure || "",
  });
  const setField = (k, v) => setForm(f => ({ ...f, [k]: v }));

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.8)", backdropFilter: "blur(8px)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 200 }}>
      <div style={{ background: "#0d1020", border: "1px solid #1e2340", borderRadius: 16, padding: "28px 24px", width: 340, color: "#e0e4f0" }}>
        <h2 style={{ fontSize: 18, marginBottom: 20 }}>{slot.occupied ? "Edit Booking" : "Book Slot"}</h2>
        <input placeholder="Owner Name" value={form.owner} onChange={e => setField("owner", e.target.value)} style={{ width: "100%", marginBottom: 10, padding: 10, borderRadius: 7, background: "#161928", border: "1px solid #1e2340", color: "white" }} />
        <select value={form.brand} onChange={e => setField("brand", e.target.value)} style={{ width: "100%", marginBottom: 10, padding: 10, borderRadius: 7, background: "#161928", border: "1px solid #1e2340", color: "white" }}>
          <option value="">Select Brand</option>
          {CAR_BRANDS.map(b => <option key={b} value={b}>{b}</option>)}
        </select>
        <input type="datetime-local" value={form.departure} onChange={e => setField("departure", e.target.value)} style={{ width: "100%", marginBottom: 20, padding: 10, borderRadius: 7, background: "#161928", border: "1px solid #1e2340", colorScheme: "dark" }} />
        <div style={{ display: "flex", gap: 8 }}>
          <button onClick={onClose} style={{ flex: 1, padding: 10, background: "transparent", color: "#3a4060", border: "1px solid #1e2340", borderRadius: 7 }}>Cancel</button>
          <button onClick={() => onSave(slot.id, form)} style={{ flex: 1, padding: 10, background: "#e0e4f0", color: "#0d1020", borderRadius: 7, fontWeight: "bold" }}>Save</button>
          {slot.occupied && <button onClick={() => onSave(slot.id, null)} style={{ padding: 10, background: "#3a1a1a", color: "#e05252", border: "1px solid #e05252", borderRadius: 7 }}>Exit</button>}
        </div>
      </div>
    </div>
  );
}

export default function GarageFloorPlan() {
  const [slots, setSlots] = useState({});
  const [editing, setEditing] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(localStorage.getItem("garage_auth") === "true");
  const [passInput, setPassInput] = useState("");

  useEffect(() => {
    if (!isAuthenticated) return;
    const slotsRef = ref(db, "slots");
    onValue(slotsRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        setSlots(data);
      } else {
        const initial = {};
        for(let i=1; i<=8; i++) initial[i] = { id: i, occupied: false, owner: "", brand: "", plate: "", color: SLOT_COLORS[0], departure: "" };
        set(slotsRef, initial);
      }
    });
  }, [isAuthenticated]);

  const handleAuth = () => {
    if (passInput === PASSCODE) {
      localStorage.setItem("garage_auth", "true");
      setIsAuthenticated(true);
    } else {
      alert("Wrong code!");
    }
  };

  const handleSave = (id, form) => {
    const slotRef = ref(db, "slots/" + id);
    if (form) {
      update(slotRef, { ...form, occupied: true });
    } else {
      update(slotRef, { occupied: false, owner: "", brand: "", plate: "", color: SLOT_COLORS[0], departure: "" });
    }
    setEditing(null);
  };

  if (!isAuthenticated) {
    return (
      <div style={{ height: "100vh", background: "#080b14", display: "flex", alignItems: "center", justifyContent: "center", color: "white", fontFamily: "sans-serif" }}>
        <div style={{ textAlign: "center", padding: 20, background: "#0d1020", borderRadius: 16, border: "1px solid #1e2340" }}>
          <h2 style={{ marginBottom: 20 }}>Enter Garage Code</h2>
          <input type="password" value={passInput} onChange={e => setPassInput(e.target.value)} style={{ padding: 12, borderRadius: 8, border: "1px solid #1e2340", background: "#161928", color: "white", textAlign: "center", fontSize: 20, width: 120, marginBottom: 20 }} />
          <br />
          <button onClick={handleAuth} style={{ padding: "10px 24px", background: "#e0e4f0", border: "none", borderRadius: 8, fontWeight: "bold", cursor: "pointer" }}>Unlock</button>
        </div>
      </div>
    );
  }

  const occupiedCount = Object.values(slots).filter(s => s.occupied).length;
  const S = (id) => slots[id] || { id, occupied: false };

  return (
    <div style={{ minHeight: "100vh", background: "#080b14", color: "#e0e4f0", padding: 20, fontFamily: "sans-serif" }}>
      <div style={{ maxWidth: 640, margin: "0 auto 20px", display: "flex", justifyContent: "space-between" }}>
        <h1>Garage Map</h1>
        <div style={{ textAlign: "right" }}>
          <span style={{ fontSize: 24, fontWeight: "bold" }}>{occupiedCount}</span> / 8 occupied
        </div>
      </div>

      <div style={{ maxWidth: 640, margin: "0 auto", display: "grid", gap: 10 }}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
          <SlotBox slot={S(3)} onClick={setEditing}/>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            <SlotBox slot={S(1)} onClick={setEditing} compact/>
            <SlotBox slot={S(2)} onClick={setEditing} compact/>
          </div>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                <SlotBox slot={S(5)} onClick={setEditing} compact/>
                <SlotBox slot={S(6)} onClick={setEditing} compact/>
                <SlotBox slot={S(7)} onClick={setEditing} compact/>
            </div>
            <SlotBox slot={S(4)} onClick={setEditing}/>
        </div>
        <SlotBox slot={S(8)} onClick={setEditing}/>
      </div>

      {editing && <Modal slot={editing} onSave={handleSave} onClose={() => setEditing(null)} />}
    </div>
  );
}
