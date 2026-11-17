"use client";

import { getApps, initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";

const APP_NAME = "mapa-incidentes-web";

export function getFirebaseClientAuth() {
  const config = {
    apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
    authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
    appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  };

  if (Object.values(config).some((value) => !value)) {
    throw new Error("Falta configurar Firebase para el navegador.");
  }

  const app =
    getApps().find((registeredApp) => registeredApp.name === APP_NAME) ??
    initializeApp(config, APP_NAME);

  return getAuth(app);
}
