import { PERSONAS } from "@/lib/mock-data";
import type { Persona, PersonaId } from "@/models/types";

export async function getPersonas(): Promise<Persona[]> {
  return PERSONAS;
}

export async function getPersona(id: PersonaId): Promise<Persona | undefined> {
  return PERSONAS.find((p) => p.id === id);
}
