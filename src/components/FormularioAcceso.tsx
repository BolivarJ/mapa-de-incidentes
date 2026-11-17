"use client";

import {
  createUserWithEmailAndPassword,
  getIdToken,
  inMemoryPersistence,
  setPersistence,
  signInWithEmailAndPassword,
  signOut,
} from "firebase/auth";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { getFirebaseClientAuth } from "@/lib/firebase-client";
import styles from "./FormularioAcceso.module.css";

type Props = { modo: "ingreso" | "registro" };

function mensajeDeError(error: unknown): string {
  const codigo =
    typeof error === "object" && error !== null && "code" in error ? String(error.code) : "";

  if (codigo === "auth/email-already-in-use") {
    return "No fue posible crear la cuenta con esos datos. Si ya tienes cuenta, inicia sesión.";
  }
  if (codigo === "auth/invalid-credential") return "El correo o la contraseña no son correctos.";
  if (codigo === "auth/invalid-email") return "Escribe un correo electrónico válido.";
  if (codigo === "auth/weak-password") return "La contraseña debe tener al menos 8 caracteres.";
  if (error instanceof Error && error.message.includes("no está configurado")) {
    return "Firebase no está configurado para la app web. Revisa la configuración pública.";
  }
  return "No fue posible completar el acceso. Intenta de nuevo.";
}

export function FormularioAcceso({ modo }: Props) {
  const acceso = useAcceso(modo);

  return (
    <form className={styles.formulario} onSubmit={acceso.enviar} noValidate>
      <CamposAcceso
        modo={modo}
        correo={acceso.correo}
        contrasena={acceso.contrasena}
        cambiarCorreo={acceso.setCorreo}
        cambiarContrasena={acceso.setContrasena}
      />
      {acceso.error && (
        <p className={styles.error} role="alert">
          {acceso.error}
        </p>
      )}
      <button className="boton" type="submit" disabled={acceso.enviando}>
        {acceso.enviando ? "Procesando…" : modo === "registro" ? "Crear cuenta" : "Iniciar sesión"}
      </button>
    </form>
  );
}

function CamposAcceso({
  modo,
  correo,
  contrasena,
  cambiarCorreo,
  cambiarContrasena,
}: {
  modo: Props["modo"];
  correo: string;
  contrasena: string;
  cambiarCorreo: (valor: string) => void;
  cambiarContrasena: (valor: string) => void;
}) {
  return (
    <>
      <div className={styles.campo}>
        <label htmlFor="correo">Correo electrónico</label>
        <input
          id="correo"
          name="email"
          type="email"
          autoComplete="email"
          required
          maxLength={254}
          value={correo}
          onChange={(evento) => cambiarCorreo(evento.target.value)}
        />
      </div>
      <div className={styles.campo}>
        <label htmlFor="contrasena">Contraseña</label>
        <input
          id="contrasena"
          name="password"
          type="password"
          autoComplete={modo === "registro" ? "new-password" : "current-password"}
          required
          minLength={8}
          maxLength={128}
          value={contrasena}
          onChange={(evento) => cambiarContrasena(evento.target.value)}
        />
        {modo === "registro" && <span className={styles.ayuda}>Usa al menos 8 caracteres.</span>}
      </div>
    </>
  );
}

function useAcceso(modo: Props["modo"]) {
  const router = useRouter();
  const [correo, setCorreo] = useState("");
  const [contrasena, setContrasena] = useState("");
  const [error, setError] = useState("");
  const [enviando, setEnviando] = useState(false);
  const esRegistro = modo === "registro";

  async function enviar(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault();
    setError("");
    setEnviando(true);

    let auth: ReturnType<typeof getFirebaseClientAuth> | null = null;
    try {
      auth = getFirebaseClientAuth();
      await setPersistence(auth, inMemoryPersistence);
      const credencial = esRegistro
        ? await createUserWithEmailAndPassword(auth, correo, contrasena)
        : await signInWithEmailAndPassword(auth, correo, contrasena);
      const idToken = await getIdToken(credencial.user, true);
      const respuesta = await fetch("/api/sesion", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ idToken }),
        cache: "no-store",
      });
      if (!respuesta.ok) throw new Error("No se pudo crear la sesión segura.");

      await signOut(auth);
      router.replace("/");
      router.refresh();
    } catch (causa) {
      if (auth) await signOut(auth).catch(() => undefined);
      setError(mensajeDeError(causa));
    } finally {
      setEnviando(false);
    }
  }

  return { correo, contrasena, setCorreo, setContrasena, error, enviando, enviar };
}
