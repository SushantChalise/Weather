"use client";

import { useState } from "react";
import { PLACE_REGISTRY } from "@/data/places";

// TODO: wire to /api/witness when intake is ready

type FormState = "idle" | "submitting" | "submitted";

export function WitnessForm() {
  const [state, setState] = useState<FormState>("idle");
  const [name, setName] = useState("");
  const [placeSlug, setPlaceSlug] = useState("");
  const [observation, setObservation] = useState("");
  const [photoUrl, setPhotoUrl] = useState("");

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setState("submitting");
    // TODO: real backend call
    setTimeout(() => setState("submitted"), 200);
  }

  if (state === "submitted") {
    return (
      <div className="rounded-md border border-green-200 bg-green-50 p-6">
        <h2 className="text-lg font-semibold text-green-900 mb-2">Thank you</h2>
        <p className="text-sm text-green-800">
          Your submission has been logged. We&apos;ll email you when we publish your story.
        </p>
      </div>
    );
  }

  const slugs = Object.keys(PLACE_REGISTRY).sort();

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <label className="block">
        <span className="text-sm font-medium text-neutral-700">Your name</span>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
          className="mt-1 block w-full rounded-md border border-neutral-200 px-3 py-2 focus:border-neutral-400 focus:outline-none"
        />
      </label>

      <label className="block">
        <span className="text-sm font-medium text-neutral-700">Place</span>
        <select
          value={placeSlug}
          onChange={(e) => setPlaceSlug(e.target.value)}
          required
          className="mt-1 block w-full rounded-md border border-neutral-200 px-3 py-2 focus:border-neutral-400 focus:outline-none"
        >
          <option value="">— Choose a place —</option>
          {slugs.map((s) => {
            const entry = PLACE_REGISTRY[s];
            return (
              <option key={s} value={s}>
                {entry?.name ?? s}
              </option>
            );
          })}
        </select>
      </label>

      <label className="block">
        <span className="text-sm font-medium text-neutral-700">What did you see?</span>
        <textarea
          value={observation}
          onChange={(e) => setObservation(e.target.value)}
          required
          minLength={50}
          maxLength={1000}
          rows={6}
          placeholder="Describe what you observed and when. Specifics help — dates, distances, photos."
          className="mt-1 block w-full rounded-md border border-neutral-200 px-3 py-2 focus:border-neutral-400 focus:outline-none"
        />
        <span className="mt-1 block text-xs text-neutral-500">
          {observation.length}/1000 characters (min 50)
        </span>
      </label>

      <label className="block">
        <span className="text-sm font-medium text-neutral-700">Photo URL (optional)</span>
        <input
          type="url"
          value={photoUrl}
          onChange={(e) => setPhotoUrl(e.target.value)}
          placeholder="https://…"
          className="mt-1 block w-full rounded-md border border-neutral-200 px-3 py-2 focus:border-neutral-400 focus:outline-none"
        />
      </label>

      <button
        type="submit"
        disabled={state === "submitting"}
        className="inline-flex items-center rounded-lg bg-neutral-900 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-neutral-700 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {state === "submitting" ? "Submitting…" : "Submit story"}
      </button>
    </form>
  );
}
