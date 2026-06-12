#pragma once
// ── Paràmetres globals del sistema ────────────────────────────────────────────
#define HEARTBEAT_TIMEOUT_MS    5000   // 5s: temps màxim sense rebre res de la RPi
#define TELEMETRIA_INTERVAL_MS  100    // Envia telemetria cada 100ms
#define DISTANCIA_SEGURETAT_CM  20.0f  // Obstacle a menys de 20cm → atura
#define SERIAL_BAUD             115200
#define VEL_MOTORS_DEFAULT      150
